# LLM API 协议参考

> **本章摘要**：
>
> 本文档是 [第二章：与模型对话：LLM API 工作模式](../02-core-work-mode/02-llm-api.md) 的延伸阅读——把正文中省略的具体 JSON 字段、控制参数表、流式事件样例、跨厂商协议差异表集中保留。读者希望看清"消息长什么样、字段叫什么、流式事件怎么推"时来这里查。

## 一、OpenAI 请求的完整结构

以 OpenAI 的 API 为例，一个请求的完整结构：

```json
{
  "model": "gpt-4o",
  "messages": [...],
  "tools": [...],
  "temperature": 0.7,
  "max_tokens": 4096,
  "stream": false
}
```

### 核心字段

| 字段 | 作用 | 说明 |
|------|------|------|
| `model` | 用哪个模型 | 如 `gpt-4o`、`gpt-4o-mini` |
| `messages` | 对话历史 | 告诉模型"之前说了什么" |
| `tools` | 可用工具列表 | 告诉模型"你能做什么" |

### 控制参数

| 字段 | 作用 | 说明 |
|------|------|------|
| `temperature` | 回复的随机性 | 0 = 确定性强，1 = 更发散，默认 1 |
| `max_tokens` | 最大生成长度 | 限制回复的 token 数 |
| `stream` | 是否流式返回 | `true` 时用 SSE 增量推送，默认 `false` |
| `n` | 生成几个候选回复 | 默认 1，响应中 `choices` 数组会有 n 个元素 |

其中 `model` 和 `messages` 是必填的，其余都可以省略使用默认值。

此外还有一些控制生成行为的参数：

- `top_p`（核采样概率阈值，默认一般是 1.0）
- `stop`（遇到指定字符串时停止生成）
- `presence_penalty` / `frequency_penalty`（惩罚重复内容，默认一般是 0）
- `seed`（固定随机种子以复现输出）
- `response_format`（强制输出 JSON 等特定格式）

注：`max_tokens` 作为通用"最大生成长度"已不够准确。Responses API 用 `max_output_tokens`；Chat Completions 的推理模型常用 `max_completion_tokens`；更早/非推理模型才继续用 `max_tokens`。

## 二、messages：对话的角色交替

每条消息有一个 `role`（角色），多种角色交替出现：

```json
{
  "messages": [
    { "role": "system", "content": "你是一个数据分析助手。" },
    { "role": "user", "content": "帮我分析一下销售数据的趋势" },
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [{
        "id": "call_abc123",
        "function": { "name": "read_file", "arguments": "{\"path\": \"/data/sales.csv\"}" }
      }]
    },
    { "role": "tool", "tool_call_id": "call_abc123", "content": "日期,销售额\n2024-01,10000\n2024-02,12000" }
  ]
}
```

| 角色 | 谁说的 | 作用 |
|------|--------|------|
| `system` | 开发者 | 定义模型的行为边界 |
| `user` | 用户 | 提出需求或问题 |
| `assistant` | 模型 | 模型的回复/工具调用 |
| `tool` | 工具执行结果 | 把工具的执行结果回传给模型 |

注：o1 及之后模型推荐用 developer 替代 system 来表达系统角色。

用户提需求 → 模型调工具 → 工具返回结果，这正好对应 Agent Loop 的一轮循环。下一轮开始时，这段完整历史作为新的 `messages` 传入，模型就知道之前发生了什么。

## 三、tools：完整 JSON Schema 示例

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

`tools` 字段定义了 Agent Loop 中"行动"步骤的全部可选动作。

## 四、响应结构：choices[0].message

响应的核心在 `choices[0].message` 里。`choices` 是一个数组，因为请求时可以通过 `n` 参数让模型生成多个候选回复，但实际使用中几乎都取第一个。

模型一般会有两种回复模式：

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

`finish_reason: "stop"` —— 模型给出了最终回答，Agent Loop 终止，任务完成。

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

`finish_reason: "tool_calls"` —— 模型没结束，它在请求执行工具，Agent Loop 继续，执行工具、获取结果、再次调用模型。

## 五、SSE 流式响应

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

## 六、Responses API：Chat Completion 的下一代

2025 年 3 月，OpenAI 发布了 Responses API。它不是替代品，而是 Chat Completion 的演进。三个关键变化：

### 有状态对话：链式引用

Chat Completion 要自己维护完整的 `messages` 数组。Responses API 用 `previous_response_id` 链式引用上一轮：

```json
{
  "model": "gpt-4o",
  "previous_response_id": "resp_abc123",
  "input": "那化学奖呢？"
}
```

服务端自己找回历史上下文，开发者不用管理消息数组。`previous_response_id` 来自上一次响应的 `id` 字段，注意它有有效期（目前 30 天），过期后历史不可找回。

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

### 预声明工具：不用自己写工具定义

Chat Completion 里每个工具都要自己写完整的 `function` 声明（name、description、parameters）。Responses API 提供了预声明工具，OpenAI 已经帮你定义好了，启用即可：

```json
{
  "model": "gpt-4o",
  "tools": [{ "type": "web_search_preview" }],
  "input": "2024 年诺贝尔物理学奖颁给了谁？"
}
```

注意，"预声明"不是"默认开启"——你仍然需要在 `tools` 里显式启用，告诉模型"这次调用你可以用搜索"。只是不需要自己写几十行 JSON Schema 了。

类似地还有 `file_search`（搜索你上传到 OpenAI 云端的文件）、`code_interpreter`（在沙箱中执行代码）等。

## 七、Anthropic Messages API：与 OpenAI 的差异

Anthropic（Claude 的开发商）没有兼容 OpenAI，而是设计了自己的 Messages API。两家做的是同一件事，但协议细节几乎处处不同。理解这些差异，是对接不同模型时的第一道门槛。

### system prompt：顶层字段 vs messages 里的角色

OpenAI 把 system prompt 放在 `messages` 数组里，当作第一条消息：

```json
{
  "messages": [
    { "role": "system", "content": "你是一个数据分析助手。" },
    { "role": "user", "content": "帮我分析一下销售数据" }
  ]
}
```

Anthropic 把它抽出来，作为独立的顶层字段 `system`：

```json
{
  "system": "你是一个数据分析助手。",
  "messages": [
    { "role": "user", "content": "帮我分析一下销售数据" }
  ]
}
```

`messages` 里只有 `user` 和 `assistant` 两种角色，不接受 `system`。

### 工具调用：两个字段 vs content block

OpenAI 把工具调用放在 `tool_calls` 字段，工具结果用 `role: "tool"` 消息回传：

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [{
    "id": "call_abc123",
    "function": { "name": "read_file", "arguments": "{\"path\": \"/data/sales.csv\"}" }
  }]
}
```

```json
{ "role": "tool", "tool_call_id": "call_abc123", "content": "日期,销售额\n2024-01,10000" }
```

Anthropic 把工具调用作为 `content` 数组里的 `tool_use` 块，工具结果作为 `tool_result` 块嵌在 `user` 消息里：

```json
{
  "role": "assistant",
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_abc123",
      "name": "read_file",
      "input": { "path": "/data/sales.csv" }
    }
  ]
}
```

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_abc123",
      "content": "日期,销售额\n2024-01,10000"
    }
  ]
}
```

关键区别：

- **位置**：OpenAI 用独立字段 `tool_calls`，Anthropic 塞进 `content` 数组
- **参数格式**：OpenAI 的 `arguments` 是 JSON 字符串，Anthropic 的 `input` 是 JSON 对象（不用再 parse）
- **工具结果的角色**：OpenAI 用 `role: "tool"`，Anthropic 用 `role: "user"`（工具结果被视为用户侧的输入）
- **关联 ID 字段名**：`tool_call_id` vs `tool_use_id`

### 响应结构：choices vs content 数组

OpenAI 的响应包在 `choices` 数组里：

```json
{
  "choices": [{
    "message": { "role": "assistant", "content": "分析结果..." },
    "finish_reason": "stop"
  }]
}
```

Anthropic 的响应直接是扁平结构，`content` 是内容块数组：

```json
{
  "content": [{ "type": "text", "text": "分析结果..." }],
  "stop_reason": "end_turn"
}
```

对应的结束标记也不同：OpenAI 是 `finish_reason: "stop"` / `"tool_calls"`，Anthropic 是 `stop_reason: "end_turn"` / `"tool_use"`。

### 流式响应：delta 增量 vs 事件类型

OpenAI 的流式用统一的 `data:` 行，每个 chunk 都是 `delta`：

```
data: {"choices":[{"delta":{"content":"根据"},"index":0}]}
data: {"choices":[{"delta":{"content":"数据"},"index":0}]}
data: [DONE]
```

Anthropic 的流式定义了一套更细粒度的事件类型，每个事件有 `event:` 和 `data:` 两行：

```
event: message_start
data: {"type":"message_start","message":{"role":"assistant","content":[]}}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"根据"}}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"数据"}}

event: message_stop
data: {"type":"message_stop"}
```

OpenAI 只有一种 chunk 格式，靠 `delta` 里的字段区分内容；Anthropic 用事件类型（`message_start`、`content_block_start`、`content_block_delta`、`content_block_stop`、`message_delta`、`message_stop`）明确标记每个阶段，解析逻辑更清晰但更复杂。

### 认证方式

| | OpenAI | Anthropic |
|---|---|---|
| Header | `Authorization: Bearer <key>` | `x-api-key: <key>` |
| 版本控制 | 无 | `anthropic-version: 2023-06-01` |

Anthropic 要求在请求头中指定 API 版本，这样可以在不破坏旧客户端的情况下迭代协议。

### 一张表总结核心差异

| 对比项 | OpenAI Chat Completions | Anthropic Messages |
|--------|------------------------|--------------------|
| 端点 | `POST /v1/chat/completions` | `POST /v1/messages` |
| system prompt | `messages` 中 `role: "system"` | 顶层 `system` 字段 |
| 工具调用位置 | `tool_calls` 字段 | `content` 中的 `tool_use` 块 |
| 工具参数格式 | JSON 字符串 | JSON 对象 |
| 工具结果角色 | `role: "tool"` | `role: "user"` + `tool_result` 块 |
| 响应结构 | `choices[].message` | 扁平 `content[]` |
| 结束标记 | `finish_reason: "stop"` | `stop_reason: "end_turn"` |
| 工具结束标记 | `finish_reason: "tool_calls"` | `stop_reason: "tool_use"` |
| 流式格式 | 统一 `delta` chunk | 分类型事件（`content_block_delta` 等） |
| 认证头 | `Authorization: Bearer` | `x-api-key` |
| API 版本 | 无 | `anthropic-version` 头 |

这些差异在 Agent Loop 的抽象层之下——无论底层调的是 OpenAI 还是 Anthropic，循环的"思考→行动→观察"逻辑不变。变的是 HTTP 层的契约：请求怎么拼、响应怎么拆。这也是为什么很多 Agent 框架会在内部统一一种消息格式，在适配层做转换，让核心循环不用关心具体调用的是哪家的模型。

## 本章要点

- 请求的"必填"只有 `model` 和 `messages`；其余控制参数（temperature、max_tokens、stream、n）按需开启
- `messages` 角色分四种：system / user / assistant / tool，o1 后推荐用 developer 替代 system
- `tools` 用 JSON Schema 描述，name + description + parameters 是三件套
- 响应通过 `finish_reason` 区分模型是在"说话"还是"调工具"
- SSE 流式用 `delta` 增量传输，工具调用参数也是流式增量
- Responses API 是 Chat Completion 的演进，引入 `previous_response_id`、`output` 数组、预声明工具
- Anthropic 协议在 system prompt 位置、工具调用形态、响应结构、流式事件命名上都与 OpenAI 不同
- 这些差异都在适配层，Agent Loop 看到的应该是统一的抽象
