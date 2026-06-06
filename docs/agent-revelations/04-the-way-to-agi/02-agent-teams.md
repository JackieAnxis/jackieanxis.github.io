# 多 Agent 团队：当并行需要通信时

[Subagent 系统](../02-core-work-mode/07-subagents.md)让 Claude Code 能把任务拆分给多个子 Agent 并行执行。但子 Agent 有一个根本限制：**只能汇报结果，不能持续对话**。叫来、干完、走人——像临时工。

想象一个场景：三个 Agent 并行审查同一个 PR——一个查安全、一个查性能、一个查测试覆盖率。安全 Agent 发现了注入漏洞，性能 Agent 发现同一个接口还有 N+1 查询问题。如果它们能互相交流，就可以说"这个接口既不安全又慢，一起重构吧"，而不是各自孤立地写报告。

这就是 Agent Teams 要解决的问题：**让多个 Agent 不仅能并行工作，还能互相通信、共享状态、协调行动**。

## 子 Agent 与队友：两种并行模式

在深入团队机制之前，先用一个对比来建立直觉：

| | 子 Agent（Subagent） | 队友（Teammate） |
|---|---|---|
| 生命周期 | 一次性，任务完成即销毁 | 持续在线，空闲时等待而不是退出 |
| 通信方式 | 只回传最终结果 | 随时通过邮箱收发消息 |
| 上下文 | 完全隔离，看不到其他 Agent | 通过共享任务列表和 Scratchpad 协调 |
| 角色关系 | 主 Agent 的下属 | Lead 的平级队友（可以互发消息） |
| 典型场景 | "帮我查一下这个文件" | "我们三个一起审查这个 PR" |

子 Agent 适合"调完就忘"的委托任务，队友适合需要持续协调的协作任务。

## 团队的四大组件

一个 Agent Team 由四个核心组件构成：

```text
┌─────────────────────────────────────────────────┐
│                   Agent Team                      │
│                                                   │
│   ┌──────────┐     邮箱系统      ┌──────────┐   │
│   │  Lead    │◄────────────────►│ Teammate │   │
│   │ (主线程)  │                  │   Alice   │   │
│   └────┬─────┘                  └──────────┘   │
│        │                              ▲          │
│   共享任务列表                         │          │
│        │                              │          │
│   ┌────┴─────┐     邮箱系统      ┌────┴─────┐   │
│   │ ~/.claude│◄────────────────►│ Teammate │   │
│   │ /teams/  │                  │   Bob     │   │
│   │ /tasks/  │                  └──────────┘   │
│   └──────────┘                                  │
└─────────────────────────────────────────────────┘
```

**Lead**（队长）是用户对话的主线程，负责创建团队、分配任务、综合结果。**Teammates**（队友）是独立的 Claude Code 实例，各有自己的上下文窗口和工具集。**共享任务列表**让所有 Agent 看到同一份任务看板，队友可以自行认领任务。**邮箱系统**是 Agent 之间的异步通信通道。

团队信息持久化在本地文件系统中：

- **团队配置**：`~/.claude/teams/{team-name}/config.json`，记录团队名称、Lead ID、成员列表、每个成员的颜色和权限模式
- **任务列表**：`~/.claude/tasks/{team-name}/`，存储共享的任务看板
- **邮箱目录**：`~/.claude/teams/{team-name}/inboxes/`，每个 Agent 一个收件箱文件

## 文件邮箱：为什么不用内存队列

团队通信的核心是邮箱系统。每个 Agent（包括 Lead）有一个收件箱文件，路径形如 `~/.claude/teams/{team}/inboxes/{name}.json`。发送消息就是往对方的文件里追加一条 JSON 记录，接收消息就是读取并清空自己的文件。

这个设计看起来很原始——为什么不用内存中的消息队列？

答案在于**跨进程通信**。Agent Teams 支持两种显示后端：In-Process（所有队友在同一进程）和 Split-Pane（队友在独立的 tmux 窗格中运行）。Split-Pane 模式下，队友是独立的进程，内存队列无法跨进程共享，而文件系统是所有进程都能访问的自然共享层。

但文件系统有并发问题——两个 Agent 同时往同一个收件箱写入时，可能出现数据丢失。Claude Code 用 `proper-lockfile` 库解决这个问题：每次写入前获取文件锁，最多重试 10 次。写入逻辑是"读取 → 追加 → 写回"，在锁的保护下保持原子性。

### 15 种消息类型

邮箱里不只是普通文本消息。Claude Code 定义了 15 种结构化消息类型，按职责可以分为四组：

**通信类**：纯文本消息，队友之间的日常对话

**生命周期类**：
- `idle_notification`：队友完成一轮工作后发消息告诉 Lead "我闲了"
- `shutdown_request` / `shutdown_approved` / `shutdown_rejected`：关机握手协议
- `teammate_terminated`：系统通知某个队友已被移除

**权限类**：
- `permission_request` / `permission_response`：权限冒泡（后文详述）
- `sandbox_permission_request` / `sandbox_permission_response`：网络访问权限
- `team_permission_update`：Lead 广播权限变更
- `mode_set_request`：Lead 修改队友的权限模式

**任务类**：
- `task_assignment`：Lead 分配任务给队友
- `plan_approval_request` / `plan_approval_response`：计划审批协议

每种消息都有对应的 Zod schema 做结构验证。消息通过 `<teammate-message>` XML 标签包装后注入到 Agent 的对话历史中——和子 Agent 的 `<task-notification>` 使用相同的 XML 注入模式，因为 LLM 对 XML 标签的识别比 JSON 更可靠。

## 队友的生命周期

一个队友从创建到退出，经历四个阶段：

```text
Spawn（创建）
  │  分配颜色、写入 team config
  │  创建独立上下文（AsyncLocalStorage 或独立进程）
  │
Work（工作）
  │  执行 Lead 分配的任务
  │  每 1 秒检查收件箱，有消息就提交为新的对话轮次
  │
Idle（空闲）
  │  LLM 返回非工具调用 → 发送 idle_notification 给 Lead
  │  不退出，而是轮询收件箱等待新消息
  │
Shutdown（关机）
  Lead 发 shutdown_request → 队友确认收尾 → shutdown_approved
  系统清理窗格、移除任务、从 config 中删除成员
```

关键设计是 **idle 状态**。子 Agent 完成任务就销毁，但队友不会——它进入 idle 状态，停止主动执行，但保持收件箱监听。Lead 随时可以通过邮箱给它发送新任务，队友收到消息后被重新激活，继续工作。

这个"停止-恢复"模式的设计动机是**资源经济性**。如果 Lead 发现 Alice 的调研结果还需要补充，直接给 Alice 追加指令即可——Alice 在已有上下文的基础上继续分析，不需要从头开始，比重新创建一个子 Agent 节省大量 token。

### 关机握手协议

关机不是直接杀进程。Lead 发送 `shutdown_request`，队友收到后可以选择同意（`shutdown_approved`）或拒绝（`shutdown_rejected`，附带原因），确认后 Lead 才会清理资源。

为什么需要握手而不是直接终止？因为队友可能正在写文件、执行测试或持有未提交的修改，直接终止会留下写到一半的文件或损坏的工作树。握手协议给队友一个"收尾"的机会——保存进度、清理临时文件、然后体面退出。

每次协议请求都携带一个 `request_id`，贯穿请求和响应的完整链路。Lead 的消息消费函数会自动匹配：收到响应时通过 `request_id` 找到对应的 pending 请求并更新状态。类型校验确保一个关机响应不会意外确认一个计划审批请求。

## 权限冒泡：队友没有终端

队友是独立的 Claude Code 实例，但它运行在后台，没有自己的终端界面。当队友执行需要用户确认的操作（比如写入文件或运行 Bash 命令）时，无法弹出确认对话框。

Claude Code 的解法是**权限冒泡**——把权限请求从队友"冒泡"到 Lead 的终端：

```text
队友遇到需要审批的操作
  │  发送 permission_request 到 Lead 的收件箱
  │  包含：工具名、描述、输入参数
  │
Lead 的收件箱轮询器（每 1 秒）
  │  检测到 permission_request
  │  在 Lead 的终端显示审批对话框（带队友名字和颜色）
  │
用户审批
  │  Lead 发送 permission_response 回队友的收件箱
  │
队友的权限轮询器（每 500ms）
  收到响应 → 继续执行或拒绝
```

整个流程涉及两个方向的轮询：队友以 500ms 间隔检查 Lead 的审批结果，Lead 以 1 秒间隔检查队友的权限请求。采用轮询而非推送，是因为文件系统没有原生的"文件变更通知到 Agent 对话层"的能力。

这个机制意味着队友的权限请求会增加 Lead 终端的交互负担。实践中可以通过预配置权限白名单来减少冒泡次数——在 `settings.json` 中预先批准常见操作，队友就不必频繁请求审批。

## 两种显示后端

Agent Teams 支持两种运行模式，决定队友在哪里"活"着：

### In-Process 模式

所有队友运行在同一个 Node.js 进程中，通过 `AsyncLocalStorage` 实现上下文隔离。每个队友有自己的对话历史、工具调用链和身份信息，但共享 API 客户端和 MCP 连接。

```text
┌─────────── 同一进程 ───────────┐
│                                 │
│  Lead (主线程)                   │
│  Alice (AsyncLocalStorage #1)   │
│  Bob   (AsyncLocalStorage #2)   │
│                                 │
│  共享：API 客户端、MCP 连接      │
└─────────────────────────────────┘
```

用户在终端中用 `Shift+Down` 键在队友之间切换，直接给某个队友发消息。

### Split-Pane 模式

每个队友在独立的 tmux 窗格或 iTerm2 分屏中运行。Lead 占左侧 30% 的窗格，队友分占右侧 70%。

```text
┌──────────┬──────────┐
│          │  Alice   │
│  Lead    ├──────────┤
│          │  Bob     │
└──────────┴──────────┘
```

Split-Pane 模式下，队友是独立的操作系统进程，通过环境变量接收身份信息（`CLAUDE_CODE_AGENT_NAME`、`CLAUDE_CODE_AGENT_COLOR` 等）。

### 为什么需要两种模式

In-Process 模式无需额外依赖，在任何终端都能运行，资源消耗更少，但所有队友挤在一个界面里，切换不够直观。Split-Pane 模式需要 tmux 或 iTerm2，但每个队友有独立视图，可以同时看到所有人的输出。

系统通过 `getResolvedTeammateMode()` 自动选择：如果已经在 tmux 会话中，就用 Split-Pane；否则默认 In-Process。也可以通过 `--teammate-mode` 参数或 `settings.json` 中的 `teammateMode` 手动指定。

## 共享任务列表

团队的第四个组件是共享任务列表，存储在 `~/.claude/tasks/{team-name}/` 目录下。任务有三种状态：pending（待认领）、in_progress（进行中）、completed（已完成）。任务之间可以设置依赖关系——一个任务可以声明"必须等任务 X 完成后才能开始"。

任务的认领有两种方式：

- **Lead 分配**：Lead 明确指定"这个任务给 Alice"
- **队友自认领**：空闲的队友查看任务看板，找到未分配、未阻塞的任务，自己认领

自认领使用文件锁防止竞争条件——如果 Alice 和 Bob 同时尝试认领同一个任务，只有一个会成功。Lead 创建团队时调用 `resetTaskList()` 初始化空的任务看板，所有队友共享。

## 代价与限制

Agent Teams 目前仍处于实验阶段，通过 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 环境变量启用。

**Token 成本线性增长**。每个队友是一个独立的 Claude Code 实例，有自己的上下文窗口，3 个队友意味着 3 倍的 token 消耗。对于研究、审查等需要多视角的任务，额外成本通常值得；对于简单任务，单个会话或子 Agent 更经济。

**不能嵌套**。队友不能再创建自己的团队或队友，只有 Lead 能管理团队。这避免了递归爆炸。

**Lead 不可替换**。创建团队的会话就是 Lead，整个团队生命周期内固定不变。不能把 Lead 的角色转移给某个队友。

**无会话恢复**。In-Process 模式下，`/resume` 不会恢复队友。恢复会话后 Lead 可能尝试给已不存在的队友发消息。如果遇到这种情况，需要让 Lead 重新创建队友。

**文件冲突**。两个队友编辑同一个文件会导致覆盖。任务分配时需要确保每个队友操作不同的文件集。

这些限制并非设计缺陷，而是"实验性功能"的现实——团队模式的骨架已经搭好，核心通信和协调机制已经跑通，但细节仍在打磨中。
