<template>
  <div class="home-layout">
    <div class="home-left">
      <div class="profile">
        <h1 class="name">潘嘉铖</h1>
        <p class="title">智能体算法工程师</p>
        <p class="tagline">华为云 · 大模型智能体 · 数据可视化 · 浙江大学博士</p>
        <div class="actions">
          <a class="action-button" href="/resume.pdf" download>
            下载简历 PDF
          </a>
        </div>
      </div>

      <div class="book-cards">
        <a class="book-card" href="/llm-for-everyone/00-neural_network/00-overview">
          <h3>大模型入门</h3>
          <p>面向所有人的大语言模型入门教程。从最基础的神经网络概念出发，逐步深入到大模型的推理与预训练过程，无需机器学习背景即可阅读。</p>
          <span class="book-link">开始阅读 →</span>
        </a>
      </div>
    </div>

    <div class="home-right">
      <iframe
        src="/resume.html"
        class="resume-iframe"
        frameborder="0"
        loading="lazy"
        title="简历"
      />
    </div>
  </div>
</template>

<style scoped>
.home-layout {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 40px;
  padding: 48px 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
  align-items: start;
}

/* 左侧 */
.profile {
  margin-bottom: 32px;
}

.name {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--vp-c-brand-1);
  margin: 0 0 8px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
}

.tagline {
  font-size: 14px;
  color: var(--vp-c-text-2);
  margin: 0 0 20px;
}

.actions {
  display: flex;
  gap: 12px;
}

.action-button {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  background: var(--vp-c-brand-1);
  color: #fff;
  text-decoration: none;
  transition: background 0.2s;
}

.action-button:hover {
  background: var(--vp-c-brand-2);
}

/* 电子书卡片 */
.book-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.book-card {
  display: block;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.book-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(118, 47, 55, 0.1);
}

.book-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--vp-c-text-1);
}

.book-card p {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin: 0 0 12px;
  line-height: 1.6;
}

.book-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
}

/* 右侧简历 */
.resume-iframe {
  width: 100%;
  height: calc(100vh - 120px);
  min-height: 800px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 移动端回退为上下布局 */
@media (max-width: 768px) {
  .home-layout {
    grid-template-columns: 1fr;
    padding: 24px 16px;
  }

  .resume-iframe {
    height: 600px;
    min-height: auto;
  }
}
</style>
