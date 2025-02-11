import { ref } from 'vue'
import AV from 'leancloud-storage'
import i18n from '../i18n'

const { t } = i18n.global

// 敏感词列表
const sensitiveWords = [
  'fuck',
  'shit',
  // ... 其他敏感词
]

// 内容审核状态
export const moderationStatus = ref({
  isPending: false,
  error: null
})

// 检查文本是否包含敏感词
const containsSensitiveWords = (text) => {
  if (!text) return false
  return sensitiveWords.some(word => 
    text.toLowerCase().includes(word.toLowerCase())
  )
}

// 文本内容审核
export const moderateText = async (text, type = 'general') => {
  if (!text) return { isValid: true, text }
  
  try {
    moderationStatus.value.isPending = true
    moderationStatus.value.error = null
    
    // 检查敏感词
    if (containsSensitiveWords(text)) {
      throw new Error(t('moderation.error.sensitiveContent'))
    }
    
    // 根据内容类型进行不同的验证
    switch (type) {
      case 'username':
        if (text.length < 2 || text.length > 20) {
          throw new Error(t('moderation.error.invalidLength'))
        }
        if (!/^[\w\u4e00-\u9fa5]+$/.test(text)) {
          throw new Error(t('moderation.error.invalidChars'))
        }
        break
        
      case 'bio':
        if (text.length > 200) {
          throw new Error(t('moderation.error.bioTooLong'))
        }
        if (/[<>]/.test(text)) {
          throw new Error(t('moderation.error.invalidChars'))
        }
        break
        
      default:
        // 通用文本验证
        if (text.length > 1000) {
          throw new Error(t('moderation.error.textTooLong'))
        }
        break
    }
    
    // 清理文本
    const cleanText = text
      .trim()
      .replace(/[^\w\s\u4e00-\u9fa5.,!?，。！？]/g, '')
    
    return { isValid: true, text: cleanText }
  } catch (error) {
    console.error('Content moderation failed:', error)
    moderationStatus.value.error = error.message
    return { isValid: false, error: error.message }
  } finally {
    moderationStatus.value.isPending = false
  }
}

// 图片内容审核
export const moderateImage = async (file) => {
  try {
    moderationStatus.value.isPending = true
    moderationStatus.value.error = null
    
    // 验证文件类型
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      throw new Error(t('moderation.error.invalidImageType'))
    }
    
    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(t('moderation.error.imageTooLarge'))
    }
    
    // 上传到 LeanCloud 进行存储和审核
    const avFile = new AV.File(file.name, file)
    await avFile.save()
    
    return { isValid: true, file: avFile }
  } catch (error) {
    console.error('Image moderation failed:', error)
    moderationStatus.value.error = error.message
    return { isValid: false, error: error.message }
  } finally {
    moderationStatus.value.isPending = false
  }
}

// 导出审核函数
export const contentModeration = {
  moderateText,
  moderateImage,
  moderationStatus
} 