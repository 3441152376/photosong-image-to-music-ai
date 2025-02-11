import { updateStaticPages } from './update-static-pages.js'
import { updateDynamicPages } from './update-dynamic-pages.js'
import express from 'express'
import { expressSeoMiddleware } from '../src/middleware/seo.js'
import { messages } from '../src/i18n/index.js'

async function testSEO() {
  try {
    console.log('Loading messages...')
    console.log('ZH features:', messages.zh?.home?.features)
    console.log('EN features:', messages.en?.home?.features)
    console.log('RU features:', messages.ru?.home?.features)
    console.log('Available locales:', Object.keys(messages))
    console.log('ZH messages structure:', JSON.stringify(messages.zh?.home?.features, null, 2))

    console.log('Initializing directories...')
    
    // 更新静态页面
    console.log('Generating static pages...')
    await updateStaticPages()
    
    // 更新动态页面
    console.log('Generating dynamic pages...')
    await updateDynamicPages()
    console.log('Dynamic pages updated successfully')

    // 在启动新服务器前先检查端口是否被占用
    const port = 3001
    const server = express()
    server.use(expressSeoMiddleware)
    
    // 优雅地处理服务器错误
    server.listen(port, () => {
      console.log(`Test server running at http://localhost:${port}`)
      console.log('Try these URLs with curl:')
      console.log(`- Homepage: curl -A "Googlebot" http://localhost:${port}/`)
      console.log(`- Profile: curl -A "Googlebot" http://localhost:${port}/profile/123`)
      console.log(`- Work: curl -A "Googlebot" http://localhost:${port}/work/456`)
      console.log('\nTesting different crawlers:')
      console.log(`- Baidu: curl -A "Baiduspider" http://localhost:${port}/`)
      console.log(`- Bing: curl -A "bingbot" http://localhost:${port}/`)
      console.log(`- Mobile: curl -A "Googlebot-Mobile" http://localhost:${port}/`)
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please try again later or use a different port.`)
        process.exit(1)
      } else {
        console.error('Server error:', err)
        process.exit(1)
      }
    })
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

testSEO() 