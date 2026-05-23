# Agent 的概念和演变 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成《Agent 启示录》第一章 `Agent 的概念和演变` 的正文内容。

**Architecture:** 这是一个 VitePress Markdown 内容任务，只创建第一章入口页面，不修改站点导航和其他章节。文章采用“概念来源 -> 问题意识 -> ChatGPT 后重新爆发 -> 四次能力迭代 -> 愿景使命”的结构，正文自洽解释 Agent，同时在关键处链接到已有大模型科普章节。

**Tech Stack:** VitePress, Markdown, MCP WebSearch

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `docs/agent-revelations/01-concept-and-evolution/00-overview.md` | Create | 第一章入口正文，包含 frontmatter、唯一 h1、h2/h3 结构、时间线表和愿景收束 |

## Reference Sources

写正文前使用 MCP WebSearch 核验关键事实。优先使用以下来源口径：

- OpenAI `Introducing ChatGPT`：确认 ChatGPT 发布于 2022 年 11 月 30 日，并强调对话格式支持追问、承认错误、挑战错误前提等能力。
- OpenAI Help Center `OpenAI API 中的函数调用`：确认函数调用将模型连接到外部工具和系统，并作为“从回答到调用工具”的事实锚点。
- Microsoft Developer Blog `Microsoft partners with Anthropic to create official C# SDK for Model Context Protocol`：确认 MCP 是 Anthropic 创建的开放协议，最初发布于 2024 年 11 月，用于连接 LLM 应用与外部工具和数据源。
- Russell & Norvig《Artificial Intelligence: A Modern Approach》相关资料：确认“智能体”是 AI 领域长期使用的核心组织概念，避免写成某个人在 ChatGPT 时代创造了 Agent 一词。

---

### Task 1: 创建第一章正文

**Files:**
- Create: `docs/agent-revelations/01-concept-and-evolution/00-overview.md`

- [ ] **Step 1: 确认目标文件尚未存在**

```bash
test ! -f docs/agent-revelations/01-concept-and-evolution/00-overview.md
```

Expected: 命令退出码为 `0`，表示文件尚不存在。

- [ ] **Step 2: 创建 Markdown 正文**

Use `apply_patch` to create `docs/agent-revelations/01-concept-and-evolution/00-overview.md` with this exact content:

````markdown
---
title: Agent 的概念和演变
---

# Agent 的概念和演变

Agent 这几年突然变成了一个高频词。很多文章会直接把它翻译成“智能体”，再补上一串词：自主规划、工具调用、长期记忆、多 Agent 协作。读者看完这些词，往往还是会困惑：Agent 到底是什么？它和 ChatGPT 有什么区别？为什么所有人都在说它会改变软件？

这篇文章先不急着进入技术细节。我们先从 Agent 这个名字讲起，再看它想解决什么问题，最后回到 2022 年 ChatGPT 发布之后，Agent 为什么重新变得重要。

我的核心判断是：Agent 会成为未来 LLM 的唯一入口。LLM 不会长期停留在一个“聊天框”里，它最终会以 Agent 的形态进入每一种工作流，接管重复、机械、不具创造性的执行过程。人类真正需要保留下来的能力，会越来越集中在想象力、创造力和审美能力上。

## Agent 这个名字从哪里来

`agent` 这个词最朴素的含义，不是“聊天的人”，而是“代替某人行动的人或实体”。

比如房产中介可以叫 real estate agent，旅行代理可以叫 travel agent，法律语境里的代理人也可以叫 agent。它们共同的特点是：某个主体把一部分行动委托给另一个主体，由后者代表前者去推进事情。

所以，Agent 这个词的重点从来不是“会不会说话”，而是“能不能行动”。

在人工智能领域，Agent 也不是 ChatGPT 出现之后才被发明的新词。更准确地说，它是 AI 里长期存在的一个核心概念。经典教材《Artificial Intelligence: A Modern Approach》就用智能体作为组织人工智能知识的重要线索：一个智能系统并不只是被动地计算答案，它要感知自己所处的环境，并采取行动影响这个环境。

这句话听起来很学术，但背后的直觉很简单：

```text
一个只会回答问题的系统，更像一本会说话的书。
一个能代你推进事情的系统，才开始接近 Agent。
```

这也是为什么今天我们重新讨论 Agent 时，不应该把它理解成“更聪明的聊天机器人”。聊天只是它和人沟通的一种方式，行动才是它真正要解决的问题。

## Agent 想解决什么问题

传统软件最大的特点是：人必须先把目标拆成明确步骤。

你想生成一份报表，就要知道去哪里取数、用什么 SQL、怎么清洗字段、怎么画图、怎么导出。你想发布一篇文章，就要自己找资料、整理结构、修改格式、上传图片、检查链接。软件可以帮你执行每一步，但前提是你已经知道每一步是什么。

自动化脚本、RPA、规则引擎也能减少重复劳动，但它们通常依赖稳定流程。流程一旦变化，页面多了一个按钮、接口返回少了一个字段、用户目标变得模糊，系统就很容易停下来，等人重新配置。

Agent 想解决的正是这个断点：人不应该永远负责把目标翻译成步骤，机器应该能理解目标，并代表人推进目标。

可以把 Agent 的核心能力先理解成四件事：

1. 理解目标：听懂人真正想完成什么，而不是只匹配关键词。
2. 代表人行动：不是只给建议，而是能实际推进事情。
3. 面对变化调整：过程出错时，不是直接停止，而是重新判断下一步。
4. 承担重复执行：把机械、格式化、流程化的工作从人手里接过去。

注意，这里还没有涉及任何复杂技术。Agent 首先是一种软件目标：让机器从“响应指令”走向“承担任务”。

## 为什么 ChatGPT 之后 Agent 重新变得重要

既然 Agent 不是新词，为什么它在 ChatGPT 之后突然变得重要？

原因在于：过去的系统缺少一种足够通用的“理解目标”的能力。

在 ChatGPT 之前，很多自动化系统已经很强。搜索引擎能帮你找资料，脚本能帮你批量处理文件，RPA 能帮你模拟点击，推荐系统能根据行为预测偏好。但这些系统大多需要清晰输入和固定流程。它们可以执行明确命令，却很难理解一句自然语言背后的真实意图。

ChatGPT 改变的是交互入口。2022 年 11 月 30 日，OpenAI 发布 ChatGPT，把大语言模型包装成一个普通人可以直接使用的对话产品。用户不需要写代码，不需要理解 API，也不需要把需求拆成严格步骤，只要用自然语言描述问题，就能得到连续回应。

如果你读过前面的《人人能懂的大模型》系列，可以把这里和[语言模型：预测下一个词](../../llm-for-everyone/01-llm_basics/01-language-model.md)、[大模型推理过程概览](../../llm-for-everyone/02-inference/01-overview.md)连起来看：LLM 本质上仍然是在根据上下文生成下一个 token，但当模型规模、训练数据和对齐方式足够强时，它表现出来的能力就不只是续写文本，而是理解问题、组织答案、解释代码、拆解任务。

这给 Agent 补上了最关键的一块拼图：理解人的目标。

但 LLM 本身还不是 Agent。一个 LLM 可以回答“怎么做”，却不一定真的去做。Agent 的出现，是为了把 LLM 的语言理解和推理能力，接到工具、环境和执行流程上，让模型从“给答案”走向“完成任务”。

## Agent 的四次能力迭代

从 2022 年底到现在，Agent 的演进可以不用按产品名背诵。更清晰的看法是：它经历了几次能力边界的扩展。

| 时间 | 能力阶段 | 代表事件 | 意义 |
|---|---|---|---|
| 2022 年底 | 从命令到对话 | ChatGPT 发布 | 自然语言成为新的交互入口 |
| 2023 年 | 从回答到工具 | 工具调用、代码执行、自主 Agent 实验兴起 | LLM 开始连接外部世界 |
| 2024 年 | 从单步响应到工作流 | 多模态、长上下文、计算机或浏览器操作、Agent 框架成熟 | Agent 开始处理更长链路任务 |
| 2024-2025 年 | 从单助手到生态协作 | MCP 等上下文和工具协议出现，多 Agent 与 AgentOps 发展 | Agent 从单点能力走向工程生态 |

### 第一阶段：从命令到对话

早期人机交互更像“发命令”：你必须用系统能理解的方式表达需求。命令行、按钮、表单、配置文件，本质上都要求人适应机器。

ChatGPT 之后，机器开始适应人的表达。用户可以说半成品想法，可以追问，可以修正，也可以把上下文一点点补进去。自然语言第一次成为大规模可用的软件入口。

这一阶段的关键变化不是 AI 会聊天，而是人终于可以用自己的语言描述目标。

### 第二阶段：从回答到调用工具

只会回答问题的 LLM 有一个明显限制：它无法直接影响外部世界。

你问它今天的天气，如果它不能联网，就只能依赖训练时见过的旧知识。你让它分析数据库，如果它不能访问数据库，就只能告诉你“应该怎么查”。你让它改一个文件，如果它不能读写文件，就只能给你一段建议。

工具调用补上了这只“手”。当模型可以调用搜索、数据库、代码解释器、文件系统、业务 API 时，它就不再只是生成文本，而是可以把文本变成行动。

这一步让 Agent 从“会说”开始走向“会做”。

### 第三阶段：从单步响应到任务工作流

工具调用解决的是“能不能做一步”，但真实任务往往不是一步完成的。

完成一份调研报告，可能需要先明确问题，再搜索资料，再筛选来源，再整理结构，再写初稿，再检查事实，再修改表达。中间任何一步失败，都需要调整路线。

因此，Agent 的第三次迭代，是从单次响应走向任务工作流。系统不只是回答当前这一问，而是围绕一个目标持续推进：记录当前状态，决定下一步行动，观察执行结果，再继续调整。

这一步让 Agent 开始接近真实工作中的“任务承担者”。

### 第四阶段：从单个助手到持续协作

当任务继续变复杂，一个 Agent 也会遇到边界。

有些任务需要不同角色：有人负责搜索，有人负责写作，有人负责审查，有人负责执行。有些任务需要长时间持续运行：今天检查一次数据，明天根据新结果调整策略，下周再生成总结。有些任务则需要连接大量外部工具和数据源，而不是为每个应用单独写一套集成。

于是，多 Agent、AgentOps、MCP 这类协议和工程实践开始出现。它们背后的共同方向是：让 Agent 不只是一个孤立助手，而是进入更大的软件生态，和工具、数据、流程、其他 Agent 协作。

这一步意味着 Agent 开始从单点能力走向基础设施。

## Agent 的愿景：让人回到创造本身

如果把上面的变化串起来，你会看到一条很清晰的线：

```text
LLM 让机器理解语言
工具调用让机器影响世界
工作流让机器持续推进任务
多 Agent 和协议生态让机器进入复杂协作
```

这条线继续往前走，Agent 就不会只是 LLM 的一个应用形态，而会成为 LLM 的入口本身。

今天我们还会说“打开 ChatGPT 问一个问题”。但未来，更自然的说法可能是：“让我的研究 Agent 持续跟踪这个方向”“让我的写作 Agent 整理素材并生成初稿”“让我的数据 Agent 每天检查异常”“让我的开发 Agent 修掉这个问题并提交 PR”。

也就是说，人不再直接面对一个裸露的模型，而是面对一个能理解目标、调动工具、管理上下文、持续执行的 Agent。

这就是为什么我认为：Agent 是未来 LLM 的唯一入口。

一旦 Agent 成熟，大量重复、机械、不具创造性的工作不会只是被“辅助”，而会被完全消灭。整理格式、搬运信息、机械检索、重复检查、流程填报、模板化生成，这些工作过去消耗了人的大量时间，但它们并不真正依赖人的创造力。

人会从这些执行细节里退出来，重新回到更重要的问题上：

```text
什么值得做？
应该创造什么？
什么是好的？
什么是美的？
什么判断不能交给平均答案？
```

未来人的核心能力，不是记住更多操作步骤，也不是比机器更快地执行流程，而是想象力、创造力和审美能力。

Agent 的使命，就是把人从重复执行中释放出来，让人回到创造本身。
````

- [ ] **Step 3: 验证 Markdown 标题规范**

```bash
node - <<'NODE'
const fs = require('fs');
const path = 'docs/agent-revelations/01-concept-and-evolution/00-overview.md';
const text = fs.readFileSync(path, 'utf8');
const h1 = text.match(/^# .+$/gm) || [];
const title = text.match(/^title: (.+)$/m)?.[1];
if (title !== 'Agent 的概念和演变') throw new Error(`frontmatter title mismatch: ${title}`);
if (h1.length !== 1) throw new Error(`expected exactly one h1, got ${h1.length}`);
if (h1[0] !== '# Agent 的概念和演变') throw new Error(`h1 mismatch: ${h1[0]}`);
console.log('markdown structure ok');
NODE
```

Expected: 输出 `markdown structure ok`。

- [ ] **Step 4: 验证旧开头没有出现**

```bash
! rg -n "## 从聊天机器人到任务执行者|从聊天机器人到任务执行者" docs/agent-revelations/01-concept-and-evolution/00-overview.md
```

Expected: 无输出，命令退出码为 `0`。

- [ ] **Step 5: Commit 正文**

```bash
git add docs/agent-revelations/01-concept-and-evolution/00-overview.md
git commit -m "docs: add agent concept and evolution chapter"
```

Expected: Git 创建正文提交。

---

### Task 2: 构建验证与事实复查

**Files:**
- Verify: `docs/agent-revelations/01-concept-and-evolution/00-overview.md`

- [ ] **Step 1: 检查关键事实表述**

```bash
rg -n "2022 年 11 月 30 日|函数调用|MCP|2024 年 11 月|Artificial Intelligence: A Modern Approach" docs/agent-revelations/01-concept-and-evolution/00-overview.md
```

Expected: 输出包含 ChatGPT 发布时间、工具调用、MCP、经典教材相关表述。若 `2024 年 11 月` 没有出现在正文中，这是可接受的，因为正文时间线使用 `2024-2025 年`，但事实来源已在计划中记录。

- [ ] **Step 2: 运行 VitePress 构建**

```bash
npx vitepress build docs
```

Expected: 构建成功，无 Markdown 标题或链接导致的报错。

- [ ] **Step 3: 检查工作区状态**

```bash
git status --short
```

Expected: 无输出，表示工作区干净。
