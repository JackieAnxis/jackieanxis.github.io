# LLM API 章节设计

## 基本信息

- **所属章节**：02-core-work-mode（Agent 的核心工作模式）
- **文件编号**：02-llm-api.md
- **h1 标题**：与模型对话：LLM API 是怎么工作的
- **位置**：接在 01-agent-loop.md 之后，作为 02-core-work-mode 的第二个小节
- **侧边栏标题**：与模型对话：LLM API 是怎么工作的

## 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 结构方案 | 方案 C：先讲透 OpenAI，再集中讲 Anthropic 差异 | 用户选择 |
| 主线标准 | OpenAI Chat Completion API | 事实上的行业标准，覆盖面最广 |
| 次线标准 | Anthropic Messages API | 在差异部分提及 |
| 展示风格 | 真实 JSON 示例 | 用户选择，比伪代码更直观 |
| 工具调用 | 包含 | Agent Loop 中 Action 步骤的展开 |
| 流式响应 | 包含 | Agent 实时体验的关键机制 |
| SVG 图示 | 不需要 | JSON 示例已足够清晰 |

## 核心叙事线

从上一节 Agent Loop 引出：Loop 每一轮"思考→行动→观察"的背后是一次 LLM API 调用。本节打开这个黑盒，展示 Agent 和模型之间到底在"说什么"。

定位不是 API 调用教学（那是 SDK 文档的事），而是让读者理解请求怎么组织、响应怎么回来、工具怎么声明和调用。

## 章节结构

### 引言

- 从 Agent Loop 引出：每一轮循环 = 一次 API 调用
- 本节目的：打开黑盒，看清楚"对话"的全貌
- 以 OpenAI 标准为主线，因为它是最广泛采用的标准

### h2：OpenAI 标准——请求是怎么组装的

**内容要点**：
- 最小请求示例（JSON）：`model`、`messages`、`tools` 三个核心字段
- `messages` 数组的角色体系：
  - `system`：系统指令，定义模型的行为边界
  - `user`：用户输入
  - `assistant`：模型的历史回复
  - `tool`：工具执行结果
- 多轮对话 JSON 示例（3-4 条消息，展示角色交替）
- `tools` 字段：工具声明格式
  - `name`：工具名称
  - `description`：工具描述（模型通过这个决定是否调用）
  - `parameters`：JSON Schema 定义参数结构
- 工具声明 JSON 示例

**JSON 示例要求**：
- 每个示例配有简短解释文字
- 不堆砌大段 JSON，保持可读性
- 关键字段用注释或加粗标注

### h2：模型怎么回复——响应结构

**内容要点**：
- 响应核心结构：`choices[0].message` 包含 `role`、`content`、`tool_calls`
- 两种回复模式：
  - **文本回复**：`content` 有值，`tool_calls` 为空 → 模型直接回答
  - **工具调用**：`tool_calls` 有值，包含 `function.name` 和 `function.arguments` → 模型请求执行工具
- 两种模式的 JSON 示例
- `finish_reason` 的含义：
  - `stop`：正常结束，模型给出了最终回答
  - `tool_calls`：模型需要调用工具
- 连回 Agent Loop：
  - 文本回复 = Loop 的终止条件（任务完成）
  - 工具调用 = Loop 继续循环（执行工具 → 获取结果 → 再次调用）

### h2：流式响应——一个字一个字地吐出来

**内容要点**：
- 为什么需要流式：Agent 的响应可能很长，等全部生成完再返回体验差
- SSE (Server-Sent Events) 机制简介：
  - HTTP 长连接
  - 服务端持续推送 `data: {...}` 事件
- 流式响应的 JSON 结构变化：
  - 完整响应变成 `delta`（增量片段）
  - `delta.content`：每次返回一小段文本
  - `delta.tool_calls`：增量返回工具调用参数
- 简化 SSE 流示例（3-4 个 chunk → 展示拼合过程）
- 连回 Agent Loop：
  - 流式不影响 Loop 逻辑
  - 改变的是"观察"的时机：从"等全部完成再看"变成"边生成边看"

### h2：Anthropic 标准——不同的设计选择

**内容要点**：
- 不重复完整流程，只聚焦关键差异
- 核心差异点：
  1. **消息格式**：
     - OpenAI：`system` 是 messages 数组中的一条消息
     - Anthropic：`system` 是顶级字段，独立于 messages
  2. **工具调用**：
     - OpenAI：独立的 `tool_calls` 字段，包含 `function.name` 和 `function.arguments`
     - Anthropic：`content` 数组中的 `tool_use` block；工具结果通过 `tool_result` block 回传
  3. **流式事件**：
     - OpenAI：`delta` 增量片段，结构相对扁平
     - Anthropic：明确的事件类型（`message_start`、`content_block_delta`、`message_stop`），更结构化
- 对比方式：表格或并列 JSON（同一场景，两边的写法放在一起）
- 结尾总结：OpenAI 更扁平简洁，Anthropic 更结构化显式——两种风格，同一件事

## 写作风格

- 沿用 01-agent-loop.md 的风格：中文为主，技术术语保留英文
- JSON 示例是核心载体，每个 JSON 配简短解释
- 与 Agent Loop 保持关联：每讲到 API 的一个环节，点出它在 Loop 中的对应位置
- 不写 SDK 调用代码，只展示原始 HTTP/JSON 层面的结构

## 不包含的内容

- SDK 使用教程
- 认证和鉴权机制
- 价格和模型选择
- 错误处理的完整规范
- 图片/音频等多模态内容
- Embedding、Fine-tuning 等非 Chat API
