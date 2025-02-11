import { generateWorksSitemap } from '../utils/sitemap'
import { useI18n } from 'vue-i18n'

export const generateUniqueDescription = (work) => {
  const { t } = useI18n()
  
  // 根据作品特征生成独特描述
  const descriptions = [
    `${work.title} - ${t('content.uniqueCreation')}`,
    `${t('content.inspiredBy')} ${work.imageDescription || t('content.visualElements')}`,
    work.tags?.map(tag => `#${tag}`).join(' ') || '',
    work.description || ''
  ].filter(Boolean)

  return descriptions.join('. ')
}

export const generateArticleContent = (article) => {
  // 为文章生成独特的段落和标题
  return {
    title: article.title,
    content: article.content,
    summary: article.summary || article.content.substring(0, 160),
    readingTime: Math.ceil(article.content.split(' ').length / 200),
    publishDate: new Date(article.createdAt).toISOString(),
    modifiedDate: new Date(article.updatedAt).toISOString()
  }
}

export const enrichMetadata = (route, meta) => {
  // 动态生成每个页面的元数据
  return {
    ...meta,
    modifiedTime: new Date().toISOString(),
    author: meta.author || 'Photo Song Team',
    section: route.meta.section || 'music',
    tags: [...(meta.keywords || []), ...(route.meta.keywords || [])],
    locale: route.params.lang || 'en'
  }
}
