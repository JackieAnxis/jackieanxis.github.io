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
      md.use(katexPlugin, { mathFence: true, strict: false })
    },
  },

  ignoreDeadLinks: true,

  appearance: false,

  themeConfig: {
    outline: {
      level: [2, 3],
    },
    nav: [
      { text: '首页', link: '/' },
    ],

    sidebar: {
      '/agent-revelations/': [
      {
        text: 'Agent 的概念和演变',
        items: [
          { text: 'Agent 的概念和演变', link: '/agent-revelations/01-concept-and-evolution/00-overview' },
        ],
      },
      {
        text: 'Agent 的核心工作模式',
        items: [
          { text: 'Agent Loop：Agent 的心跳', link: '/agent-revelations/02-core-work-mode/01-agent-loop' },
          { text: '与模型对话：LLM API 是怎么工作的', link: '/agent-revelations/02-core-work-mode/02-llm-api' },
          { text: '工具系统：Agent 的双手', link: '/agent-revelations/02-core-work-mode/03-tool-system' },
          { text: '权限管线：Agent 的护栏', link: '/agent-revelations/02-core-work-mode/04-permission-pipeline' },
          { text: '技能系统：Agent 的训练手册', link: '/agent-revelations/02-core-work-mode/05-skill-system' },
          { text: '计划与任务系统：Agent 的行动蓝图', link: '/agent-revelations/02-core-work-mode/06-plan-task-system' },
          { text: 'Subagent 系统：Agent 的多线程工作模式', link: '/agent-revelations/02-core-work-mode/07-subagents' },
          { text: 'CLAUDE.md：Agent 的指令本', link: '/agent-revelations/02-core-work-mode/08-claude-md' },
          { text: '记忆系统：Agent 的经验本', link: '/agent-revelations/02-core-work-mode/09-memory-system' },
        ],
      },
      ],
    },
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
