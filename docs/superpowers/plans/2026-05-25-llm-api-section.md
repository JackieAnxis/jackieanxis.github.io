# LLM API 章节 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `02-core-work-mode` 下创建第二个小节 `02-llm-api.md`，用真实 JSON 示例讲解 LLM API 的工作方式，以 OpenAI 为主线，覆盖请求/响应/工具调用/流式/Responses API，最后对比 Anthropic 差异。

**Architecture:** 单文件 Markdown 内容任务。文章采用"引言 → OpenAI 请求 → 响应 → 流式 → Responses API → Anthropic 差异"的结构，每部分用 JSON 示例 + 简短解释展开。完成后更新 VitePress 侧边栏配置。

**Tech Stack:** VitePress, Markdown, JSON code blocks

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `docs/agent-revelations/02-core-work-mode/02-llm-api.md` | Create | 本节正文，包含 frontmatter、唯一 h1、5 个 h2、JSON 示例 |
| `docs/.vitepress/config.mts` | Modify | 在 `Agent 的核心工作模式` 侧边栏组中添加本节链接 |

---

### Task 1: 创建 LLM API 章节正文

**Files:**
- Create: `docs/agent-revelations/02-core-work-mode/02-llm-api.md`

- [ ] **Step 1: 确认目标文件尚未存在**

```bash
test ! -f docs/agent-revelations/02-core-work-mode/02-llm-api.md
```

Expected: 命令退出码为 `0`，表示文件尚不存在。

- [ ] **Step 2: 创建 Markdown 正文**

Use `Write` tool to create `docs/agent-revelations/02-core-work-mode/02-llm-api.md` with this content:

````markdown
---
title: 与模型对话：LLM API 是怎么工作的
---

# 与模型对话：LLM API 是怎么工作的

上一节我们讲了 Agent Loop：一个 `while (true)` 循环，让模型围绕目标持续思考、行动、观察。但 Loop 每一轮"思考 → 行动 → 观察"的背后，到底发生了什么？

答案是：每一次循环，都是一次 LLM API 调用。

你发一段消息过去，模型返回一段回复。如果你想让它调用工具，就在请求里声明工具；如果你想让它持续工作，就把历史消息一次次传过去。Agent Loop 的所有"智能"，最终都建立在这个朴素的请求-响应机制上。

这一节我们打开这个黑盒，看看 Agent 和模型之间到底在"说什么"。以 OpenAI 的 Chat Completion API 为主线，因为它是最广泛采用的标准。最后再看 Anthropic 的 Messages API 有什么不同。

## 请求是怎么组装的

向 LLM 发一个请求，核心就是三个字段：

```json
{
  "model": "gpt-4o",
  "messages": [...],
  "tools": [...]
}
```

- `model`：用哪个模型
- `messages`：对话历史，告诉模型"之前说了什么"
- `tools`：可用工具列表，告诉模型"你能做什么"

### messages：对话的角色交替

`messages` 是一个数组，每条消息都有一个 `role`（角色）：

```json
{
  "messages": [
    { "role": "system", "content": "你是一个数据分析助手。" },
    { "role": "user", "content": "帮我分析一下销售数据的趋势" },
    { "role": "assistant", "content": "好的，我需要先读取数据文件。请调用 read_file 工具。" },
    { "role": "tool", "content": "日期,销售额\n2024-01,10000\n2024-02,12000\n2024-03,11500", "tool_call_id": "call_abc123" }
  ]
}
```

四种角色，各司其职：

| 角色 | 谁说的 | 作用 |
|------|--------|------|
| `system` | 开发者 | 定义模型的行为边界，相当于"岗位说明书" |
| `user` | 用户 | 提出需求或问题 |
| `assistant` | 模型 | 模型的回复 |
| `tool` | 工具执行结果 | 把工具的执行结果回传给模型 |

注意看这段对话的顺序：用户提了需求 → 模型说要调工具 → 工具执行后把结果传回来。这正好对应 Agent Loop 里的一轮"思考 → 行动 → 观察"。下一轮循环开始时，这段完整的历史会作为新的 `messages` 传给模型，模型就知道之前发生了什么，可以继续推进。

### tools：告诉模型"你能做什么"

如果不声明工具，模型只能用文本回答。声明了工具，模型才有了"动手"的能力：

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
            "path": {
              "type": "string",
              "description": "文件的绝对路径"
            }
          },
          "required": ["path"]
        }
      }
    }
  ]
}
```

一个工具声明包含三个关键部分：

- **name**：工具叫什么。模型在回复中用这个名字来引用工具。
- **description**：工具做什么。模型靠这段描述决定"什么时候该用这个工具"，所以写清楚很重要。
- **parameters**：工具需要什么参数。用 JSON Schema 定义，告诉模型参数的名称、类型和是否必填。

回到 Agent Loop 的视角：`tools` 字段定义了 Loop 中"行动"步骤的全部可选动作。模型每次循环只从中选一个（或选择直接回答），这就构成了 Agent 的行为边界。

## 模型怎么回复：响应结构

请求发出去了，模型会返回什么？响应的核心在 `choices[0].message` 里：

### 文本回复

当模型认为可以直接回答时：

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "根据数据分析，2024年Q1销售额整体呈上升趋势..."
      },
      "finish_reason": "stop"
    }
  ]
}
```

`finish_reason` 是 `"stop"`，意思是模型正常结束了，给出了最终回答。

### 工具调用

当模型决定需要调用工具时：

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc123",
            "function": {
              "name": "read_file",
              "arguments": "{\"path\": \"/data/sales.csv\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ]
}
```

`finish_reason` 变成了 `"tool_calls"`，意思是模型没有结束，它在请求执行工具。`tool_calls` 数组里包含了工具名称和参数。

连回 Agent Loop：

- `finish_reason: "stop"` → Loop 终止，任务完成
- `finish_reason: "tool_calls"` → Loop 继续循环，执行工具、获取结果、再次调用模型

这就是 Agent Loop 的心跳：每次模型返回 `tool_calls`，Loop 就知道"还没完，继续"。

## 流式响应：一个字一个字地吐出来

上面讲的都是"等模型全部生成完，再一次性返回"。但实际用 Agent 的时候你会发现，它的回复是一个字一个字蹦出来的，不是等了好几秒才突然出现一大段。

这就是流式响应（Streaming）。

### 为什么需要流式

模型生成文本是逐 token 预测的（如果你读过前面的大模型推理章节，应该对这个过程很熟悉）。一个长回答可能有几百个 token，等全部生成完再返回，用户可能要干等十几秒。

流式响应的思路是：每生成一个 token 就立刻推送给客户端，不用等全部完成。

### SSE：服务端主动推送

流式响应使用 SSE（Server-Sent Events）协议。它本质上是一个 HTTP 长连接，服务端不断推送 `data: {...}` 事件：

```
data: {"choices":[{"delta":{"content":"根据"},"index":0}]}

data: {"choices":[{"delta":{"content":"数据"},"index":0}]}

data: {"choices":[{"delta":{"content":"分析"},"index":0}]}

data: [DONE]
```

注意响应结构的变化：完整响应里的 `message` 变成了 `delta`（增量）。每个 chunk 只包含本次新增的一小段内容，客户端需要自己拼接：

```
"根据" + "数据" + "分析" → "根据数据分析"
```

工具调用的参数也是增量传输的：

```
data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":""}}]}}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"pa"}}]}}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"th\": "}}]}}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"/data/sales.csv\"}"}}]}}]}

data: [DONE]
```

拼合之后：`{"path": "/data/sales.csv"}`，和之前非流式返回的 `arguments` 完全一样。

流式不影响 Agent Loop 的逻辑，它改变的是"观察"的时机：从"等全部完成再看"变成"边生成边看"。对用户来说，这意味着不用对着空白屏幕干等，体验上是一个质的飞跃。

## Responses API：Chat Completion 的下一代

2025 年 3 月，OpenAI 发布了 Responses API。它不是 Chat Completion 的替代品，而是在它基础上的演进。了解它的设计思路，能帮你看清 API 标准正在往哪个方向走。

### 内置工具：从"自己声明"到"开箱即用"

Chat Completion 里，每个工具都要你自己写 `name`、`description`、`parameters`。Responses API 提供了内置工具，不需要声明就能直接用：

```json
{
  "model": "gpt-4o",
  "tools": [
    { "type": "web_search_preview" }
  ],
  "input": "2024 年诺贝尔物理学奖颁给了谁？"
}
```

`web_search_preview` 是 OpenAI 预置的搜索工具，不需要你定义参数格式。类似地还有 `file_search`（文件搜索）、`code_interpreter`（代码解释器）等。

### 有状态对话：从"自己维护历史"到"链式引用"

Chat Completion 里，你需要自己维护完整的 `messages` 数组，每次把所有历史消息传过去。Responses API 引入了 `previous_response_id`：

```json
{
  "model": "gpt-4o",
  "previous_response_id": "resp_abc123",
  "input": "那化学奖呢？"
}
```

只传新的输入和上一轮响应的 ID，服务端自己找回历史上下文。开发者不再需要自己管理消息数组。

### 统一的输出结构

Chat Completion 的回复里，文本在 `content`，工具调用在 `tool_calls`，两个字段。Responses API 把它们统一到 `output` 数组里：

```json
{
  "output": [
    {
      "type": "message",
      "content": [
        { "type": "output_text", "text": "2024 年诺贝尔物理学奖颁给了..." }
      ]
    },
    {
      "type": "web_search_call",
      "id": "ws_abc123",
      "status": "completed"
    }
  ]
}
```

文本、搜索调用、代码执行，都是 `output` 数组里的一项，结构更统一。

### 演进方向

把 Chat Completion 和 Responses API 放在一起看，API 设计的演进方向很清晰：

| 维度 | Chat Completion | Responses API |
|------|----------------|---------------|
| 工具 | 自己声明每个工具 | 内置工具开箱即用 |
| 对话状态 | 自己维护 messages 数组 | 服务端管理，链式引用 |
| 输出结构 | `content` + `tool_calls` 分离 | 统一的 `output` 数组 |

趋势是：开发者需要自己管理的东西越来越少，API 越来越像一个"有状态的服务"而不是"无状态的函数"。

## Anthropic 标准：不同的设计选择

讲完 OpenAI 的完整体系，再来看 Anthropic 的 Messages API。它做的事情一样——发消息、收回复、调工具——但设计选择不同。这里不重复讲完整流程，只聚焦三个关键差异。

### 差异一：system 是顶级字段

OpenAI 把 `system` 消息放在 `messages` 数组里，和其他消息平级：

```json
{
  "messages": [
    { "role": "system", "content": "你是数据分析助手" },
    { "role": "user", "content": "帮我分析数据" }
  ]
}
```

Anthropic 把 `system` 提到顶级，独立于 `messages`：

```json
{
  "system": "你是数据分析助手",
  "messages": [
    { "role": "user", "content": "帮我分析数据" }
  ]
}
```

设计思路的区别：OpenAI 认为系统指令也是一种消息，放在数组里更统一；Anthropic 认为系统指令和对话内容性质不同，应该分开。

### 差异二：工具调用用 content block

OpenAI 的工具调用是独立的 `tool_calls` 字段：

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_abc",
      "function": {
        "name": "read_file",
        "arguments": "{\"path\": \"/data/sales.csv\"}"
      }
    }
  ]
}
```

Anthropic 把工具调用放进 `content` 数组，作为一种 block：

```json
{
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "我来读取数据文件。"
    },
    {
      "type": "tool_use",
      "id": "toolu_abc",
      "name": "read_file",
      "input": { "path": "/data/sales.csv" }
    }
  ]
}
```

注意两点不同：
- Anthropic 的模型可以**同时输出文本和工具调用**，而 OpenAI 在调用工具时 `content` 通常为 `null`
- 参数字段名不同：OpenAI 用 `arguments`（JSON 字符串），Anthropic 用 `input`（JSON 对象）

工具执行结果的回传方式也不同。OpenAI 用 `role: "tool"` 的独立消息；Anthropic 用 `role: "user"` 消息中的 `tool_result` block：

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_abc",
      "content": "日期,销售额\n2024-01,10000\n2024-02,12000"
    }
  ]
}
```

### 差异三：流式事件有明确类型

OpenAI 的流式响应结构扁平，主要靠 `delta` 区分内容变化。Anthropic 设计了明确的事件类型：

| 事件类型 | 含义 |
|---------|------|
| `message_start` | 消息开始，包含 metadata |
| `content_block_start` | 一个内容块开始（文本或工具调用） |
| `content_block_delta` | 内容块的增量更新 |
| `content_block_stop` | 一个内容块结束 |
| `message_stop` | 整个消息结束 |

这让客户端解析流式响应时可以更精确地追踪状态，但也意味着处理逻辑更复杂。

### 两种风格，同一件事

把两个标准放在一起：

| 维度 | OpenAI | Anthropic |
|------|--------|-----------|
| system 消息 | 放在 messages 数组中 | 独立的顶级字段 |
| 工具调用 | 独立的 `tool_calls` 字段 | `content` 数组中的 `tool_use` block |
| 工具结果 | `role: "tool"` 独立消息 | `tool_result` block 嵌入 user 消息 |
| 流式事件 | `delta` 增量片段 | 明确的事件类型分层 |
| 整体风格 | 扁平简洁 | 结构化显式 |

OpenAI 更扁平简洁，Anthropic 更结构化显式。两种风格，同一件事：让模型和外部世界对话。
````

- [ ] **Step 3: 验证 Markdown 标题规范**

```bash
node - <<'NODE'
const fs = require('fs');
const path = 'docs/agent-revelations/02-core-work-mode/02-llm-api.md';
const text = fs.readFileSync(path, 'utf8');
const h1 = text.match(/^# .+$/gm) || [];
const title = text.match(/^title: (.+)$/m)?.[1];
if (title !== '与模型对话：LLM API 是怎么工作的') throw new Error(`frontmatter title mismatch: ${title}`);
if (h1.length !== 1) throw new Error(`expected exactly one h1, got ${h1.length}`);
if (h1[0] !== '# 与模型对话：LLM API 是怎么工作的') throw new Error(`h1 mismatch: ${h1[0]}`);
const h2 = text.match(/^## .+$/gm) || [];
if (h2.length !== 5) throw new Error(`expected 5 h2 sections, got ${h2.length}: ${h2.join(', ')}`);
console.log('markdown structure ok');
NODE
```

Expected: 输出 `markdown structure ok`。

- [ ] **Step 4: Commit 正文**

```bash
git add docs/agent-revelations/02-core-work-mode/02-llm-api.md
git commit -m "docs: add LLM API section - request, response, streaming, responses api, anthropic diff"
```

Expected: Git 创建正文提交。

---

### Task 2: 更新 VitePress 侧边栏

**Files:**
- Modify: `docs/.vitepress/config.mts:175-176`

- [ ] **Step 1: 在侧边栏中添加本节链接**

在 `docs/.vitepress/config.mts` 的 `Agent 的核心工作模式` 侧边栏组中，在 `Agent Loop` 条目之后添加本节：

找到：
```typescript
          { text: 'Agent Loop：Agent 的心跳', link: '/agent-revelations/02-core-work-mode/01-agent-loop' },
```

在下一行添加：
```typescript
          { text: '与模型对话：LLM API 是怎么工作的', link: '/agent-revelations/02-core-work-mode/02-llm-api' },
```

- [ ] **Step 2: 验证侧边栏配置**

```bash
node - <<'NODE'
const fs = require('fs');
const text = fs.readFileSync('docs/.vitepress/config.mts', 'utf8');
if (!text.includes('02-llm-api')) throw new Error('sidebar link not found');
console.log('sidebar config ok');
NODE
```

Expected: 输出 `sidebar config ok`。

- [ ] **Step 3: Commit 侧边栏更新**

```bash
git add docs/.vitepress/config.mts
git commit -m "docs: add LLM API section to sidebar"
```

Expected: Git 创建侧边栏更新提交。

---

### Task 3: 构建验证

**Files:**
- Verify: `docs/agent-revelations/02-core-work-mode/02-llm-api.md`
- Verify: `docs/.vitepress/config.mts`

- [ ] **Step 1: 运行 VitePress 构建**

```bash
npx vitepress build docs
```

Expected: 构建成功，无 Markdown 标题或链接导致的报错。

- [ ] **Step 2: 检查工作区状态**

```bash
git status --short
```

Expected: 无输出，表示工作区干净。
