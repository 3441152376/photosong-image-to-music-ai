import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'
import routes from '../router'
import { createPinia } from 'pinia'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class StaticGenerator {
  constructor(baseUrl = 'https://photosong.com') {
    this.baseUrl = baseUrl
    this.distPath = path.resolve(__dirname, '../../dist/static')
    this.template = ''
  }

  async initialize() {
    // 读取 index.html 模板
    const templatePath = path.resolve(__dirname, '../../dist/index.html')
    this.template = await fs.promises.readFile(templatePath, 'utf-8')
  }

  async generatePage(url, meta = {}) {
    // 创建 Vue 应用实例
    const app = createSSRApp({
      template: '<router-view></router-view>'
    })

    // 创建路由实例
    const router = createRouter({
      history: createMemoryHistory(),
      routes
    })

    // 创建 Pinia 实例
    const pinia = createPinia()

    app.use(router)
    app.use(pinia)

    // 导航到目标 URL
    await router.push(url)
    await router.isReady()

    // 渲染页面内容
    const content = await renderToString(app)

    // 注入 SEO 元数据
    const html = this.template
      .replace('<!--vue-ssr-outlet-->', content)
      .replace('</head>',
        `<meta name="description" content="${meta.description || ''}">\n` +
        `<meta name="keywords" content="${meta.keywords || ''}">\n` +
        `<link rel="canonical" href="${this.baseUrl}${url}">\n` +
        `</head>`
      )

    // 创建目标目录
    const targetDir = path.join(this.distPath, url)
    await fs.promises.mkdir(targetDir, { recursive: true })

    // 写入生成的 HTML
    const targetPath = path.join(targetDir, 'index.html')
    await fs.promises.writeFile(targetPath, html)

    return targetPath
  }

  async generateStaticPages(pages) {
    const results = {
      success: [],
      failed: []
    }

    for (const page of pages) {
      try {
        const targetPath = await this.generatePage(page.url, page.meta)
        results.success.push({
          url: page.url,
          path: targetPath
        })
      } catch (error) {
        results.failed.push({
          url: page.url,
          error: error.message
        })
      }
    }

    return results
  }
}

export async function generateStaticPages(pages, baseUrl) {
  const generator = new StaticGenerator(baseUrl)
  await generator.initialize()
  return await generator.generateStaticPages(pages)
}
