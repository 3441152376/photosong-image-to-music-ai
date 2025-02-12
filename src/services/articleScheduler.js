import AV from 'leancloud-storage'
import { autoGenerateAndPublishArticle } from './articleGenerator'
import { CronJob } from 'cron'

// 定时任务映射
const cronMapping = {
  daily: '0 0 * * *',      // 每天凌晨执行
  weekly: '0 0 * * 1',     // 每周一凌晨执行
  monthly: '0 0 1 * *'     // 每月1日凌晨执行
}

// 活跃的定时任务
const activeJobs = new Map()

// 初始化定时任务
export async function initializeScheduler() {
  try {
    // 获取所有启用的调度设置
    const Schedule = AV.Object.extend('ArticleSchedule')
    const query = new AV.Query(Schedule)
    query.equalTo('enabled', true)
    
    const schedules = await query.find()
    
    // 为每个调度创建定时任务
    schedules.forEach(schedule => {
      createScheduleJob(schedule)
    })
    
    console.log(`Initialized ${schedules.length} article generation schedules`)
  } catch (error) {
    console.error('Initialize article scheduler failed:', error)
  }
}

// 创建定时任务
function createScheduleJob(schedule) {
  const scheduleId = schedule.id
  const frequency = schedule.get('frequency')
  const cronPattern = cronMapping[frequency]
  
  if (!cronPattern) {
    console.error(`Invalid frequency: ${frequency}`)
    return
  }
  
  // 如果已存在相同ID的任务，先停止它
  if (activeJobs.has(scheduleId)) {
    activeJobs.get(scheduleId).stop()
  }
  
  // 创建新的定时任务
  const job = new CronJob(cronPattern, async () => {
    try {
      const types = schedule.get('types')
      const languages = schedule.get('languages')
      
      console.log(`Executing scheduled article generation:`, {
        scheduleId,
        types,
        languages
      })
      
      // 为每个类型和语言生成文章
      for (const type of types) {
        for (const language of languages) {
          try {
            await autoGenerateAndPublishArticle(type, language)
            console.log(`Generated article: ${type} - ${language}`)
          } catch (error) {
            console.error(`Failed to generate article: ${type} - ${language}`, error)
          }
        }
      }
    } catch (error) {
      console.error('Schedule job execution failed:', error)
    }
  })
  
  // 启动任务
  job.start()
  
  // 保存到活跃任务映射
  activeJobs.set(scheduleId, job)
}

// 更新调度设置
export async function updateSchedule(scheduleId, settings) {
  try {
    const Schedule = AV.Object.extend('ArticleSchedule')
    const query = new AV.Query(Schedule)
    const schedule = await query.get(scheduleId)
    
    // 更新设置
    Object.entries(settings).forEach(([key, value]) => {
      schedule.set(key, value)
    })
    
    await schedule.save()
    
    // 如果启用状态改变
    if ('enabled' in settings) {
      if (settings.enabled) {
        // 创建新的定时任务
        createScheduleJob(schedule)
      } else {
        // 停止现有任务
        const job = activeJobs.get(scheduleId)
        if (job) {
          job.stop()
          activeJobs.delete(scheduleId)
        }
      }
    } else if (settings.frequency || settings.time) {
      // 如果频率或时间改变，重新创建任务
      createScheduleJob(schedule)
    }
    
    return schedule
  } catch (error) {
    console.error('Update schedule failed:', error)
    throw error
  }
}

// 删除调度
export async function deleteSchedule(scheduleId) {
  try {
    const Schedule = AV.Object.extend('ArticleSchedule')
    const query = new AV.Query(Schedule)
    const schedule = await query.get(scheduleId)
    
    // 停止定时任务
    const job = activeJobs.get(scheduleId)
    if (job) {
      job.stop()
      activeJobs.delete(scheduleId)
    }
    
    // 删除调度记录
    await schedule.destroy()
  } catch (error) {
    console.error('Delete schedule failed:', error)
    throw error
  }
}

// 获取所有调度
export async function getAllSchedules() {
  try {
    const Schedule = AV.Object.extend('ArticleSchedule')
    const query = new AV.Query(Schedule)
    return await query.find()
  } catch (error) {
    console.error('Get all schedules failed:', error)
    throw error
  }
}

// 在应用启动时初始化调度器
initializeScheduler() 