#!/usr/bin/env node

// 自动扫描博客文章，按年份生成 sidebar 配置片段
// 输出格式：直接可粘贴到 config.mts 的 sidebar['/blog/'] 中
// 同时更新 blog/index.md

const fs = require('fs')
const path = require('path')

const postsDir = path.join(__dirname, '..', 'docs', 'blog', 'posts')
const indexFile = path.join(__dirname, '..', 'docs', 'blog', 'index.md')

// 扫描所有文章
const posts = []
const years = fs.readdirSync(postsDir).filter(d => /^\d{4}$/.test(d))

for (const year of years) {
  const yearDir = path.join(postsDir, year)
  const files = fs.readdirSync(yearDir).filter(f => f.endsWith('.md'))

  for (const file of files) {
    const filepath = path.join(yearDir, file)
    const content = fs.readFileSync(filepath, 'utf-8')

    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) continue

    const fm = fmMatch[1]
    const titleMatch = fm.match(/^title:\s*"?([^"]*)"?\s*$/m)
    const dateMatch = fm.match(/^date:\s*(.+)\s*$/m)

    if (!titleMatch) continue

    const title = titleMatch[1].trim()
    const date = dateMatch ? dateMatch[1].trim().split(' ')[0] : `${year}-01-01`
    const basename = file.replace(/\.md$/, '')
    const link = `/blog/posts/${year}/${basename}`

    posts.push({ title, date, year, link })
  }
}

// 按日期倒序（最新在前）
posts.sort((a, b) => b.date.localeCompare(a.date))

// 按年份分组（倒序）
const grouped = {}
for (const post of posts) {
  if (!grouped[post.year]) grouped[post.year] = []
  grouped[post.year].push(post)
}
const sortedYears = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

// --- 生成 sidebar 配置 ---
let sidebarCode = ''
for (const year of sortedYears) {
  sidebarCode += `        {\n          text: '${year}',\n          items: [\n`
  for (const item of grouped[year]) {
    const escapedTitle = item.title.replace(/'/g, "\\'")
    sidebarCode += `            { text: '${escapedTitle}', link: '${item.link}' },\n`
  }
  sidebarCode += `          ],\n        },\n`
}

// --- 生成 index.md ---
let md = `---
layout: doc
title: 博客
---

# 博客

共 ${posts.length} 篇文章。

`

for (const year of sortedYears) {
  md += `## ${year}\n\n`
  for (const item of grouped[year]) {
    md += `- [${item.title}](<${item.link}>)\n`
  }
  md += '\n'
}

fs.writeFileSync(indexFile, md, 'utf-8')

// 输出 sidebar 配置片段到 stdout
console.log(sidebarCode)
console.error(`已生成 ${indexFile}，共 ${posts.length} 篇文章`)
