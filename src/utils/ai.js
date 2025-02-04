import AV from './leancloud'

// GPT-4 Vision API 配置
const VISION_API_URL = import.meta.env.VITE_OPENAI_API_URL
const VISION_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

// Suno Music API 配置 
const SUNO_API_URL = import.meta.env.VITE_SUNO_API_URL
const SUNO_API_KEY = import.meta.env.VITE_SUNO_API_KEY

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

// 添加重试函数
async function retryOperation(operation, maxRetries = 3, delay = 2000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed:`, error);
      
      // 如果不是上游错误，直接抛出
      if (error.message && !error.message.includes('upstream_error')) {
        throw error;
      }
      
      // 最后一次重试失败，抛出错误
      if (i === maxRetries - 1) {
        throw new Error(`操作失败，已重试 ${maxRetries} 次: ${error.message}`);
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
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
      title: musicParams.title.trim(),
      tags: typeof musicParams.tags === 'string' ? musicParams.tags : (Array.isArray(musicParams.tags) ? musicParams.tags.join(',') : ''),
      generation_type: 'TEXT',
      prompt: typeof musicParams.prompt === 'string' ? musicParams.prompt : JSON.stringify(musicParams.prompt),
      negative_tags: musicParams.negative_tags || '',
      mv: 'chirp-v3-5',
      make_instrumental: Boolean(musicParams.make_instrumental)
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

// 查询音乐生成任务状态
export async function checkMusicTask(taskId) {
  try {
    const response = await fetch(`${SUNO_API_URL.replace('/submit/music', '/fetch')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        task_ids: [taskId]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Task Check Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`检查任务状态失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    if (data.code !== 'success' || !data.data || !data.data[0]) {
      throw new Error(data.message || '检查任务状态失败')
    }
    
    // 更新 LeanCloud 中的任务状态
    const query = new AV.Query('MusicTask')
    query.equalTo('taskId', taskId)
    const task = await query.first()
    if (task) {
      task.set('status', data.data[0].status)
      if (data.data[0].status === 'SUCCESS' && data.data[0].data && data.data[0].data[0]) {
        task.set('audioUrl', data.data[0].data[0].audio_url)
      }
      await task.save()
    }
    
    return data.data[0]
  } catch (error) {
    console.error('Task Check Error:', error)
    throw error
  }
} 