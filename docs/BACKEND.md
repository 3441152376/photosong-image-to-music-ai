# Photo Song 后端文档

## 后端架构

### 技术选型

1. 核心服务
   - LeanCloud 后端服务
   - OpenAI GPT-4 Vision API
   - Suno AI 音乐生成 API

2. 数据存储
   - LeanCloud 对象存储
   - 文件存储系统

### 数据模型

1. User 模型
```javascript
{
  username: String,      // 用户名
  email: String,        // 邮箱
  password: String,     // 密码（加密存储）
  avatar: File,         // 头像
  points: Number,       // 积分
  membershipEndDate: Date, // 会员到期时间
  isVIP: Boolean,      // 是否是会员
  createdAt: Date      // 创建时间
}
```

2. Work 模型
```javascript
{
  title: String,        // 作品标题
  description: String,  // 作品描述
  imageUrl: String,     // 图片 URL
  audioUrl: String,     // 音频 URL
  creator: Pointer<User>, // 创建者
  status: String,       // 状态
  style: String,        // 音乐风格
  tags: Array,         // 标签
  plays: Number,       // 播放次数
  likes: Number,       // 点赞数
  createdAt: Date      // 创建时间
}
```

3. MusicTask 模型
```javascript
{
  taskId: String,      // 任务 ID
  status: String,      // 任务状态
  params: Object,      // 生成参数
  audioUrl: String,    // 生成的音频 URL
  creator: Pointer<User>, // 创建者
  createdAt: Date      // 创建时间
}
```

4. PointsHistory 模型
```javascript
{
  user: Pointer<User>, // 用户
  amount: Number,      // 变动数量
  reason: String,      // 变动原因
  balance: Number,     // 变动后余额
  time: Date          // 变动时间
}
```

## API 接口

### 用户认证

1. 注册
```http
POST /users
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "avatar": "file"
}
```

2. 登录
```http
POST /login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

3. 重置密码
```http
POST /requestPasswordReset
Content-Type: application/json

{
  "email": "string"
}
```

### 作品管理

1. 创建作品
```http
POST /works
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "image": "file",
  "style": "string",
  "tags": ["string"]
}
```

2. 获取作品列表
```http
GET /works
Query Parameters:
  - page: number
  - limit: number
  - creator: string
  - tag: string
```

3. 获取作品详情
```http
GET /works/:id
```

### 音乐生成

1. 提交生成任务
```http
POST /music/tasks
Content-Type: application/json

{
  "title": "string",
  "tags": ["string"],
  "prompt": "string",
  "negative_tags": ["string"]
}
```

2. 查询任务状态
```http
GET /music/tasks/:taskId
```

### 积分系统

1. 获取积分历史
```http
GET /points/history
Query Parameters:
  - page: number
  - limit: number
```

2. 购买积分
```http
POST /points/purchase
Content-Type: application/json

{
  "packageId": "string",
  "payment": {
    "method": "string",
    "amount": number
  }
}
```

## 安全机制

### 数据安全

1. 访问控制
   - 用户认证
   - 角色权限
   - ACL 控制
   - API 访问限制

2. 数据加密
   - 密码加密
   - 敏感信息加密
   - HTTPS 传输
   - Token 加密

### 接口安全

1. 请求验证
   - Token 验证
   - 签名验证
   - 时间戳验证
   - 防重放攻击

2. 限流措施
   - API 调用限制
   - 并发请求限制
   - IP 限制
   - 用户限制

## 错误处理

### 错误码

1. 通用错误 (1xxxx)
   - 10000: 系统错误
   - 10001: 参数错误
   - 10002: 未授权
   - 10003: 禁止访问

2. 用户相关 (2xxxx)
   - 20000: 用户不存在
   - 20001: 密码错误
   - 20002: 邮箱未验证
   - 20003: 账号已禁用

3. 作品相关 (3xxxx)
   - 30000: 作品不存在
   - 30001: 创建失败
   - 30002: 更新失败
   - 30003: 删除失败

4. 积分相关 (4xxxx)
   - 40000: 积分不足
   - 40001: 购买失败
   - 40002: 扣除失败
   - 40003: 返还失败

### 错误响应格式

```javascript
{
  "code": number,     // 错误码
  "message": string,  // 错误信息
  "details": object,  // 详细信息
  "timestamp": string // 时间戳
}
```

## 性能优化

### 缓存策略

1. 数据缓存
   - 用户信息缓存
   - 作品信息缓存
   - 配置信息缓存
   - 计算结果缓存

2. 文件缓存
   - 图片缓存
   - 音频缓存
   - 静态资源缓存
   - CDN 缓存

### 并发处理

1. 任务队列
   - 音乐生成队列
   - 文件处理队列
   - 通知队列
   - 统计队列

2. 限流控制
   - API 限流
   - 资源限流
   - 用户限流
   - IP 限流

## 监控告警

### 监控指标

1. 性能指标
   - API 响应时间
   - 并发请求数
   - 资源使用率
   - 错误率

2. 业务指标
   - 用户活跃度
   - 作品创建量
   - 转化率
   - 留存率

### 告警机制

1. 告警规则
   - 错误率阈值
   - 响应时间阈值
   - 资源使用阈值
   - 业务指标阈值

2. 通知渠道
   - 邮件通知
   - 短信通知
   - webhook 通知
   - 控制台告警 