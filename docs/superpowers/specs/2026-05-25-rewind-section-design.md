---
title: Agent 启示录 - 时间回溯小节设计
created: 2026-05-25
status: approved
---

# 时间回溯（Rewind）小节设计

## 背景

在 `docs/agent-revelations/02-core-work-mode/` 目录下新增一个小节，阐述 Claude Code 的时间回溯（rewind）机制。目标读者是程序员，核心目的是让他们理解 rewind **是怎么做到的**（技术实现），而非只是概念认知。

## 约束

- 文件路径：`docs/agent-revelations/02-core-work-mode/02-rewind.md`
- 写作风格：与 01-agent-loop.md 保持一致（中文、代码示例、伪代码辅助）
- 范围：只写 rewind 功能，不涉及 context compaction、undo 等关联机制
- 开场方式：直接解释，不用生活化类比
- 遵循 Markdown 规范：h1 标题与 frontmatter title 一致，h2/h3 组织章节

## 结构设计：线性流程（方案 A）

按 rewind 的执行顺序组织，读者跟着走一遍完整回退流程。

### 第一节：定义与动机

**标题**：`## Agent 会犯错，所以需要时间回溯`

- 直接说明 rewind 是什么：Claude Code 提供的"撤销最近一轮对话"的能力
- 为什么需要：Agent 在循环中可能走错方向，需要能回到之前的状态重新来
- 关键点：rewind 不只是删除聊天记录，同时恢复对话状态**和**被修改的文件——真正的"时间回溯"

约 100 字。

### 第二节：消息存储机制

**标题**：`## 消息是怎么存下来的`

- 对话历史以 JSONL 格式存储（每个 session 一个文件）
- 每条消息包含：uuid、role（user/assistant/tool）、content、timestamp
- JSONL 特点：追加写入，不修改已有内容——为 rewind 提供基础
- JSONL 示例片段

约 200 字。

### 第三节：触发与目标选择

**标题**：`## 用户怎么告诉 Agent "回到过去"`

- 两种触发方式：UI "Undo turn" 按钮、CLI `/rewind` 命令
- 定位回退目标的三种方式：
  - `targetUserMessageId`：直接指定目标用户消息
  - `userMessageIndex`：按序号指定
  - `expectedContent`：可选内容校验
- 约束：只能回退到用户消息
- ASCII 示意图说明回退位置

约 200 字。

### 第四节：文件快照机制

**标题**：`## 不只是对话，文件也要一起回去`

- 核心问题：Agent 会修改真实文件，只回退对话不回退文件会导致不一致
- 备份机制：每次修改文件时先备份原版本
- 备份命名：SHA256 哈希 + 版本号（`{hash}@v{version}`）
- 存储位置：`file-history/{sessionId}/`
- 快照上限：100 个
- 快照数据结构示例

约 250 字。

### 第五节：执行回退

**标题**：`## 回退的具体过程`

`executeSessionRewind()` 的完整流程：

1. 停止当前生成
2. 定位目标消息
3. 计算影响范围
4. 恢复文件（逆操作：新增→删除、修改→还原、删除→恢复）
5. 截断消息历史
6. 持久化写回 JSONL

伪代码概括核心逻辑。强调对话状态和文件状态必须原子性回退。

约 250 字。

### 第六节：安全保护

**标题**：`## 防止回退出错`

- Dry-run 预览：执行前预览效果，不实际执行
- 内容校验：`expectedContent` 确认目标消息
- 边界保护：不能超出消息数量、空会话不回退、未完成轮次不回退
- 总结：rewind 是安全的可控回退

约 150 字。

## 技术来源

基于 cc-haha 仓库（`external/cc-haha/`）的源码分析：
- `src/server/services/sessionRewindService.ts` — 核心回退逻辑
- `src/commands/rewind/` — 命令入口
- `src/utils/fileHistory.ts` — 文件备份与恢复
