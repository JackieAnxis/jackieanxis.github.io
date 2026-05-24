# Agent Loop 小节实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `02-core-work-mode` 下创建 `01-agent-loop.md`，用概念科普 + 伪代码风格讲解 Agent Loop 的核心循环机制。

**Architecture:** 单 Markdown 文件 + 1 张 SVG 流程图。SVG 遵循已有 `agent-evolution_3-4.svg` 的配色方案（深红 `#8B0000` + 金色 `#C9B037` + 思源宋体）。完成后需将 SVG 上传到阿里云 OSS 并替换本地路径。sidebar 由 `scripts/auto-sidebar-generate.js` 自动生成，无需手动配置。

**Tech Stack:** Markdown (VitePress)、SVG、阿里云 OSS 上传脚本 (`scripts/upload-images.js`)、svg-drawer 技能

---

### Task 1: 创建 Agent Loop 流程图 SVG

**Files:**
- Create: `docs/public/assets/agent-loop-flow.svg`

设计要求：
- 尺寸约 768×900
- 配色沿用 `agent-evolution_3-4.svg`：深红 `#8B0000`、金色 `#C9B037`、深灰 `#1A1A1A`、深蓝 `#1E3A5F`、中灰 `#3F3F3F`
- 字体：Songti SC / STSong / SimSun / Times New Roman
- 圆角矩形卡片 + 箭头连接，展示 Thought → Action → Observation 的循环
- 循环体内包含终止分支（任务完成 / 达到上限 / 出错中断）
- 底部 footer 标注 "02"（表示第二章）
- 边框风格、卡片间距与已有 SVG 保持一致

SVG 内容结构：
- 顶部标题："Agent Loop 的核心结构"
- 副标题："Thought → Action → Observation 循环"
- 中央循环区域：
  - "思考（Thought）" 卡片 → 箭头 → "行动（Action）" 卡片 → 箭头 → "观察（Observation）" 卡片 → 箭头回到 "思考"
  - 每个卡片内含一句话说明
- 右侧终止分支：
  - 从 "行动" 卡片分出一条线到 "终止条件" 判断节点
  - 判断节点分三条：任务完成（绿）、达到上限（橙）、出错中断（红）
- 底部总结条

- [ ] **Step 1: 使用 svg-drawer 技能生成 SVG**

调用 svg-drawer 技能，传入以上设计描述，生成 `docs/public/assets/agent-loop-flow.svg`。

- [ ] **Step 2: 检查生成的 SVG**

打开 SVG 文件，确认：
- 文字清晰可读，无遮挡
- 箭头方向正确（Thought → Action → Observation → 回到 Thought）
- 终止分支布局合理
- 配色与已有 SVG 一致

- [ ] **Step 3: 将 SVG 上传到阿里云 OSS**

运行上传脚本：
```bash
node scripts/upload-images.js docs/agent-revelations/02-core-work-mode/01-agent-loop.md
```

或使用 upload-image-to-oss 技能将 SVG 上传到 OSS，获取 CDN URL。

- [ ] **Step 4: Commit SVG**

```bash
git add docs/public/assets/agent-loop-flow.svg
git commit -m "docs: add agent loop flow diagram SVG"
```

---

### Task 2: 撰写 Agent Loop 小节 Markdown

**Files:**
- Create: `docs/agent-revelations/02-core-work-mode/01-agent-loop.md`

文档完整内容如下。文件必须在 frontmatter 后以 h1 开头，且 h1 与 frontmatter title 完全一致。

- [ ] **Step 1: 创建 Markdown 文件**

写入以下完整内容（SVG 路径先使用本地路径，Task 1 完成后替换为 OSS URL）：

```markdown
---
title: Agent Loop：Agent 的心跳
---

# Agent Loop：Agent 的心跳

在上一章，我们看到了 Agent 的四次能力迭代：从自然语言对话到工具调用，从单步响应到任务工作流，最终走向生态协作。其中第三阶段——"从单步响应到任务工作流"——有一个关键的技术机制，它就是 **Agent Loop**。

## 什么让 Agent 从"一问一答"变成"持续推进"

普通聊天机器人的工作方式很简单：你问一句，它答一句。每次对话都是独立的，模型看不到之前的上下文（或者只看最近几轮），更不会主动推进任务。

但真实的工作不是这样的。

假设你去看医生，你描述了症状，医生不会听完就给你开药。他会先查看病历，然后可能说"我需要看一下你的验血报告"，你去做检查，拿到结果后医生再综合判断。如果结果不够明确，他可能还会让你做进一步检查。这是一个**循环**的过程：收集信息、做出判断、采取行动、观察结果、再继续调整。

Agent Loop 做的就是这件事。它的定义很简单：

> Agent Loop 是一个让大语言模型围绕目标持续推理和行动的循环结构。

没有 Agent Loop，模型只是一个"你问我答"的应答器。有了 Agent Loop，模型就变成了一个能"持续推进任务"的执行者。

这就是 Agent 区别于普通聊天机器人的关键。

## Agent Loop 的核心结构

Agent Loop 的核心可以用一段伪代码来概括：

```text
循环开始:
    消息历史 = [用户的任务描述]

    重复执行:
        ① 思考 (Thought)
           模型阅读消息历史，决定下一步做什么

        ② 行动 (Action)
           模型选择一个动作：
           - 调用一个工具（如搜索、读写文件、执行代码）
           - 直接给出最终回答

        ③ 观察 (Observation)
           如果调用了工具，获取执行结果
           将结果追加到消息历史中

        如果 模型给出了最终回答:
            循环结束，返回结果
```

![agent-loop-flow](/assets/agent-loop-flow.svg)

这个循环有三个核心步骤，我们逐一来看。

### 思考（Thought）

每一轮循环开始时，模型会"阅读"当前的消息历史，理解任务进展到了哪里，然后决定下一步该做什么。

这一步的本质是**推理和规划**。模型不是随机选择一个工具来调用，而是基于当前信息做出判断：现在最需要做什么？是继续收集信息，还是该综合分析，还是可以给出结论了？

### 行动（Action）

思考之后，模型选择执行一个具体的动作。最常见的动作有两种：

- **调用工具**：比如搜索文档、读取文件、执行代码、查询数据库等。工具是 Agent 接触外部世界的"手"。
- **给出回答**：当模型认为已经收集到足够的信息，可以直接向用户输出最终结果。

行动是整个循环中唯一"对外产生效果"的环节。思考是内部的，观察是被动的，只有行动会改变外部状态。

### 观察（Observation）

行动执行之后，模型需要"看到"结果。这个步骤叫观察。

观察的内容会被追加到消息历史中。这意味着下一轮循环时，模型不仅能看到用户的原始请求，还能看到之前每一步的行动和结果。

**消息历史就是这个循环的"记忆"。** 它随着每一轮循环不断增长，让模型对任务的理解越来越完整。这也是为什么 Agent 能处理复杂任务——它在不断积累上下文，而不是每次都从零开始。

## 循环什么时候停下来

循环不能永远跑下去。Agent Loop 有三种主要的终止情况：

### 任务完成

最理想的退出方式。模型认为目标已经达成，直接给出最终回答，不再调用任何工具。这是正常流程的终点。

### 达到上限

循环次数或资源消耗超出了预设的阈值。比如设置了"最多循环 10 次"的保护机制，防止模型陷入无限循环。这是一种安全兜底，确保 Agent 不会无限制地消耗资源。

### 出错中断

用户主动停止（比如觉得方向不对，按下了中断键），或者系统遇到了无法恢复的错误（比如网络断开、工具执行失败且无法重试）。

用伪代码来表达：

```text
重复执行:
    ① 思考 → ② 行动 → ③ 观察

    如果 模型给出最终回答:
        返回 "任务完成"

    如果 循环次数 > 最大限制:
        返回 "达到上限，任务暂停"

    如果 用户中断 或 发生不可恢复的错误:
        返回 "任务中断"
```

三种终止情况各有分工：**任务完成**是成功路径，**达到上限**是保护机制，**出错中断**是异常处理。一个好的 Agent 系统，需要对这三种情况都有清晰的处理逻辑。

## Agent Loop 的意义

回到核心问题：Agent Loop 改变了什么？

没有 Agent Loop，模型只能做一件事：回答问题。你问它"这个 bug 怎么修"，它会给你一段建议，但不会自己去读代码、复现问题、尝试修复、验证结果。

有了 Agent Loop，模型可以自己推进整个流程：

```text
用户: "帮我修复这个 bug"

循环第 1 轮:
  思考 → "我需要先看看代码结构"
  行动 → 调用文件搜索工具
  观察 → 找到了相关文件

循环第 2 轮:
  思考 → "让我读一下这个文件的内容"
  行动 → 调用文件读取工具
  观察 → 看到了问题所在

循环第 3 轮:
  思考 → "问题在第 42 行，我可以修复它"
  行动 → 调用文件编辑工具
  观察 → 修改成功

循环第 4 轮:
  思考 → "让我运行测试确认修复没有引入新问题"
  行动 → 调用命令执行工具
  观察 → 测试全部通过

循环第 5 轮:
  思考 → "任务完成了"
  行动 → 给出最终回答
  终止 → 任务完成
```

从"回答问题"到"执行任务"，这就是 Agent Loop 带来的核心转变。

接下来的小节，我们会逐步展开 Agent Loop 中的关键组成部分——从工具调用到消息管理，深入理解每个部分是如何支撑这个循环运转的。
```

- [ ] **Step 2: 替换 SVG 路径为 OSS URL**

使用 upload-image-to-oss 技能或手动替换 SVG 图片路径：
- 将 `/assets/agent-loop-flow.svg` 替换为上传到 OSS 后获得的 CDN URL

- [ ] **Step 3: 本地预览验证**

运行 dev server 确认：
```bash
npm run docs:dev
```

检查：
- 页面正常渲染，无 404
- h1 标题与 frontmatter title 一致
- h2/h3 正确出现在 VitePress "On this page" 大纲中
- SVG 图片正常显示
- 伪代码块格式正确

- [ ] **Step 4: 更新 sidebar**

运行 sidebar 自动生成脚本：
```bash
node scripts/auto-sidebar-generate.js
```

如果脚本不覆盖 `agent-revelations` 路径（当前脚本只处理 blog 和 llm-for-everyone），需要手动在 `docs/.vitepress/config.mts` 中添加 `agent-revelations` 的 sidebar 配置。

检查 config.mts 中 sidebar 是否已包含 `/agent-revelations/` 路径。如果没有，添加配置。

- [ ] **Step 5: Commit**

```bash
git add docs/agent-revelations/02-core-work-mode/01-agent-loop.md
git add docs/.vitepress/config.mts  # 如果 sidebar 有变更
git commit -m "docs: add agent loop section to agent-revelations"
```
