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
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请根据这张图片创建一个详细的音乐创作描述。无论图片内容是否清晰、是否能识别出具体内容，都请发挥想象力，基于图片的色彩、氛围、抽象元素等进行创作。禁止回复'无法识别'或'无法帮助'等内容。\n\n请返回一个JSON，包含以下字段：\n- title: 推荐的音乐标题\n- tags: 音乐关键词（逗号分隔）\n- prompt: 详细的音乐描述（描述这张图片应该配什么样的音乐，包括氛围、风格、情绪等，可以包含一些歌词灵感）\n- negative_tags: 应避免的元素\n\n如果图片内容不清晰，可以完全基于色彩、光影、抽象感受进行创意描述。"
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
        max_tokens: 1500
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
      console.error('Missing required environment variables:', {
        hasApiUrl: !!SUNO_API_URL,
        hasApiKey: !!SUNO_API_KEY
      })
      throw new Error('API configuration missing')
    }

    // 验证必需的参数
    if (!musicParams.title || !musicParams.tags || !musicParams.prompt) {
      console.error('Missing required parameters:', {
        hasTitle: !!musicParams.title,
        hasTags: !!musicParams.tags,
        hasPrompt: !!musicParams.prompt
      })
      throw new Error('缺少必需的参数: title, tags, prompt')
    }

    // 确保参数格式正确
    const params = {
      title: musicParams.title,
      tags: Array.isArray(musicParams.tags) ? musicParams.tags.join(',') : musicParams.tags,
      generation_type: 'TEXT',
      prompt: musicParams.prompt,
      negative_tags: musicParams.negative_tags || '',
      mv: 'chirp-v4',
      make_instrumental: musicParams.make_instrumental || false
    }

    console.log('Formatted Suno API Parameters:', {
      params,
      apiUrl: SUNO_API_URL
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
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        console.error('Suno API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          params: params,
          apiUrl: SUNO_API_URL
        })
        
        // 如果是上游错误，抛出特殊错误以触发重试
        if (errorData.code === 'upstream_error') {
          throw new Error('upstream_error: ' + errorData.message)
        }
        
        throw new Error(`音乐生成请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (data.code !== 'success' || !data.data) {
        throw new Error(data.message || '音乐生成失败')
      }
      
      return data;
    });

    // 保存任务到 LeanCloud
    const MusicTask = AV.Object.extend('MusicTask')
    const task = new MusicTask()
    task.set('taskId', data.data)
    task.set('status', 'SUBMITTED')
    task.set('params', params)
    
    console.log('Saving task to LeanCloud...')
    await task.save()
    console.log('Task saved with ID:', data.data)
    
    return data.data // 返回任务ID
  } catch (error) {
    console.error('Suno API Error:', {
      error,
      stack: error.stack,
      apiUrl: SUNO_API_URL
    })
    throw error
  }
}

// 修改 checkMusicTask 函数也使用重试机制
export async function checkMusicTask(taskId) {
  try {
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
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        // 处理特定错误码
        if (response.status === 429) {
          throw new Error('请求过于频繁，请稍后再试')
        } else if (response.status === 403) {
          throw new Error('没有权限执行此操作')
        } else if (response.status === 404) {
          throw new Error('任务不存在')
        }
        
        throw new Error(`检查任务状态失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (data.code !== 'success' || !data.data || !data.data[0]) {
        throw new Error(data.message || '检查任务状态失败')
      }
      
      return data.data[0];
    });
    
    // 更新 LeanCloud 中的任务状态
    const query = new AV.Query('MusicTask')
    query.equalTo('taskId', taskId)
    const task = await query.first()
    if (task) {
      task.set('status', result.status)
      if (result.status === 'SUCCESS' && result.data && result.data[0]) {
        task.set('audioUrl', result.data[0].audio_url)
      }
      await task.save()
    }
    
    return result
  } catch (error) {
    console.error('Task Check Error:', error)
    throw error
  }
} 