import { createRenderer } from 'vue-server-renderer'
import { isBot } from '../utils/userAgent'
import { createSSRApp } from 'vue'
import App from '../../App.vue'

const renderer = createRenderer()

export default async function dynamicRenderer(req, res, next) {
  try {
    // 检查是否是搜索引擎爬虫
    if (isBot(req.headers['user-agent'])) {
      // 为爬虫创建预渲染版本
      const app = createSSRApp(App)
      const html = await renderer.renderToString(app)
      
      // 注入 meta 信息
      const finalHtml = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${app.$meta?.title || 'Photo Song'}</title>
            <meta name="description" content="${app.$meta?.description || ''}">
            ${app.$meta?.schema ? `<script type="application/ld+json">${JSON.stringify(app.$meta.schema)}</script>` : ''}
          </head>
          <body>
            ${html}
          </body>
        </html>
      `
      
      res.send(finalHtml)
    } else {
      // 普通用户使用客户端渲染
      next()
    }
  } catch (error) {
    console.error('Dynamic rendering error:', error)
    next()
  }
} 