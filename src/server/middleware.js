// 缓存控制中间件
export const cacheControl = (maxAge) => (req, res, next) => {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}`)
  next()
}

// 语言检测中间件
export const detectLanguage = (req, res, next) => {
  const supportedLanguages = ['en', 'zh']
  const defaultLanguage = 'en'
  
  // 从 URL 路径中提取语言代码
  const urlLang = req.path.split('/')[1]
  
  // 从请求头中获取首选语言
  const acceptLanguage = req.headers['accept-language']
  let preferredLang = defaultLanguage
  
  if (acceptLanguage) {
    const langs = acceptLanguage.split(',')
    for (let lang of langs) {
      const code = lang.split(';')[0].substring(0, 2)
      if (supportedLanguages.includes(code)) {
        preferredLang = code
        break
      }
    }
  }
  
  // 如果 URL 中的语言有效，使用它
  if (supportedLanguages.includes(urlLang)) {
    req.language = urlLang
  } else {
    req.language = preferredLang
  }
  
  next()
} 