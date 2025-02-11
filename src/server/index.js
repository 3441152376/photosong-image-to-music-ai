import express from 'express'
import compression from 'compression'
import routes from './routes'
import { detectLanguage } from './middleware'

const app = express()

// 启用压缩
app.use(compression())

// 添加语言检测中间件
app.use(detectLanguage)

// 使用路由
app.use('/', routes)

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).send('Internal Server Error')
})

export default app 