import { generateDynamicHTML } from '../src/utils/dynamicHtmlGenerator.js'
import AV from 'leancloud-storage'
import { CronJob } from 'cron'

export async function updateDynamicPages() {
  try {
    // 确保使用 masterKey
    AV.Cloud.useMasterKey()

    // 更新用户页面
    const userQuery = new AV.Query('_User')
    userQuery.limit(1000)
    const users = await userQuery.find({ useMasterKey: true })
    
    console.log(`Found ${users.length} users`)
    
    for (const user of users) {
      const userData = user.toJSON()
      const locales = ['zh', 'en', 'ru']
      
      for (const locale of locales) {
        await generateDynamicHTML(`/profile/${userData.objectId}`, locale, {
          type: 'profile',
          ...userData
        })
      }
    }

    // 更新作品页面
    const workQuery = new AV.Query('Work')
    workQuery.limit(1000)
    const works = await workQuery.find({ useMasterKey: true })
    
    console.log(`Found ${works.length} works`)
    
    for (const work of works) {
      const workData = work.toJSON()
      const locales = ['zh', 'en', 'ru']
      
      for (const locale of locales) {
        await generateDynamicHTML(`/work/${workData.objectId}`, locale, {
          type: 'work',
          ...workData
        })
      }
    }

    console.log('Dynamic pages updated successfully')
  } catch (error) {
    console.error('Failed to update dynamic pages:', error)
    throw error
  }
}

// 每天凌晨2点执行更新
const job = new CronJob('0 2 * * *', updateDynamicPages)
job.start() 