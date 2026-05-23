import { defineConfig } from 'vitepress'
import { katex as katexPlugin } from '@mdit/plugin-katex'

export default defineConfig({
  lang: 'zh-CN',
  title: '大模型入门',
  description: '面向所有人的大语言模型入门教程',
  base: '/llm-for-everyone/',
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
      { text: '开始阅读', link: '/00-neural_network/00-overview' },
    ],

    sidebar: [
      {
        text: '神经网络基础',
        items: [
          { text: '神经网络是什么', link: '/00-neural_network/00-overview' },
          { text: '神经网络如何完成预测', link: '/00-neural_network/01-basic-concepts' },
          { text: '如何衡量神经网络的好坏', link: '/00-neural_network/02-loss-function' },
          { text: '如何训练一个神经网络', link: '/00-neural_network/03-training-neural-network' },
          { text: '本章小结与练习', link: '/00-neural_network/04-summary-and-practice' },
        ],
      },
      {
        text: '大语言模型基础',
        items: [
          { text: '语言模型：预测下一个词', link: '/01-llm_basics/01-language-model' },
          { text: '从文字到数字', link: '/01-llm_basics/02-from-text-to-numbers' },
          { text: '简单神经网络的局限', link: '/01-llm_basics/03-simple-network-limits' },
          { text: 'Transformer 的直觉', link: '/01-llm_basics/04-transformer-intuition' },
          { text: '大模型：为什么要"大"', link: '/01-llm_basics/05-why-scale-matters' },
        ],
      },
      {
        text: '大模型推理：如何预测下一个词',
        items: [
          { text: '推理过程概览', link: '/02-inference/01-overview' },
          { text: 'Token 是怎么被切出来的', link: '/02-inference/03-tokenize' },
          { text: '模型如何预测下一个 token', link: '/02-inference/04a-token_predict_overview' },
          { text: 'Decoder Block 是什么', link: '/02-inference/04b-decoder_block' },
          { text: '采样一个 token', link: '/02-inference/05-token_sample' },
          { text: '推理过程回顾', link: '/02-inference/06-summary' },
        ],
      },
      {
        text: '预训练：让模型学会语言',
        items: [
          { text: '预训练做什么', link: '/03-pretraining/01-overview' },
          { text: '数据准备', link: '/03-pretraining/02-data-preparation' },
          { text: '训练循环', link: '/03-pretraining/03-training-loop' },
          { text: '训练细节', link: '/03-pretraining/04-training-details' },
          { text: '预训练回顾', link: '/03-pretraining/05-summary' },
        ],
      },
      {
        text: '参考资料',
        items: [
          { text: 'Embedding 表长什么样', link: '/references/embedding' },
          { text: '最经典的做法：sinusoidal positional encoding', link: '/references/positional_encoding' },
          { text: '为什么需要 Self-Attention', link: '/references/self-attention' },
          { text: 'Feed Forward 在哪里', link: '/references/feed-forward' },
          { text: '为什么需要 Norm', link: '/references/norm' },
          { text: 'Logits 不是概率', link: '/references/logits' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/JackieAnxis/llm-for-everyone' },
    ],
  },
})
