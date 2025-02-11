import AV from './leancloud'

// GPT-4 Vision API 配置
const VISION_API_URL = import.meta.env.VITE_OPENAI_API_URL
const VISION_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

// Suno Music API 配置 
const SUNO_API_URL = import.meta.env.VITE_SUNO_API_URL
const SUNO_API_KEY = import.meta.env.VITE_SUNO_API_KEY

// 添加请求限制控制
const MIN_REQUEST_INTERVAL = 5000 // 最小请求间隔为5秒
const MAX_RETRIES = 3 // 最大重试次数
const BASE_DELAY = 5000 // 基础延迟时间为5秒
let lastRequestTime = 0

// 添加延迟函数
async function waitForNextRequest() {
  const now = Date.now()
  const timeToWait = Math.max(0, MIN_REQUEST_INTERVAL - (now - lastRequestTime))
  if (timeToWait > 0) {
    await new Promise(resolve => setTimeout(resolve, timeToWait))
  }
  lastRequestTime = Date.now()
}

// 使用 GPT-4 Vision 分析图片
export async function analyzeImageWithVision(imageBase64) {
  try {
    const response = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VISION_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image and provide a detailed description for music generation. Include: 1. The mood and emotions 2. Visual elements and scenes 3. Suggested music style and genre 4. Any specific instruments that would match the image. Format the response as a JSON with keys: title, tags (comma separated), prompt (detailed description), negative_tags (what to avoid)"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    })

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  } catch (error) {
    console.error('Vision API Error:', error)
    throw error
  }
}

// 修改重试函数
async function retryOperation(operation, maxRetries = MAX_RETRIES) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 等待合适的时间间隔
      await waitForNextRequest()
      
      // 执行操作
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1}/${maxRetries} failed:`, error);
      
      // 如果不是上游错误，直接抛出
      if (error.message && !error.message.includes('upstream_error')) {
        throw error;
      }
      
      // 最后一次重试失败，抛出错误
      if (i === maxRetries - 1) {
        throw new Error(`操作失败，已重试 ${maxRetries} 次: ${error.message}`);
      }
      
      // 使用指数退避策略计算下次重试延迟
      const delay = BASE_DELAY * Math.pow(2, i);
      console.log(`等待 ${delay/1000} 秒后进行第 ${i + 2} 次重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// 使用 Suno 生成音乐
export async function generateMusic(musicParams) {
  try {
    // 检查环境变量
    if (!SUNO_API_URL || !SUNO_API_KEY) {
      const error = new Error('API configuration missing')
      console.error('环境变量缺失:', {
        hasApiUrl: !!SUNO_API_URL,
        hasApiKey: !!SUNO_API_KEY,
        env: process.env.NODE_ENV
      })
      throw error
    }

    // 验证必需的参数
    const requiredParams = ['title', 'tags', 'prompt']
    const missingParams = requiredParams.filter(param => !musicParams[param])
    if (missingParams.length > 0) {
      const error = new Error(`缺少必需的参数: ${missingParams.join(', ')}`)
      console.error('参数验证失败:', {
        missingParams,
        providedParams: Object.keys(musicParams)
      })
      throw error
    }

    // 确保参数格式正确
    const params = {
      title: musicParams.title.trim(),
      tags: Array.isArray(musicParams.tags) ? musicParams.tags.join(',') : musicParams.tags,
      generation_type: 'TEXT',
      prompt: musicParams.prompt.trim(),
      negative_tags: (musicParams.negative_tags || '').trim(),
      mv: 'chirp-v4',
      make_instrumental: Boolean(musicParams.make_instrumental)
    }

    console.log('准备调用 Suno API:', {
      params,
      apiUrl: SUNO_API_URL,
      env: process.env.NODE_ENV
    })

    // 使用重试机制调用 API
    const data = await retryOperation(async () => {
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
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { message: errorText }
        }
        
        console.error('Suno API 错误响应:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          params,
          apiUrl: SUNO_API_URL,
          env: process.env.NODE_ENV
        })
        
        // 处理特定错误码
        if (response.status === 429) {
          throw new Error('请求过于频繁，请稍后再试')
        } else if (response.status === 403) {
          throw new Error('API 密钥无效或已过期')
        } else if (response.status === 400) {
          throw new Error(`请求参数错误: ${errorData.message || '未知错误'}`)
        }
        
        // 如果是上游错误，抛出特殊错误以触发重试
        if (errorData.code === 'upstream_error') {
          throw new Error('upstream_error: ' + errorData.message)
        }
        
        throw new Error(`音乐生成请求失败: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      if (responseData.code !== 'success' || !responseData.data) {
        console.error('Suno API 响应格式错误:', {
          responseData,
          params
        })
        throw new Error(responseData.message || '音乐生成失败')
      }
      
      return responseData
    })

    // 保存任务到 LeanCloud
    const MusicTask = AV.Object.extend('MusicTask')
    const task = new MusicTask()
    task.set('taskId', data.data)
    task.set('status', 'SUBMITTED')
    task.set('params', params)
    task.set('env', process.env.NODE_ENV)
    
    console.log('正在保存任务到 LeanCloud...')
    await task.save()
    console.log('任务已保存:', {
      taskId: data.data,
      env: process.env.NODE_ENV
    })
    
    return data.data
  } catch (error) {
    console.error('音乐生成失败:', {
      error: error.message,
      stack: error.stack,
      params: musicParams,
      apiUrl: SUNO_API_URL,
      env: process.env.NODE_ENV
    })
    throw error
  }
}

// 修改 checkMusicTask 函数
export async function checkMusicTask(taskId) {
  try {
    console.log('开始检查任务状态:', {
      taskId,
      env: process.env.NODE_ENV
    })

    const result = await retryOperation(async () => {
      const response = await fetch(`${SUNO_API_URL.replace('/submit/music', '/fetch')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ids: [taskId],
          action: "MUSIC"
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { message: errorText }
        }
        
        console.error('检查任务状态失败:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          taskId,
          env: process.env.NODE_ENV
        })
        
        // 处理特定错误码
        if (response.status === 429) {
          throw new Error('请求过于频繁，请稍后再试')
        } else if (response.status === 403) {
          throw new Error('API 密钥无效或已过期')
        } else if (response.status === 404) {
          throw new Error('任务不存在')
        }
        
        throw new Error(`检查任务状态失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (data.code !== 'success' || !data.data || !data.data[0]) {
        console.error('任务状态响应格式错误:', {
          data,
          taskId
        })
        throw new Error(data.message || '检查任务状态失败')
      }
      
      console.log('任务状态检查结果:', {
        taskId,
        status: data.data[0].status,
        env: process.env.NODE_ENV
      })
      
      return data.data[0]
    })

    return result
  } catch (error) {
    console.error('检查任务状态时发生错误:', {
      error: error.message,
      stack: error.stack,
      taskId,
      env: process.env.NODE_ENV
    })
    throw error
  }
} 