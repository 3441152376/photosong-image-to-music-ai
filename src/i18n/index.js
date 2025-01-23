import { createI18n } from 'vue-i18n'
import en from '../locales/en'
import zh from '../locales/zh'
import ru from '../locales/ru'

const i18n = createI18n({
  legacy: false, // Enable Composition API mode
  globalInjection: true, // Enable global injection
  locale: localStorage.getItem('language') || 'zh', // 默认语言
  fallbackLocale: 'en', // 备用语言
  messages: {
    en,
    zh,
    ru
  },
  allowComposition: true,
  useScope: 'global'
})

export default i18n 