const AV = require('leancloud-storage')
const fetch = require('node-fetch')

// 检查必要的环境变量
const requiredEnvVars = [
  'LEANCLOUD_APP_ID',
  'LEANCLOUD_APP_KEY',
  'LEANCLOUD_API_SERVER',
  'VITE_SUNO_API_KEY'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`)
    console.error('Please set the environment variables in the Baota panel')
    process.exit(1)
  }
}

// 初始化 LeanCloud
try {
  AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
    serverURL: process.env.LEANCLOUD_API_SERVER
  })
  console.log('LeanCloud initialized successfully')
} catch (error) {
  console.error('Failed to initialize LeanCloud:', error)
  process.exit(1)
}

// 作品状态枚举
const WorkStatus = {
  GENERATING: 'GENERATING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PENDING: 'PENDING'
}

// 检查单个作品状态
async function checkWorkStatus(work) {
  try {
    const taskId = work.get('taskId')
    if (!taskId) {
      console.log(`Work ${work.id} has no taskId, skipping...`)
      return
    }

    console.log(`Checking status for work ${work.id} with taskId ${taskId}...`)

    const response = await fetch(`https://api.whatai.cc/suno/fetch/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_SUNO_API_KEY}`
      }
    })

    if (!response.ok) {
      console.error(`API request failed for work ${work.id}: ${response.status} ${response.statusText}`)
      if (response.status === 404) {
        work.set('status', WorkStatus.FAILED)
        work.set('error', 'Task not found')
        await work.save()
        console.log(`Work ${work.id} marked as failed due to missing task`)
        return
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`Received status for work ${work.id}:`, data)

    const currentStatus = work.get('status')
    
    // 将 API 返回的状态映射到我们的状态
    let newStatus = currentStatus
    if (data.status === 'success') {
      newStatus = WorkStatus.COMPLETED
    } else if (data.status === 'failed') {
      newStatus = WorkStatus.FAILED
    } else if (data.status === 'in_progress') {
      newStatus = WorkStatus.GENERATING
    }

    // 如果状态有变化，更新作品
    if (newStatus !== currentStatus) {
      console.log(`Updating status for work ${work.id} from ${currentStatus} to ${newStatus}`)
      work.set('status', newStatus)
      
      if (newStatus === WorkStatus.COMPLETED) {
        work.set('completedAt', new Date())
        work.set('audioUrl', data.audio_url || data.audioUrl) // 兼容两种字段名
        
        // 创建完成通知
        const Notification = AV.Object.extend('Notification')
        const notification = new Notification()
        notification.set('user', work.get('user'))
        notification.set('type', 'work_completed')
        notification.set('work', work)
        notification.set('read', false)
        await notification.save()
        
        console.log(`Work ${work.id} completed successfully`)
      } else if (newStatus === WorkStatus.FAILED) {
        work.set('error', data.error || 'Generation failed')
        
        // 创建失败通知
        const Notification = AV.Object.extend('Notification')
        const notification = new Notification()
        notification.set('user', work.get('user'))
        notification.set('type', 'work_failed')
        notification.set('work', work)
        notification.set('read', false)
        await notification.save()
        
        console.log(`Work ${work.id} failed: ${data.error || 'Unknown error'}`)
      }
      
      await work.save()
    } else {
      console.log(`No status change for work ${work.id}, current status: ${currentStatus}`)
    }
  } catch (error) {
    console.error(`Error checking work ${work.id} status:`, error)
  }
}

// 主函数
async function main() {
  try {
    console.log('Starting work status check...')
    console.log('Environment:', {
      LEANCLOUD_APP_ID: process.env.LEANCLOUD_APP_ID ? '✓' : '✗',
      LEANCLOUD_APP_KEY: process.env.LEANCLOUD_APP_KEY ? '✓' : '✗',
      LEANCLOUD_API_SERVER: process.env.LEANCLOUD_API_SERVER ? '✓' : '✗',
      VITE_SUNO_API_KEY: process.env.VITE_SUNO_API_KEY ? '✓' : '✗'
    })
    
    // 查询所有未完成的作品
    const query = new AV.Query('Work')
    query.containedIn('status', [WorkStatus.GENERATING, WorkStatus.PENDING])
    query.include('user')
    query.limit(1000) // 限制每次处理的数量
    
    const works = await query.find()
    console.log(`Found ${works.length} pending works`)
    
    if (works.length === 0) {
      console.log('No pending works found')
      process.exit(0)
    }
    
    // 并行处理所有作品
    await Promise.all(works.map(work => checkWorkStatus(work)))
    console.log('Work status check completed')
    process.exit(0)
  } catch (error) {
    console.error('Error in main function:', error)
    process.exit(1)
  }
}

// 运行主函数
main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
