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
      { text: '大模型入门', link: '/llm-for-everyone/00-neural_network/00-overview', activeMatch: '^/llm-for-everyone/' },
      { text: '博客', link: '/blog', activeMatch: '^/blog/' },
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

      '/blog/': [
        {
          text: '2022',
          items: [
            { text: 'Simultaneous Matrix Orderings for Graph Collections', link: '/blog/posts/2022/2022-06-02-Simultaneous-Matrix-Orderings-for-Graph-Collections' },
            { text: '2021年国庆西北大环线游记', link: '/blog/posts/2022/2022-05-13 西北大环线游记' },
          ],
        },
        {
          text: '2021',
          items: [
            { text: 'Windows装机指南', link: '/blog/posts/2021/2021-11-15 Window装机指南' },
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
            { text: 'CS229：16-模型选择和特征选择', link: '/blog/posts/2019/2019-01-18 16-模型选择和特征选择' },
            { text: '杂谈：图的相关基础知识', link: '/blog/posts/2019/2019-01-16 图的基础知识' },
            { text: 'CS229：15-Vapnik–Chervonenkis dimension', link: '/blog/posts/2019/2019-01-10 15-Vapnik-Chervonenkis Dimension' },
            { text: '动态图overview论文阅读总结', link: '/blog/posts/2019/2019-01-08 动态图overview论文阅读总结' },
            { text: 'CS229：14-经验风险最小化', link: '/blog/posts/2019/2019-01-05 14-经验风险最小化' },
          ],
        },
        {
          text: '2018',
          items: [
            { text: 'redux浅析', link: '/blog/posts/2018/2018-12-04 redux浅析' },
            { text: 'dyngraph2vec, Capturing Network Dynamics using Dynamic Graph Representation Learning', link: '/blog/posts/2018/2018-11-26 dyngraph2vec' },
            { text: 'The State of the Art in Visualizing Dynamic Graphs', link: '/blog/posts/2018/2018-11-16 The State of the Art in Visualizing Dynamic Graphs 2014' },
            { text: '十分钟了解MobX', link: '/blog/posts/2018/2018-09-14 十分钟了解MobX' },
            { text: 'Structure-aware Fisheye Views for Efficient Large Graph Exploration', link: '/blog/posts/2018/2018-09-05 Structure-aware Fisheye Views for Efficient Large Graph Exploration' },
            { text: '杂谈：国庆川西自驾游计划', link: '/blog/posts/2018/2018-08-22 国庆川西自驾游计划' },
            { text: 'CS229：13-SVM（四）非线性决策边界', link: '/blog/posts/2018/2018-07-25 13-SVM（四）非线性决策边界' },
            { text: 'CS229：12-SVM（三）核函数', link: '/blog/posts/2018/2018-07-22 12-SVM（三）核函数' },
            { text: '记一个Promise问题', link: '/blog/posts/2018/2018-07-08 记一个Promise问题' },
            { text: 'CS229：11-SVM（二）最优间隔分类器', link: '/blog/posts/2018/2018-07-03 11-SVM（二）最优间隔分类器' },
            { text: 'CS229：10-SVM（一）概念', link: '/blog/posts/2018/2018-07-02 10-SVM（一）概念' },
            { text: 'CS229：08-生成学习算法的概念', link: '/blog/posts/2018/2018-06-29 08-生成学习算法的概念' },
            { text: 'CS229：09-生成学习算法的例子', link: '/blog/posts/2018/2018-06-29 09-生成学习算法的例子' },
            { text: 'Reﬁnery, Visual Exploration of Large, Heterogeneous Networks through Associative Browsing', link: '/blog/posts/2018/2018-06-28 Reﬁnery, Visual Exploration of Large, HeterogeneousNetworks through Associative Browsing' },
            { text: 'HiPiler Visual Exploration of Large Genome Interaction Matrices with Interactive Small Multiples', link: '/blog/posts/2018/2018-06-26 HiPiler, Visual Exploration of Large Genome Interaction Matrices with Interactive Small Multiples' },
            { text: 'Wavelet-based Visual Analysis of Dynamic Networks', link: '/blog/posts/2018/2018-06-24 Wavelet-based Visual Analysis of Dynamic Networks' },
            { text: '杂谈：【转】傅里叶分析之掐死教程（完整版）', link: '/blog/posts/2018/2018-06-19 傅里叶分析' },
            { text: '杂谈：图的小波变换', link: '/blog/posts/2018/2018-06-19 图的小波变换' },
            { text: '杂谈：拉普拉斯矩阵和代数连通度', link: '/blog/posts/2018/2018-06-19 拉普拉斯矩阵和代数连通度' },
            { text: 'JellyLens, Content-Aware Adaptive Lenses', link: '/blog/posts/2018/2018-06-17 JellyLens- Content-Aware Adaptive Lenses' },
            { text: '杂谈：快慢指针', link: '/blog/posts/2018/2018-06-13 快慢指针' },
            { text: 'CS229：07-广义线性模型', link: '/blog/posts/2018/2018-06-09 07-广义线性模型' },
            { text: 'SchemeLens, A Content-Aware Vector-Based Fisheye Technique for Navigating Large Systems Diagrams', link: '/blog/posts/2018/2018-06-09 SchemeLens, A Content-Aware Vector-Based Fisheye Technique for Navigating Large Systems Diagrams' },
            { text: 'CS229：06-牛顿法', link: '/blog/posts/2018/2018-06-07 06-牛顿法' },
            { text: 'CS229：04-线性模型的概率解释', link: '/blog/posts/2018/2018-06-05 04-线性模型的概率解释' },
            { text: 'CS229：05-二分类问题', link: '/blog/posts/2018/2018-06-05 05-二分类问题' },
            { text: 'CS229：03-过拟合&局部加权回归', link: '/blog/posts/2018/2018-06-04 03-过拟合&局部加权回归' },
            { text: 'CS229：01-监督学习&梯度下降法', link: '/blog/posts/2018/2018-06-03 01-监督学习&梯度下降法' },
            { text: 'CS229：02-线性回归', link: '/blog/posts/2018/2018-06-03 02-线性回归' },
            { text: 'ICCV2017：第一人称视角手势估计', link: '/blog/posts/2018/2018-05-06 ICCV2017：第一人称视角手势估计' },
            { text: 'Affective Color in Visualization', link: '/blog/posts/2018/2018-05-03 Affective Color in Visualization' },
            { text: 'iSphere-交互式探索大规模图的焦点+上下文球体可视化技术', link: '/blog/posts/2018/2018-04-26 iSphere_ Focus+Context Sphere Visualization for Interactive Large Graph Exploration' },
            { text: '如何选择JavaScript构建工具之Babel、Browserify、Webpack、Grunt以及Gulp', link: '/blog/posts/2018/2018-01-18 如何选择JavaScript构建工具之Babel、Browserify、Webpack、Grunt以及Gulp' },
            { text: 'STRUC2VEC（图结构→向量）论文方法解读', link: '/blog/posts/2018/2018-01-17 struc2vec Learning Node Representations from Structural Identity' },
          ],
        },
        {
          text: '2017',
          items: [
            { text: '杂谈：六级翻译重要词汇短语', link: '/blog/posts/2017/2017-12-16 六级翻译重要词汇' },
            { text: '杂谈：机器学习三要素', link: '/blog/posts/2017/2017-11-23 机器学习的三个主要组成' },
            { text: '杂谈：浙江大学-数据挖掘课程-复习笔记', link: '/blog/posts/2017/2017-11-10 数据挖掘复习' },
            { text: 'A Survey on Graph Visualization', link: '/blog/posts/2017/2017-10-03 A Survey on Graph Visualization' },
            { text: 'A Machine Learning Approach to Large Graph Visualization', link: '/blog/posts/2017/2017-09-03 A Machine Learning Approach to Large Graph Visualization' },
            { text: '杂谈：Python入门学习笔记基础', link: '/blog/posts/2017/2017-08-21 Python入门学习笔记' },
            { text: '杂谈：《软技能》学习篇阅读笔记', link: '/blog/posts/2017/2017-08-07 《软技能》学习篇阅读笔记' },
            { text: '杂谈：《软技能》生产力篇阅读笔记', link: '/blog/posts/2017/2017-08-07 《软技能》生产力篇阅读笔记' },
            { text: 'JavaScript闭包', link: '/blog/posts/2017/2017-07-27 JavaScript闭包' },
            { text: 'JavaScript中的this关键字', link: '/blog/posts/2017/2017-07-25 JavaScript中的this关键字' },
            { text: 'JavaScript执行环境和作用域', link: '/blog/posts/2017/2017-07-24 JavaScript执行环境和作用域' },
            { text: 'JavaScript函数表达式和函数声明', link: '/blog/posts/2017/2017-05-19 JavaScript函数表达式和函数声明' },
            { text: 'JavaScript中四种不同的属性检测方式比较', link: '/blog/posts/2017/2017-05-16 JavaScript中四种不同的属性检测方式比较' },
            { text: 'JavaScript类型转换和相等性', link: '/blog/posts/2017/2017-04-15 JavaScript类型与相等性' },
            { text: 'CSS@12布局篇', link: '/blog/posts/2017/2017-04-03 CSS@12布局篇' },
            { text: 'CSS@11弹性布局flex', link: '/blog/posts/2017/2017-01-29 CSS@11弹性布局flex' },
            { text: '杂谈：《编写可读代码的艺术》阅读笔记（三）', link: '/blog/posts/2017/2017-01-26 《编写可读代码的艺术》阅读笔记（三） ' },
            { text: '杂谈：《编写可读代码的艺术》阅读笔记（二）', link: '/blog/posts/2017/2017-01-26 《编写可读代码的艺术》阅读笔记（二）' },
            { text: '杂谈：《编写可读代码的艺术》阅读笔记（一）', link: '/blog/posts/2017/2017-01-24 《编写可读代码的艺术》阅读笔记（一）' },
            { text: 'CSS@10布局（下）：float', link: '/blog/posts/2017/2017-01-14 CSS@10布局（下）：float' },
          ],
        },
        {
          text: '2016',
          items: [
            { text: 'CSS@布局（中）：position', link: '/blog/posts/2016/2016-12-31 CSS@9布局（中）：position' },
            { text: 'CSS@8布局（上）：display&z-index', link: '/blog/posts/2016/2016-12-09 CSS@8布局（上）：display&z-index' },
            { text: '读《一道JS面试题引发的思考》', link: '/blog/posts/2016/2016-11-30 读《一道JS面试题引发的思考》笔记和思考' },
            { text: 'CSS@7背景', link: '/blog/posts/2016/2016-11-29 CSS@7背景' },
            { text: 'CSS@6盒模型', link: '/blog/posts/2016/2016-11-26 CSS@6盒模型' },
            { text: 'CSS@5文本', link: '/blog/posts/2016/2016-10-23 CSS@5文本' },
            { text: '浅析JS模块化规范：CommonJS，AMD，CMD', link: '/blog/posts/2016/2016-10-17 浅析JS模块化规范：CommonJS，AMD，CMD' },
            { text: 'CSS@4单位', link: '/blog/posts/2016/2016-09-26 CSS@4单位' },
            { text: 'CSS@3继承优先级', link: '/blog/posts/2016/2016-09-14 CSS@3继承优先级' },
            { text: 'CSS@2选择器', link: '/blog/posts/2016/2016-09-13 CSS@2选择器' },
            { text: 'CSS@1介绍和准备', link: '/blog/posts/2016/2016-08-18 CSS@1介绍和准备' },
            { text: 'HTML@7补充篇', link: '/blog/posts/2016/2016-08-13 HTML@7结尾篇' },
            { text: 'HTML@6表单标签', link: '/blog/posts/2016/2016-08-09 HTML@6表单标签' },
            { text: 'HTML@5表格标签', link: '/blog/posts/2016/2016-08-08 HTML@5表格标签' },
            { text: 'HTML@4嵌入资源标签', link: '/blog/posts/2016/2016-08-07 HTML@4嵌入资源标签' },
            { text: 'HTML@3组合内容标签', link: '/blog/posts/2016/2016-08-06 HTML@3组合内容标签' },
            { text: 'HTML@2章节标签&文本标签', link: '/blog/posts/2016/2016-08-05 HTML@2章节标签&文本标签' },
            { text: 'HTML@1文档结构&标签属性', link: '/blog/posts/2016/2016-07-19 HTML@1文档结构&标签属性' },
            { text: '杂谈：react-native的枪林弹雨', link: '/blog/posts/2016/2016-06-04 react-native的枪林弹雨' },
            { text: '杂谈：React-Native在win10平台上的部署', link: '/blog/posts/2016/2016-05-09 React-Native在win10平台上的部署' },
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
