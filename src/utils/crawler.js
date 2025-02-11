// 常见爬虫 User Agent 列表
const CRAWLER_USER_AGENTS = [
  'Googlebot',
  'Baiduspider',
  'bingbot',
  'YandexBot',
  'Sogou',
  'DuckDuckBot',
  '360Spider',
  'Bytespider',
  'AdsBot-Google',
  'APIs-Google',
  'Mediapartners-Google',
  'AdsBot-Google-Mobile',
  'facebookexternalhit',
  'LinkedInBot',
  'Twitterbot',
  'WhatsApp',
  'TelegramBot'
]

/**
 * 检查是否是爬虫请求
 * @param {string} userAgent - 请求的 User-Agent
 * @returns {boolean} 是否是爬虫
 */
export function isCrawler(userAgent) {
  if (!userAgent) return false
  
  // 转换为小写进行比较
  const ua = userAgent.toLowerCase()
  
  return CRAWLER_USER_AGENTS.some(crawler => 
    ua.includes(crawler.toLowerCase()) || 
    ua.includes('bot') || 
    ua.includes('spider')
  )
}

/**
 * 获取爬虫类型
 * @param {string} userAgent - 请求的 User-Agent
 * @returns {string|null} 爬虫类型
 */
export function getCrawlerType(userAgent) {
  if (!userAgent) return null
  
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('googlebot')) return 'google'
  if (ua.includes('baiduspider')) return 'baidu'
  if (ua.includes('bingbot')) return 'bing'
  if (ua.includes('yandexbot')) return 'yandex'
  if (ua.includes('bytespider')) return 'bytedance'
  if (ua.includes('360spider')) return '360'
  if (ua.includes('sogou')) return 'sogou'
  if (ua.includes('facebookexternalhit')) return 'facebook'
  if (ua.includes('linkedinbot')) return 'linkedin'
  if (ua.includes('twitterbot')) return 'twitter'
  if (ua.includes('whatsapp')) return 'whatsapp'
  if (ua.includes('telegrambot')) return 'telegram'
  
  // 其他爬虫
  if (ua.includes('bot') || ua.includes('spider')) return 'other'
  
  return null
}

/**
 * 检查是否是移动端爬虫
 * @param {string} userAgent - 请求的 User-Agent
 * @returns {boolean} 是否是移动端爬虫
 */
export function isMobileCrawler(userAgent) {
  if (!userAgent) return false
  
  const ua = userAgent.toLowerCase()
  return ua.includes('mobile') && isCrawler(ua)
} 