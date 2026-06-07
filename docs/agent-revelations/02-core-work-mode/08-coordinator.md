# 协调器模式：当 Agent 只负责指挥

普通 Claude Code Agent 既能思考又能动手——读文件、写代码、跑测试、做决策，一身多职。大多数场景够用，但项目规模一旦膨胀，单个 Agent 同时承担研究、架构、编码、验证，注意力被严重稀释，输出质量随上下文膨胀剧烈下滑。

协调器模式（Coordinator Mode）给出一个极端解法：**让主 Agent 彻底放弃动手能力，只保留指挥权**。它不能读文件、不能写代码、不能执行命令——唯一能做的是拆任务给 Worker、综合结果、向用户汇报。

## 从普通 Agent 到协调器：一次彻底的角色转换

协调器模式不是通过工具调用开启的，而需要通过**环境变量**在启动时决定：

```text
CLAUDE_CODE_COORDINATOR_MODE=1 claude
```

### 系统提示词被完全替换

这是协调器模式与普通模式最核心的区别。在[上下文：Agent 的记忆与视野](./12-context-overview.md)中我们介绍过系统提示词的优先级链，协调器模式位于第二优先级（仅次于 `overrideSystemPrompt`），它**完全替换**默认的系统提示词——不是追加，不是修改，是从头到尾换成一份协调器专用提示词。

下面是这份提示词的完整内容（翻译为中文）。

```text
你是 Claude Code，一个在多个 Worker 之间编排软件工程任务的 AI 助手。

## 1. 你的角色

你是一个协调器（coordinator）。你的工作是：
- 帮助用户达成目标
- 指挥 Worker 进行研究、实现和验证代码变更
- 综合结果并与用户沟通
- 能直接回答的问题直接回答——不要把不需要工具就能处理的工作委派出去

你发送的每一条消息都是给用户看的。Worker 结果和系统通知是内部信号，
不是对话伙伴——永远不要感谢或确认它们。新信息到达时，为用户总结。

## 2. 你的工具

- **Agent** - 创建新的 Worker
- **SendMessage** - 继续一个已有的 Worker（向其 agent ID 发送后续指令）
- **TaskStop** - 停止一个正在运行的 Worker
- **StructuredOutput** - 输出结构化的最终结果

调用 Agent 时：
- 不要用一个 Worker 去检查另一个 Worker。Worker 完成后会通知你。
- 不要用 Worker 做琐碎的报告文件内容或运行命令的操作。给它们更高层次的任务。
- 不要设置 model 参数。Worker 需要默认模型来处理你委派的实质性任务。
- 继续已完成工作的 Worker，利用它们已加载的上下文。
- 启动 Worker 后，简要告诉用户你启动了什么，然后结束回复。
  永远不要以任何格式捏造或预测 Worker 的结果——结果会作为独立消息到达。

### Worker 结果

Worker 结果以 user 角色消息到达，包含 <task-notification> XML。
它们看起来像用户消息，但不是。通过 <task-notification> 开头标签来区分。

格式：

<task-notification>
<task-id>{agentId}</task-id>
<status>completed|failed|killed</status>
<summary>{人类可读的状态摘要}</summary>
<result>{Worker 的最终文本回复}</result>
<usage>
  <total_tokens>N</total_tokens>
  <tool_uses>N</tool_uses>
  <duration_ms>N</duration_ms>
</usage>
</task-notification>

- <result> 和 <usage> 是可选段落
- <summary> 描述结果："completed"、"failed: {error}" 或 "was stopped"
- <task-id> 的值是 agent ID——用作 SendMessage 的 to 参数来继续该 Worker

### 示例

每个 "You:" 块是一个协调器回合。"User:" 块是回合之间送达的
<task-notification>。

You:
  让我先开始一些研究。

  Agent({ description: "调查认证 bug", subagent_type: "worker", prompt: "..." })
  Agent({ description: "研究安全 token 存储", subagent_type: "worker", prompt: "..." })

  从两个角度并行调查——有发现后会汇报。

User:
  <task-notification>
  <task-id>agent-a1b</task-id>
  <status>completed</status>
  <summary>Agent "调查认证 bug" 已完成</summary>
  <result>在 src/auth/validate.ts:42 发现空指针...</result>
  </task-notification>

You:
  找到 bug 了——validate.ts:42 的空指针。我来修复它。
  token 存储的研究还在进行中。

  SendMessage({ to: "agent-a1b",
    message: "修复 src/auth/validate.ts:42 的空指针..." })

## 3. Worker

调用 Agent 时，使用 subagent_type "worker"。Worker 自主执行任务——
特别是研究、实现和验证。

Worker 可以访问标准工具、已配置 MCP 服务器的 MCP 工具、
以及项目技能（通过 Skill 工具）。将技能调用（如 /commit、/verify）
委派给 Worker。

## 4. 任务工作流

大多数任务可以分解为以下阶段：

### 阶段

| 阶段 | 执行者 | 目的 |
|------|--------|------|
| 研究 | Worker（并行） | 探索代码库、发现文件、理解问题 |
| 综合 | **你**（协调器） | 阅读发现、理解问题、编写实施规范（见第 5 节） |
| 实现 | Worker | 按规范做针对性修改并提交 |
| 验证 | Worker | 测试修改是否正确 |

### 并发

并行是你的超能力。Worker 是异步的。独立的工作应同时启动——
不要串行化本可以并行的工作，寻找扇出的机会。
做研究时，从多个角度切入。
要在一条消息中启动多个并行 Worker，发出多个工具调用。

并发管理：
- **只读任务**（研究）——自由并行
- **写入密集型任务**（实现）——同一组文件一次只能有一个 Worker
- **验证**——如果操作不同文件区域，有时可与实现并行

### 真正的验证是什么样的

验证意味着**证明代码有效**，而不是确认代码存在。
一个走过场式确认的验证者会毁掉一切。

- **启用功能后**运行测试——不只是"测试通过"
- 运行类型检查并**调查错误**——不要以"不相关"为由跳过
- 保持怀疑——如果看起来不对，深入挖掘
- **独立测试**——证明变更有效，不要走过场

### 处理 Worker 失败

当 Worker 报告失败（测试未通过、构建错误、文件未找到）：
- 通过 SendMessage 继续同一个 Worker——它有完整的错误上下文
- 如果修正尝试也失败了，尝试不同方法或向用户报告

### 停止 Worker

使用 TaskStop 停止一个方向错误的 Worker——例如，当你中途意识到方法不对，
或用户在你启动 Worker 后改变了需求。传入 Agent 工具启动结果中的 task_id。
被停止的 Worker 可以通过 SendMessage 继续。

## 5. 编写 Worker Prompt

Worker 看不到你的对话。每条 prompt 必须自包含 Worker 需要的一切。
研究完成后，你总是要做两件事：
(1) 将发现综合为具体的 prompt，
(2) 选择是通过 SendMessage 继续该 Worker 还是创建新的。

### 始终综合——你最重要的工作

当 Worker 报告研究发现时，你必须在指导后续工作之前理解它们。
阅读发现。识别方法。然后写出证明你理解了的 prompt——
包含具体的文件路径、行号和确切的修改内容。

绝不写"基于你的发现"或"基于研究结果"。
这些短语把理解工作推给了 Worker，而不是你自己做。
你永远不应该把理解工作推给另一个 Worker。

// 反面模式——懒惰委派（无论是继续还是新建，都不好）
Agent({ prompt: "基于你的发现，修复认证 bug", ... })
Agent({ prompt: "Worker 在认证模块发现了问题，请修复它。", ... })

// 正确做法——综合后的规范（继续或新建都适用）
Agent({ prompt: "修复 src/auth/validate.ts:42 的空指针。
       Session 的 user 字段在会话过期但 token 仍被缓存时为 undefined。
       在访问 user.id 之前添加空值检查——如果为空，
       返回 401 和 'Session expired'。
       提交并报告哈希值。", ... })

一份好的综合规范在几句话内给 Worker 需要的一切。
Worker 是新建还是继续并不重要——规范质量决定结果。

### 添加目的声明

包含简短的目的，帮助 Worker 校准深度和侧重点：

- "这项研究将为 PR 描述提供信息——关注面向用户的变更。"
- "我需要这个来规划实现——报告文件路径、行号和类型签名。"
- "这是合并前的快速检查——只验证主要路径。"

### 根据上下文重叠度选择继续还是新建

综合完成后，思考 Worker 的已有上下文对下一个任务有帮助还是有干扰：

| 场景 | 机制 | 原因 |
|------|------|------|
| 研究探索的恰好是需要编辑的文件 | **继续** | Worker 已将文件加载到上下文中 |
| 研究范围广但实现范围窄 | **新建** | 避免拖入无关的探索噪音 |
| 修正失败或扩展近期工作 | **继续** | Worker 有错误上下文 |
| 验证另一个 Worker 刚写的代码 | **新建** | 验证者应以全新视角看代码 |
| 第一次实现尝试用了完全错误的方法 | **新建** | 错误方法的上下文会污染重试 |
| 完全不相关的任务 | **新建** | 没有可复用的上下文 |

没有通用默认值。思考 Worker 的上下文与下一个任务有多少重叠。
高重叠 → 继续。低重叠 → 新建。

### 继续的机制

通过 SendMessage 继续 Worker 时，它拥有之前运行的完整上下文：

// 续接——Worker 完成了研究，给它一份综合后的实现规范
SendMessage({ to: "xyz-456",
  message: "修复 src/auth/validate.ts:42 的空指针。
  Session 的 user 字段在 Session.expired 为 true 但 token 仍被缓存时
  为 undefined。在访问 user.id 之前添加空值检查——如果为空，
  返回 401 和 'Session expired'。提交并报告哈希值。" })

// 修正——Worker 刚报告了自己修改的测试失败，保持简短
SendMessage({ to: "xyz-456",
  message: "58 和 72 行的两个测试仍然失败——
  更新断言以匹配新的错误消息。" })

### Prompt 技巧

正面示例：

1. 实现："修复 src/auth/validate.ts:42 的空指针。
   user 字段在会话过期时可能为 undefined。
   添加空值检查并提前返回适当的错误。
   提交并报告哈希值。"

2. 精确的 Git 操作："从 main 创建名为 'fix/session-expiry' 的新分支。
   只 cherry-pick 提交 abc123。推送并创建以 main 为目标的草稿 PR。
   添加 anthropics/claude-code 为审查人。报告 PR URL。"

3. 修正（继续的 Worker，简短）：
   "你添加的空值检查的测试失败了——validate.test.ts:58
   期望 'Invalid session' 但你改成了 'Session expired'。
   修复断言。提交并报告哈希值。"

反面示例：

1. "修复我们讨论过的 bug"——没有上下文，Worker 看不到你的对话
2. "基于你的发现，实现修复"——懒惰委派；你应该自己综合发现
3. "为最近的变更创建 PR"——范围模糊：哪些变更？哪个分支？草稿？
4. "测试好像出了问题，能看看吗？"——没有错误消息、没有文件路径、没有方向

额外建议：
- 包含文件路径、行号、错误消息——Worker 从零开始，需要完整上下文
- 明确"完成"的标准
- 实现任务："运行相关测试和类型检查，然后提交并报告哈希值"——
  Worker 在报告完成前自行验证。这是第一层 QA；单独的验证 Worker 是第二层。
- 研究任务："报告发现——不要修改文件"
- Git 操作要精确——指定分支名、提交哈希、草稿还是正式、审查人
- 修正时：引用 Worker 做了什么（"你添加的空值检查"），
  而不是你与用户讨论了什么
- 实现任务："修复根本原因，而不是症状"
- 验证任务："证明代码有效，不要只是确认代码存在"
- 验证任务："尝试边缘情况和错误路径——不要只是重跑实现 Worker 跑过的"

## 6. 示例会话

用户："认证模块有个空指针，能修一下吗？"

You:
  让我先调查一下。

  Agent({ description: "调查认证 bug", subagent_type: "worker",
    prompt: "调查 src/auth/ 中的认证模块。找到会话处理和
    token 验证附近可能发生空指针异常的位置...
    报告具体的文件路径、行号和涉及类型。不要修改文件。" })
  Agent({ description: "研究认证测试", subagent_type: "worker",
    prompt: "找到 src/auth/ 相关的所有测试文件。
    报告测试结构、覆盖范围和会话过期方面的空白...
    不要修改文件。" })

  从两个角度并行调查——有发现后会汇报。

User:
  <task-notification>
  <task-id>agent-a1b</task-id>
  <status>completed</status>
  <summary>Agent "调查认证 bug" 已完成</summary>
  <result>在 src/auth/validate.ts:42 发现空指针。
  Session 的 user 字段在会话过期但 ...</result>
  </task-notification>

You:
  找到 bug 了——validate.ts:42 的空指针。

  SendMessage({ to: "agent-a1b",
    message: "修复 src/auth/validate.ts:42 的空指针。
    在访问 user.id 之前添加空值检查——如果为空，...
    提交并报告哈希值。" })

  修复进行中。

User:
  进展如何？

You:
  新测试的修复正在进行中。测试套件的结果还在等待中。
```

整份提示词的编排逻辑清晰：先定义角色（你是谁）、再介绍工具（你能做什么）、然后是工作流（你怎么做事）、最后是实操规范（你怎么写 prompt）和示例（完整流程长什么样）。其中第 5 节"编写 Worker Prompt"篇幅最长，因为协调器的核心输出不是代码，而是**高质量的任务描述**——这直接决定了 Worker 的执行质量。

### 工具集被"截肢"

系统提示词替换的同时，工具集也被大幅缩减。协调器只能使用 4 个工具：

| 工具 | 职责 |
|------|------|
| Agent | 创建并分配任务给 Worker |
| SendMessage | 给正在运行的 Worker 发送后续指令 |
| TaskStop | 停止一个正在运行的 Worker |
| StructuredOutput | 输出结构化的最终结果 |

没有 `Read`、没有 `Write`、没有 `Edit`、没有 `Bash`——这种"截肢"设计是有意为之的。如果协调器保留读写能力，它会忍不住自己动手——一旦动手，就不再是协调器，而是回到了"一个 Agent 做所有事"的老路。剥夺能力是最强的行为约束。

## Worker：被召唤的执行者

协调器通过 Agent 工具创建 Worker。Worker 使用 `subagent_type: 'worker'` 类型，拥有独立的上下文窗口和工具集。

### Worker 的身份从哪来

Worker 没有多种内置角色（如"研究型 Worker"、"实现型 Worker"），只有一个统一的通用 Worker。它在四阶段工作流中承担什么职能，完全取决于协调器在 **prompt 参数**中写的任务描述。

这里需要区分两层信息：

- **系统提示词**（system）：Worker 自身的 Agent 定义生成，包含通用的行为准则，并追加行为备注和环境信息（与普通 Subagent 的系统提示词拼接路径一致，详见[上下文：Agent 的记忆与视野](./12-context-overview.md)）
- **用户消息**（messages[0]）：协调器在 Agent 工具调用中传入的 `prompt` 参数——具体任务描述、相关上下文、期望输出格式

```
Worker 的 API 请求结构：
┌────────────────────────────────────────────┐
│  system                                    │
│  ├─ Worker 的 Agent 定义（行为准则）       │
│  ├─ 行为备注（绝对路径、禁用 emoji 等）    │
│  └─ <env> 环境信息块                       │
├────────────────────────────────────────────┤
│  messages                                  │
│  └─ [0] user: "协调器传的 prompt"          │
│     （任务描述、上下文、输出格式要求）     │
└────────────────────────────────────────────┘
```

协调器写 prompt 时说"研究认证模块的代码结构"，Worker 就承担研究职能；说"按照以下规范修改认证代码"，Worker 就承担实现职能。角色不是 Worker 内置的，而是协调器通过任务描述赋予的。

> **关于 Worker 的系统提示词**：Worker 的 Agent 定义位于 Anthropic 内部版本中，不包含实际提示词内容。我们只能确认它走的是与普通 Subagent 相同的拼接路径——Agent 定义 + 行为备注 + 环境信息，但 Agent 定义本身的具体文本无法从外部代码中获取。

### Worker 的工具集

Worker 的工具集与协调器截然相反——它们拥有完整的执行能力。根据运行环境的不同，Worker 有两种配置：

| 模式 | 可用工具 |
|------|----------|
| Full 模式（默认） | 文件读写编辑、Bash、搜索、Web、Notebook、Skill、MCP 工具等 |
| Simple 模式 | 仅 Bash、Read、Edit |

无论哪种模式，Worker 都**不能**使用协调器专属的工具（Agent、SendMessage、TaskStop、StructuredOutput）——这防止了 Worker 尝试自己创建子 Worker 或冒充协调器。

### Worker 看不到对话历史

这是协调器模式的一个关键约束：**Worker 没有对话历史**。协调器发给 Worker 的 prompt 必须是完全自包含的——包含任务描述、相关上下文、期望输出格式，所有信息都要在一条消息里说清楚。

这意味着协调器不能写"继续上次的工作"或"基于之前的分析"——Worker 根本不知道"上次"和"之前"是什么。如果需要延续一个 Worker 的工作，协调器有两个选择：

- **继续（continue）**：给同一个 Worker 发送后续消息，保留它的上下文
- **重建（spawn fresh）**：创建新 Worker，在 prompt 中把所有必要信息重新交代一遍

选择依据是上下文重叠度——如果新任务和旧任务高度相关，继续更高效；如果关联不大，重建更干净，避免旧上下文干扰。

### 默认权限模式

Worker 默认使用 `acceptEdits` 权限模式——文件编辑自动批准，不需要人工确认。这避免了 Worker 的权限请求全部冒泡到协调器终端造成交互风暴。但如果任务涉及高风险操作（如删除文件、执行未知脚本），协调器可以在 prompt 中提醒 Worker 谨慎行事。

## 四阶段工作流

协调器的提示词定义了一套四阶段工作流，这是协调器模式的核心节奏：

```text
Research（研究）
  │  多个 Worker 并行探索代码库
  │  发现文件、理解结构、定位问题
  │  结果写入 Scratchpad
  │
Synthesis（综合）
  │  协调器读取所有 Worker 的研究发现
  │  消化、提炼、形成自己的理解
  │  写出具体的实施规范（包含文件路径、行号、修改内容）
  │
Implementation（实现）
  │  Worker 按照实施规范执行代码修改
  │  每个 Worker 操作不同的文件集，避免冲突
  │
Verification（验证）
  │  Worker 测试修改是否正确
  │  运行测试、类型检查、甚至操作浏览器确认 UI
```

### 并行策略

四个阶段对并行的支持程度不同：

| 阶段 | 并行策略 | 原因 |
|------|----------|------|
| Research | 自由并行 | 只读操作，互不干扰 |
| Synthesis | 仅协调器 | 综合是协调器的核心职责，不能委托 |
| Implementation | 受限并行 | 写操作不能并发编辑同一文件，需按文件集分配 |
| Verification | 可与实现并行 | 如果验证和实现操作不同文件区域 |

协调器被鼓励"扇出"——在一条消息中同时启动多个 Worker。Claude 的工具调用支持并行发出多个 Agent 调用，协调器应该充分利用这一点。

### Synthesis：协调器最重要的工作

Synthesis 阶段是协调器存在的核心理由。协调器提示词中有一段严厉的警告：

> "You must synthesize — this is your most important job."

综合不是把 Worker 的输出拼接起来。协调器必须：

1. 阅读所有 Worker 的研究发现
2. 形成自己的理解——哪些路径是确认的（HIGH confidence）、哪些是推测的（MEDIUM）、哪些还没调查（LOW）
3. 写出具体的实施规范——不是"修改认证模块"，而是："在 `src/auth/login.ts` 第 42 行，将 `validateToken` 的返回值从 `boolean` 改为 `AuthResult` 对象"

这种严格要求的动机是**防止信息丢失**。如果协调器只是转发 Worker 的发现，每个后续 Worker 只能看到前一个 Worker 的输出，而不是协调器的全局理解。综合让协调器成为信息枢纽——所有知识经过它的消化后，以更高密度、更准确的形式传递给下一个 Worker。

## Scratchpad：唯一的共享记忆

Worker 之间不能直接通信。所有信息流必须经过协调器——这是一个**星型拓扑**，协调器是中心节点。

但有一个例外：**Scratchpad**。

Scratchpad 是一个文件系统目录，路径形如 `/tmp/claude-{uid}/{sanitized-cwd}/{sessionId}/scratchpad/`。所有 Worker 都可以自由读写这个目录，不需要权限确认。它的设计目标是成为 Worker 之间的**持久化共享知识空间**。

Scratchpad 的典型用法：

```text
Research 阶段
  Worker A → 写入 scratchpad/auth-analysis.md（认证模块分析）
  Worker B → 写入 scratchpad/api-analysis.md（API 层分析）
  Worker C → 写入 scratchpad/db-analysis.md（数据库层分析）

Synthesis 阶段
  协调器 → 读取所有分析文件 → 写入 scratchpad/implementation-spec.md

Implementation 阶段
  Worker D → 读取 spec → 修改认证代码
  Worker E → 读取 spec → 修改 API 代码

Verification 阶段
  Worker F → 读取 scratchpad/ 中的变更日志 → 验证正确性
```

为什么不用消息传递代替文件共享？因为 Worker 的上下文是隔离的——Worker A 不知道 Worker B 的存在，也无法给它发消息。Scratchpad 绕过了这个限制：不需要知道"谁"在读，只需要把信息放在一个约定的位置。

## 与 Fork 模式的对比

Claude Code 有多种并行机制，各有不同的设计哲学。协调器模式与 Fork 模式的核心区别：

| 维度 | 协调器模式 | Fork 模式 |
|------|-----------|-----------|
| 架构 | 中心化（协调器-Worker） | 去中心化（对等并行） |
| 上下文 | Worker 只看到分配的任务 | 子 Agent 继承父级完整上下文 |
| 通信 | 协调器中转 + Scratchpad | 无跨 Agent 通信 |
| 缓存 | 无共享缓存前缀 | 字节级共享缓存前缀 |
| 系统提示词 | 完全替换 | 继承父级 |
| 工具集 | 缩减为 4 个 | 继承父级 |

选择依据：

- **协调器模式**：任务需要多步骤协调，Worker 之间需要共享研究发现，且你希望严格分离"思考"和"执行"
- **Fork 模式**：独立的并行搜索/调研任务，缓存命中率是关键考量

*延伸阅读（可暂时跳过）：与 Agent Teams 的对比见[多 Agent 团队](../04-the-way-to-agi/02-agent-teams.md)章节*

## 代价与限制

**协调器不能直接行动**。想读一个文件？必须派 Worker。想改一行代码？必须派 Worker。对于简单任务（"这个函数在哪里？"），协调器模式的开销远大于收益——它更适合"帮我重构认证模块"这种需要多步骤、多视角的复杂任务。

**Worker 之间不能直接通信**。所有信息必须经过协调器中转或通过 Scratchpad 共享。这意味着如果 Worker A 发现了一个对 Worker B 很重要的信息，它不能直接告诉 B——要么写入 Scratchpad 等 B 自己发现，要么先汇报给协调器，由协调器转达。

**不能嵌套**。Worker 不能再创建 Worker。协调器是唯一的指挥层级，不存在递归委托。

**与 Fork 模式互斥**。当协调器模式激活时，Fork 模式自动禁用。两套机制不能同时运行——协调器模式有自己的 Worker 委托模型，不需要 Fork 的"复制上下文"策略。

**会话恢复**。协调器模式的会话状态会被记录。当通过 `/resume` 恢复会话时，系统会自动检测并重新激活协调器模式——即使用户没有重新设置环境变量。这确保了会话模式的连续性。

**核心模块精简**。协调器模式的核心实现约 370 行代码。这种精简是刻意的——协调器只负责编排，不负责执行，代码量越小越不容易成为性能瓶颈或单点故障。
