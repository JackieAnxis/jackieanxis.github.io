# MCP（Model Context Protocol）：AI 时代的 “USB-C 接口”

Model Context Protocol（模型上下文协议，简称 MCP）是 Anthropic 提出的开源标准协议，用于标准化 AI 模型与外部数据源之间的通信方式。它就像电脑和外设之间的”USB-C 接口”——无论什么牌子的电脑（AI 客户端），连接什么设备（数据源），只要都支持 USB-C（MCP 标准），插上就能协同工作，无需为每个设备单独开发驱动。

![MCP Architecture](https://www.runoob.com/wp-content/uploads/2025/03/https___dev-to-uploads.s3.amazonaws.com_uploads_articles_nuvybev34xhz3btc0xys.jpeg)

## 什么是MCP

大语言模型本身是”缸中之脑”——能力很强，但与外界完全隔离。要让 AI 成为生产力工具，它需要访问真实世界的上下文：读取本地代码库、检索 Notion 文档、查询业务数据库。在 MCP 出现之前，这面临严重的碎片化问题（N × M 难题）：

- 3 个 AI 客户端（Claude Desktop、Cursor、自定义智能体）× 4 个数据源（GitHub、Slack、本地文件、PostgreSQL）= 12 次定制化集成。
- 开发成本高、难维护，且每次集成的数据安全标准不一，存在隐私泄露风险。

一个常见的疑问是：”AI 不是早就支持 Function Calling 了吗？这和 MCP 有什么区别？”

简而言之：MCP 底层利用 Function Calling 来执行工具，但在上面包裹了一层标准化外壳（MCP Server）。只需写一次 MCP Server，任何支持 MCP 的 AI 都能直接发现并调用其中的 Function，无需再做适配。

| 特性 | Function Calling（函数调用） | MCP（模型上下文协议） |
| --- | --- | --- |
| 定位 | 一种模型能力，赋予模型输出结构化 JSON 以调用特定函数 | 一套完整的标准化架构，包含客户端和服务器端的通信协议 |
| 作用范围 | 仅解决”模型如何发起动作”。开发者仍需自行对接数据源、管理鉴权、处理执行 | 解决”系统如何连接”。标准化了资源读取（Resources）、动作执行（Tools，底层利用 Function Calling）和指令模板（Prompts） |
| 比喻 | 学会了用普通话点菜 | 建立了一套全球统一的餐饮操作系统——涵盖点菜、接单、备菜、上菜的完整流程 |

通过标准化接口，MCP 提供了以下价值：

- **一次编写，到处运行**：数据提供方只需开发一个 MCP Server，所有支持 MCP 的 AI 客户端均可即插即用。
- **更安全的数据控制**：MCP 采用 Client-Server 架构，数据控制权保留在 MCP Server 端，AI 客户端只能通过协议请求数据，无法越权访问。
- **加速 AI 智能体生态繁荣**：打破各厂商自建闭环生态的壁垒，开发者专注于打造高质量的 MCP Server，无需为不同 AI 模型重复适配。

## MCP 的能力

MCP 定义了三大核心能力，让 MCP Server 向 AI 模型开放全方位的数据访问和操作权限：

### 资源 (Resources) —— “看”的能力

资源是 MCP 协议中的**只读数据源**，允许 Server 将结构化或非结构化的信息安全地暴露给模型，作为推理的背景上下文。

- **应用场景**：本地文件内容、数据库表结构与记录、实时日志流、Notion 文档、GitHub Issue 列表。
- **实现机制**：MCP 使用 URI 方案（如 `file:///workspace/src/main.py` 或 `postgres://db/users`）来定位和读取数据，类似于网页 URL。

```jsonc
// Request
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "method": "resources/read",
  "params": {
    "uri": "file:///Users/dev/my-project/config.yaml"
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "result": {
    "contents": [
      {
        "uri": "file:///Users/dev/my-project/config.yaml",
        "mimeType": "application/x-yaml",
        "text": "server:\n  port: 8080\n  host: 127.0.0.1\ndebug: true"
      }
    ]
  }
}
```

### 工具 (Tools) —— “做”的能力

工具是 MCP 协议中的**可执行动作**，允许 AI 模型主动发起操作、与外部系统动态交互，底层依赖 Function Calling 能力。

- **应用场景**：运行终端命令、创建 GitHub Pull Request、向 Slack 发消息、重构并保存本地代码。
- **实现机制**：Server 声明工具名称、描述及符合 JSON Schema 的参数列表。模型决定使用工具时输出结构化参数，由 MCP Server 执行并返回结果。

```jsonc
// Request
{
  "jsonrpc": "2.0",
  "id": "req-002",
  "method": "tools/call",
  "params": {
    "name": "create_github_issue",
    "arguments": {
      "repo": "anthropic/mcp-standard",
      "title": "Bug: Server connection timeout",
      "body": "The MCP server randomly times out after 30 seconds of inactivity..."
    }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": "req-002",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Successfully created issue #42. URL: https://github.com/anthropic/mcp-standard/issues/42"
      }
    ],
    "isError": false
  }
}
```

### 提示词模板 (Prompts) —— “想”的能力

提示词模板是 MCP 协议中的**交互快捷方式**，允许 Server 预设结构化提示词或工作流模板，引导模型更高效地完成特定任务。

- **应用场景**：”审查这段代码的安全性”、”总结近期的异常日志”、”根据 API 文档编写测试用例”。
- **实现机制**：Server 集中管理 prompt 模板，用户或 Host 调用时填入变量，自动拼装成适合当前数据源的提示词，免去手动编写复杂 Prompt 的成本。

```jsonc
// Request
{
  "jsonrpc": "2.0",
  "id": "req-003",
  "method": "prompts/get",
  "params": {
    "name": "git_commit_generator",
    "arguments": {
      "diff_content": "--- a/main.py\n+++ b/main.py\n@@ -1,2 +1,3 @@\n def hello():\n-    print('world')\n+    print('MCP world')"
    }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": "req-003",
  "result": {
    "description": "Standardized conventional commit prompt",
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "You are an expert developer. Please generate a Conventional Commit message for the following code changes. Make sure to use feat, fix, docs, etc.\n\nCode Diff:\n--- a/main.py\n+++ b/main.py\n@@ -1,2 +1,3 @@\n def hello():\n-    print('world')\n+    print('MCP world')"
        }
      }
    ]
  }
}
```

---

> **总结：** MCP 通过 **Resources（递资料）**、**Tools（递工具）** 和 **Prompts（递思路）**，把孤立的大模型变成既懂业务上下文、又能跨软件执行任务的智能体。


### 还有哪些 method 可用？

除了上述三大核心业务能力，MCP 协议还定义了一系列底层控制方法，用于连接发现、握手协商和状态保持：

#### 发现机制 (Discovery) —— “你都有什么？”

在调用工具或读取资源之前，Client 必须先了解 Server 提供了哪些能力。`list` 系列方法就是 MCP 的”菜单”：

- **`resources/list`**：获取服务器上所有可读资源的目录。
- **`resources/templates/list`**：获取资源模板列表（支持通过填充变量构造动态 URI）。
- **`tools/list`**：获取服务器提供的所有工具及其 JSON Schema 参数说明。
- **`prompts/list`**：获取所有可用的提示词模板列表。

#### 生命周期与保活 (Lifecycle & Ping) —— “握手与心跳”

MCP 连接建立时需经过握手流程，协商双方支持的功能和协议版本。

- **`initialize`**：客户端连接后发送的第一条消息，包含客户端名称、版本及支持的能力。服务器返回自己的版本和能力边界。
- **`notifications/initialized`**：客户端收到 `initialize` 响应后发送，表示握手完成，可以正常通信。
- **`ping`**：心跳检测，任一方均可发送，对方必须回复，以确认连接仍然存活。

#### 订阅与实时通知 (Subscriptions & Notifications) —— “有情况通知我”

对于动态更新的数据源（实时日志、数据库新增记录等），MCP 支持事件驱动的推送，避免模型轮询。

- **`resources/subscribe`** / **`resources/unsubscribe`**：订阅或取消订阅某个资源。
- **`notifications/resources/updated`**：订阅的资源发生变化时，服务器主动推送通知。
- **`notifications/progress`**：耗时操作（如编译代码）的实时进度更新。
- **`notifications/message`**：服务器发送自定义日志或诊断信息（支持 info、debug、error 等级别）。

#### 高级双向交互 (Advanced Features) —— “反向调用与上下文补全”

随着协议演进，MCP 还加入了更高级的 Agentic 特性：

- **`completion/complete`**：自动补全功能，类似终端按 Tab 键，客户端可向服务器请求参数的补全建议。
- **`sampling/createMessage`（Server-to-Client）**：一种**反向调用**能力。服务器被授权后，可反过来请求客户端（即 AI 模型）进行推理和生成文本。在构建 Server 驱动的多步骤 Agent 工作流时非常有用。
- **`roots/list`**：客户端告知服务器当前工作区根目录，用于限制文件访问范围、实现相对路径导航。

## 核心架构

- **Host（宿主应用）**：AI 模型运行和用户交互的地方，管理模型的生命周期。例如 Cursor、Claude Desktop 或自定义 Agent 平台。Host 不直接访问外部数据，而是通过 Client 间接完成。

- **Client（客户端）**：嵌入在 Host 中的逻辑组件，充当”翻译器”和”接口管理器”。负责建立与 Server 的连接，使用统一协议发送请求和接收响应。Host 通过 Client 发现和利用外部能力。

- **Server（服务器）**：独立进程，可运行在本地或远程。直接对接具体数据源或功能集（本地文件系统、SQLite、Slack API、GitHub API 等），向 Client 声明自身能力（Resources、Tools、Prompts）。

- **Protocol（协议）**：基于 JSON-RPC 的标准化通信规范，定义了 Client 与 Server 之间请求/响应的格式，以及资源、工具和提示模板的规范。

```
┌───────────────────────────────────────────┐
│                    HOST                   │
│        宿主应用，如 Cursor / Claude       │
│                                           │
│    ┌───────────┐      ┌──────────────┐    │
│    │  AI 模型  │ ◀──▶ │ 宿主核心逻辑 │    │
│    └───────────┘      └───────┬──────┘    │
│                               ▼           │
│    ┌─────────────────────────────────┐    │
│    │             CLIENT              │    │
│    │         MCP 客户端组件          │    │
│    └────────────────┬────────────────┘    │
└─────────────────────┼─────────────────────┘
                      │
           ┌──────────▼───────────┐
           │       PROTOCOL       │
           │ 标准化 JSON-RPC 通信 │
           └──────────┬───────────┘
                      │
     ┌────────────────┼────────────────┐
     │                ▼                │
     │     ┌─────────────────────┐     │
     │     │        SERVER       │     │
     │     │    MCP 服务器进程   │     │
     │     └──────────┬──────────┘     │
     │                ▼                │
     │     ┌─────────────────────┐     │
     │     │  数据 / 能力提供层  │     │
     │     │                     │     │
     │     │  资源 / 工具 /      │     │
     │     │  提示词模板         │     │
     │     │                     │     │
     │     │  File DB Slack Git  │     │
     │     └─────────────────────┘     │
     └─────────────────────────────────┘
```

MCP 采用这种架构，核心目的是解决 AI 应用落地面临的**集成成本高**、**数据不安全**和**生态碎片化**三大痛点：

- 通过 Client-Server 模式与标准化协议实现解耦，将 N×M 的定制开发削减为 N+M，做到”一次接入，全局互通”。
- 将数据访问权限和敏感密钥保留在 Server 端，建立安全防线，防范模型越权。
- 让”思考”的 AI 模型与”执行”的外部服务各司其职，打破编程语言壁垒，为 AI 智能体生态构筑安全高效的底层基础设施。

## 通信协议

MCP 在”语言”层面使用 **JSON-RPC 2.0** 规定报文格式，而在”管道”（传输层）层面，定义了两种底层传输协议以适应不同的场景：

### 1. Stdio（标准输入/输出）—— 本地运行

最常用、最安全的通信方式，用于 AI 客户端与数据源在同一台机器上的场景。

- **工作原理**：AI 客户端在后台将 MCP Server 作为子进程启动，通过操作系统管道通信——向 `stdin` 写请求，从 `stdout` 读结果。
- **典型场景**：读取本地代码库、访问本地 SQLite 数据库、执行本地终端命令。
- **核心优势**：
  - **极致安全**：不依赖网络接口，无需开放端口，外部无法通过网络扫描或攻击。
  - **生命周期绑定**：关闭 AI 客户端时，MCP Server 子进程自动终止，不留僵尸进程。

### 2. HTTP + SSE（Server-Sent Events）—— 远程云端

当 AI 客户端与数据源不在同一台机器上（跨局域网、云端调用企业内网数据）时使用。

- **工作原理**：采用”双通道”设计：
  1. **Client → Server**：客户端通过 HTTP `POST` 发送 JSON-RPC 消息。
  2. **Server → Client**：服务器通过 SSE 长连接返回结果，并可主动推送资源更新、任务进度等通知。
- **典型场景**：公司内网部署统一的 GitHub/Notion MCP Server，全团队通过 URL 连接。
- **核心优势**：
  - **防火墙友好**：SSE 基于标准 HTTP/HTTPS（端口 80/443），不会被企业防火墙拦截。
  - **跨平台互通**：适合 Web 架构，能发 HTTP 请求的设备即可接入。

---

### 扩展：协议的开放性 (WebSocket 等)

虽然官方只定义了 Stdio 和 SSE，但 MCP 架构高度解耦。核心只是”交换 JSON-RPC 字符串”，因此社区常基于 **WebSocket** 实现传输层（适合高频双向通信）。只要 Client 和 Server 能安全完整地传递 JSON 字符串，上层 MCP 逻辑无需修改。

**总结**：查本地文件走 **Stdio**，查云端数据走 **HTTP+SSE**。这就是它被称为”USB-C 接口”的原因——既能插本地优盘，也能连远端网络硬盘。