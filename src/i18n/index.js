import { createI18n } from 'vue-i18n'
import en from '@/locales/en'
import zh from '@/locales/zh'
import ru from '@/locales/ru'

// 支持的语言列表
export const supportedLocales = ['zh', 'en', 'ru']

// 深拷贝函数
function deepClone(obj) {
  try {
    return structuredClone(obj)
  } catch (error) {
    try {
      return JSON.parse(JSON.stringify(obj))
    } catch (jsonError) {
      return obj
    }
  }
}

// 安全获取嵌套对象值的函数
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined
  try {
    return path.split('.').reduce((o, i) => (o && typeof o === 'object' ? o[i] : undefined), obj)
  } catch (error) {
    return undefined
  }
}

// 处理翻译数据
function processTranslations(translations) {
  if (!translations || typeof translations !== 'object') {
    return {}
  }

  try {
    const processed = deepClone(translations)
    return processed
  } catch (error) {
    return translations
  }
}

// 检查必需的翻译键
function checkRequiredTranslations(translations, locale) {
  const requiredKeys = [
    'profile.user.gender.label',
    'profile.user.gender.placeholder',
    'profile.user.gender.notSpecified',
    'profile.user.gender.male',
    'profile.user.gender.female',
    'profile.user.gender.other',
    'profile.user.gender.nonBinary',
    'profile.user.gender.alien',
    'profile.user.gender.toaster',
    'profile.user.gender.dinosaur',
    'profile.user.gender.robot',
    'profile.user.gender.ghost',
    'profile.user.gender.unicorn',
    'profile.user.gender.livingMeme',
    'profile.user.gender.catPerson',
    'profile.user.gender.dogPerson',
    'profile.user.gender.attackHelicopter',
    'profile.user.gender.stillLoading',
    'profile.user.gender.quantumSuperposition',
    'profile.user.gender.coffeeMachine',
    'profile.user.gender.walmartBag'
  ]

  const missingKeys = requiredKeys.filter(key => {
    const value = getNestedValue(translations, key)
    return !value
  })

  return missingKeys.length === 0
}

// 创建消息对象
export const messages = {
  en: processTranslations(en),
  zh: processTranslations(zh),
  ru: processTranslations(ru)
}

// 检查每个语言的必需翻译
Object.entries(messages).forEach(([locale, translations]) => {
  checkRequiredTranslations(translations, locale)
})

// 获取默认语言
const defaultLocale = (() => {
  const savedLocale = localStorage.getItem('language')
  if (savedLocale && messages[savedLocale]) {
    return savedLocale
  }
  
  const browserLocale = navigator.language.split('-')[0]
  if (messages[browserLocale]) {
    return browserLocale
  }
  
  return 'zh'
})()

// 创建i18n实例
const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages,
  missing: (locale, key) => {
    const foundTranslation = getNestedValue(messages[locale], key)
    if (foundTranslation) return foundTranslation
    
    const fallbackTranslation = getNestedValue(messages.en, key)
    if (fallbackTranslation) return fallbackTranslation
    
    // 如果都没找到，返回键名
    return key
  },
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  missingWarn: false,
  fallbackWarn: false
})

// 语言切换函数
export function setLanguage(lang) {
  if (!messages[lang]) {
    return false
  }
  
  try {
    i18n.global.locale.value = lang
    localStorage.setItem('language', lang)
    document.querySelector('html').setAttribute('lang', lang)
    checkRequiredTranslations(messages[lang], lang)
    return true
  } catch (error) {
    return false
  }
}

// 导出一个获取翻译的辅助函数
export function getTranslation(locale, path) {
  const translation = getNestedValue(messages[locale], path)
  if (!translation) {
    return getNestedValue(messages['en'], path) || path
  }
  return translation
}

export default i18n