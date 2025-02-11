import AV from 'leancloud-storage'

// 作品状态枚举
export const WorkStatus = {
  GENERATING: 'GENERATING',  // 生成中
  COMPLETED: 'COMPLETED',    // 已完成
  FAILED: 'FAILED',         // 失败
  PENDING: 'PENDING'        // 等待中
}

// 检查单个作品的状态
const checkWorkStatus = async (work) => {
  try {
    // 获取作品ID和当前状态
    const workId = work.get('workId')
    const currentStatus = work.get('status')
    
    // 如果作品已经是终态，则跳过
    if (currentStatus === WorkStatus.COMPLETED || 
        currentStatus === WorkStatus.FAILED) {
      return
    }

    // 调用API检查状态
    const response = await fetch(`${import.meta.env.VITE_AI_BASE_URL}/status/${workId}`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_AI_TOKEN}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch work status')
    }

    const data = await response.json()
    
    // 更新作品状态
    if (data.status !== currentStatus) {
      work.set('status', data.status)
      if (data.status === WorkStatus.COMPLETED) {
        work.set('completedAt', new Date())
        work.set('audioUrl', data.audioUrl)
      } else if (data.status === WorkStatus.FAILED) {
        work.set('error', data.error || 'Generation failed')
      }
      await work.save()
      
      // 如果状态变为完成，发送通知
      if (data.status === WorkStatus.COMPLETED) {
        const user = work.get('user')
        if (user) {
          // 创建通知
          const notification = new AV.Object('Notification')
          notification.set('user', user)
          notification.set('type', 'WORK_COMPLETED')
          notification.set('work', work)
          notification.set('read', false)
          await notification.save()
        }
      }
    }
  } catch (error) {
    // 静默处理错误
  }
}

// 查询所有未完成的作品
const queryPendingWorks = async () => {
  const query = new AV.Query('Work')
  query.containedIn('status', [WorkStatus.GENERATING, WorkStatus.PENDING])
  query.include('user')
  query.ascending('createdAt')
  query.limit(1000) // 限制查询数量
  
  return await query.find()
}

// 批量检查作品状态
const batchCheckWorkStatus = async () => {
  try {
    const works = await queryPendingWorks()
    
    if (works.length === 0) {
      return
    }
    
    // 并发检查所有作品状态，但限制并发数
    const batchSize = 5
    for (let i = 0; i < works.length; i += batchSize) {
      const batch = works.slice(i, i + batchSize)
      await Promise.all(batch.map(work => checkWorkStatus(work)))
      
      // 添加小延迟避免请求过快
      if (i + batchSize < works.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  } catch (error) {
    // 静默处理错误
  }
}

// 启动定时检查
export const startWorkStatusChecker = (interval = 30000) => { // 默认30秒检查一次
  // 立即执行一次
  batchCheckWorkStatus()
  
  // 设置定时器
  const timer = setInterval(batchCheckWorkStatus, interval)
  
  // 返回停止函数
  return () => {
    clearInterval(timer)
  }
}

export default {
  startWorkStatusChecker,
  checkWorkStatus,
  WorkStatus
} 