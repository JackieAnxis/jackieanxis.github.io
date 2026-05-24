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
      { text: '人人能懂的大模型', link: '/llm-for-everyone/00-neural_network/00-overview', activeMatch: '^/llm-for-everyone/' },
      { text: '博客', link: '/blog/posts/2022/2022-06-02-Simultaneous-Matrix-Orderings-for-Graph-Collections', activeMatch: '^/blog/' },
    ],

    sidebar: {
      '/blog/': [
      {
        text: '2026',
        items: [
          { text: 'Claude Code 核心问题和可能的解决方案', link: '/blog/posts/2026/2026-05-25-Claude Code Shortages' },
        ],
      },
      {
        text: '2022',
        items: [
          { text: 'Simultaneous Matrix Orderings for Graph Collections', link: '/blog/posts/2022/2022-06-02-Simultaneous-Matrix-Orderings-for-Graph-Collections' },
        ],
      },
      {
        text: '2021',
        items: [
          { text: 'Lumos Increasing Awareness of Analytic Behavior during Visual Data Analysis', link: '/blog/posts/2021/2021-10-11-Lumos' },
          { text: 'P4 P5 以及 P6', link: '/blog/posts/2021/2021-06-10 P4&P5&P6' },
          { text: 'Kyrix-S: Authoring Scalable Scatterplot Visualizations', link: '/blog/posts/2021/2021-04-20 Kyrix-S-Authoring Scalable Scatterplot Visualizations of Big Data' },
        ],
      },
      {
        text: '2020',
        items: [
          { text: 'ATOM: A Grammar for Unit Visualizations', link: '/blog/posts/2020/2020-08-06 ATOM-a grammar of unit visualization' },
        ],
      },
      {
        text: '2019',
        items: [
          { text: '动态图overview论文阅读总结', link: '/blog/posts/2019/2019-01-08 动态图overview论文阅读总结' },
        ],
      },
      {
        text: '2018',
        items: [
          { text: 'dyngraph2vec, Capturing Network Dynamics using Dynamic Graph Representation Learning', link: '/blog/posts/2018/2018-11-26 dyngraph2vec' },
          { text: 'The State of the Art in Visualizing Dynamic Graphs', link: '/blog/posts/2018/2018-11-16 The State of the Art in Visualizing Dynamic Graphs 2014' },
          { text: 'Structure-aware Fisheye Views for Efficient Large Graph Exploration', link: '/blog/posts/2018/2018-09-05 Structure-aware Fisheye Views for Efficient Large Graph Exploration' },
          { text: 'Reﬁnery, Visual Exploration of Large, Heterogeneous Networks through Associative Browsing', link: '/blog/posts/2018/2018-06-28 Reﬁnery, Visual Exploration of Large, HeterogeneousNetworks through Associative Browsing' },
          { text: 'HiPiler Visual Exploration of Large Genome Interaction Matrices with Interactive Small Multiples', link: '/blog/posts/2018/2018-06-26 HiPiler, Visual Exploration of Large Genome Interaction Matrices with Interactive Small Multiples' },
          { text: 'Wavelet-based Visual Analysis of Dynamic Networks', link: '/blog/posts/2018/2018-06-24 Wavelet-based Visual Analysis of Dynamic Networks' },
          { text: '杂谈：【转】傅里叶分析之掐死教程（完整版）', link: '/blog/posts/2018/2018-06-19 傅里叶分析' },
          { text: '杂谈：图的小波变换', link: '/blog/posts/2018/2018-06-19 图的小波变换' },
          { text: '杂谈：拉普拉斯矩阵和代数连通度', link: '/blog/posts/2018/2018-06-19 拉普拉斯矩阵和代数连通度' },
          { text: 'JellyLens, Content-Aware Adaptive Lenses', link: '/blog/posts/2018/2018-06-17 JellyLens- Content-Aware Adaptive Lenses' },
          { text: '杂谈：快慢指针', link: '/blog/posts/2018/2018-06-13 快慢指针' },
          { text: 'SchemeLens, A Content-Aware Vector-Based Fisheye Technique for Navigating Large Systems Diagrams', link: '/blog/posts/2018/2018-06-09 SchemeLens, A Content-Aware Vector-Based Fisheye Technique for Navigating Large Systems Diagrams' },
          { text: 'ICCV2017：第一人称视角手势估计', link: '/blog/posts/2018/2018-05-06 ICCV2017：第一人称视角手势估计' },
          { text: 'Affective Color in Visualization', link: '/blog/posts/2018/2018-05-03 Affective Color in Visualization' },
          { text: 'iSphere-交互式探索大规模图的焦点+上下文球体可视化技术', link: '/blog/posts/2018/2018-04-26 iSphere_ Focus+Context Sphere Visualization for Interactive Large Graph Exploration' },
          { text: 'STRUC2VEC（图结构→向量）论文方法解读', link: '/blog/posts/2018/2018-01-17 struc2vec Learning Node Representations from Structural Identity' },
        ],
      },
      {
        text: '2017',
        items: [
          { text: '杂谈：机器学习三要素', link: '/blog/posts/2017/2017-11-23 机器学习的三个主要组成' },
          { text: '杂谈：浙江大学-数据挖掘课程-复习笔记', link: '/blog/posts/2017/2017-11-10 数据挖掘复习' },
          { text: 'A Survey on Graph Visualization', link: '/blog/posts/2017/2017-10-03 A Survey on Graph Visualization' },
          { text: 'A Machine Learning Approach to Large Graph Visualization', link: '/blog/posts/2017/2017-09-03 A Machine Learning Approach to Large Graph Visualization' },
          { text: '杂谈：《软技能》学习篇阅读笔记', link: '/blog/posts/2017/2017-08-07 《软技能》学习篇阅读笔记' },
          { text: '杂谈：《软技能》生产力篇阅读笔记', link: '/blog/posts/2017/2017-08-07 《软技能》生产力篇阅读笔记' },
          { text: '杂谈：《编写可读代码的艺术》阅读笔记（三）', link: '/blog/posts/2017/2017-01-26 《编写可读代码的艺术》阅读笔记（三） ' },
          { text: '杂谈：《编写可读代码的艺术》阅读笔记（二）', link: '/blog/posts/2017/2017-01-26 《编写可读代码的艺术》阅读笔记（二）' },
          { text: '杂谈：《编写可读代码的艺术》阅读笔记（一）', link: '/blog/posts/2017/2017-01-24 《编写可读代码的艺术》阅读笔记（一）' },
        ],
      },
      {
        text: '2016',
        items: [
          { text: '读《一道JS面试题引发的思考》', link: '/blog/posts/2016/2016-11-30 读《一道JS面试题引发的思考》笔记和思考' },
        ],
      },
      ],
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
        text: '大语言模型基础',
        items: [
          { text: '语言模型：预测下一个词', link: '/llm-for-everyone/01-llm_basics/01-language-model' },
          { text: '从文字到数字：Tokenizer 和 Embedding', link: '/llm-for-everyone/01-llm_basics/02-from-text-to-numbers' },
          { text: '简单神经网络的局限', link: '/llm-for-everyone/01-llm_basics/03-simple-network-limits' },
          { text: 'Transformer 的直觉', link: '/llm-for-everyone/01-llm_basics/04-transformer-intuition' },
          { text: '大模型：为什么要"大"', link: '/llm-for-everyone/01-llm_basics/05-why-scale-matters' },
        ],
      },
      {
        text: '大模型推理：如何预测下一个词',
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
        text: '预训练：让模型学会语言',
        items: [
          { text: '预训练：让模型学会语言', link: '/llm-for-everyone/03-pretraining/01-overview' },
          { text: '数据准备：模型从什么数据中学习', link: '/llm-for-everyone/03-pretraining/02-data-preparation' },
          { text: '训练循环：模型怎么从数据中学习', link: '/llm-for-everyone/03-pretraining/03-training-loop' },
          { text: '训练细节：让训练跑稳、跑快', link: '/llm-for-everyone/03-pretraining/04-training-details' },
          { text: '预训练回顾', link: '/llm-for-everyone/03-pretraining/05-summary' },
        ],
      },
      {
        text: '参考资料',
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
          { text: 'Rewind：Agent 的时间回溯', link: '/agent-revelations/02-core-work-mode/0x-rewind' },
          { text: '权限管线：Agent 的护栏', link: '/agent-revelations/02-core-work-mode/04-permission-pipeline' },
          { text: '技能系统：Agent 的训练手册', link: '/agent-revelations/02-core-work-mode/05-skill-system' },
          { text: '计划与任务系统：Agent 的行动蓝图', link: '/agent-revelations/02-core-work-mode/06-plan-task-system' },
          { text: 'Subagent 系统：Agent 的多线程工作模式', link: '/agent-revelations/02-core-work-mode/07-subagents' },
          { text: '记忆系统：Agent 的经验本', link: '/agent-revelations/02-core-work-mode/08-memory-system' },
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
