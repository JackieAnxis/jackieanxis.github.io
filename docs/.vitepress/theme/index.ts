import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import 'katex/dist/katex.min.css'
import './custom.css'
import ResumeEmbed from '../components/ResumeEmbed.vue'
import HomePage from '../components/HomePage.vue'
import DynamicNavTitle from '../components/DynamicNavTitle.vue'
import CodeWrapToggle from '../components/CodeWrapToggle.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ResumeEmbed', ResumeEmbed)
    app.component('HomePage', HomePage)
  },
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-title-after': () => h(DynamicNavTitle),
      'layout-bottom': () => h(CodeWrapToggle),
    })
  },
}
