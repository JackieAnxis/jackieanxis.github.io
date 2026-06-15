<template>
  <main class="home-layout">
    <section class="gallery-showcase" aria-labelledby="gallery-title">
      <div class="gallery-layout">
        <div class="bookshelf-panel">
          <div ref="shelfStageRef" class="shelf-stage">
            <div
              class="bookshelf"
              :style="{
                '--featured-book-count': featuredBooks.length,
                '--visible-placeholder-count': visiblePlaceholderCount,
              }"
            >
              <div class="shelf-object statue-object" aria-hidden="true">
                <img
                  class="shelf-statue"
                  src="/assets/statue.png"
                  alt=""
                  loading="eager"
                >
              </div>

              <a
                v-for="book in featuredBooks"
                :key="book.id"
                class="book-card spine"
                :href="book.href"
                @mouseenter="activeBookId = book.id"
                @focus="activeBookId = book.id"
              >
                <img
                  :src="book.spineUrl"
                  :alt="book.spineAlt"
                  loading="eager"
                >
              </a>

              <div
                v-for="placeholder in visiblePlaceholders"
                :key="placeholder"
                class="book-card placeholder"
                aria-label="电子书占位"
              >
                <span class="placeholder-title">敬请期待</span>
                <span class="placeholder-status">创作中</span>
              </div>
            </div>
          </div>
        </div>

        <aside class="gallery-detail" aria-live="polite">
          <a class="gallery-cover-link" :href="activeBook.href">
            <img
              class="gallery-cover"
              :src="activeBook.coverUrl"
              :alt="activeBook.coverAlt"
            >
          </a>
          <div class="gallery-copy">
            <h1 id="gallery-title">{{ activeBook.title }}</h1>
            <p class="gallery-subtitle">{{ activeBook.subtitle }}</p>
            <p class="gallery-description">{{ activeBook.description }}</p>
            <div class="gallery-tags" aria-label="书籍主题">
              <span v-for="tag in activeBook.tags" :key="tag">{{ tag }}</span>
            </div>
            <a class="gallery-link" :href="activeBook.href">进入阅读</a>
          </div>
        </aside>
      </div>

      <div class="gallery-list" aria-label="已撰写书籍">
        <article
          v-for="book in featuredBooks"
          :key="book.id"
          class="gallery-item"
        >
          <img
            class="gallery-item-cover"
            :src="book.coverUrl"
            :alt="book.coverAlt"
          >
          <div class="gallery-item-copy">
            <p class="gallery-kicker">电子书展品</p>
            <h2>{{ book.title }}</h2>
            <p class="gallery-subtitle">{{ book.subtitle }}</p>
            <p class="gallery-description">{{ book.description }}</p>
            <div class="gallery-tags" aria-label="书籍主题">
              <span v-for="tag in book.tags" :key="tag">{{ tag }}</span>
            </div>
            <a class="gallery-link" :href="book.href">进入阅读</a>
          </div>
        </article>
      </div>
    </section>

    <footer class="home-footer">
      <span>© 2026 潘嘉铖</span>
      <a href="mailto:jackieanxis@gmail.com">jackieanxis@gmail.com</a>
      <a href="https://github.com/JackieAnxis/jackieanxis.github.io" target="_blank" rel="noreferrer">
        GitHub
      </a>
    </footer>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const featuredBooks = [
  {
    id: "agent-revelations",
    title: "Agent 启示录",
    subtitle: "Agent Revelations",
    description: "以 Claude Code 为例理解智能体原理，拆解智能体架构、工具调用、记忆与上下文，以及规划和执行如何共同构成可持续工作的系统。",
    href: "/agent-revelations/",
    coverUrl: "/assets/agent-revelations-cover.png",
    coverAlt: "《Agent 启示录》封面",
    spineUrl: "/assets/agent-revelations-spine.png",
    spineAlt: "《Agent 启示录》书脊",
    tags: ["智能体架构", "工具调用", "记忆与上下文", "规划与执行"],
  },
];

const maxPlaceholderCount = 9;
const activeBookId = ref(featuredBooks[0]?.id ?? "");
const visiblePlaceholderCount = ref(maxPlaceholderCount);
const shelfStageRef = ref(null);

let resizeObserver;

const visiblePlaceholders = computed(() => (
  Array.from({ length: visiblePlaceholderCount.value }, (_, index) => index)
));

const activeBook = computed(() => (
  featuredBooks.find((book) => book.id === activeBookId.value) ?? featuredBooks[0]
));

const getShelfMetrics = () => {
  if (window.matchMedia("(max-width: 640px)").matches) {
    return {
      fixedWidth: 69 + 56,
      placeholderWidth: 88,
    };
  }

  if (window.matchMedia("(max-width: 960px) and (orientation: landscape)").matches) {
    return {
      fixedWidth: 53 + 52,
      placeholderWidth: 60,
    };
  }

  if (window.matchMedia("(max-width: 1200px)").matches) {
    return {
      fixedWidth: 85 + 72,
      placeholderWidth: 68,
    };
  }

  return {
    fixedWidth: 107 + 72,
    placeholderWidth: 96,
  };
};

const updateVisiblePlaceholderCount = () => {
  const stageWidth = shelfStageRef.value?.clientWidth;

  if (!stageWidth) {
    visiblePlaceholderCount.value = maxPlaceholderCount;
    return;
  }

  const { fixedWidth, placeholderWidth } = getShelfMetrics();
  const shelfGap = 1;
  const availableWidth = Math.max(placeholderWidth + shelfGap, stageWidth - fixedWidth);
  visiblePlaceholderCount.value = Math.max(
    1,
    Math.min(maxPlaceholderCount, Math.floor(availableWidth / (placeholderWidth + shelfGap))),
  );
};

onMounted(() => {
  updateVisiblePlaceholderCount();

  if ("ResizeObserver" in window && shelfStageRef.value) {
    resizeObserver = new ResizeObserver(updateVisiblePlaceholderCount);
    resizeObserver.observe(shelfStageRef.value);
  }

  window.addEventListener("resize", updateVisiblePlaceholderCount);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", updateVisiblePlaceholderCount);
});
</script>

<style scoped>
.home-layout {
  --book-spine-height: 420px;
  --book-placeholder-height: calc(var(--book-spine-height) * 0.72);
  --shelf-stage-top-padding: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(18px, 3vw, 30px);
  place-items: center;
  width: min(1180px, calc(100vw - 48px));
  margin: 0 auto;
  padding: clamp(10px, 2vw, 20px) 0;
}

.gallery-showcase {
  width: 100%;
}

.gallery-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
  gap: clamp(28px, 4vw, 56px);
  align-items: start;
  width: 100%;
}

.bookshelf-panel {
  min-width: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.home-footer {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  align-items: center;
  justify-content: center;
  padding-top: 24px;
  border-top: 1px solid rgba(216, 210, 199, 0.75);
  color: var(--vp-c-text-3);
  font-size: 14px;
  line-height: 1.6;
}

.home-footer a {
  color: var(--vp-c-brand-1);
  font-weight: 700;
  text-decoration: none;
}

.home-footer a:hover {
  color: var(--vp-c-brand-2);
}

.gallery-detail {
  position: relative;
  display: grid;
  grid-template-columns: minmax(118px, 0.72fr) minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  height: calc(var(--book-spine-height) + 16px);
  margin-top: var(--shelf-stage-top-padding);
  padding: 20px;
  background: rgba(255, 253, 248, 0.74);
  box-shadow:
    0 20px 44px rgba(54, 44, 30, 0.12),
    inset 0 0 0 1px rgba(211, 200, 181, 0.7);
}

.gallery-detail::before {
  content: "";
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(188, 143, 58, 0.22);
  pointer-events: none;
}

.gallery-cover,
.gallery-item-cover {
  display: block;
  width: 100%;
  height: auto;
  box-shadow: 0 18px 30px rgba(37, 27, 18, 0.2);
}

.gallery-copy,
.gallery-item-copy {
  position: relative;
  z-index: 1;
}

.gallery-kicker {
  margin: 0;
  color: #a37a2c;
  font-size: 13px;
  font-weight: 700;
}

.gallery-copy h1,
.gallery-item-copy h2 {
  margin: 8px 0 0;
  color: var(--vp-c-text-1);
  font-size: clamp(24px, 2.4vw, 34px);
  line-height: 1.18;
  letter-spacing: 0;
}

.gallery-subtitle {
  margin: 6px 0 0;
  color: #9b1d1d;
  font-size: 15px;
  font-weight: 700;
}

.gallery-description {
  margin: 14px 0 0;
  color: var(--vp-c-text-2);
  font-size: 15px;
  line-height: 1.75;
}

.gallery-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.gallery-tags span {
  padding: 4px 8px;
  border: 1px solid rgba(176, 132, 45, 0.28);
  color: #7c6539;
  background: rgba(255, 249, 238, 0.66);
  font-size: 12px;
  line-height: 1.4;
}

.gallery-link {
  display: inline-flex;
  margin-top: 18px;
  color: #9b1d1d;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
}

.gallery-link::after {
  content: "→";
  margin-left: 8px;
}

.gallery-link:hover {
  color: #b8872f;
}

.gallery-list {
  display: none;
}

.shelf-stage {
  position: relative;
  isolation: isolate;
  width: 100%;
  display: flex;
  justify-content: center;
  overflow: visible;
  min-height: calc(var(--book-spine-height) + 74px);
  padding: var(--shelf-stage-top-padding) 0 48px;
}

.shelf-stage::after {
  content: "";
  position: absolute;
  right: 2%;
  bottom: 0;
  left: 8%;
  z-index: -2;
  height: 26px;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(58, 49, 36, 0.22), rgba(58, 49, 36, 0));
  filter: blur(8px);
}

.shelf-statue {
  display: block;
  width: min(107px, 100%);
  max-height: var(--book-spine-height);
  object-fit: contain;
  opacity: 0.82;
  filter: drop-shadow(0 14px 18px rgba(64, 54, 40, 0.14));
  pointer-events: none;
}

.bookshelf {
  position: relative;
  z-index: 1;
  isolation: isolate;
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: minmax(84px, 107px) repeat(var(--featured-book-count), max-content) repeat(var(--visible-placeholder-count), minmax(64px, 96px));
  width: max-content;
  margin: 0 auto;
  gap: 1px;
  align-items: end;
  justify-content: end;
  padding: 0 0 16px;
}

.bookshelf::before {
  content: "";
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;
  height: 24px;
  border: 0;
  background: #f8f6f1;
  box-shadow:
    0 14px 24px rgba(62, 52, 38, 0.16),
    0 3px 8px rgba(62, 52, 38, 0.08),
    inset 0 2px 0 rgba(255, 255, 255, 0.92),
    inset 0 -6px 10px rgba(124, 111, 91, 0.16);
}

.shelf-object {
  display: flex;
  align-items: end;
  justify-content: flex-start;
  height: var(--book-spine-height);
}

.book-card {
  position: relative;
  display: flex;
  overflow: hidden;
  height: var(--book-placeholder-height);
  border-radius: 6px;
  text-decoration: none;
}

.book-card.spine {
  display: block;
  justify-self: center;
  width: fit-content;
  height: auto;
  box-shadow: 0 18px 32px rgba(35, 22, 15, 0.24);
  transition: transform 0.2s, box-shadow 0.2s;
}

.book-card.spine:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 42px rgba(35, 22, 15, 0.28);
}

.book-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-card.spine img {
  display: block;
  width: auto;
  height: var(--book-spine-height);
  object-fit: contain;
}

.book-card.placeholder {
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  padding: 34px 12px;
  border: 2px dashed #d2b98d;
  background: rgba(255, 253, 247, 0.62);
  color: var(--vp-c-text-2);
  box-shadow:
    10px 14px 18px rgba(54, 44, 30, 0.08),
    inset -10px 0 16px rgba(122, 97, 63, 0.08);
}

.book-card.placeholder::before,
.book-card.placeholder::after {
  content: "";
  width: 42px;
  height: 1px;
  background: #bd8d35;
}

.placeholder-title {
  writing-mode: vertical-rl;
  white-space: nowrap;
  word-break: keep-all;
  color: var(--vp-c-text-2);
  font-size: 22px;
  line-height: 1.4;
}

.placeholder-status {
  writing-mode: vertical-rl;
  white-space: nowrap;
  word-break: keep-all;
  color: var(--vp-c-text-3);
  font-size: 14px;
}

@media (max-width: 960px) {
  .home-layout {
    align-items: start;
    min-height: auto;
  }

  .gallery-layout {
    grid-template-columns: 1fr;
  }

  .gallery-detail {
    display: none;
  }

  .gallery-list {
    display: grid;
    gap: 22px;
    margin-top: 10px;
  }

  .gallery-item {
    display: grid;
    grid-template-columns: minmax(110px, 180px) minmax(0, 1fr);
    gap: 18px;
    align-items: center;
    padding: 18px;
    background: rgba(255, 253, 248, 0.74);
    box-shadow:
      0 18px 36px rgba(54, 44, 30, 0.1),
      inset 0 0 0 1px rgba(211, 200, 181, 0.68);
  }
}

@media (max-width: 1200px) and (min-width: 961px) {
  .home-layout {
    width: min(100% - 40px, 1120px);
  }

  .bookshelf {
    grid-template-columns: minmax(75px, 85px) repeat(var(--featured-book-count), max-content) repeat(var(--visible-placeholder-count), minmax(52px, 68px));
    gap: 1px;
  }

  .shelf-statue {
    width: min(85px, 100%);
  }
}

@media (max-width: 960px) and (orientation: landscape) {
  .home-layout {
    --book-spine-height: 300px;
    --book-placeholder-height: calc(var(--book-spine-height) * 0.72);
    --shelf-stage-top-padding: 16px;
    align-items: center;
    width: min(100% - 32px, 980px);
    padding: clamp(7px, 1.5vw, 12px) 0;
  }

  .bookshelf {
    grid-template-columns: 53px repeat(var(--featured-book-count), max-content) repeat(var(--visible-placeholder-count), minmax(48px, 60px));
    gap: 1px;
  }

  .shelf-stage {
    min-height: calc(var(--book-spine-height) + 54px);
  }

  .shelf-statue {
    width: 53px;
  }
}

@media (max-width: 640px) {
  .home-layout {
    --book-spine-height: 320px;
    --book-placeholder-height: 230px;
    --shelf-stage-top-padding: 18px;
    width: min(100% - 32px, 560px);
    padding: 24px 0 40px;
  }

  .bookshelf {
    grid-template-columns: 69px repeat(var(--featured-book-count), max-content) repeat(var(--visible-placeholder-count), 88px);
    justify-content: end;
    margin: 0 auto;
    gap: 1px;
    padding-bottom: 14px;
  }

  .shelf-stage {
    display: block;
    min-height: auto;
    padding: var(--shelf-stage-top-padding) 0 34px;
  }

  .shelf-statue {
    width: 69px;
  }

  .book-card.spine {
    height: var(--book-spine-height);
  }

  .book-card.placeholder {
    min-width: 88px;
    height: var(--book-placeholder-height);
    padding: 28px 10px;
  }

  .placeholder-title {
    font-size: 20px;
  }

  .gallery-item {
    grid-template-columns: 1fr;
  }

  .gallery-item-cover {
    width: min(220px, 100%);
    margin: 0 auto;
  }

  .gallery-copy h1,
  .gallery-item-copy h2 {
    font-size: 26px;
  }
}
</style>
