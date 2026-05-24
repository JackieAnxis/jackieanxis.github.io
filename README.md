# Jiacheng's Site

**在线访问**: [panjiacheng.site](https://panjiacheng.site/)

个人网站，包含电子书和博客两部分内容。

## 人人能懂的大模型

一份面向所有程序员的大语言模型入门教程。从最基础的神经网络概念出发，逐步深入到大模型的推理与预训练过程，无需机器学习背景即可阅读。

- **神经网络基础** — 理解神经网络的基本结构，学会如何预测、衡量误差、并通过训练优化模型
- **大语言模型基础** — 了解语言模型的核心思想，从文本数字化到 Transformer 架构的直觉理解
- **大模型推理** — 深入推理过程的每一步：Token 切分、Token 预测、Decoder Block、采样机制
- **预训练** — 了解预训练的目标、数据准备、训练循环与关键细节
- **参考资料** — Embedding、位置编码、自注意力、Feed Forward、Norm、Logits 等核心概念的独立详解

## 博客

2016–2022 年的技术文章，涵盖可视化、机器学习、前端开发等主题。

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
docs/                          # 站点内容（Markdown）
├── .vitepress/                # VitePress 配置与主题
├── llm-for-everyone/          # 电子书
│   ├── 00-neural_network/     # 神经网络基础
│   ├── 01-llm_basics/         # 大语言模型基础
│   ├── 02-inference/          # 大模型推理
│   ├── 03-pretraining/        # 预训练
│   └── references/            # 参考资料
├── blog/posts/                # 博客文章（按年份分目录）
└── public/                    # 静态资源（图片、字体）
scripts/                       # 自动化脚本
├── auto-sidebar-generate.js   # 自动生成 sidebar 配置
└── upload-images.js           # 上传本地图片到阿里云 OSS
```

## 技术栈

- [VitePress](https://vitepress.dev/) — 静态站点生成
- [KaTeX](https://katex.org/) — 数学公式渲染
