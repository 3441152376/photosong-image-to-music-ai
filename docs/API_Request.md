# Photo Song API 请求方式文档

## 请求基础配置

### Axios 配置
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // 处理未授权
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## API 请求示例

### 1. 认证相关

#### 1.1 用户注册
```javascript
const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      avatar: userData.avatar,
      inviteCode: userData.inviteCode
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || '注册失败')
  }
}
```

#### 1.2 用户登录
```javascript
const login = async (email, password, remember = false) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
      remember
    })
    const { token, user } = response.data
    localStorage.setItem('token', token)
    return user
  } catch (error) {
    throw new Error(error.response?.data?.message || '登录失败')
  }
}
```

### 2. 音乐生成

#### 2.1 图片分析
```javascript
const analyzeImage = async (imageData) => {
  try {
    const response = await api.post('/music/analyze', {
      image: imageData,
      language: 'zh'
    }, {
      timeout: 60000 // 增加超时时间
    })
    return response.data.analysis
  } catch (error) {
    throw new Error(error.response?.data?.message || '图片分析失败')
  }
}
```

#### 2.2 生成音乐
```javascript
const generateMusic = async (params) => {
  try {
    const response = await api.post('/music/generate', {
      title: params.title,
      prompt: params.prompt,
      tags: params.tags,
      negative_tags: params.negativeTags,
      style: params.style,
      duration: params.duration,
      model: 'chirp-v3-5',
      make_instrumental: params.makeInstrumental,
      imageUrl: params.imageUrl
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || '音乐生成失败')
  }
}
```

#### 2.3 查询生成状态
```javascript
const checkMusicStatus = async (taskId) => {
  try {
    const response = await api.get(`/music/status/${taskId}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || '状态查询失败')
  }
}
```

### 3. 作品管理

#### 3.1 创建作品
```javascript
const createWork = async (workData) => {
  try {
    const formData = new FormData()
    formData.append('title', workData.title)
    formData.append('description', workData.description)
    formData.append('image', workData.image)
    formData.append('audio', workData.audio)
    formData.append('tags', JSON.stringify(workData.tags))
    formData.append('style', workData.style)
    formData.append('isPublic', workData.isPublic)

    const response = await api.post('/works', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || '作品创建失败')
  }
}
```

#### 3.2 获取作品列表
```javascript
const getWorks = async (params = {}) => {
  try {
    const response = await api.get('/works', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        status: params.status || 'all'
      }
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || '获取作品列表失败')
  }
}
```

### 4. 社区功能

#### 4.1 点赞作品
```javascript
const likeWork = async (workId) => {
  try {
    const response = await api.post(`/community/works/${workId}/like`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || '点赞失败')
  }
}
```

#### 4.2 评论作品
```javascript
const commentWork = async (workId, content, parentId = null) => {
  try {
    const response = await api.post(`/community/works/${workId}/comments`, {
      content,
      parentId
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || '评论失败')
  }
}
```

### 5. 支付功能

#### 5.1 创建支付订单
```javascript
const createPayment = async (paymentData) => {
  try {
    const response = await api.post('/payments/create', {
      type: paymentData.type,
      productId: paymentData.productId,
      quantity: paymentData.quantity,
      currency: paymentData.currency
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || '创建支付订单失败')
  }
}
```

#### 5.2 验证支付状态
```javascript
const verifyPayment = async (sessionId) => {
  try {
    const response = await api.get(`/payments/${sessionId}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || '支付验证失败')
  }
}
```

### 6. 文件上传

#### 6.1 上传文件
```javascript
const uploadFile = async (file, type = 'image') => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await api.post('/system/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: progressEvent => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        console.log('上传进度：', percentCompleted)
      }
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || '文件上传失败')
  }
}
```

## 错误处理工具

```javascript
// 统一错误处理
const handleApiError = (error) => {
  const message = error.response?.data?.message || error.message
  const code = error.response?.data?.code
  
  // 根据错误码处理
  switch (code) {
    case 'AUTH_REQUIRED':
      // 处理认证错误
      break
    case 'INVALID_PARAMS':
      // 处理参数错误
      break
    case 'RATE_LIMIT':
      // 处理请求限制
      break
    default:
      // 处理其他错误
      console.error('API Error:', message)
  }
  
  return {
    error: true,
    message,
    code
  }
}
```

## WebSocket 连接（实时状态更新）

```javascript
class WebSocketClient {
  constructor(url) {
    this.url = url
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect() {
    this.ws = new WebSocket(this.url)
    
    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // 处理消息
      this.handleMessage(data)
    }
    
    this.ws.onclose = () => {
      console.log('WebSocket closed')
      this.reconnect()
    }
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log('Attempting to reconnect...')
        this.connect()
      }, 1000 * Math.pow(2, this.reconnectAttempts))
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'MUSIC_PROGRESS':
        // 处理音乐生成进度更新
        break
      case 'PAYMENT_STATUS':
        // 处理支付状态更新
        break
      default:
        console.log('Received message:', data)
    }
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  close() {
    if (this.ws) {
      this.ws.close()
    }
  }
}
```

## 使用示例

```javascript
// 初始化 API 客户端
const apiClient = {
  auth: {
    register,
    login,
    // ... 其他认证方法
  },
  music: {
    analyze: analyzeImage,
    generate: generateMusic,
    checkStatus: checkMusicStatus
  },
  works: {
    create: createWork,
    getList: getWorks,
    // ... 其他作品相关方法
  },
  community: {
    like: likeWork,
    comment: commentWork,
    // ... 其他社区相关方法
  },
  payments: {
    create: createPayment,
    verify: verifyPayment,
    // ... 其他支付相关方法
  },
  system: {
    upload: uploadFile,
    // ... 其他系统相关方法
  }
}

export default apiClient
``` 