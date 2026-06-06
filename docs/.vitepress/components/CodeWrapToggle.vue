<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

function handleToggle(e: MouseEvent) {
  const btn = e.currentTarget as HTMLButtonElement
  const block = btn.closest<HTMLDivElement>("div[class*='language-']")
  if (!block) return
  const isWrapped = block.hasAttribute('data-wrap')
  if (isWrapped) {
    block.removeAttribute('data-wrap')
    btn.className = 'code-wrap-toggle nowrap'
    btn.title = '切换为自动换行'
  } else {
    block.setAttribute('data-wrap', '')
    btn.className = 'code-wrap-toggle wrapped'
    btn.title = '切换为不换行'
  }
  btn.blur()
}

function injectButtons() {
  const blocks = document.querySelectorAll<HTMLDivElement>(
    ".vp-doc div[class*='language-']"
  )
  blocks.forEach((block) => {
    if (block.querySelector('.code-wrap-toggle')) return
    const btn = document.createElement('button')
    btn.className = 'code-wrap-toggle nowrap'
    btn.title = '切换为自动换行'
    btn.addEventListener('click', handleToggle)
    block.appendChild(btn)
  })
}

let observer: MutationObserver | null = null

onMounted(() => {
  injectButtons()
  observer = new MutationObserver(injectButtons)
  observer.observe(document.body, { childList: true, subtree: true })
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <!-- 无可见 DOM，通过 MutationObserver 注入按钮 -->
</template>
