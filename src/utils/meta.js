import { useI18n } from 'vue-i18n'

export function getPageTitle(data, locale = 'zh') {
  const { t } = useI18n()
  
  // 根据路径类型返回不同标题
  if (data.type === 'work') {
    return t('work.meta.title', {
      title: data.title || t('work.defaultTitle'),
      author: data.author || t('work.defaultAuthor')
    })
  }
  
  if (data.type === 'profile') {
    return t('profile.meta.title', { username: data.username || 'User' })
  }
  
  // 默认返回主页标题
  return t('meta.title')
}

export function getPageDescription(data, locale = 'zh') {
  const { t } = useI18n()

  if (data.type === 'work') {
    return t('work.meta.description', {
      title: data.title || t('work.defaultTitle'),
      author: data.author || t('work.defaultAuthor'),
      style: data.style || t('work.defaultStyle')
    })
  }
  
  if (data.type === 'profile') {
    return t('profile.meta.description', { username: data.username || 'User' })
  }
  
  return t('meta.description')
}

export function getProfileMetaTitle(data = {}) {
  const { t } = useI18n()
  return t('profile.meta.title', { username: data.username || 'User' })
}

export function getProfileMetaDescription(data = {}) {
  const { t } = useI18n()
  return t('profile.meta.description', { username: data.username || 'User' })
} 