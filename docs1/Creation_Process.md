# Photo Song 创作流程文档

## 创作流程概述

### 1. 图片分析
使用 GPT-4 Vision API 分析图片内容，提取音乐创作所需的关键信息：

```javascript
// 使用 GPT-4 Vision 分析图片
const visionResult = await analyzeImageWithVision(imageBase64)
```

分析结果包含：
- title: 建议的音乐标题
- tags: 音乐标签（逗号分隔）
- prompt: 详细的音乐描述提示词
- negative_tags: 需要避免的元素

### 2. 音乐生成

#### 2.1 基本参数
```javascript
const musicParams = {
  title: string,           // 作品标题
  tags: string,           // 音乐标签（逗号分隔）
  generation_type: 'TEXT', // 生成类型
  prompt: string,         // 详细描述
  negative_tags: string,  // 需要避免的元素（可选）
  mv: 'chirp-v3-5',      // AI模型版本
  make_instrumental: boolean // 是否纯音乐
}
```

#### 2.2 生成过程
```javascript
// 生成音乐
const taskId = await generateMusic(musicParams)

// 轮询任务状态
const result = await checkMusicTask(taskId)
```

任务状态：
- SUBMITTED: 已提交
- IN_PROGRESS: 处理中
- SUCCESS: 已完成
- FAILED: 失败

### 3. 作品保存

创建新的作品记录：
```javascript
const work = new WorkClass()
work.set('status', 'generating')
work.set('taskId', taskId)
work.set('platform', 'suno')
work.set('submitTime', new Date())
work.set('action', 'MUSIC')
work.set('title', title)
work.set('imageUrl', imageUrl)
work.set('style', style)
work.set('lyrics', lyrics)
```

## 错误处理

### 1. 参数验证
```javascript
// 验证必需的参数
if (!musicParams.title || !musicParams.tags || !musicParams.prompt) {
  throw new Error('缺少必需的参数: title, tags, prompt')
}
```

### 2. API错误处理
```javascript
try {
  const response = await fetch(SUNO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUNO_API_KEY}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`音乐生成请求失败: ${response.status} ${response.statusText}`)
  }
} catch (error) {
  console.error('Suno API Error:', error)
  throw error
}
```

### 3. 重试机制
```javascript
const MAX_RETRIES = 3
const BASE_DELAY = 5000

async function retryOperation(operation, maxRetries = MAX_RETRIES) {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (i === maxRetries - 1) {
        throw new Error(`操作失败，已重试 ${maxRetries} 次: ${error.message}`)
      }
      const delay = BASE_DELAY * Math.pow(2, i)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

## 积分系统

### 1. 积分消耗
- 生成失败自动退还积分
- 根据音乐时长扣除不同积分

### 2. 退还机制
```javascript
if (pointsDeducted.value) {
  try {
    await updateUserPoints(POINTS_CONFIG.CREATE_MUSIC, '生成失败退还')
    userPoints.value = await getUserPoints()
    pointsDeducted.value = false
    ElMessage.info('已退还积分')
  } catch (refundError) {
    console.error('Points refund failed:', refundError)
    ElMessage.error('积分退还失败,请联系客服')
  }
}
```

## 最佳实践

### 1. 环境检查
- 检查必要的API密钥配置
- 验证用户权限和积分余额
- 确保音频上下文初始化

### 2. 状态管理
- 保存任务ID和生成状态
- 定时轮询任务进度
- 正确处理中断和恢复

### 3. 用户体验
- 显示生成进度
- 及时反馈错误信息
- 自动处理积分退还

## 创作限制

### 1. 资源限制
- 图片大小：最大 10MB
- 图片格式：JPG, PNG, WEBP
- 音乐时长：最长 5 分钟
- 生成次数：普通用户每天 3 次，VIP 用户每天 10 次

### 2. 积分消耗
- 30秒音乐：30积分
- 60秒音乐：50积分
- 120秒音乐：80积分
- 300秒音乐：150积分

### 3. 内容限制
- 禁止违规图片
- 禁止侵权内容
- 遵守社区规范

## 最佳实践

### 1. 图片选择
- 清晰度：建议 1024x1024 像素以上
- 主题明确：避免过于复杂的场景
- 情绪突出：选择情感表达清晰的图片

### 2. 参数调优
- 详细的提示词描述
- 合适的音乐风格选择
- 准确的标签设置
- 合理的负面标签

### 3. 音乐优化
- 选择合适的音乐时长
- 根据场景选择是否纯音乐
- 保持风格的一致性

### 4. 发布建议
- 添加清晰的作品描述
- 使用准确的标签
- 选择合适的发布时间
- 及时与社区互动

## 错误处理

### 1. 常见错误
```javascript
try {
  await generateMusic(params)
} catch (error) {
  switch (error.code) {
    case 'INSUFFICIENT_POINTS':
      // 积分不足
      break
    case 'DAILY_LIMIT_EXCEEDED':
      // 超出每日限制
      break
    case 'INVALID_IMAGE':
      // 图片无效
      break
    case 'CONTENT_VIOLATION':
      // 内容违规
      break
    default:
      // 其他错误
      console.error('生成失败:', error)
  }
}
```

### 2. 重试策略
```javascript
const MAX_RETRIES = 3
const RETRY_DELAY = 5000

const retryGeneration = async (params) => {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await generateMusic(params)
    } catch (error) {
      if (i === MAX_RETRIES - 1) throw error
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    }
  }
}
```

## 进阶技巧

### 1. 批量创作
```javascript
const batchGenerate = async (images) => {
  const tasks = images.map(async (image) => {
    const analysis = await analyzeImage(image)
    const params = buildMusicParams(analysis)
    return generateMusic(params)
  })
  return Promise.all(tasks)
}
```

### 2. 风格混合
```javascript
const mixStyles = (style1, style2, ratio = 0.5) => {
  return {
    ...style1,
    prompt: `${style1.prompt} 与 ${style2.prompt} 的融合`,
    tags: [...new Set([...style1.tags, ...style2.tags])],
    style: `${style1.style}-${style2.style}`
  }
}
```

### 3. 自定义预设
```javascript
const presets = {
  cinematic: {
    style: 'Classical',
    duration: 180,
    make_instrumental: true,
    tags: ['epic', 'orchestral', 'dramatic']
  },
  lofi: {
    style: 'Electronic',
    duration: 120,
    make_instrumental: true,
    tags: ['chill', 'relaxing', 'beats']
  }
}
``` 