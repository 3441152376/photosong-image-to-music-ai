import express from 'express'
import { generateSitemap, generateRobotsTxt } from './sitemap'
import { cacheControl } from './middleware'

const router = express.Router()

// 缓存配置
const CACHE_DURATION = {
  sitemap: 60 * 60, // 1小时
  robots: 24 * 60 * 60 // 24小时
}

let sitemapCache = null
let lastSitemapUpdate = 0
let urlCount = 0

// 支持的语言列表
const SUPPORTED_LANGUAGES = ['en', 'zh', 'ru']

// 获取站点地图状态
router.get('/api/sitemap/status', async (req, res) => {
  try {
    // 检查服务器状态
    if (!global.server || !global.server.isReady) {
      return res.status(503).json({
        success: false,
        error: 'server_not_ready',
        message: '服务器正在启动中，请稍后再试'
      })
    }

    res.json({
      success: true,
      lastUpdate: lastSitemapUpdate,
      urlCount: urlCount,
      status: sitemapCache ? 'ready' : 'not_generated'
    })
  } catch (error) {
    console.error('获取站点地图状态失败:', error)
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: error.message || '服务器内部错误'
    })
  }
})

// 生成站点地图
router.get('/api/sitemap/generate', async (req, res) => {
  try {
    // 检查服务器状态
    if (!global.server || !global.server.isReady) {
      return res.status(503).json({
        success: false,
        error: 'server_not_ready',
        message: '服务器正在启动中，请稍后再试'
      })
    }

    const lang = req.query.lang
    
    // 验证语言参数
    if (lang && !SUPPORTED_LANGUAGES.includes(lang)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_language',
        message: `不支持的语言: ${lang}. 支持的语言: ${SUPPORTED_LANGUAGES.join(', ')}`
      })
    }

    // 检查是否有正在进行的生成任务
    if (global.isGeneratingSitemap) {
      return res.status(429).json({
        success: false,
        error: 'generation_in_progress',
        message: '站点地图正在生成中，请稍后再试'
      })
    }

    global.isGeneratingSitemap = true

    try {
      // 生成站点地图
      sitemapCache = await generateSitemap(lang)
      lastSitemapUpdate = Date.now()
      
      // 计算URL数量
      urlCount = (sitemapCache.match(/<url>/g) || []).length

      res.json({
        success: true,
        lastUpdate: lastSitemapUpdate,
        urlCount: urlCount,
        message: '站点地图生成成功'
      })
    } finally {
      global.isGeneratingSitemap = false
    }
  } catch (error) {
    console.error('生成站点地图失败:', error)
    
    // 根据错误类型返回不同的错误信息
    if (error.code === 'ENOENT') {
      res.status(404).json({
        success: false,
        error: 'file_not_found',
        message: '找不到必要的文件'
      })
    } else if (error.code === 'EACCES') {
      res.status(403).json({
        success: false,
        error: 'permission_denied',
        message: '没有足够的权限'
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'generation_failed',
        message: error.message || '生成站点地图失败'
      })
    }
  }
})

// sitemap.xml 路由
router.get('/sitemap.xml', cacheControl(CACHE_DURATION.sitemap), async (req, res) => {
  try {
    const lang = req.query.lang

    // 如果缓存不存在或已过期，重新生成
    if (!sitemapCache || Date.now() - lastSitemapUpdate > CACHE_DURATION.sitemap * 1000) {
      if (global.isGeneratingSitemap) {
        return res.status(429).json({
          success: false,
          error: 'generation_in_progress',
          message: '站点地图正在生成中，请稍后再试'
        })
      }

      global.isGeneratingSitemap = true
      try {
        sitemapCache = await generateSitemap(lang)
        lastSitemapUpdate = Date.now()
        urlCount = (sitemapCache.match(/<url>/g) || []).length
      } finally {
        global.isGeneratingSitemap = false
      }
    }
    
    // 设置正确的内容类型和字符编码
    res.header('Content-Type', 'application/xml; charset=utf-8')
    res.header('Cache-Control', 'public, max-age=3600')
    
    // 确保XML声明存在
    if (!sitemapCache.trim().startsWith('<?xml')) {
      sitemapCache = '<?xml version="1.0" encoding="UTF-8"?>\n' + sitemapCache
    }
    
    res.send(sitemapCache)
  } catch (error) {
    console.error('获取站点地图失败:', error)
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: error.message || '获取站点地图失败'
    })
  }
})

// robots.txt 路由
router.get('/robots.txt', cacheControl(CACHE_DURATION.robots), (req, res) => {
  try {
    const robotsTxt = generateRobotsTxt()
    res.header('Content-Type', 'text/plain')
    res.send(robotsTxt)
  } catch (error) {
    console.error('获取 robots.txt 失败:', error)
    res.status(500).send('Internal Server Error')
  }
})

export default router 