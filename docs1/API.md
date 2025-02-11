# Photo Song 完整 API 文档

## 目录
- [环境配置](#环境配置)
- [认证接口](#认证接口)
- [用户接口](#用户接口)
- [音乐生成接口](#音乐生成接口)
- [作品管理接口](#作品管理接口)
- [社区接口](#社区接口)
- [支付接口](#支付接口)
- [积分接口](#积分接口)
- [系统接口](#系统接口)

## 环境配置

### 所有必需的密钥
```env
# OpenAI 配置
VITE_OPENAI_API_URL=https://api.openai.com/v1
VITE_OPENAI_API_KEY=sk-xxxxx

# Suno API 配置
VITE_SUNO_API_URL=https://api.suno.ai
VITE_SUNO_API_KEY=suno-xxxxx

# LeanCloud 配置
VITE_LEANCLOUD_APP_ID=your-app-id
VITE_LEANCLOUD_APP_KEY=your-app-key
VITE_LEANCLOUD_SERVER_URL=https://your-server.leancloud.cn

# Stripe 支付配置
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
VITE_STRIPE_SECRET_KEY=sk_test_xxxxx
VITE_STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# 其他配置
VITE_APP_URL=https://your-domain.com
VITE_API_BASE_URL=https://api.your-domain.com
```

## 认证接口

### 1.1 用户注册
```http
POST /api/auth/register
Content-Type: application/json

Request:
{
  "username": string,     // 2-30字符
  "email": string,        // 有效邮箱
  "password": string,     // 最少6字符
  "avatar": string,       // base64图片（可选）
  "inviteCode": string    // 邀请码（可选）
}

Response: {
  "success": boolean,
  "message": string,
  "user": {
    "id": string,
    "username": string,
    "email": string,
    ...
  }
}
```

### 1.2 邮箱登录
```http
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": string,
  "password": string,
  "remember": boolean    // 是否记住登录
}

Response: {
  "token": string,      // JWT token
  "user": {
    "id": string,
    "username": string,
    "email": string,
    "avatar": string,
    "points": number,
    "membershipEndDate": object,
    "isVIP": boolean
  }
}
```

### 1.3 第三方登录
```http
POST /api/auth/oauth/{provider}
Content-Type: application/json

// provider: google, facebook, github

Request:
{
  "code": string,        // OAuth授权码
  "redirectUri": string  // 重定向URI
}

Response: {
  "token": string,
  "user": object
}
```

### 1.4 重置密码
```http
POST /api/auth/reset-password
Content-Type: application/json

Request:
{
  "email": string
}

Response: {
  "success": boolean,
  "message": string
}
```

### 1.5 验证邮箱
```http
POST /api/auth/verify-email
Content-Type: application/json

Request:
{
  "token": string
}

Response: {
  "success": boolean,
  "message": string
}
```

## 用户接口

### 2.1 获取用户信息
```http
GET /api/users/me
Authorization: Bearer {token}

Response: {
  "user": {
    "id": string,
    "username": string,
    "email": string,
    "avatar": string,
    "bio": string,
    "points": number,
    "membershipEndDate": object,
    "works": array,
    "createdAt": string
  }
}
```

### 2.2 更新用户信息
```http
PUT /api/users/me
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "username": string,
  "bio": string,
  "avatar": string,
  "password": {
    "old": string,
    "new": string
  }
}

Response: {
  "success": boolean,
  "user": object
}
```

### 2.3 获取用户作品
```http
GET /api/users/{userId}/works
Authorization: Bearer {token}

Query Parameters:
- page: number
- limit: number
- status: string (all/completed/generating/failed)

Response: {
  "works": array,
  "total": number,
  "page": number,
  "pages": number
}
```

## 音乐生成接口

### 3.1 图片分析
```http
POST /api/music/analyze
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "image": string,      // base64图片
  "language": string    // zh/en
}

Response: {
  "analysis": {
    "title": string,
    "description": string,
    "tags": string[],
    "style": string,
    "mood": string
  }
}
```

### 3.2 生成音乐
```http
POST /api/music/generate
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": string,
  "prompt": string,
  "tags": string[],
  "negative_tags": string[],
  "style": string,
  "duration": number,    // 秒数
  "model": string,       // chirp-v3-5
  "make_instrumental": boolean,
  "imageUrl": string
}

Response: {
  "taskId": string,
  "estimatedTime": number
}
```

### 3.3 查询生成状态
```http
GET /api/music/status/{taskId}
Authorization: Bearer {token}

Response: {
  "status": string,     // generating/completed/failed
  "progress": number,   // 0-100
  "result": {
    "audioUrl": string,
    "videoUrl": string,
    "metadata": object
  },
  "error": string
}
```

## 作品管理接口

### 4.1 创建作品
```http
POST /api/works
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": string,
  "description": string,
  "imageUrl": string,
  "audioUrl": string,
  "videoUrl": string,
  "tags": string[],
  "style": string,
  "isPublic": boolean
}

Response: {
  "work": object
}
```

### 4.2 更新作品
```http
PUT /api/works/{workId}
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": string,
  "description": string,
  "tags": string[],
  "isPublic": boolean
}

Response: {
  "work": object
}
```

### 4.3 删除作品
```http
DELETE /api/works/{workId}
Authorization: Bearer {token}

Response: {
  "success": boolean
}
```

### 4.4 获取作品详情
```http
GET /api/works/{workId}
Authorization: Bearer {token}

Response: {
  "work": {
    "id": string,
    "title": string,
    "description": string,
    "imageUrl": string,
    "audioUrl": string,
    "videoUrl": string,
    "tags": string[],
    "style": string,
    "status": string,
    "likes": number,
    "comments": number,
    "user": object,
    "createdAt": string
  }
}
```

## 社区接口

### 5.1 获取作品列表
```http
GET /api/community/works
Authorization: Bearer {token}

Query Parameters:
- page: number
- limit: number
- sort: string (latest/popular/trending)
- style: string
- tag: string

Response: {
  "works": array,
  "total": number,
  "page": number,
  "pages": number
}
```

### 5.2 点赞作品
```http
POST /api/community/works/{workId}/like
Authorization: Bearer {token}

Response: {
  "success": boolean,
  "likes": number
}
```

### 5.3 评论作品
```http
POST /api/community/works/{workId}/comments
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "content": string,
  "parentId": string    // 回复评论ID（可选）
}

Response: {
  "comment": object
}
```

### 5.4 获取评论列表
```http
GET /api/community/works/{workId}/comments
Authorization: Bearer {token}

Query Parameters:
- page: number
- limit: number

Response: {
  "comments": array,
  "total": number
}
```

## 支付接口

### 6.1 创建支付订单
```http
POST /api/payments/create
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "type": string,      // points/membership
  "productId": string,
  "quantity": number,
  "currency": string   // USD/CNY
}

Response: {
  "sessionId": string,
  "url": string
}
```

### 6.2 查询支付状态
```http
GET /api/payments/{sessionId}
Authorization: Bearer {token}

Response: {
  "status": string,    // success/pending/failed
  "order": object
}
```

### 6.3 获取支付历史
```http
GET /api/payments/history
Authorization: Bearer {token}

Query Parameters:
- page: number
- limit: number

Response: {
  "payments": array,
  "total": number
}
```

## 积分接口

### 7.1 获取积分余额
```http
GET /api/points/balance
Authorization: Bearer {token}

Response: {
  "points": number,
  "details": {
    "total": number,
    "used": number,
    "available": number
  }
}
```

### 7.2 积分交易记录
```http
GET /api/points/transactions
Authorization: Bearer {token}

Query Parameters:
- page: number
- limit: number
- type: string (all/deduct/add/refund)

Response: {
  "transactions": array,
  "total": number
}
```

### 7.3 使用积分
```http
POST /api/points/deduct
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "points": number,
  "description": string,
  "workId": string     // 关联作品ID
}

Response: {
  "success": boolean,
  "balance": number
}
```

## 系统接口

### 8.1 获取系统配置
```http
GET /api/system/config
Authorization: Bearer {token}

Response: {
  "prices": {
    "points": object,
    "membership": object
  },
  "limits": {
    "maxFileSize": number,
    "maxDuration": number
  },
  "features": {
    "styles": string[],
    "models": string[]
  }
}
```

### 8.2 上传文件
```http
POST /api/system/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
- file: File
- type: string (image/audio)

Response: {
  "url": string,
  "key": string
}
```

### 8.3 健康检查
```http
GET /api/system/health

Response: {
  "status": string,
  "services": {
    "api": boolean,
    "db": boolean,
    "storage": boolean
  }
}
```

## API 版本控制

### 版本规则
- API版本通过URL路径指定：`/api/v1/`
- 当前稳定版本：v1
- Beta版本：v2-beta
- 弃用通知：提前30天发出

### 版本兼容性
- 主版本号变更表示不兼容的API更改
- 次版本号变更表示向后兼容的功能性新增
- 修订号变更表示向后兼容的问题修正

## WebSocket 接口

### 1. 连接建立
```javascript
const ws = new WebSocket('wss://api.your-domain.com/ws')
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }))
}
```

### 2. 音乐生成状态订阅
```javascript
// 订阅任务状态
ws.send(JSON.stringify({
  type: 'subscribe',
  taskId: 'task-id'
}))

// 接收状态更新
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  switch(data.type) {
    case 'progress':
      console.log(`Progress: ${data.progress}%`)
      break
    case 'completed':
      console.log('Task completed:', data.result)
      break
    case 'failed':
      console.error('Task failed:', data.error)
      break
  }
}
```

### 3. 心跳保活
```javascript
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }))
}, 30000)
```

## 请求速率限制

### 1. 普通用户限制
- 注册/登录：60次/小时
- 音乐生成：10次/小时
- 其他API：1000次/小时

### 2. VIP用户限制
- 注册/登录：120次/小时
- 音乐生成：30次/小时
- 其他API：3000次/小时

### 3. 超限处理
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200

{
  "error": "rate_limit_exceeded",
  "message": "已超过请求限制，请稍后再试",
  "retryAfter": 3600
}
```

## 错误处理

所有接口的错误响应格式：
```javascript
{
  "code": string,      // 错误代码
  "message": string,   // 错误信息
  "details": object    // 详细信息（可选）
}
```

## 请求限制
- 普通用户：60次/分钟
- VIP用户：200次/分钟
- 图片上传：10MB/文件
- 音频生成：最长5分钟
- 批量请求：最多20个/次

## 安全要求
- 所有请求必须使用 HTTPS
- API密钥定期轮换
- 敏感数据传输加密
- 实现请求签名验证
- 启用 CORS 保护 