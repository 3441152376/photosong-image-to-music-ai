import AV from 'leancloud-storage'

AV.init({
  appId: import.meta.env.VITE_LEANCLOUD_APP_ID,
  appKey: import.meta.env.VITE_LEANCLOUD_APP_KEY,
  serverURL: import.meta.env.VITE_LEANCLOUD_SERVER_URL
})

// 初始化 Work 类
const Work = AV.Object.extend('Work')

// 创建 Work 类并设置默认 ACL
async function initWorkClass() {
  try {
    // 创建一个测试对象来确保类存在
    const testWork = new Work()
    testWork.set('test', true)
    await testWork.save()
    
    // 设置默认 ACL
    const acl = new AV.ACL()
    acl.setPublicReadAccess(true)      // 所有人可读
    acl.setPublicWriteAccess(false)    // 仅创建者可写
    
    // 删除测试对象
    await testWork.destroy()
    
    // console.log('Work class initialized successfully')
  } catch (error) {
    if (error.code === 101) { // Class not found
      // console.log('Creating Work class...')
      const testWork = new Work()
      testWork.set('test', true)
      await testWork.save()
      await testWork.destroy()
      // console.log('Work class created successfully')
    } else {
      console.error('Failed to initialize Work class:', error)
    }
  }
}

// 导出 Work 类
export const WorkClass = Work

// 初始化
initWorkClass()

export default AV 