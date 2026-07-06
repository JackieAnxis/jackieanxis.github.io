# 用户习惯

在撰写书籍时，用户提问问题时，不要直接修改书籍，要经过用户批准才可以直接去动文章内容。

# Markdown 规范

每个 Markdown 页面必须从 h1（`#`）标题开始，且整页只有一个 h1。h1 的内容必须与 frontmatter 中的 `title` 字段完全一致。页面内的章节用 h2（`##`）和小节用 h3（`###`）组织。VitePress 的 "On this page" 大纲只展示 h2 和 h3。

- 图片在推送 github 部署前必须替换成 oss 源，禁止使用本地图片；上传 oss 具体参考 upload-image-to-oss 技能，未经用户允许禁止上传


# 各模块规范

## llm-for-everyone

llm-for-everyone 项目是作为一个科普性质的电子书，目的是为了向广大程序员介绍什么是神经网络、大模型等一系列概念，帮助很多没有接触大模型机会的程序员也能够掌握大模型的核心技术概念，所以一切更新都应该围绕这点核心目的出发。

## agent-revelations

agent-revelations 也是一本电子书，面向一些使用过 claude code 的程序员来介绍 Agent 的原理（以 claude code 为例）。 分析 external/cc-haha 的代码 和 external/claude-code-docs 的文档 来配合撰写，仅讲原理，禁止直接引用代码（未阅读过代码的读者会容易迷失），尽可能少讲操作方式（这样会使本文档看着像用户指南，其实用户可以看官方文档来了解）。

# Github 相关

推送 Github 前必须检查：
- [ ] 如果本次提交更新了文章内容，请检查各书籍的 sidebar 配置是否完成了更新？