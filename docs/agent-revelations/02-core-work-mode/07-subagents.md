# Subagent 系统：Agent 的多线程工作模式

Subagent 系统提供**上下文隔离、并行执行、专业化分工**的能力——Agent 将复杂任务拆解为独立的子任务，交给不同的子 Agent 并发完成。

> **注**：本文不涉及 teammates 模式，后续有单独介绍

## 为什么需要 Subagent

| 问题 | Subagent 解法 |
|------|---------------|
| 上下文窗口有限 | 隔离到子 Agent 的独立窗口 |
| 串行效率低 | 多个子 Agent 并行启动 |
| 角色泛化 | 不同 Agent 类型各司其职 |
| Token 成本高 | 子任务可用更小的模型或受限工具集 |

主 Agent 发出指令，子 Agent 自主执行并返回摘要。主对话的上下文保持干净，只保留最终决策。

![Subagent 并行委托架构](https://jackie-image.oss-cn-hangzhou.aliyuncs.com/2026-05-28/subagent-parallel-architecture.svg)

## Subagent 的定义

Subagent 是拥有**独立对话上下文**、**系统提示**、**工具池**和**LLM 调用链** 的自主执行单元，消耗自己的 token 预算。与主 Agent 的关系是单向的：主 Agent 通过 Agent 工具唤起，子 Agent 完成后返回单一结果。

## 如何定义一个 Subagent

Claude Code 支持 **Markdown 文件**和 **JSON 配置**两种格式。

### Markdown 格式（推荐）

在 `.claude/agents/` 下创建 `.md` 文件，frontmatter 定义元数据，正文为系统提示：

```markdown
---
name: test-runner
description: 在代码编写完成后运行测试套件
tools: Bash
permissionMode: dontAsk
background: true
---
你是一个测试运行专员。收到代码修改后，使用 Bash 执行项目测试命令，报告通过/失败结果。
```

### JSON 格式

在 `settings.json` 的 `agents` 字段中定义（`prompt` 字段替代 Markdown 正文）：

```json
{
  "agents": {
    "test-runner": {
      "description": "在代码编写完成后运行测试套件",
      "tools": ["Bash"],
      "prompt": "你是一个测试运行专员...",
      "permissionMode": "dontAsk",
      "background": true
    }
  }
}
```

### 存放位置与优先级

| 来源 | 存放位置 | 优先级 |
|------|----------|--------|
| 组织策略 | `/etc/claude-code/` 等全局管理配置 | 6（最高） |
| CLI/SDK 注入 | `--agents` 参数或 SDK 运行时传入 | 5 |
| 项目级 | `.claude/agents/` | 4 |
| 用户级 | `~/.claude/agents/` | 3 |
| 插件级 | 插件 `agents/` 目录 | 2 |
| 内置 Agent | 系统预定义（general-purpose、Explore 等） | 1（最低） |

同名 Agent 高优先级覆盖低优先级，即任意自定义 Agent 只要名称与内置 Agent 相同，即可覆盖内置 Agent 的行为。Claude Code 递归扫描各级目录，`name` 必须唯一。

### 字段速查表

所有 Agent 的基础定义字段可以按四个维度理解：

- **身份标识**：`name`、`description`——说明"我是谁"、"什么时候用我"，必填
- **能力范围**：`tools`、`disallowedTools`、`mcpServers`——定义"我能用什么工具"
- **行为控制**：`model`、`effort`、`permissionMode`、`maxTurns`——控制"怎么跑、跑多深"
- **生命周期**：`background`、`isolation`、`skills`、`hooks`、`memory`——管理"从生到死"

此外还有系统提示和 UI 表现（`color`）等辅助字段。

具体详见：

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 唯一标识符，不含 `@` |
| `description` | string | Claude 何时委托给此 Agent |
| `tools` | string[] | 工具白名单 |
| `disallowedTools` | string[] | 工具黑名单 |
| `model` | string | 模型：`sonnet`/`opus`/`haiku`/完整ID/`inherit`（默认） |
| `permissionMode` | string | 权限模式（见下文） |
| `effort` | string\|number | 思考努力程度：`low`/`medium`/`high`/`xhigh`/`max` |
| `maxTurns` | number | 最大对话轮次 |
| `mcpServers` | string[]\|object[] | Agent 专属 MCP 服务器（引用名或内联定义） |
| `hooks` | object | Agent 生命周期钩子 |
| `skills` | string[] | 启动时预加载的技能 |
| `memory` | string | 持久记忆的作用域：`user`/`project`/`local` |
| `isolation` | string | `worktree` 或 `remote` |
| `background` | boolean | 是否始终以后台模式运行 |
| `initialPrompt` | string | 启动时自动串接在用户提示词前的提示（仅限主对话使用） |
| `color` | string | UI 颜色 |

### 内置 Agent

#### general-purpose

默认 Agent，全工具权限。未指定 `subagent_type` 时兜底，继承父级模型。

#### Explore

快速只读搜索 Agent，使用 Haiku 模型。工具仅限 Glob/Grep/Grep/Bash，**不能编辑或写入文件**。跳过加载 CLAUDE.md 和 git 状态，它只接收自己的系统提示和任务提示，以加速和降低成本。调用时指定彻底程度：`quick`/`medium`/`very thorough`。

#### Plan

只读研究 Agent，在 plan mode 期间收集上下文。与 Explore 一样跳过 CLAUDE.md 和 git 状态，但从主对话继承模型（非 Haiku），用于更深入的代码理解。

#### claude-code-guide

知识查询 Agent，使用 Haiku。查询 Claude Code 自身的功能、快捷键、MCP、Hook 系统等文档信息。

#### verification

验证 Agent，用于确认代码变更是否真正实现了预期功能，设计目标是**尽可能破坏被验证的代码**，而不是确认它能工作。它会在沙箱中运行变更，执行测试、类型检查、甚至通过 Playwright 操作浏览器确认 UI 效果。

除了功能性测试外，Verification Agent 还必须执行对抗性探测，包括**并发测试**，**边界值**，**幂等性**，**孤儿操作**（删除或引用不存在的 ID）等，最终结论必须是明确的 `VERDICT: PASS`、`VERDICT: FAIL` 或 `VERDICT: PARTIAL`（仅限环境限制），而非模糊的"应该没问题"。

#### statusline-setup

状态栏配置 Agent，协助设置终端状态栏显示。


适用于不想让 Claude 自动委托给某个 Agent 的场景。也可以使用 CLI 标志在启动时禁用：`--disallowedTools "Agent(Explore)"`。

## Subagent 唤起模式

**关键约束：子 Agent 不能生成子 Agent**——不存在嵌套委托。

### 同步调用（Foreground）

默认模式，调用方阻塞，等待 Subagent 结果返回。适用于依赖链场景。

```js
Agent({
  description: "代码审查",
  subagent_type: "Explore",
  prompt: "检查 src/auth/ 目录下的所有文件"
})
```

### 后台运行（Background）

`run_in_background: true`，调用方继续工作，Subagent 异步运行，完成后自动通知。适用于独立并行任务。

```js
Agent({
  description: "运行测试",
  subagent_type: "test-runner",
  prompt: "运行全部单元测试",
  run_in_background: true
})
```

后台 Agent 无法弹出权限确认框。在 `auto` 模式下分类器仍会智能判断；若无分类器覆盖且 hooks 未给出决定，需要用户确认的操作会被自动拒绝。

### Fork 模式（实验功能特性）

省略 `subagent_type` 自动进入 Fork 模式。子 Agent **继承父级完整对话上下文**（所有消息、工具使用记录、思考链）。

```js
Agent({
  description: "调研部署方案",
  prompt: "研究三种部署方案的优劣"
})
```

Fork 模式的核心价值在于**最大化 prompt cache 命中率**，从而大幅降低并行调用的 token 成本。

**直接复用父级上下文**：Fork 子 Agent 不会拥有自己的系统提示和工具列表，而是直接使用父级已经构建好的完整对话上下文。这确保了所有子 Agent 的 API 请求前缀与父级完全一致，从而命中缓存。


### 工作树隔离

设置 `isolation: "worktree"`，子 Agent 在临时 git worktree 中运行，修改不直接影响主工作区。适用于有风险的探索性操作。


```js
Agent({
  description: "升级依赖",
  prompt: "将 React 升级到 19.0，修复所有 breaking changes",
  isolation: "worktree"
})
```

## Subagent 生命周期

Subagent 从创建到资源清理经历完整的状态流转：

![Subagent 生命周期](https://jackie-image.oss-cn-hangzhou.aliyuncs.com/2026-05-28/subagent-lifecycle-cn-draft.png)

| 阶段 | 关键操作 |
|------|----------|
| **创建** | 解析输入参数、选择 Agent 定义、检查 MCP 前置条件 |
| **上下文构建** | 渲染系统提示、组装工具池（独立于父级）、初始化 MCP 服务器、执行 SubagentStart 钩子 |
| **执行** | 进入 query 循环。后台 Agent 额外启动进度追踪和周期性摘要生成 |
| **终止** | 达到 `maxTurns` 上限、用户主动终止、或任务自然完成 |
| **资源清理** | 断开专属 MCP 服务器、释放缓存、清理临时目录、杀死子进程产生的后台任务 |

### 后台 Agent 的特殊处理

后台 Agent 在运行时有一些独特的安全阀机制：

- **权限自动拒绝**：无法弹出用户确认框，需要用户决定的操作会被自动拒绝
- **DenialTracking**：跟踪连续被拒绝的次数，达到阈值时 Agent 会停止重试
- **僵尸进程防护**：清理阶段会专门杀死 Agent 产生的后台 Bash 任务，防止变成孤儿进程
- **周期性摘要**：每 30 秒生成一次任务进度摘要，让主 Agent 了解执行状态

### 中断恢复

被中断的子 Agent 可以从磁盘读取历史记录恢复。恢复类型由磁盘元数据中的 agentType 决定：Fork 类型会重建父级系统提示以保持缓存一致性，命名类型从注册表查找对应定义，未知类型兜底为 general-purpose。恢复时还会重建缓存替换决策、验证 worktree 是否仍存在，然后重新进入执行循环。

## Subagent 的权限体系

![Subagent 权限与工具过滤](https://jackie-image.oss-cn-hangzhou.aliyuncs.com/2026-05-28/subagent-permission-tooling-cn-draft.png)

### 权限模式体系

Claude Code 的权限模式定义了 Agent 在执行敏感操作（如文件写入、Bash 命令）时的行为：

| 模式 | 行为 |
|------|------|
| `default` | 标准权限检查，弹窗确认 |
| `plan` | 只读探索，禁止写入 |
| `acceptEdits` | 自动接受文件编辑 |
| `bypassPermissions` | 跳过所有权限检查 |
| `dontAsk` | 不弹窗，无法自动决定的操作直接拒绝 |
| `auto` | 后台分类器智能判断 |

- 父级为 `bypassPermissions` 或 `acceptEdits` 时**始终优先**，子 Agent 的配置被忽略
- 父级为 `auto` 时，子 Agent 继承 auto 模式，分类器用相同规则评估
- 已批准的权限**不自动泄漏**到子 Agent，除非父级通过 `allowedTools` 显式授予

> **⚠️ 安全提示**：当父级为 `plan` 模式时，子 Agent 若定义了 `permissionMode: bypassPermissions`，将**真正获得 bypass 权限**，从而绕过父级的只读限制。这意味着 `plan` 模式仅约束主线程的交互行为，并非严格的安全隔离边界。

### bubble (权限冒泡) 模式实现机制

通过 Fork 模式创建的子 Agent 遇到需确认的操作时，将请求通过 IPC 上报父进程，父终端弹窗确认，用户决策后回传——子 Agent 以 500ms 间隔轮询等待。

这个模式被称为 **权限冒泡 (bubble)**  模式，是 Fork 的 Subagent 的内部专用模式（Fork 时只能使用 bubble 模式，其他类型创建的 Subagent 配置该模式，用户不感知）。

对比：命名 Subagent 后台运行时权限请求**自动拒绝**；Fork 用 bubble 模式则**冒泡到用户终端**。


### 自定义 Agent 配置 permissionMode

```markdown
---
name: deploy-agent
description: 负责部署到生产环境的 Agent
permissionMode: bypassPermissions
tools: Bash
---
```

当 Agent 通过 `--agent` 或 `agent` 设置作为主会话运行时，`initialPrompt` 自动作为第一个用户轮次提交。


### 工具池隔离

如果直接继承父级工具池，子 Agent 可能获得超出其运行能力的权限，带来安全风险。
因此，Claude Code 通过三层过滤机制为每个子 Agent 重新构建专属工具池。

#### 第一层：全局黑名单

无论什么类型的 Subagent，以下工具一律禁止：

| 被阻断的工具 | 原因 |
|-------------|------|
| 任务输出工具 | 防止递归——子 Agent 不应能读取其他任务的输出 |
| 计划模式切换工具 | 计划模式是主线程抽象，子 Agent 不应切换模式 |
| 用户提问工具 | 子 Agent 不应直接与用户交互 |
| 任务终止工具 | 需要访问主线程任务状态，子 Agent 无权 |
| 子 Agent 创建工具 | 防止嵌套 Agent——子 Agent 不能再生成子 Agent |

#### 第二层：异步白名单

后台运行的 Agent 额外受到白名单限制，仅开放以下核心操作：

- 文件读写与编辑
- 搜索工具（Grep、Glob、Web 搜索）
- Bash 命令执行
- ipynb Notebook 编辑、Skill 工具
- git Worktree 的 Enter/Exit

#### 第三层：MCP 工具仲裁

以 `mcp__` 为前缀的 MCP 工具在过滤时被**永久放行**。其安全性需要由 MCP server 的配置和插件审批机制保证，不在 Agent 工具过滤层额外限制。

## 最佳实践

### 限制主线程可生成的子 Agent 类型

当使用 `--agent` 将 Agent 作为主线程运行时，可以在 `tools` 字段中使用 `Agent(type1,type2)` 语法限制它能生成哪些子 Agent：

```yaml
---
name: coordinator
description: 协调多个专业 Agent 完成复杂任务
tools: Agent(worker,researcher), Read, Bash
---
```

该 Agent 只能生成 `worker` 和 `researcher` 两种子 Agent，尝试生成其他类型会失败。使用不带括号的 `Agent` 表示允许生成任何类型，完全省略 `Agent` 则不能生成任何子 Agent。

> 注意：`Agent(x,y)` 只对主线程 Agent 有效，子 Agent 本身不能生成子 Agent（不存在嵌套委托）。


### 禁用特定 Subagent

可以通过 `settings.json` 中的 `permissions.deny` 数组阻止 Claude 使用特定的 Subagent（包括内置和自定义）：

```json
{
  "permissions": {
    "deny": ["Agent(Explore)", "Agent(my-custom-agent)"]
  }
}
```

也可以使用 CLI 标志 `--disallowedTools "Agent(Explore)"` 在启动时禁用。
