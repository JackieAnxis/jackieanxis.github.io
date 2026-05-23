<template>
  <div class="home-layout">
    <div class="resume-wrapper">
      <a class="download-btn" href="/resume.pdf" target="_blank">
        下载 PDF
      </a>
      <iframe
        src="/resume.html"
        class="resume-iframe"
        frameborder="0"
        scrolling="no"
        loading="lazy"
        title="简历"
      />
    </div>
  </div>
</template>

<style scoped>
.home-layout {
  padding: 0;
  max-width: 1000px;
  margin: 0 auto;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.resume-wrapper {
  position: relative;
  height: 100%;
  overflow: hidden;
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
  height: 100%;
  border: none;
}

@media (max-width: 768px) {
  .home-layout {
    padding: 0;
    height: auto;
  }

  .resume-wrapper {
    height: calc(100vh - 96px);
  }
}
</style>
