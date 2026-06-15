# Subagent 系统：多 Agents 合作

> **本章摘要**：
>
> Subagent 的核心价值是**隔离与专业化**——独立上下文窗口让子任务不污染主对话，不同 Subagent 可配不同模型/工具/权限。每个 Subagent 拥有独立对话历史和 token 预算，主 Agent 只接收最终结果。

Subagent 系统提供**上下文隔离、并行执行、专业化分工**的能力——主 Agent 把复杂任务拆解为独立的子任务，交给不同的 Subagent 并发完成。

> **注**：本文讲的是 "Subagent 通用机制"。"协调器模式"（一种特定运行模式）和"Agent Teams"（团队协作）分别在后续章节单独介绍。

## 为什么需要 Subagent

| 问题 | Subagent 解法 |
|---|---|
| 上下文窗口有限 | 把子任务隔离到 Subagent 的独立窗口 |
| 串行效率低 | 多个 Subagent 并行启动 |
| 角色泛化 | 不同 Agent 类型各司其职 |
| Token 成本高 | 子任务可用更小的模型或受限工具集 |

主 Agent 发出指令，Subagent 自主执行并返回摘要。主对话的上下文保持干净，只保留最终决策。

![Subagent 并行委托架构](https://jackie-image.oss-cn-hangzhou.aliyuncs.com/2026-05-28/subagent-parallel-architecture.svg)

## 什么是 Subagent

Subagent 是拥有**独立对话上下文**、**独立系统提示**、**独立工具池**的自主执行单元，消耗自己的 token 预算。它与主 Agent 的关系是**单向**的：主 Agent 通过 Agent 工具唤起，Subagent 完成后返回单一结果。

## 内置的核心 Agent

框架通常预置几个核心 Agent 类型：

- **general-purpose**：默认 Agent，全工具权限
- **Explore**：快速只读搜索 Agent，使用较小模型
- **Plan**：只读研究 Agent，在计划模式期间收集上下文，制定计划
- **Verification**：验证 Agent，用于确认Agent 的工作是否真正实现了预期功能，可以采取类似黑客攻防的手段来破坏现有工作，以便验证现有工作是否有缺陷和不足。
- **Guide**：用于辅助用户查询 Agent 系统本身相关功能，相当于使用指导的客服

## 如何定义一个 Subagent

一个 Subagent 的定义通常包含四个维度：

- **身份标识**：叫什么、什么时候该用它
- **能力范围**：能用什么工具
- **行为控制**：用什么模型、跑多深、权限模式
- **生命周期**：是否后台运行、是否有持久记忆

最简单的定义只需提供"身份"和"角色描述"。其他维度都有合理默认值，**配置项按需启用，不是必填**。示例：

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

### 字段速查表


| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 唯一标识符，不含 `@` |
| `description` | string | 何时委托任务给此 Agent |
| `tools` | string[] | 工具白名单 |
| `disallowedTools` | string[] | 工具黑名单 |
| `model` | string | 模型：完整ID/`inherit`（默认） |
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

下面挑一些比较重要的配置项讲解。

#### `background`

- `false`: **同步**模式，默认模式。调用方会一直等待 Subagent 结果返回。适用于有依赖关系的场景——后续步骤需要前一步的结果。
- `true`：**异步**模式，主 Agent 继续推进其他工作，Subagent 异步在后台运行，完成后自动通知。适用于独立的并行任务。需要注意，后台运行的 Agent 无法弹出权限确认框——需要用户决定的操作会被自动拒绝。

#### `isolation`

为了避免 Subagent 的工作影响到主要工作区，Agent 框架需要支持让 Subagent 在隔离的临时工作区（比如，git worktree）中运行，修改不直接影响主工作区。适用于有风险的探索性操作——比如升级依赖、跑实验性代码。

如果 Agent 系统还支持远程隔离，甚至可以让 subagent 去远程的沙箱中执行（详见[沙箱：安全的隔离环境](../03-peripheral-components/sandbox.md)）。

#### `permissionMode`

Subagent 可以声明自己的 `permissionMode`（default、plan、acceptEdits、bypassPermissions、dontAsk、auto），其语义和上一章"权限管线"一致。理想状态下，应该遵循权限收缩的原则：**Subagent 的权限模式不能宽于父级**。
但实现时却会有一些特殊的考虑，可以根据实际情况来进行约定（比如在 Claude Code 中，plan 模式下也可以唤起一个 bypassPermissions 的 Subagent）。

#### 工具池

Subagent 的工具池**不等于**父 Agent 的工具池。框架通过几层过滤为每个 Subagent 重新构建专属工具集：

- **黑名单防滥用**：需要对 Subagent 禁用部分工具，来阻止意外的无限循环和递归。比如：任务/计划读取工具（防止看别人的任务产生竞争），模式切换工具（Subagent 不要自己决定模式），用户交互工具（防止和Main Agent 冲突），Subagent 创建工具（防止无限递归创建）....

- **白名单限制后台 Agent**：如果 Subagent 在后台异步运行，因为不受用户的监控，必须尽可能降低它可用的工具范围，此时会仅开放一些核心操作：文件操作/网络搜索/Shell/沙箱/计划写入...在保证任务完成的前提下尽可能削减工具范围。

- **外部协议工具默认放行**：通过外部注入工具不受限制（原则上，是用户自己注入的外部工具，所以默认用户已经审查过它们的风险了）

在此基础上，如果用户还为 Subagent 定义了 `tools` 参数（工具白名单），还会和上述过滤后的工具池求交集。如果用户还定义了 `disallowedTools` 则会进一步取差集。此时才是完整的，Subagent 可用的工具池。

## Subagent 生命周期

Subagent 从创建到资源清理经历完整的状态流转：

![Subagent 生命周期](https://jackie-image.oss-cn-hangzhou.aliyuncs.com/2026-05-28/subagent-lifecycle-cn-draft.png)

| 阶段 | 关键操作 |
|------|----------|
| **创建** | 解析输入参数、选择 Agent 定义、检查前置条件等 |
| **上下文构建** | 渲染系统提示、组装工具池等等 |
| **执行** | 进入 Agent Loop。后台 Agent 额外启动进度追踪和周期性摘要生成 |
| **终止** | 达到循环次数上限、用户主动终止、或任务自然完成 |
| **资源清理** | 断开专属外部资源、释放缓存、清理临时目录、杀死子进程产生的后台任务 |

### 后台 Agent 的特殊处理

后台 Agent 在运行时有一些独特的安全阀机制：

- **权限自动拒绝**：无法弹出用户确认框，需要用户决定的操作会被自动拒绝
- **拒绝次数追踪**：跟踪连续被拒绝的次数，达到阈值时 Agent 会停止重试
- **僵尸进程防护**：清理阶段会专门杀死 Agent 产生的后台 Bash 任务，防止变成孤儿进程（**僵尸进程**是子进程已经终止但父进程未处理的状态，而**孤儿进程**是父进程先于子进程终止的情况）
- **周期性摘要**：每 30 秒生成一次任务进度摘要，让主 Agent 了解执行状态

### 中断恢复

被中断的子 Agent 可以从磁盘读取历史记录恢复。恢复类型由磁盘元数据中的 agentType 决定：Fork 类型会重建父级系统提示以保持缓存一致性，命名类型从注册表查找对应定义，未知类型兜底为 general-purpose。恢复时还会重建缓存替换决策、验证 worktree 是否仍存在，然后重新进入执行循环。

### 特殊的唤起方式：Fork 模式

- **Fork 模式**：Main Agent 调用 Agent Tool 时省略 Subagent 名称（类型）时自动进入 Fork 模式。此时的 Subagent **继承父级的完整对话上下文**（所有消息、工具使用记录、思考链）。

Fork 模式的核心价值是**最大化提示词缓存命中率**——所有 Subagent 的 API 请求前缀与父级完全一致，从而命中缓存、降低并行调用的 token 成本。但是又和 Main Agent 上下文隔离，常用语处理一些独立的单次任务，比如总结当前会话，基于当前对话开辟新对话等等。

## 本章要点

- Subagent 的核心价值是**隔离与专业化**：独立上下文、独立工具、独立权限
- 三种唤起模式：**同步（依赖链）、后台（独立并行）、Fork（继承上下文）**
- 权限传递遵循"**单调不增**"原则：子级实际 mode = min(父级, 子级声明)，沿调用链严格度不降。理想模型下 `plan` 行被自动保护；Claude Code 实际实现对 `plan`/`default`/`dontAsk` 行不做夹紧，导致 `plan` 行存在绕过 ExitPlanMode 审批的漏洞
- 工具池**不等于**父 Agent——框架会按类型做过滤
- **Subagent 不能生成 Subagent**——多 Agent 系统只有一层委托关系


> Fork 不是新功能——它是一种"复用上下文的 Subagent 唤起方式"。