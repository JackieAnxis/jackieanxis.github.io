#!/usr/bin/env node

// 自动扫描所有内容目录，生成 sidebar 配置并写入 config.mts

const fs = require('fs')
const path = require('path')

const configPath = path.join(__dirname, '..', 'docs', '.vitepress', 'config.mts')

// ============================================================
// 扫描器：博客（按年份倒序）
// ============================================================
function scanBlog() {
  const postsDir = path.join(__dirname, '..', 'docs', 'blog', 'posts')
  if (!fs.existsSync(postsDir)) return []

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

      const titleMatch = fmMatch[1].match(/^title:\s*"?([^"]*)"?\s*$/m)
      const dateMatch = fmMatch[1].match(/^date:\s*(.+)\s*$/m)
      if (!titleMatch) continue

      posts.push({
        title: titleMatch[1].trim(),
        date: dateMatch ? dateMatch[1].trim().split(' ')[0] : `${year}-01-01`,
        year,
        link: `/blog/posts/${year}/${file.replace(/\.md$/, '')}`,
      })
    }
  }

  posts.sort((a, b) => b.date.localeCompare(a.date))

  const grouped = {}
  for (const post of posts) {
    if (!grouped[post.year]) grouped[post.year] = []
    grouped[post.year].push(post)
  }

  return Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a))
    .map(year => ({
      text: year,
      items: grouped[year].map(p => ({ text: p.title, link: p.link })),
    }))
}

// ============================================================
// 扫描器：电子书（按章节目录排序，从 h1 取标题）
// ============================================================
function scanEbook() {
  const baseDir = path.join(__dirname, '..', 'docs', 'llm-for-everyone')
  if (!fs.existsSync(baseDir)) return []

  // 章节目录按前缀数字排序
  const chapters = fs.readdirSync(baseDir)
    .filter(d => fs.statSync(path.join(baseDir, d)).isDirectory())
    .sort()

  const result = []

  // 手动维护章节中文名（目录名 → 显示名）
  const chapterNames = {
    '00-neural_network': '神经网络基础',
    '01-llm_basics': '大语言模型基础',
    '02-inference': '大模型推理：如何预测下一个词',
    '03-pretraining': '预训练：让模型学会语言',
    'references': '参考资料',
  }

  for (const chapter of chapters) {
    const chapterDir = path.join(baseDir, chapter)
    const files = fs.readdirSync(chapterDir)
      .filter(f => f.endsWith('.md'))
      .sort()

    const items = []
    for (const file of files) {
      const content = fs.readFileSync(path.join(chapterDir, file), 'utf-8')
      const h1Match = content.match(/^# (.+)$/m)
      if (!h1Match) continue

      items.push({
        text: h1Match[1].trim(),
        link: `/llm-for-everyone/${chapter}/${file.replace(/\.md$/, '')}`,
      })
    }

    if (items.length > 0) {
      result.push({
        text: chapterNames[chapter] || chapter,
        items,
      })
    }
  }

  return result
}

// ============================================================
// 扫描器：Agent 启示录（按章节目录排序，从 h1 取标题）
// ============================================================
function scanAgentRevelations() {
  const baseDir = path.join(__dirname, '..', 'docs', 'agent-revelations')
  if (!fs.existsSync(baseDir)) return []

  const chapters = fs.readdirSync(baseDir)
    .filter(d => fs.statSync(path.join(baseDir, d)).isDirectory())
    .sort()

  const result = []

  const chapterNames = {
    '01-concept-and-evolution': 'Agent 的概念和演变',
    '02-core-work-mode': 'Agent 的核心工作模式',
  }

  for (const chapter of chapters) {
    const chapterDir = path.join(baseDir, chapter)
    const files = fs.readdirSync(chapterDir)
      .filter(f => f.endsWith('.md'))
      .sort()

    const items = []
    for (const file of files) {
      const content = fs.readFileSync(path.join(chapterDir, file), 'utf-8')
      const h1Match = content.match(/^# (.+)$/m)
      if (!h1Match) continue

      items.push({
        text: h1Match[1].trim(),
        link: `/agent-revelations/${chapter}/${file.replace(/\.md$/, '')}`,
      })
    }

    if (items.length > 0) {
      result.push({
        text: chapterNames[chapter] || chapter,
        items,
      })
    }
  }

  return result
}

// ============================================================
// 生成 JS 对象字符串（写入 config.mts 的 sidebar 字段）
// ============================================================
function sidebarToString(sidebar, indent = '      ') {
  const lines = []
  for (const group of sidebar) {
    lines.push(`${indent}{`)
    lines.push(`${indent}  text: '${group.text.replace(/'/g, "\\'")}',`)
    lines.push(`${indent}  items: [`)
    for (const item of group.items) {
      lines.push(`${indent}    { text: '${item.text.replace(/'/g, "\\'")}', link: '${item.link}' },`)
    }
    lines.push(`${indent}  ],`)
    lines.push(`${indent}},`)
  }
  return lines.join('\n')
}

// ============================================================
// 更新 config.mts 中的 sidebar 配置
// ============================================================
function updateConfig(blogSidebar, ebookSidebar, agentRevelationsSidebar) {
  let content = fs.readFileSync(configPath, 'utf-8')
  const lines = content.split('\n')

  // 找到 sidebar: 所在行
  let sidebarLine = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\s*sidebar:\s*\{/)) {
      sidebarLine = i
      break
    }
  }

  // 找到 search: 所在行（sidebar 结束标记之后）
  let searchLine = -1
  for (let i = sidebarLine + 1; i < lines.length; i++) {
    if (lines[i].match(/^\s+search:\s*\{/)) {
      searchLine = i
      break
    }
  }

  if (sidebarLine === -1 || searchLine === -1) {
    throw new Error(`无法定位 sidebar 或 search 配置 (sidebar: line ${sidebarLine}, search: line ${searchLine})`)
  }

  const blogStr = sidebarToString(blogSidebar)
  const ebookStr = sidebarToString(ebookSidebar)
  const agentRevelationsStr = sidebarToString(agentRevelationsSidebar)

  const newSidebarBlock = `    sidebar: {
      '/blog/': [
${blogStr}
      ],
      '/llm-for-everyone/': [
${ebookStr}
      ],
      '/agent-revelations/': [
${agentRevelationsStr}
      ],
    },
`

  // 替换 sidebar: 到 search: 之前的所有行
  lines.splice(sidebarLine, searchLine - sidebarLine, newSidebarBlock.trimEnd())

  fs.writeFileSync(configPath, lines.join('\n'), 'utf-8')
}

// ============================================================
// 主流程
// ============================================================
const blogSidebar = scanBlog()
const ebookSidebar = scanEbook()
const agentRevelationsSidebar = scanAgentRevelations()

updateConfig(blogSidebar, ebookSidebar, agentRevelationsSidebar)

console.log(`博客 sidebar: ${blogSidebar.reduce((n, g) => n + g.items.length, 0)} 篇文章`)
console.log(`电子书 sidebar: ${ebookSidebar.reduce((n, g) => n + g.items.length, 0)} 篇章节`)
console.log(`Agent 启示录 sidebar: ${agentRevelationsSidebar.reduce((n, g) => n + g.items.length, 0)} 篇章节`)
console.log(`已更新 ${configPath}`)
