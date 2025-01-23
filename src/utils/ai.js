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

// 使用 Suno 生成音乐
export async function generateMusic(musicParams) {
  try {
    const response = await fetch(SUNO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUNO_API_KEY}`
      },
      body: JSON.stringify({
        title: musicParams.title,
        tags: musicParams.tags,
        generation_type: 'TEXT',
        prompt: musicParams.prompt,
        negative_tags: musicParams.negative_tags,
        mv: 'chirp-v3-5' // 使用最新的模型
      })
    })

    const data = await response.json()
    
    // 保存任务到 LeanCloud
    const MusicTask = AV.Object.extend('MusicTask')
    const task = new MusicTask()
    task.set('taskId', data.data)
    task.set('status', 'SUBMITTED')
    task.set('params', musicParams)
    await task.save()
    
    return data.data // 返回任务ID
  } catch (error) {
    console.error('Suno API Error:', error)
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
        'Authorization': `Bearer ${SUNO_API_KEY}`
      },
      body: JSON.stringify({
        task_ids: [taskId]
      })
    })

    const data = await response.json()
    
    // 更新 LeanCloud 中的任务状态
    const query = new AV.Query('MusicTask')
    query.equalTo('taskId', taskId)
    const task = await query.first()
    if (task) {
      task.set('status', data.data[0].status)
      if (data.data[0].status === 'SUCCESS') {
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