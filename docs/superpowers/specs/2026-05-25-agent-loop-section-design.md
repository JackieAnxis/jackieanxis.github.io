---
title: Agent Loop 小节设计文档
date: 2026-05-25
---

# Agent Loop 小节设计文档

## 目标

在 `docs/agent-revelations/02-core-work-mode/` 下创建 `01-agent-loop.md`，用概念科普 + 伪代码的风格讲解 Agent Loop 的核心机制。

## 定位

- **目标读者：** 广大程序员（非 AI 领域专家）
- **风格：** 通俗语言 + 简化伪代码，类似 01 章节的科普风格
- **范围：** 只讲 Agent Loop 循环机制本身，不展开工具调用、消息历史等子主题
- **文件：** 单文件完成

## 写作参考

- 正面参考：01 章节的叙事节奏——先讲"为什么"，再讲"是什么"，最后点明意义
- 反面参考：lintsinghua/claude-code-book 的"对话循环"章节——太技术化，大量名词缺少上下文，阅读体验差

## 文档结构

### h1: Agent Loop：Agent 的心跳

### h2-1: 什么让 Agent 从"一问一答"变成"持续推进"

- 承接 01 章节"第三阶段：从单步响应到任务工作流"，点明核心差距
- 给出 Agent Loop 的一句话定义：一个让 LLM 围绕目标持续推理和行动的循环结构
- 用生活类比帮助理解循环概念（如医生诊断：看病历 → 问诊 → 开检查 → 拿结果 → 再判断）
- 明确 Agent Loop 是 Agent 区别于普通聊天机器人的关键机制

### h2-2: Agent Loop 的核心结构

- 展示精简伪代码骨架（Thought → Action → Observation 循环）
- 配 SVG 流程图（类似 01 章节的配图风格）
- 逐段解释三个核心步骤：
  - **思考（Thought）：** 模型根据当前信息决定下一步做什么
  - **行动（Action）：** 模型选择执行一个动作（调用工具或给出回答）
  - **观察（Observation）：** 获取行动的结果，追加到上下文中
- 不涉及具体 API 协议、框架术语、或压缩管线等实现细节

### h2-3: 循环什么时候停下来

- 终止条件分三类讲解：
  1. **任务完成：** 模型认为目标已达成，直接给出最终回答
  2. **达到上限：** 循环次数或资源消耗超出预设阈值
  3. **出错中断：** 用户主动停止或系统遇到无法恢复的错误
- 用简化伪代码展示判断逻辑
- 不展开具体的 10 种终止原因，保持概念层面

### h2-4: Agent Loop 的意义

- 与单次对话的对比总结：一问一答 vs 持续推进
- 点明核心价值：Loop 让 Agent 从"回答问题"变成"执行任务"
- 简短衔接预告下一节（02-core-work-mode 的后续小节）

## 配图需求

1. **Agent Loop 流程图（SVG）：** 展示 Thought → Action → Observation 的循环，包含终止条件分支
   - 风格参考：01 章节的 agent-evolution SVG
   - 需要上传到 OSS

## 技术约束

- 图片必须上传到阿里云 OSS，禁止使用本地路径
- frontmatter title 与 h1 标题完全一致
- 整页只有一个 h1
- VitePress "On this page" 大纲只展示 h2 和 h3

## 与 external 代码的关联

- minimind 的 `eval_toolcall.py` 展示了最简形式的工具调用循环（while True + parse + execute + append）
- claw-code 的 `runtime.py` 展示了带路由和权限的 Turn Loop
- 在文档中可简要提及"真实项目中的 Agent Loop 长这样"，但不展开代码细节
