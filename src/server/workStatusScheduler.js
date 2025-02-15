import AV from 'leancloud-storage'
import { WorkStatus } from '../utils/workStatusChecker'

// 定义检查间隔（毫秒）
const CHECK_INTERVAL = 60000 // 1分钟

// 检查单个作品状态
async function checkWorkStatus(work) {
  try {
    const taskId = work.get('taskId')
    if (!taskId) return

    const response = await fetch(`${process.env.VITE_AI_BASE_URL}/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_AI_TOKEN}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch task status')
    }

    const data = await response.json()
    const currentStatus = work.get('status')

    // 如果状态有变化，更新作品
    if (data.status !== currentStatus) {
      work.set('status', data.status)
      
      if (data.status === WorkStatus.COMPLETED) {
        work.set('completedAt', new Date())
        work.set('audioUrl', data.audioUrl)
        
        // 发送通知给用户
        const user = work.get('user')
        if (user) {
          // 创建通知
          const Notification = AV.Object.extend('Notification')
          const notification = new Notification()
          notification.set('user', user)
          notification.set('type', 'work_completed')
          notification.set('work', work)
          notification.set('read', false)
          await notification.save()
        }
      } else if (data.status === WorkStatus.FAILED) {
        work.set('error', data.error || 'Generation failed')
        
        // 发送失败通知
        const user = work.get('user')
        if (user) {
          const Notification = AV.Object.extend('Notification')
          const notification = new Notification()
          notification.set('user', user)
          notification.set('type', 'work_failed')
          notification.set('work', work)
          notification.set('read', false)
          await notification.save()
        }
      }
      
      await work.save()
      console.log(`Updated work ${work.id} status to ${data.status}`)
    }
  } catch (error) {
    console.error(`Error checking work ${work.id} status:`, error)
  }
}

// 检查所有未完成的作品
async function checkPendingWorks() {
  try {
    // 查询所有未完成的作品
    const query = new AV.Query('Work')
    query.containedIn('status', [WorkStatus.GENERATING, WorkStatus.PENDING])
    query.include('user')
    query.limit(1000) // 限制每次处理的数量
    
    const works = await query.find()
    console.log(`Found ${works.length} pending works`)
    
    // 并行处理所有作品
    await Promise.all(works.map(work => checkWorkStatus(work)))
  } catch (error) {
    console.error('Error checking pending works:', error)
  }
}

// 启动定时任务
function startScheduler() {
  // 立即执行一次
  checkPendingWorks()
  
  // 设置定时器
  setInterval(checkPendingWorks, CHECK_INTERVAL)
  console.log('Work status scheduler started')
}

export { startScheduler }
