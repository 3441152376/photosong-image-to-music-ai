import { createI18n } from 'vue-i18n'
import en from '../locales/en'
import zh from '../locales/zh'
import ru from '../locales/ru'

// 支持的语言列表
export const supportedLocales = ['en', 'zh', 'ru']

const i18n = createI18n({
  legacy: false, // Enable Composition API mode
  globalInjection: true, // Enable global injection
  locale: localStorage.getItem('language') || 'zh', // Default language
  fallbackLocale: 'en', // Fallback language
  messages: {
    en,
    zh,
    ru
  },
  allowComposition: true,
  useScope: 'global',
  flatJson: false, // Allow nested objects and arrays
  warnHtmlInMessage: 'off',
  escapeParameterHtml: false,
  missingWarn: false, // Disable missing translation warnings
  fallbackWarn: false, // Disable fallback warnings
  disableVt: true  // 禁用 v-t 指令
})

export default i18n 