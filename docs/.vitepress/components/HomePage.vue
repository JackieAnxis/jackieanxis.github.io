<template>
  <div class="home-layout">
    <div class="home-left">
      <div class="book-cards">
        <a class="book-card" href="/llm-for-everyone/00-neural_network/00-overview">
          <h3>大模型入门</h3>
          <p>面向所有人的大语言模型入门教程。从最基础的神经网络概念出发，逐步深入到大模型的推理与预训练过程，无需机器学习背景即可阅读。</p>
          <span class="book-link">开始阅读 →</span>
        </a>
      </div>
    </div>

    <div class="home-right">
      <div class="resume-wrapper">
        <a class="download-btn" href="/resume.pdf" target="_blank">
          下载 PDF
        </a>
        <iframe
          src="/resume.html"
          class="resume-iframe"
          frameborder="0"
          loading="lazy"
          title="简历"
        />
      </div>
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
.resume-wrapper {
  position: relative;
}

.download-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: rgba(251, 250, 246, 0.9);
  color: var(--vp-c-brand-1);
  text-decoration: none;
  border: 1px solid var(--vp-c-divider);
  backdrop-filter: blur(4px);
  transition: background 0.2s, color 0.2s;
}

.download-btn:hover {
  background: var(--vp-c-brand-1);
  color: #fff;
}

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
