import { defineConfig, type HeadConfig } from 'vitepress'
import { katex as katexPlugin } from '@mdit/plugin-katex'

export default defineConfig({
  lang: 'zh-CN',
  title: "Jiacheng's Library",
  description: '智能体算法工程师 / 数据智能体 / 数据可视化',
  base: '/',
  cleanUrls: true,

  sitemap: {
    hostname: 'https://jackieanxis.github.io',
  },

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
      { text: 'Agent 启示录', link: '/agent-revelations/', activeMatch: '^/agent-revelations/' },
    ],

    sidebar: {
      '/llm-for-everyone/': [
        {
          text: '神经网络基础',
          items: [
            { text: '神经网络是什么', link: '/llm-for-everyone/00-neural_network/00-overview' },
            { text: '神经元、层和前向传播：神经网络如何完成预测', link: '/llm-for-everyone/00-neural_network/01-basic-concepts' },
            { text: '如何衡量一个神经网络的好坏：损失函数', link: '/llm-for-everyone/00-neural_network/02-loss-function' },
            { text: '如何训练一个神经网络', link: '/llm-for-everyone/00-neural_network/03-training-neural-network' },
            { text: '本章小结与练习', link: '/llm-for-everyone/00-neural_network/04-summary-and-practice' },
          ],
        },
        {
          text: '大模型基础',
          items: [
            { text: '语言模型：预测下一个词', link: '/llm-for-everyone/01-llm_basics/01-language-model' },
            { text: '从文字到数字：Tokenizer 和 Embedding', link: '/llm-for-everyone/01-llm_basics/02-from-text-to-numbers' },
            { text: '简单神经网络的局限', link: '/llm-for-everyone/01-llm_basics/03-simple-network-limits' },
            { text: 'Transformer 的直觉', link: '/llm-for-everyone/01-llm_basics/04-transformer-intuition' },
            { text: '大模型：为什么要"大"', link: '/llm-for-everyone/01-llm_basics/05-why-scale-matters' },
          ],
        },
        {
          text: '推理过程',
          items: [
            { text: '大模型推理过程概览：以 MiniMind 为例', link: '/llm-for-everyone/02-inference/01-overview' },
            { text: 'Token 是怎么被切出来的', link: '/llm-for-everyone/02-inference/03-tokenize' },
            { text: '模型如何预测下一个 token', link: '/llm-for-everyone/02-inference/04a-token_predict_overview' },
            { text: 'Decoder Block 是什么', link: '/llm-for-everyone/02-inference/04b-decoder_block' },
            { text: '采样一个 token', link: '/llm-for-everyone/02-inference/05-token_sample' },
            { text: '推理过程回顾', link: '/llm-for-everyone/02-inference/06-summary' },
          ],
        },
        {
          text: '预训练',
          items: [
            { text: '预训练：让模型学会语言', link: '/llm-for-everyone/03-pretraining/01-overview' },
            { text: '数据准备：模型从什么数据中学习', link: '/llm-for-everyone/03-pretraining/02-data-preparation' },
            { text: '训练循环：模型怎么从数据中学习', link: '/llm-for-everyone/03-pretraining/03-training-loop' },
            { text: '训练细节：让训练跑稳、跑快', link: '/llm-for-everyone/03-pretraining/04-training-details' },
            { text: '预训练回顾', link: '/llm-for-everyone/03-pretraining/05-summary' },
          ],
        },
        {
          text: '参考概念',
          items: [
            { text: 'Embedding 是什么', link: '/llm-for-everyone/references/embedding' },
            { text: 'Feed Forward 是什么', link: '/llm-for-everyone/references/feed-forward' },
            { text: 'Logits 是什么', link: '/llm-for-everyone/references/logits' },
            { text: 'Norm 是什么', link: '/llm-for-everyone/references/norm' },
            { text: '位置编码是什么', link: '/llm-for-everyone/references/positional_encoding' },
            { text: 'Self-Attention 是什么', link: '/llm-for-everyone/references/self-attention' },
          ],
        },
      ],
      '/agent-revelations/': [
        {
          text: 'Agent 的核心工作模式',
          items: [
            { text: 'Agent Loop：Agent 的心跳', link: '/agent-revelations/02-core-work-mode/01-agent-loop' },
            { text: '与模型对话：LLM API 工作模式', link: '/agent-revelations/02-core-work-mode/02-llm-api' },
            { text: '工具系统：Agent 的双手', link: '/agent-revelations/02-core-work-mode/03-tool-system' },
            { text: '权限管线：Agent 的护栏', link: '/agent-revelations/02-core-work-mode/04-permission-pipeline' },
            { text: '技能系统：Agent 的训练手册', link: '/agent-revelations/02-core-work-mode/05-skill-system' },
            { text: '任务系统：Agent 的行动蓝图', link: '/agent-revelations/02-core-work-mode/06-plan-task-system' },
            { text: 'Subagent 系统：多 Agents 合作', link: '/agent-revelations/02-core-work-mode/07-subagents' },
            { text: '协调器模式：主进程只负责指挥', link: '/agent-revelations/02-core-work-mode/08-coordinator' },
            { text: 'AGENTS.md：Agent 的指令本', link: '/agent-revelations/02-core-work-mode/09-agents-md' },
            { text: '记忆系统：Agent 的经验本', link: '/agent-revelations/02-core-work-mode/10-memory-system' },
            { text: 'AutoDream：睡眠时的记忆整理', link: '/agent-revelations/02-core-work-mode/11-auto-dream' },
            { text: '上下文：Agent 的记忆与视野', link: '/agent-revelations/02-core-work-mode/12-context-overview' },
            { text: '上下文压缩：当窗口不够用时', link: '/agent-revelations/02-core-work-mode/13-context-management' },
          ],
        },
        {
          text: '周围组件',
          items: [
            { text: 'Hooks：Agent 的生命线监控器', link: '/agent-revelations/03-peripheral-components/01-hooks' },
            { text: 'MCP：AI 时代的 "USB-C 接口"', link: '/agent-revelations/03-peripheral-components/02-model-context-protocol' },
          ],
        },
        {
          text: '通往 AGI 之路',
          items: [
            { text: 'KAIROS：永不关机的 Agent', link: '/agent-revelations/04-the-way-to-agi/01-kairos' },
            { text: 'Agent 团队：像真实团队一样协作', link: '/agent-revelations/04-the-way-to-agi/02-agent-teams' },
          ],
        },
        {
          text: '参考',
          items: [
            { text: 'Claude Code 系统提示词参考', link: '/agent-revelations/05-reference/01-claude-code-prompts' },
            { text: 'LLM API 协议参考', link: '/agent-revelations/05-reference/02-llm-api-protocols' },
            { text: 'Bash 工具权限检查详解', link: '/agent-revelations/05-reference/03-bash-tool-permissions' },
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
})
