# Photo Song 数据库设计文档

## 数据模型

### 1. User 用户表
```javascript
{
  id: String,                 // 用户ID
  username: String,           // 用户名
  email: String,             // 邮箱
  password: String,          // 加密密码
  avatar: String,            // 头像URL
  bio: String,               // 个人简介
  points: Number,            // 积分
  membershipEndDate: {       // 会员期限
    endTime: Number,         // 结束时间戳
    endDate: String         // 结束日期字符串
  },
  isAdmin: Boolean,          // 是否管理员
  emailVerified: Boolean,    // 邮箱是否验证
  googleId: String,          // Google用户ID
  googleAccessToken: String, // Google访问令牌
  authProvider: String,      // 认证提供商：local/google
  createdAt: Date,          // 创建时间
  updatedAt: Date           // 更新时间
}
```

### 2. Work 作品表
```javascript
{
  id: String,               // 作品ID
  user: Pointer<User>,      // 关联用户
  title: String,            // 作品标题
  imageUrl: String,         // 图片URL
  audioUrl: String,         // 音频URL
  videoUrl: String,         // 视频URL（可选）
  style: String,            // 音乐风格
  status: String,           // 状态：completed/generating/failed
  progress: Number,         // 生成进度（0-100）
  taskId: String,           // Suno API 任务ID
  metadata: Object,         // 元数据
  retryCount: Number,       // 重试次数
  error: String,            // 错误信息
  startTime: Date,          // 开始时间
  completedTime: Date,      // 完成时间
  createdAt: Date,          // 创建时间
  updatedAt: Date          // 更新时间
}
```

### 3. Payment 支付表
```javascript
{
  id: String,               // 支付ID
  user: Pointer<User>,      // 关联用户
  amount: Number,           // 支付金额
  currency: String,         // 货币类型
  type: String,             // 支付类型：points/subscription
  status: String,           // 状态：success/failed/pending
  sessionId: String,        // 支付会话ID
  productId: String,        // 商品ID
  points: Number,           // 购买积分数（积分支付）
  plan: String,             // 会员计划（会员支付）
  metadata: Object,         // 元数据
  createdAt: Date,          // 创建时间
  updatedAt: Date          // 更新时间
}
```

### 4. PointsTransaction 积分交易表
```javascript
{
  id: String,               // 交易ID
  user: Pointer<User>,      // 关联用户
  type: String,             // 类型：deduct/add/refund
  amount: Number,           // 积分数量
  balance: Number,          // 交易后余额
  description: String,      // 交易描述
  work: Pointer<Work>,      // 关联作品（可选）
  payment: Pointer<Payment>,// 关联支付（可选）
  createdAt: Date,          // 创建时间
  updatedAt: Date          // 更新时间
}
```

## 索引设计

### User 表索引
```javascript
{
  email: { unique: true },
  username: { unique: true },
  membershipEndDate.endTime: 1,
  points: 1
}
```

### Work 表索引
```javascript
{
  user: 1,
  status: 1,
  taskId: { unique: true },
  createdAt: -1
}
```

### Payment 表索引
```javascript
{
  user: 1,
  sessionId: { unique: true },
  status: 1,
  createdAt: -1
}
```

### PointsTransaction 表索引
```javascript
{
  user: 1,
  type: 1,
  createdAt: -1
}
```

## 关系图

```
User 1:N Work         // 一个用户可以有多个作品
User 1:N Payment      // 一个用户可以有多个支付记录
User 1:N PointsTx     // 一个用户可以有多个积分交易
Work 1:N PointsTx     // 一个作品可以关联多个积分交易
Payment 1:N PointsTx  // 一个支付可以关联多个积分交易
```

## 数据验证规则

### User 表验证
- username: 2-30字符，只允许字母数字下划线
- email: 有效邮箱格式
- password: 最少6字符
- points: 非负整数
- avatar: 有效URL格式

### Work 表验证
- title: 1-100字符
- status: enum['completed', 'generating', 'failed']
- progress: 0-100的整数
- retryCount: 0-5的整数

### Payment 表验证
- amount: 正数，最多2位小数
- currency: enum['USD', 'CNY']
- type: enum['points', 'subscription']
- status: enum['success', 'failed', 'pending']

### PointsTransaction 表验证
- amount: 非零整数
- type: enum['deduct', 'add', 'refund']
- balance: 非负整数

## 数据迁移策略

### 版本控制
- 使用版本号管理数据库结构变更
- 每次变更记录在 migrations 目录
- 自动化迁移脚本处理数据转换

### 数据备份
- 每日自动备份
- 重要操作前手动备份
- 保留最近30天的备份

### 数据清理
- 定期清理过期的临时数据
- 归档6个月前的交易记录
- 软删除而不是物理删除

## 性能优化

### 查询优化
- 合理使用索引
- 避免大范围查询
- 使用投影限制返回字段

### 缓存策略
- 缓存用户信息
- 缓存热门作品
- 缓存积分余额

### 分页处理
- 默认每页20条
- 最大每页100条
- 使用游标分页 

## 分表策略

### 1. 作品表分表
```javascript
// 按用户ID范围分表
work_0000_0999  // 用户ID 0-999
work_1000_1999  // 用户ID 1000-1999
work_2000_2999  // 用户ID 2000-2999

// 分表路由
const getWorkTable = (userId) => {
  const range = Math.floor(userId / 1000)
  return `work_${range * 1000}_${range * 1000 + 999}`
}
```

### 2. 交易记录分表
```javascript
// 按时间分表
points_tx_202401  // 2024年1月
points_tx_202402  // 2024年2月
points_tx_202403  // 2024年3月

// 分表路由
const getPointsTxTable = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `points_tx_${year}${month}`
}
```

## 数据库连接池

### 1. 连接池配置
```javascript
const dbConfig = {
  connectionLimit: 10,     // 最大连接数
  queueLimit: 0,          // 排队限制
  waitForConnections: true,// 等待连接
  idleTimeout: 60000,     // 空闲超时
  maxIdle: 10,            // 最大空闲连接
  minIdle: 5,             // 最小空闲连接
  acquireTimeout: 10000,  // 获取超时
  reapInterval: 1000      // 回收间隔
}
```

### 2. 连接池监控
```javascript
pool.on('acquire', function (connection) {
  console.log('Connection %d acquired', connection.threadId)
})

pool.on('release', function (connection) {
  console.log('Connection %d released', connection.threadId)
})
```

## 数据库备份恢复

### 1. 自动备份脚本
```bash
#!/bin/bash

# 配置
DB_NAME="photo_song"
BACKUP_DIR="/data/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 创建备份
mongodump --db $DB_NAME --out $BACKUP_DIR/$DATE

# 压缩备份
cd $BACKUP_DIR
tar -czf $DATE.tar.gz $DATE
rm -rf $DATE

# 删除旧备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
```

### 2. 备份策略
- 每日增量备份：凌晨2点
- 每周全量备份：周日凌晨3点
- 每月归档备份：每月1日凌晨4点

### 3. 恢复流程
```bash
#!/bin/bash

# 配置
BACKUP_FILE=$1
TEMP_DIR="/tmp/db_restore"

# 解压备份
tar -xzf $BACKUP_FILE -C $TEMP_DIR

# 恢复数据
mongorestore --db photo_song $TEMP_DIR/photo_song

# 清理临时文件
rm -rf $TEMP_DIR
```

### 4. 恢复验证
```javascript
// 验证数据完整性
const validateRestore = async () => {
  const counts = await Promise.all([
    User.count(),
    Work.count(),
    Payment.count(),
    PointsTransaction.count()
  ])
  
  return {
    users: counts[0],
    works: counts[1],
    payments: counts[2],
    transactions: counts[3]
  }
}
``` 