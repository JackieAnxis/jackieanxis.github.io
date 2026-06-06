<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const titleText = ref(null)
let dividerElement = null

onMounted(async () => {
  await nextTick()

  const navTitle = titleText.value?.closest('.VPNavBarTitle')
  if (!navTitle || navTitle.querySelector(':scope > .nav-title-divider')) {
    return
  }

  dividerElement = document.createElement('div')
  dividerElement.className = 'nav-title-divider'
  dividerElement.setAttribute('aria-hidden', 'true')
  navTitle.appendChild(dividerElement)
})

onBeforeUnmount(() => {
  dividerElement?.remove()
  dividerElement = null
})
</script>

<template>
  <span ref="titleText" class="dynamic-nav-title">Jiacheng's Library</span>
</template>

<style scoped>
.dynamic-nav-title {
  font-size: 14px;
  font-weight: 700;
  color: #762f37;
  white-space: nowrap;
}
</style>
