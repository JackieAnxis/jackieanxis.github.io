# 新增章节设计：「大语言模型基础」

## 背景

当前书籍结构：
- 第 00 章：神经网络基础（全连接网络、前向传播、损失函数、训练）
- 第 01 章：推理过程（聊天模板 → tokenizer → Transformer 预测 → 采样）

**问题**：从第 00 章的简单全连接网络直接跳到第 01 章的 Transformer 推理，缺少关键过渡——语言模型是什么、为什么要用 Transformer、文字如何变成数字。

## 章节定位

- **编号**：新章节编号为 `01`（介于现有 00 和 01 之间）
- **现有章节重新编号**：
  - 现有 `01-inference` → `02-inference`
- **目标**：回答"用神经网络处理语言，需要哪些新概念？"
- **风格**：直觉优先，重例子，轻公式，不配代码

## 内容复用策略

以下现有内容可直接复用或改写：

| 新章节小节 | 复用来源 | 复用方式 |
|---|---|---|
| 从文字到数字 | `01-inference/03-tokenize.md` | 提取 Tokenizer 直觉部分，去掉 BPE 算法细节 |
| 从文字到数字 | `references/embedding.md` | 提取 Embedding 直觉部分，简化数学 |
| Transformer 的直觉 | `references/self-attention.md` | 提取注意力的直觉比喻，去掉 QKV 数学推导 |
| Transformer 的直觉 | `references/positional_encoding.md` | 提取"为什么需要位置信息"的直觉，去掉 sin/cos 公式 |

**不复用的内容**（保留在 reference 或推理章节）：
- `references/feed-forward.md` — 细节过多，不适合基础章节
- `references/norm.md` — 细节过多
- `references/logits.md` — 属于推理输出环节，留在推理章节
- `01-inference/01-overview.md` — 训练 vs 推理的区分留在推理章节

## 小节结构

### 1. 语言模型：预测下一个词

**文件**：`01-llm_basics/01-language-model.md`

**核心内容**：
- 语言模型 = 给定前面的文字，预测下一个词
- 用输入法联想、自动补全的日常例子建立直觉
- 和第 00 章串联：同一个"预测"框架，输入输出变了
- 为什么预测下一个词就等于"理解"语言（接龙比喻）
- 从 n-gram 到神经网络语言模型的演进（一笔带过）

**不复用现有内容**，全新撰写。

### 2. 从文字到数字：Tokenizer 和 Embedding

**文件**：`01-llm_basics/02-from-text-to-numbers.md`

**核心内容**：
- 神经网络只认数字 → 文字需要变成数字
- Tokenizer 的直觉：把句子切成小片段（token）
  - 复用 `01-inference/03-tokenize.md` 的前半部分（token 概念、分词直觉）
  - 去掉 BPE 算法的详细训练过程
- 词表的概念：所有 token 的"字典"
- Embedding：token id → 有意义的数字向量
  - 复用 `references/embedding.md` 的直觉部分
  - 简化为"查表"比喻，去掉矩阵数学

### 3. 全连接网络的局限

**文件**：`01-llm_basics/03-why-not-mlp.md`

**核心内容**：
- 用第 00 章学到的全连接网络来处理语言会遇到什么问题？
- 固定输入长度 vs 任意长度文本
- 没有顺序概念（"我爱你" vs "你爱我"对全连接网络是一样的）
- 长距离依赖（一句话开头和结尾的关系很难捕捉）
- 引出问题：我们需要一种新的网络结构

**不复用现有内容**，全新撰写。

### 4. Transformer 的直觉

**文件**：`01-llm_basics/04-transformer-intuition.md`

**核心内容**：
- 注意力机制的直觉：读一句话时你不是均匀地看每个字
- 自注意力 = 每个词看其他所有词，决定"谁对我重要"
  - 复用 `references/self-attention.md` 的直觉比喻部分
  - 去掉 Q/K/V 的数学推导和计算细节
- 位置编码：告诉模型词的顺序
  - 复用 `references/positional_encoding.md` 的"为什么需要位置信息"部分
  - 不展开 sin/cos 或 RoPE 的公式
- Decoder-only：一个词一个词地生成，和"预测下一个词"完美对应
- 整体结构直觉：一堆 Decoder Block 堆叠

### 5. 大模型：为什么要"大"

**文件**：`01-llm_basics/05-why-scale-matters.md`

**核心内容**：
- 从小模型到大模型的演进（GPT 系列时间线）
- 规模的含义：参数量、训练数据量的量级
- 涌现能力：模型大到一定程度突然会做新事情
- "大语言模型"中的"大"不只是量变，而是质变
- MiniMind 定位：一个小型大模型，适合学习

**不复用现有内容**，全新撰写。

## 写作风格

- 沿用第 00 章风格：重直觉、重例子、轻公式
- 每个小节解决一个具体问题，问题驱动节奏
- 和第 00 章建立回溯（"还记得第 00 章说的预测吗？"）
- 不配代码示例（代码留给推理章节的 MiniMind 实战）

## 文件变更清单

### 新增文件
- `docs/01-llm_basics/01-language-model.md`
- `docs/01-llm_basics/02-from-text-to-numbers.md`
- `docs/01-llm_basics/03-why-not-mlp.md`
- `docs/01-llm_basics/04-transformer-intuition.md`
- `docs/01-llm_basics/05-why-scale-matters.md`

### 移动/重命名
- `docs/01-inference/` → `docs/02-inference/`

### 修改文件
- `.vitepress/config.mts` — 更新侧边栏导航，加入新章节，更新推理章节编号

## 不在范围内

- 不改动第 00 章内容
- 不改动推理章节的现有内容（仅重新编号）
- 不改动参考资料（references/）
- 不涉及后续章节（训练、微调等）
