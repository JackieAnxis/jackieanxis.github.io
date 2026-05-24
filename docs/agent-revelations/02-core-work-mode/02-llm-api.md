---
title: 与模型对话：LLM API 是怎么工作的
---

# 与模型对话：LLM API 是怎么工作的

上一节讲了 Agent Loop：一个 `while (true)` 循环，让模型持续思考、行动、观察。但每一轮循环的背后到底发生了什么？答案很简单：**一次 LLM API 调用**。

这一节打开这个黑盒。以 OpenAI 的 Chat Completion API 为主线，最后对比 Anthropic 的 Messages API。

## 请求是怎么组装的

一个请求核心就三个字段：

```json
{
  "model": "gpt-4o",
  "messages": [...],
  "tools": [...]
}
```

### messages：对话的角色交替

每条消息有一个 `role`（角色），四种角色交替出现：

```json
{
  "messages": [
    { "role": "system", "content": "你是一个数据分析助手。" },
    { "role": "user", "content": "帮我分析一下销售数据的趋势" },
    { "role": "assistant", "content": "好的，我需要先读取数据文件。" },
    { "role": "tool", "content": "日期,销售额\n2024-01,10000\n2024-02,12000", "tool_call_id": "call_abc123" }
  ]
}
```

| 角色 | 谁说的 | 作用 |
|------|--------|------|
| `system` | 开发者 | 定义模型的行为边界 |
| `user` | 用户 | 提出需求或问题 |
| `assistant` | 模型 | 模型的回复 |
| `tool` | 工具执行结果 | 把工具的执行结果回传给模型 |

用户提需求 → 模型调工具 → 工具返回结果，这正好对应 Agent Loop 的一轮循环。下一轮开始时，这段完整历史作为新的 `messages` 传入，模型就知道之前发生了什么。

### tools：告诉模型"你能做什么"

不声明工具，模型只能用文本回答。声明了工具，模型才有了"动手"的能力：

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "read_file",
        "description": "读取指定路径的文件内容",
        "parameters": {
          "type": "object",
          "properties": {
            "path": { "type": "string", "description": "文件的绝对路径" }
          },
          "required": ["path"]
        }
      }
    }
  ]
}
```

三个关键部分：

- **name**：工具叫什么
- **description**：工具做什么——模型靠这段描述决定什么时候该用
- **parameters**：需要什么参数，用 JSON Schema 定义

`tools` 字段定义了 Agent Loop 中"行动"步骤的全部可选动作。模型每次循环只从中选一个（或直接回答），这就是 Agent 的行为边界。

## 模型怎么回复：响应结构

响应的核心在 `choices[0].message` 里，有两种模式：

### 文本回复

```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "根据数据分析，2024年Q1销售额整体呈上升趋势..."
    },
    "finish_reason": "stop"
  }]
}
```

`finish_reason: "stop"` —— 模型给出了最终回答。

### 工具调用

```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": null,
      "tool_calls": [{
        "id": "call_abc123",
        "function": {
          "name": "read_file",
          "arguments": "{\"path\": \"/data/sales.csv\"}"
        }
      }]
    },
    "finish_reason": "tool_calls"
  }]
}
```

`finish_reason: "tool_calls"` —— 模型没结束，它在请求执行工具。

连回 Agent Loop：

- `"stop"` → Loop 终止，任务完成
- `"tool_calls"` → Loop 继续，执行工具、获取结果、再次调用模型

## 流式响应：一个字一个字地吐出来

前面的响应都是"等模型全部生成完，再一次性返回"。但实际用 Agent 时，回复是一个字一个字蹦出来的——这就是流式响应（Streaming）。

### SSE：服务端主动推送

流式响应用 SSE（Server-Sent Events）协议，HTTP 长连接，服务端不断推送 `data: {...}` 事件：

```
data: {"choices":[{"delta":{"content":"根据"},"index":0}]}

data: {"choices":[{"delta":{"content":"数据"},"index":0}]}

data: {"choices":[{"delta":{"content":"分析"},"index":0}]}

data: [DONE]
```

完整响应里的 `message` 变成了 `delta`（增量），客户端自己拼接：

```
"根据" + "数据" + "分析" → "根据数据分析"
```

工具调用参数也是增量传输的：

```
data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"pa"}}]}}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"th\": "}}]}}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"/data/sales.csv\"}"}}]}}]}

data: [DONE]
```

拼合后：`{"path": "/data/sales.csv"}`，和非流式完全一样。

流式不影响 Loop 逻辑，改变的是"观察"的时机：从"等全部完成再看"变成"边生成边看"。

## Responses API：Chat Completion 的下一代

2025 年 3 月，OpenAI 发布了 Responses API。它不是替代品，而是 Chat Completion 的演进。三个关键变化：

### 内置工具：开箱即用

Chat Completion 里每个工具都要自己写声明。Responses API 提供内置工具，直接用：

```json
{
  "model": "gpt-4o",
  "tools": [{ "type": "web_search_preview" }],
  "input": "2024 年诺贝尔物理学奖颁给了谁？"
}
```

类似地还有 `file_search`、`code_interpreter` 等，不需要定义参数格式。

### 有状态对话：链式引用

Chat Completion 要自己维护完整的 `messages` 数组。Responses API 用 `previous_response_id` 链式引用上一轮：

```json
{
  "model": "gpt-4o",
  "previous_response_id": "resp_abc123",
  "input": "那化学奖呢？"
}
```

服务端自己找回历史上下文，开发者不用管理消息数组。

### 统一的输出结构

Chat Completion 的文本在 `content`，工具调用在 `tool_calls`，两个字段。Responses API 统一到 `output` 数组：

```json
{
  "output": [
    {
      "type": "message",
      "content": [{ "type": "output_text", "text": "2024 年诺贝尔物理学奖颁给了..." }]
    },
    {
      "type": "web_search_call",
      "id": "ws_abc123",
      "status": "completed"
    }
  ]
}
```

### 演进方向

| 维度 | Chat Completion | Responses API |
|------|----------------|---------------|
| 工具 | 自己声明每个工具 | 内置工具开箱即用 |
| 对话状态 | 自己维护 messages 数组 | 服务端管理，链式引用 |
| 输出结构 | `content` + `tool_calls` 分离 | 统一的 `output` 数组 |

趋势：开发者管理的东西越来越少，API 从"无状态函数"走向"有状态服务"。

## Anthropic 标准：不同的设计选择

Anthropic 的 Messages API 做的事一样——发消息、收回复、调工具——但设计选择不同。只看三个关键差异。

### 差异一：system 是顶级字段

OpenAI 把 `system` 放在 `messages` 数组里；Anthropic 提到顶级，独立于 `messages`：

```json
// OpenAI
{ "messages": [
    { "role": "system", "content": "你是数据分析助手" },
    { "role": "user", "content": "帮我分析数据" }
]}

// Anthropic
{ "system": "你是数据分析助手",
  "messages": [
    { "role": "user", "content": "帮我分析数据" }
]}
```

### 差异二：工具调用用 content block

OpenAI 用独立的 `tool_calls` 字段，`content` 为 `null`；Anthropic 把工具调用放进 `content` 数组：

```json
// OpenAI
{ "role": "assistant", "content": null,
  "tool_calls": [{ "id": "call_abc", "function": {
    "name": "read_file", "arguments": "{\"path\": \"/data/sales.csv\"}"
  }}]
}

// Anthropic
{ "role": "assistant", "content": [
    { "type": "text", "text": "我来读取数据文件。" },
    { "type": "tool_use", "id": "toolu_abc", "name": "read_file",
      "input": { "path": "/data/sales.csv" } }
]}
```

两个关键区别：
- Anthropic 可以**同时输出文本和工具调用**，OpenAI 调工具时 `content` 通常为 `null`
- 参数字段不同：OpenAI 用 `arguments`（JSON 字符串），Anthropic 用 `input`（JSON 对象）

工具结果的回传也不同。OpenAI 用 `role: "tool"` 独立消息；Anthropic 用 `role: "user"` 中的 `tool_result` block：

```json
{ "role": "user", "content": [
    { "type": "tool_result", "tool_use_id": "toolu_abc",
      "content": "日期,销售额\n2024-01,10000" }
]}
```

### 差异三：流式事件有明确类型

| Anthropic 事件类型 | 含义 |
|---------|------|
| `message_start` | 消息开始，包含 metadata |
| `content_block_start` | 一个内容块开始 |
| `content_block_delta` | 内容块的增量更新 |
| `content_block_stop` | 一个内容块结束 |
| `message_stop` | 整个消息结束 |

对比 OpenAI 扁平的 `delta` 结构，Anthropic 用明确的事件类型分层，解析时追踪状态更精确，但处理逻辑也更复杂。

### 两种风格，同一件事

| 维度 | OpenAI | Anthropic |
|------|--------|-----------|
| system 消息 | messages 数组中的一项 | 独立的顶级字段 |
| 工具调用 | 独立的 `tool_calls` 字段 | `content` 数组中的 `tool_use` block |
| 工具结果 | `role: "tool"` 独立消息 | `tool_result` block 嵌入 user 消息 |
| 流式事件 | `delta` 增量片段 | 明确的事件类型分层 |
| 整体风格 | 扁平简洁 | 结构化显式 |

OpenAI 扁平简洁，Anthropic 结构化显式。两种风格，同一件事：让模型和外部世界对话。
