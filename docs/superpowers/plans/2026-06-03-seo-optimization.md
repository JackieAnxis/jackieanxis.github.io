# SEO 基础建设 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 VitePress 电子书站点添加全面的 SEO 基础设施（sitemap、robots.txt、Open Graph、结构化数据）。

**Architecture:** 利用 VitePress 内置的 sitemap 功能 + config.mts 中的 `head` 配置和 `transformHead` 钩子自动生成页面级 meta 标签，通过 `transformPageData` 注入 JSON-LD 结构化数据。零额外依赖。

**Tech Stack:** VitePress 1.6+、TypeScript（config.mts）

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `docs/.vitepress/config.mts` | 启用 sitemap、添加全局 head 标签、添加 transformHead 钩子 |
| 创建 | `docs/public/robots.txt` | 搜索引擎爬虫指引 |

---

### Task 1: 启用 Sitemap 并创建 robots.txt

**Files:**
- 修改: `docs/.vitepress/config.mts:4` (在 `defineConfig` 中添加 `sitemap` 字段)
- 创建: `docs/public/robots.txt`

- [ ] **Step 1: 在 config.mts 中启用 sitemap**

在 `docs/.vitepress/config.mts` 的 `defineConfig` 对象中，在 `cleanUrls: true,` 后面添加 sitemap 配置：

```ts
  cleanUrls: true,

  sitemap: {
    hostname: 'https://jackieanxis.github.io',
  },
```

- [ ] **Step 2: 创建 robots.txt**

创建文件 `docs/public/robots.txt`，内容为：

```
User-agent: *
Allow: /

Sitemap: https://jackieanxis.github.io/sitemap.xml
```

- [ ] **Step 3: 构建验证 sitemap 和 robots.txt 生成**

运行: `npm run docs:build`

验证构建产物中存在 `docs/.vitepress/dist/sitemap.xml` 和 `docs/.vitepress/dist/robots.txt`：

```bash
ls docs/.vitepress/dist/sitemap.xml docs/.vitepress/dist/robots.txt
```

Expected: 两个文件都存在

- [ ] **Step 4: 检查 sitemap 内容**

```bash
head -20 docs/.vitepress/dist/sitemap.xml
```

Expected: 包含 `<urlset>` 标签和 `<loc>` 条目，hostname 为 `https://jackieanxis.github.io`

- [ ] **Step 5: Commit**

```bash
git add docs/.vitepress/config.mts docs/public/robots.txt
git commit -m "feat(seo): 启用 sitemap 生成并添加 robots.txt"
```

---

### Task 2: 添加全局 Meta 标签

**Files:**
- 修改: `docs/.vitepress/config.mts:11-13` (扩展 `head` 数组)

- [ ] **Step 1: 扩展 head 配置，添加全局 SEO meta 标签**

将 `docs/.vitepress/config.mts` 中的 `head` 数组替换为：

```ts
  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: '/assets/avatar.jpeg' }],
    // Open Graph
    ['meta', { property: 'og:site_name', content: "Jiacheng's Library" }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: 'https://jackieanxis.github.io/assets/avatar.jpeg' }],
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
```

- [ ] **Step 2: 构建并验证全局 meta 标签**

```bash
npm run docs:build
```

然后在任意构建产物页面中验证全局 meta 标签存在：

```bash
grep -c 'og:site_name' docs/.vitepress/dist/index.html
grep -c 'twitter:card' docs/.vitepress/dist/index.html
grep -c 'og:image' docs/.vitepress/dist/index.html
```

Expected: 每个命令输出 >= 1

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/config.mts
git commit -m "feat(seo): 添加全局 Open Graph 和 Twitter Card meta 标签"
```

---

### Task 3: 添加 transformHead 钩子自动生成页面级 Meta

**Files:**
- 修改: `docs/.vitepress/config.mts` (在 `defineConfig` 对象末尾添加 `transformHead` 函数)

- [ ] **Step 1: 在 config.mts 中添加 transformHead 钩子**

在 `docs/.vitepress/config.mts` 的 `defineConfig` 对象中，在 `themeConfig` 闭合括号 `}` 之前，添加 `transformHead`：

```ts
    socialLinks: [
      { icon: 'github', link: 'https://github.com/JackieAnxis/jackieanxis.github.io' },
    ],
  },

  async transformHead({ pageData }) {
    const title = pageData.frontmatter.title
    const description = pageData.frontmatter.description
    const head: HeadConfig[] = []

    if (title) {
      head.push(['meta', { property: 'og:title', content: title }])
      head.push(['meta', { name: 'twitter:title', content: title }])
    }

    if (description) {
      head.push(['meta', { name: 'description', content: description }])
      head.push(['meta', { property: 'og:description', content: description }])
      head.push(['meta', { name: 'twitter:description', content: description }])
    }

    return head
  },
```

同时需要在文件顶部 `import` 语句之后添加 `HeadConfig` 类型导入。将第一行改为：

```ts
import { defineConfig, type HeadConfig } from 'vitepress'
```

- [ ] **Step 2: 为一个电子书页面添加 description frontmatter 做测试**

选择 `docs/agent-revelations/01-concept-and-evolution/00-overview.md`，在其 frontmatter 中添加 description 字段（如果还没有的话）：

```yaml
---
title: "Agent 的概念和演变"
description: "从软件助手到自主智能体，Agent 的概念经历了怎样的演变？本章梳理 Agent 的定义、发展历程，以及为什么大模型让 Agent 迎来了真正的爆发。"
---
```

> 注意：此步骤仅验证 transformHead 工作正常。为所有页面添加 description 属于内容工作，不在本计划范围内。

- [ ] **Step 3: 构建并验证页面级 meta 自动生成**

```bash
npm run docs:build
```

验证测试页面的构建产物中包含自动生成的 meta 标签：

```bash
grep 'og:title' docs/.vitepress/dist/agent-revelations/01-concept-and-evolution/00-overview.html
grep 'og:description' docs/.vitepress/dist/agent-revelations/01-concept-and-evolution/00-overview.html
grep 'twitter:title' docs/.vitepress/dist/agent-revelations/01-concept-and-evolution/00-overview.html
```

Expected: 每个命令输出包含对应的 meta 标签，内容为 frontmatter 中的值

- [ ] **Step 4: Commit**

```bash
git add docs/.vitepress/config.mts docs/agent-revelations/01-concept-and-evolution/00-overview.md
git commit -m "feat(seo): 添加 transformHead 钩子自动生成页面级 og 和 twitter meta 标签"
```

---

### Task 4: 添加 JSON-LD 结构化数据

**Files:**
- 修改: `docs/.vitepress/config.mts` (在 `transformHead` 之后添加 `transformPageData`)

- [ ] **Step 1: 在 config.mts 中添加 transformPageData 钩子**

在 `docs/.vitepress/config.mts` 的 `transformHead` 函数之后，添加 `transformPageData`：

```ts
  async transformPageData(pageData) {
    const title = pageData.frontmatter.title
    const description = pageData.frontmatter.description
    if (!title) return

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description || '',
      author: {
        '@type': 'Person',
        name: 'Jiacheng',
      },
      publisher: {
        '@type': 'Person',
        name: 'Jiacheng',
      },
    }

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push([
      'script',
      { type: 'application/ld+json' },
      JSON.stringify(jsonLd),
    ])
  },
```

- [ ] **Step 2: 构建并验证 JSON-LD 注入**

```bash
npm run docs:build
```

验证测试页面的构建产物中包含 JSON-LD 脚本：

```bash
grep 'application/ld+json' docs/.vitepress/dist/agent-revelations/01-concept-and-evolution/00-overview.html
grep 'schema.org' docs/.vitepress/dist/agent-revelations/01-concept-and-evolution/00-overview.html
```

Expected: 两个命令都有输出，内容包含 Article 类型和正确的 headline

- [ ] **Step 3: 用 Google 富媒体结果测试工具验证（手动）**

本地启动开发服务器：

```bash
npm run docs:dev
```

在浏览器中打开 `http://localhost:5173/agent-revelations/01-concept-and-evolution/00-overview`，查看页面源码，确认 `<script type="application/ld+json">` 标签存在且内容正确。

> 可选：将页面 URL 粘贴到 https://search.google.com/test/rich-results 验证结构化数据有效性。

- [ ] **Step 4: Commit**

```bash
git add docs/.vitepress/config.mts
git commit -m "feat(seo): 添加 JSON-LD 结构化数据自动注入"
```

---

## 自检结果

**1. Spec 覆盖：**
- Sitemap → Task 1 ✓
- Robots.txt → Task 1 ✓
- 全局 og 标签 → Task 2 ✓
- 页面级 og/twitter 标签 → Task 3 ✓
- JSON-LD 结构化数据 → Task 4 ✓
- 页面 description frontmatter 规范 → Task 3 验证了一个示例页面 ✓

**2. 占位符扫描：** 无 TBD/TODO，所有步骤包含完整代码 ✓

**3. 类型一致性：** HeadConfig 导入与 transformHead 返回类型匹配，jsonLd 对象结构与 JSON.stringify 一致 ✓
