# Hooks：Agent 的生命线监控器

> 太长不看:
>
> **Hooks 是 Agent 的"确定性约束"**——挂在生命周期节点上的回调，让某些规则无论模型怎么想都必须执行。
>
> 多个 Hook 并行执行（所有匹配的 hook 同时启动），总延迟取决于最慢的而非之和。最严格决策获胜（deny > ask > allow）——一个 hook 拒绝即全局拒绝，安全底线不被宽松 hook 绕过。
>
> Hook 崩溃/超时/无效 JSON 时操作默认继续（"默认放行"原则），避免一个 hook 故障阻塞整个工作流，但显式 deny 依然生效。

Agent Loop 中，LLM 自主决定下一步做什么、调用什么工具、传什么参数。用户能影响的只有初始提示和中间的权限弹窗。这意味着拦截操作靠提示词约束（软约束），审批操作靠手动弹窗（低效率），事后追溯靠手动翻日志。

Hooks 在软件领域是一套很成熟的概念，其表示软件（或者软件的某一部分）的生命周期循环的一系列"钩子"，外部代码可以挂在"钩子"上，参与到生命周期中。在 Agent 领域，Hooks 可以让用户自由介入 Agent Loop 的不同节点的行为逻辑。


## 为什么需要 Hooks

Hooks 的设计哲学用一句话概括：**挂在循环上，不写进循环里**。

Agent Loop 本身保持稳定——它只负责"思考 → 调用 → 观察"的核心循环。Hooks 是挂在这个循环外部的回调，在特定生命周期事件发生时被触发。循环体只管调用触发函数，具体逻辑全在 hook 回调里。扩展行为不需要修改循环本身，这正是开闭原则的直接体现。

## Hooks 的全貌：一张生命周期地图

Hooks 系统定义了二十多个事件，覆盖 Agent 运行的完整生命周期，按功能自然形成几个层次：

```
┌─ 会话层 ─────────────────────────────────────────────────┐
│  SessionStart → [用户交互循环] → SessionEnd              │
│                                                          │
│  ┌─ 用户交互层 ───────────────────────────────────────┐  │
│  │  UserPromptSubmit → [Agent 处理] → Stop            │  │
│  │                                                    │  │
│  │  ┌─ 工具调用层 ─────────────────────────────────┐  │  │
│  │  │  PreToolUse → [工具执行] → PostToolUse       │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  ┌─ 子代理层 ───────────────────────────────────┐  │  │
│  │  │  SubagentStart → [子代理执行] → SubagentStop │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  ┌─ 压缩层 ─────────────────────────────────────┐  │  │
│  │  │  PreCompact → [上下文压缩] → PostCompact     │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

下表列出主要事件及其核心特征：

- **能否拦截**：hook 能否通过返回退出码 2 或 `decision: "block"` 来阻止当前操作。标记为"否"的事件属于已发生的不可逆操作（如工具已执行完毕、会话已启动），hook 只能做观察和记录，无法撤销。

- **强制续跑**：Stop 和 SubagentStop 事件的拦截比较特殊——它们拦截的不是"操作"，而是"停止"本身。hook 返回退出码 2 时，模型不会停下来，而是把 stderr 作为反馈注入上下文，继续工作。

| 层次 | 事件 | 触发时机 | 能否拦截 |
|------|------|---------|-----------|
| 会话层 | SessionStart | 会话启动、恢复、清空或压缩后 | 否 |
| 会话层 | SessionEnd | 会话结束时 | 否 |
| 用户交互层 | UserPromptSubmit | 用户提交消息后、模型处理前 | 是 |
| 用户交互层 | Stop | 模型即将结束响应前 | 是（强制续跑） |
| 用户交互层 | StopFailure | API 错误导致回合结束时 | 否 |
| 工具调用层 | PreToolUse | 工具执行前 | 是 |
| 工具调用层 | PostToolUse | 工具执行成功后 | 否 |
| 工具调用层 | PostToolUseFailure | 工具执行失败后 | 否 |
| 权限层 | PermissionRequest | 权限对话框弹出时 | 是（自动审批/拒绝） |
| 权限层 | PermissionDenied | 自动模式拒绝工具调用后 | 否 |
| 子代理层 | SubagentStart | 子代理启动时 | 否 |
| 子代理层 | SubagentStop | 子代理即将停止时 | 是（强制续跑） |
| 压缩层 | PreCompact | 上下文压缩前 | 是 |
| 压缩层 | PostCompact | 上下文压缩后 | 否 |
| 通知层 | Notification | 系统发送通知时 | 否 |

此外还有 ConfigChange（配置文件变更）、CwdChanged（工作目录切换）、FileChanged（文件变更）、WorktreeCreate/Remove（工作树管理）、TeammateIdle（队友空闲）、TaskCreated/Completed（任务生命周期）等辅助事件。


## Hook 类型：从简单到复杂

系统定义了多种 hook 类型，覆盖不同复杂度的需求：

| 类型 | 执行引擎 | 延迟 | 可持久化到配置文件 | 典型场景 |
|------|---------|------|-----------------|---------|
| Command | Shell 进程 | 毫秒级 | 是 | 格式检查、文件操作、自定义校验 |
| HTTP | HTTP POST 请求 | 取决于网络 | 是 | CI 集成、审计日志、远程审批 |
| Prompt | LLM 单次推理 | 秒级 | 是 | 内容审核、智能判断、上下文增强 |
| Agent | LLM 多步推理 | 秒到分钟 | 是 | 测试验证、复杂审批、深度分析 |
| Callback | TypeScript 回调 | 毫秒级 | 否（仅内存） | 内部事件处理 |
| Function | TypeScript 回调 | 毫秒级 | 否（仅内存） | 运行时拦截、SDK 嵌入 |

前四种可以写入 JSON 配置文件，在会话之间持久存在。Callback 和 Function 只在运行时通过 API 注册，会话结束就消失。这背后是声明式与命令式的边界——Command、HTTP、Prompt、Agent 描述"做什么"，系统负责"怎么做"；Callback 和 Function 是 TypeScript 回调函数引用，无法序列化为 JSON。

### Command

最常用的类型，传入事件 JSON，hook 进程处理后返回 JSON，通过退出码表达决策。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ 
          "type": "command", 
          "command": "python3 /path/to/check.py" 
        }]
      }
    ]
  }
}
```

`check.py` 的写法：从 stdin（系统标准输入） 读入事件 JSON，判断后输出决策：

```
stdin → {"tool_name":"Bash","tool_input":{"command":"rm -rf /tmp"}}
stdout → {"decision":"block","reason":"禁止删除命令"}
exit 2
```

### HTTP

系统向指定 URL 发送 POST 请求，请求体是事件 JSON，响应体是 hook 的输出 JSON。适合与外部服务集成——审计日志、CI 系统、远程审批服务等。

```json
{ "type": "http", "url": "https://audit.example.com/hooks" }
```

服务端收到 POST 后返回 `{"decision": "approve"}` 或 `{"decision": "block", "reason": "..."}`。

### Prompt

系统调用 LLM 对事件上下文做一次性推理，注入固定的 system prompt，要求 LLM 返回 `{"ok": true}` 或 `{"ok": false, "reason": "..."}`。用户在模板中写的 `$ARGUMENTS` 会被替换为事件的完整输入 JSON（包含 tool_name、tool_input 等字段）。一般不携带对话历史，除非是 Stop hook（会传入最后一条助手消息）。默认使用轻量模型（Haiku）。

```json
{
  "type": "prompt",
  "prompt": "检查以下工具调用是否安全：$ARGUMENTS",
  "model": "claude-sonnet-4-6"
}
```

若 LLM 返回的 JSON 不符合 schema（格式错误、字段缺失等），hook 会返回 `non_blocking_error`——hook 本身失败，但操作继续执行，等于"没这个 hook"。

### Agent

类似 Prompt，但启动一个完整的验证代理，支持多轮工具调用。

```json
{
  "type": "agent",
  "prompt": "验证这次代码变更是否通过了所有测试，运行 npm test 并检查结果"
}
```

与 Prompt 的关键区别：

| 维度 | Prompt | Agent |
|------|--------|-------|
| 调用模式 | 单次 LLM 调用 | 多轮对话，最多 50 轮 |
| 工具调用 | 无 | 可调用工具（读文件、跑命令等，Agent Tool 除外） |
| 上下文 | 一般无对话历史 | 可以读取完整对话转录文件（JSONL） |
| 超时 | 默认 30 秒 | 默认 60 秒 |

两者返回格式相同（`{"ok": true/false}`），但达成方式不同：Prompt 靠一次推理直接输出 JSON，Agent 靠多轮工具调用后通过 StructuredOutput 工具返回结果。

### Callback / Function

这两种无法写入 JSON 配置文件，只能通过 SDK 在运行时注册为 TypeScript 回调，这里暂时不展开。

## 执行模式

Command hook 有三种执行模式，其他类型均为同步：

- **同步模式**（默认）：阻塞当前操作，等待 hook 完成后根据结果决定继续还是阻止。
- **异步模式**（`async: true`）：操作不等待 hook，直接继续执行。hook 在后台运行，结果对模型不可见。
- **异步唤醒模式**（`asyncRewake: true`）：操作不等待 hook，直接继续执行。hook 在后台运行，但如果最终以退出码 2 结束，会注入错误消息到模型的下一轮输入中——属于"事后追责"，已经发生的操作无法撤回。

## 通信协议：Hooks 如何与 Agent 对话

不同类型的 hook 与 Agent 之间的通信方式不同。Command 和 HTTP hook 通过进程间通信（stdin/stdout + 退出码），Prompt 和 Agent hook 通过 LLM 调用的输入输出。但它们最终都被统一转换为内部的 `HookResult` 结构。

### Command / HTTP hook 的通信

#### 输入

Hook 被触发时，Agent 通过 stdin 传入 JSON 对象（HTTP hook 则通过 POST 请求体传入）：

```
Agent ─> stdin -> Hook 进程

{
  "hook_event_name": "PreToolUse",
  "session_id": "abc-123",
  "cwd": "/path/to/project",
  "tool_name": "Bash",
  "tool_input": { "command": "rm -rf /tmp/test" },
  "permission_mode": "auto",
  "transcript_path": "/path/to/transcript.jsonl"
}
```

不同事件附加的字段不同。PreToolUse 包含 `tool_name` 和 `tool_input`；PostToolUse 额外包含 `tool_output`；UserPromptSubmit 包含 `user_prompt`。

#### 输出

系统同时读取 hook 的 stdout、stderr 和退出码，按固定优先级处理：

1. **退出码优先**：退出码为 2 时直接阻止操作，stderr 内容展示给模型作为反馈
2. **JSON 解析其次**：退出码为 0 时，尝试将 stdout 解析为 JSON，提取 decision、permissionDecision 等字段
3. **纯文本兜底**：stdout 不是合法 JSON 时，当作纯文本日志，操作照常继续

退出码语义：

| 退出码 | 含义 | Agent 的反应 |
|--------|------|-------------|
| 0 | 成功 | 继续操作（但如果 JSON 中指定了 block，则阻止） |
| 2 | 阻塞错误 | 阻止当前操作，stderr 展示给模型 |
| 其他非零 | 非阻塞错误 | 操作继续，但在转录中记录错误通知 |

退出码体系体现了一个重要原则：**"默认放行，显式阻止"**。hook 崩溃、输出无效 JSON、或因超时被杀掉——操作默认继续，一个 hook 的故障不会阻塞正常工作流。

退出码为 0/2 的情况下，Command hook 通过 stdout 输出 JSON 精确控制 Agent 行为：

```
Hook 进程 -> stdout -> Agent

{
  "decision": "block",
  "reason": "不允许执行删除命令",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "additionalContext": "该命令会影响生产环境文件"
  }
}
```

核心字段是 `decision`（`approve` 或 `block`）和 `hookSpecificOutput` 中的 `permissionDecision`（`allow` / `deny` / `ask`）。PreToolUse 事件还有一个 `updatedInput` 字段——允许 hook 在运行时**修改工具的输入参数**，而模型感知不到参数被篡改。

### Prompt / Agent hook 的通信

这两种类型不通过 stdin/stdout 通信，而是通过 LLM 调用的输入输出：

- **输入**：用户的 prompt 模板中 `$ARGUMENTS` 被替换为事件上下文 JSON，加上固定的 system prompt
- **输出**：LLM 返回 `{"ok": true/false, "reason": "..."}`（Agent hook 通过 StructuredOutput 工具返回）

系统将 `ok: false` 转换为 blocking 决策，`ok: true` 转换为 success。最终都统一转换为 `HookResult`，与 Command/HTTP hook 的结果走同一条后续处理管线。

## Hook 的执行管线

当一个生命周期事件触发时，Hooks 系统的执行管线按以下步骤运行：

```
事件发生
  │
  ├─ 1. 构造输入：收集事件上下文，组装成 JSON
  │
  ├─ 2. 匹配过滤：遍历注册在该事件上的 hook 配置
  │     ├─ 检查 matcher：比如 "Bash" 只匹配工具名为 Bash 的调用
  │     ├─ 检查 if 条件：比如 "Bash(git *)" 进一步过滤命令内容
  │     └─ 去重：相同命令的 hook 只执行一次
  │
  ├─ 3. 并行执行：所有匹配的 hook 同时启动
  │
  ├─ 4. 收集结果：等待所有 hook 完成（或超时）
  │     ├─ 解析 stdout 为 JSON（如果合法）
  │     ├─ 读取退出码
  │     └─ 合并所有 hook 的决策
  │
  └─ 5. 执行最终决策
        ├─ 任何一个 hook 返回 block → 阻止操作
        ├─ 所有 hook 返回 approve → 放行
        └─ "最严格决策获胜"：deny > ask > allow
```

几个关键设计决策：

**并行执行**。多个 hook 同时运行，总延迟取决于最慢的那个，而非延迟之和。

**最严格决策获胜**。三个 hook 中两个返回 `allow`、一个返回 `deny`，最终结果是 `deny`。优先级为 `deny > ask > allow`。

**超时保护**：

| Hook 类型 | 默认超时 |
|----------|---------|
| Command | 10 分钟 |
| HTTP | 10 分钟 |
| Prompt | 30 秒 |
| Agent | 60 秒 |
| SessionEnd 事件 | 1.5 秒 |

SessionEnd 超时特别短——会话结束时用户期望立刻退出，不应被慢 hook 拖住。该值可通过环境变量覆盖。

## 安全纵深：三层防护

Hook 以用户权限执行，恶意 hook 理论上可做任何事。系统设计了纵深防御模型：

**第一层：工作区信任检查**。clone 包含 hook 配置的仓库时，系统不会自动执行那些 hook，先确认工作区是否受信。防止供应链攻击——攻击者在开源项目中植入恶意 hook，不知情开发者 clone 后中招。

**第二层：托管模式**。企业管理员可以通过 `allowManagedHooksOnly` 设置限制系统只执行企业 IT 策略配置的 hook，忽略用户自行添加的。

**第三层：全局禁用开关**。`disableAllHooks: true` 一键关闭所有 hook。

贯穿始终的安全不变式：**hook 的 allow 不能覆盖 settings.json 的 deny**。hook 可以收紧安全策略，但不能放松——这是权限系统的铁律。

## 几个精妙的设计细节

### Stop 钩子的防无限循环

Stop hook 在模型即将结束响应时"拉住它"，注入反馈让其继续工作。但 Stop hook 注入的反馈可能触发另一次 Stop，形成无限循环。

系统通过状态标志 `stopHookActive` 打破循环。当 Stop hook 触发了 blocking response，下一轮循环带着该标志运行，后续迭代不再触发 Stop hook——一个熔断器，给一次续跑机会，但不允许无限续跑。

### PreCompact 的自定义压缩

PreCompact hook 的 stdout 会被附加到压缩提示中，允许用户为不同项目定制压缩策略——保留哪些上下文、丢弃哪些细节。

Hook 不只是"通过/阻止"的闸门，也是"信息注入"的通道。同一个协议同时支持控制和增强两种用途。

### 快速路径优化

Callback 和 Function 类型的 hook 不走 shell 进程，不涉及 JSON 序列化，直接在进程内调用。系统检测到所有匹配的 hook 都是内部类型时，跳过进程创建、stdin/stdout 管道、超时管理等开销。源码注释显示微基准测试中该优化带来约 44 倍性能提升。

### 延迟序列化

多个 hook 接收相同输入 JSON。系统用惰性缓存避免重复序列化——第一次调用时序列化，后续直接复用。

## Hooks 在系统中的定位

回到最初的问题：Hooks 在 Claude Code 的整体架构中扮演什么角色？

如果把 Agent Loop 比作一个自动驾驶系统，那么模型是"驾驶员"，工具是"方向盘和油门"，上下文是"导航地图"。Hooks 则是"行车记录仪 + 电子围栏 + 自动报警器"——它不驾驶车辆，但确保驾驶行为符合规则，记录每一步操作，并在偏离时发出警报。

Hooks 的核心价值是**确定性控制**。在一个由 LLM 驱动的系统中，模型的每次决策都带有概率性。Hooks 提供了一条确定性路径：无论模型怎么想，某些规则必须被执行。"概率性推理 + 确定性约束"的组合，是构建可信 Agent 系统的关键模式。
