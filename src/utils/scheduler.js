import { updateAllSitemaps } from './sitemap'

/**
 * 启动定时任务
 */
export const startScheduledTasks = () => {
  // 更新站点地图的时间间隔（毫秒）
  const UPDATE_INTERVALS = {
    WORKS: 12 * 60 * 60 * 1000,    // 每12小时
    NEWS: 4 * 60 * 60 * 1000,      // 每4小时
    MAIN: 24 * 60 * 60 * 1000      // 每24小时
  }
  
  // 站点地图更新任务
  const updateSitemapsTask = async () => {
    try {
      await updateAllSitemaps()
    } catch (error) {
      console.error('更新站点地图失败:', error)
    }
  }
  
  // 立即执行一次更新
  updateSitemapsTask().catch(error => {
    console.error('初始更新站点地图失败:', error)
  })
  
  // 设置定时更新
  setInterval(updateSitemapsTask, UPDATE_INTERVALS.NEWS)      // 新闻站点地图更新最频繁
  setInterval(updateSitemapsTask, UPDATE_INTERVALS.WORKS)     // 作品站点地图次之
  setInterval(updateSitemapsTask, UPDATE_INTERVALS.MAIN)      // 主站点地图更新最慢
  
  // 记录下次更新时间
  const nextUpdate = {
    news: new Date(Date.now() + UPDATE_INTERVALS.NEWS),
    works: new Date(Date.now() + UPDATE_INTERVALS.WORKS),
    main: new Date(Date.now() + UPDATE_INTERVALS.MAIN)
  }
  
  console.log('站点地图更新计划:', {
    news: nextUpdate.news.toLocaleString(),
    works: nextUpdate.works.toLocaleString(),
    main: nextUpdate.main.toLocaleString()
  })
  
  console.log('定时任务已启动')
} 