import { defineConfig } from 'vitepress'
import { katex as katexPlugin } from '@mdit/plugin-katex'

export default defineConfig({
  lang: 'zh-CN',
  title: "Jiacheng's Site",
  description: '智能体算法工程师 / 数据智能体 / 数据可视化',
  base: '/',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: '/assets/avatar.jpeg' }],
  ],

  markdown: {
    config: (md) => {
      md.use(katexPlugin, { mathFence: true })
    },
  },

  appearance: false,

  themeConfig: {
    outline: {
      level: [2, 3],
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '人人能懂的大模型', link: '/llm-for-everyone/00-neural_network/00-overview', activeMatch: '^/llm-for-everyone/' },
      { text: '博客', link: '/blog/posts/2022/2022-06-02-Simultaneous-Matrix-Orderings-for-Graph-Collections', activeMatch: '^/blog/' },
    ],

    sidebar: {}, // github 部署时，会调用 scripts/auto-sidebar-generate.js 来自动生成侧边栏

    search: {
      provider: 'local',
    },

    siteTitle: false,

    logo: '/assets/avatar.jpeg',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/JackieAnxis' },
    ],
  },
})
