<template>
  <div class="resume-embed">
    <iframe
      src="/resume.html"
      class="resume-iframe"
      frameborder="0"
      loading="lazy"
      title="简历"
    />
  </div>
</template>

<style scoped>
.resume-embed {
  width: 100%;
  margin: 0 auto;
  padding: 24px 0;
}

.resume-iframe {
  width: 100%;
  max-width: 800px;
  height: 1100px;
  margin: 0 auto;
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
