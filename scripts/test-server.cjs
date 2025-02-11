const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('Starting server setup...');

// 简化的爬虫检测函数
const isCrawler = (userAgent) => {
  const crawlers = [
    'googlebot',
    'bingbot',
    'baiduspider',
    'yandexbot',
    'duckduckbot',
    'slurp',
    'sogou',
    'exabot',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'embedly'
  ]
  
  const lowerUserAgent = (userAgent || '').toLowerCase()
  return crawlers.some(crawler => lowerUserAgent.includes(crawler))
}

const app = express()
const port = 3000

console.log('Setting up directories...');

// 确保目录存在
const staticDir = path.join(__dirname, '../dist/static')
const dynamicDir = path.join(__dirname, '../dist')

console.log('Static directory:', staticDir);
console.log('Dynamic directory:', dynamicDir);

if (!fs.existsSync(staticDir)) {
  console.log('Creating static directory...');
  fs.mkdirSync(staticDir, { recursive: true })
}

if (!fs.existsSync(dynamicDir)) {
  console.log('Creating dynamic directory...');
  fs.mkdirSync(dynamicDir, { recursive: true })
}

// 创建示例静态页面（如果不存在）
const staticIndexPath = path.join(staticDir, 'index.html')
console.log('Static index path:', staticIndexPath);

if (!fs.existsSync(staticIndexPath)) {
  console.log('Creating static index file...');
  const staticHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photo Song - Static Version for SEO</title>
    <meta name="description" content="Transform your photos into unique musical pieces with our AI-powered platform.">
    <meta name="keywords" content="photo to music, AI music generator">
    <link rel="canonical" href="https://photosong.com/" />
</head>
<body>
    <div id="app">
        <h1>Photo Song - Static Page for SEO</h1>
        <p>This is the static version that search engines will see.</p>
    </div>
</body>
</html>
  `.trim()
  fs.writeFileSync(staticIndexPath, staticHTML)
}

// 创建示例动态页面（如果不存在）
const dynamicIndexPath = path.join(dynamicDir, 'index.html')
console.log('Dynamic index path:', dynamicIndexPath);

if (!fs.existsSync(dynamicIndexPath)) {
  console.log('Creating dynamic index file...');
  const dynamicHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photo Song - Dynamic Version</title>
</head>
<body>
    <div id="app">
        <h1>Photo Song - Dynamic Page</h1>
        <p>This is the dynamic version that regular users will see.</p>
    </div>
    <script>
        console.log('Dynamic page loaded');
    </script>
</body>
</html>
  `.trim()
  fs.writeFileSync(dynamicIndexPath, dynamicHTML)
}

console.log('Setting up middleware...');

// 静态文件服务
app.use(express.static(path.join(__dirname, '../dist')))

// 爬虫检测中间件
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || ''
  console.log(`\n收到请求: ${req.path}`)
  console.log(`User Agent: ${userAgent}`)
  
  if (isCrawler(userAgent)) {
    console.log('检测到爬虫访问')
    const staticPath = path.join(staticDir, req.path === '/' ? 'index.html' : `${req.path}.html`)
    console.log('尝试提供静态文件:', staticPath)
    
    if (fs.existsSync(staticPath)) {
      console.log(`提供静态文件: ${staticPath}`)
      res.sendFile(staticPath)
    } else {
      console.log('静态文件不存在，返回动态页面')
      next()
    }
  } else {
    console.log('检测到普通用户访问')
    next()
  }
})

// 所有其他请求返回动态 index.html
app.get('*', (req, res) => {
  console.log(`返回动态页面: ${dynamicIndexPath}`)
  res.sendFile(dynamicIndexPath)
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).send('服务器错误')
})

// 启动服务器
app.listen(port, () => {
  console.log(`\n测试服务器运行在 http://localhost:${port}`)
  console.log('\n可以使用以下命令测试:')
  console.log('\n1. 测试爬虫访问:')
  console.log('curl -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" http://localhost:3000/')
  console.log('\n2. 测试普通用户访问:')
  console.log('curl http://localhost:3000/')
}) 