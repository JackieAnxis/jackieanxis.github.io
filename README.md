# 大模型入门 — 面向所有人的大语言模型入门教程

**在线阅读**: [https://panjiacheng.site/llm-for-everyone/](https://panjiacheng.site/llm-for-everyone/)

一份面向所有程序员的大语言模型入门教程。从最基础的神经网络概念出发，逐步深入到大模型的推理与预训练过程，无需机器学习背景即可阅读。

## 内容概览

**第一部分：神经网络基础** — 理解神经网络的基本结构，学会如何预测、衡量误差、并通过训练优化模型。

**第二部分：大语言模型基础** — 了解语言模型的核心思想，从文本数字化到 Transformer 架构的直觉理解。

**第三部分：大模型推理** — 深入推理过程的每一步：Token 切分、Token 预测、Decoder Block、采样机制。

**第四部分：预训练** — 了解预训练的目标、数据准备、训练循环与关键细节。

**参考资料** — Embedding、位置编码、自注意力、Feed Forward、Norm、Logits 等核心概念的独立详解。

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run docs:dev

# 构建生产版本
npm run docs:build

# 预览构建结果
npm run docs:preview
```

## 项目结构

```
docs/                        # 教程内容（Markdown）
├── .vitepress/              # VitePress 配置
├── 00-neural_network/       # 神经网络基础
├── 01-llm_basics/           # 大语言模型基础
├── 02-inference/            # 大模型推理
├── 03-pretraining/          # 预训练
├── references/              # 参考资料
└── public/                  # 静态资源（图片、字体、可视化页面）
tinymind.js                  # JavaScript 实现的小型 Transformer
external/minimind/           # MiniMind：超小语言模型实现（Python）
tests/                       # 测试
```

## 技术栈

- [VitePress](https://vitepress.dev/) — 静态站点生成
- [KaTeX](https://katex.org/) — 数学公式渲染
- [tinymind.js](tinymind.js) — JavaScript 实现的小型 Transformer，用于教程中的交互式示例
