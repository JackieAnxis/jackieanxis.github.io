import DefaultTheme from 'vitepress/theme'
import 'katex/dist/katex.min.css'
import './custom.css'
import ResumeEmbed from '../components/ResumeEmbed.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ResumeEmbed', ResumeEmbed)
  },
}
