/**
 * 确保 URL 使用 HTTPS
 * @param {string} url - 需要处理的 URL
 * @returns {string} - 处理后的 URL
 */
export const ensureHttps = (url) => {
  if (!url) return ''
  return url.replace(/^http:/, 'https:')
}

/**
 * 处理 LeanCloud 文件 URL
 * @param {string} url - LeanCloud 文件 URL
 * @returns {string} - 处理后的 URL
 */
export const processLeanCloudUrl = (url) => {
  if (!url) return ''
  
  // 确保使用 HTTPS
  let processedUrl = url.replace(/^http:\/\/lc-[^/]+\.cn-n1\.lcfile\.com/,
    'https://lc-$1.cn-n1.lcfile.com')
  
  // 如果还是以 http:// 开头，直接替换为 https://
  processedUrl = processedUrl.replace(/^http:/, 'https:')
  
  // 处理特殊字符
  processedUrl = processedUrl.replace(/…/g, '%E2%80%A6')
  
  return processedUrl
}

/**
 * 获取图片的缩略图 URL
 * @param {string} url - 原始图片 URL
 * @param {Object} options - 缩略图选项
 * @returns {string} - 缩略图 URL
 */
export const getThumbnailUrl = (url, options = {}) => {
  if (!url) return ''
  
  const {
    width = 200,
    height = 200,
    quality = 80,
    format = 'webp'
  } = options
  
  let processedUrl = processLeanCloudUrl(url)
  
  // 添加缩略图参数
  if (processedUrl.includes('lcfile.com')) {
    processedUrl += `?imageView2/1/w/${width}/h/${height}/q/${quality}/format/${format}`
  }
  
  return processedUrl
}

/**
 * 验证图片 URL
 * @param {string} url - 需要验证的 URL
 * @returns {boolean} - 是否是有效的图片 URL
 */
export const isValidImageUrl = (url) => {
  if (!url) return false
  
  // 检查是否是允许的域名
  const allowedDomains = [
    'lcfile.com',
    'photosong.com'
  ]
  
  try {
    const urlObj = new URL(url)
    return allowedDomains.some(domain => urlObj.hostname.includes(domain))
  } catch {
    return false
  }
} 