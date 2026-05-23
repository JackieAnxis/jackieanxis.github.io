import { defineConfig } from 'vitepress'
import { katex as katexPlugin } from '@mdit/plugin-katex'

export default defineConfig({
  lang: 'zh-CN',
  title: '潘嘉铖',
  description: '智能体算法工程师 / 数据智能体 / 数据可视化',
  base: '/',
  cleanUrls: true,

  markdown: {
    config: (md) => {
      md.use(katexPlugin, { mathFence: true })
    },
  },

  themeConfig: {
    outline: {
      level: [2, 3],
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '电子书', items: [
        { text: '大模型入门', link: '/llm-for-everyone/00-neural_network/00-overview' },
      ]},
      { text: '博客', link: '/blog/' },
      { text: '项目', link: '/projects' },
    ],

    sidebar: {
      '/llm-for-everyone/': [
        {
          text: '神经网络基础',
          items: [
            { text: '神经网络是什么', link: '/llm-for-everyone/00-neural_network/00-overview' },
            { text: '神经网络如何完成预测', link: '/llm-for-everyone/00-neural_network/01-basic-concepts' },
            { text: '如何衡量神经网络的好坏', link: '/llm-for-everyone/00-neural_network/02-loss-function' },
            { text: '如何训练一个神经网络', link: '/llm-for-everyone/00-neural_network/03-training-neural-network' },
            { text: '本章小结与练习', link: '/llm-for-everyone/00-neural_network/04-summary-and-practice' },
          ],
        },
        {
          text: '大语言模型基础',
          items: [
            { text: '语言模型：预测下一个词', link: '/llm-for-everyone/01-llm_basics/01-language-model' },
            { text: '从文字到数字', link: '/llm-for-everyone/01-llm_basics/02-from-text-to-numbers' },
            { text: '简单神经网络的局限', link: '/llm-for-everyone/01-llm_basics/03-simple-network-limits' },
            { text: 'Transformer 的直觉', link: '/llm-for-everyone/01-llm_basics/04-transformer-intuition' },
            { text: '大模型：为什么要"大"', link: '/llm-for-everyone/01-llm_basics/05-why-scale-matters' },
          ],
        },
        {
          text: '大模型推理：如何预测下一个词',
          items: [
            { text: '推理过程概览', link: '/llm-for-everyone/02-inference/01-overview' },
            { text: 'Token 是怎么被切出来的', link: '/llm-for-everyone/02-inference/03-tokenize' },
            { text: '模型如何预测下一个 token', link: '/llm-for-everyone/02-inference/04a-token_predict_overview' },
            { text: 'Decoder Block 是什么', link: '/llm-for-everyone/02-inference/04b-decoder_block' },
            { text: '采样一个 token', link: '/llm-for-everyone/02-inference/05-token_sample' },
            { text: '推理过程回顾', link: '/llm-for-everyone/02-inference/06-summary' },
          ],
        },
        {
          text: '预训练：让模型学会语言',
          items: [
            { text: '预训练做什么', link: '/llm-for-everyone/03-pretraining/01-overview' },
            { text: '数据准备', link: '/llm-for-everyone/03-pretraining/02-data-preparation' },
            { text: '训练循环', link: '/llm-for-everyone/03-pretraining/03-training-loop' },
            { text: '训练细节', link: '/llm-for-everyone/03-pretraining/04-training-details' },
            { text: '预训练回顾', link: '/llm-for-everyone/03-pretraining/05-summary' },
          ],
        },
        {
          text: '参考资料',
          items: [
            { text: 'Embedding 表长什么样', link: '/llm-for-everyone/references/embedding' },
            { text: '最经典的做法：sinusoidal positional encoding', link: '/llm-for-everyone/references/positional_encoding' },
            { text: '为什么需要 Self-Attention', link: '/llm-for-everyone/references/self-attention' },
            { text: 'Feed Forward 在哪里', link: '/llm-for-everyone/references/feed-forward' },
            { text: '为什么需要 Norm', link: '/llm-for-everyone/references/norm' },
            { text: 'Logits 不是概率', link: '/llm-for-everyone/references/logits' },
          ],
        },
      ],
    },

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/JackieAnxis' },
    ],
  },
})
