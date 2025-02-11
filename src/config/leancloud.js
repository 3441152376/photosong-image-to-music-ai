import AV from 'leancloud-storage'

// LeanCloud 初始化配置
const initLeanCloud = () => {
  // 检查是否已经初始化
  if (AV.applicationId) {
    return
  }

  // 基础配置
  AV.init({
    appId: import.meta.env.VITE_LEANCLOUD_APP_ID,
    appKey: import.meta.env.VITE_LEANCLOUD_APP_KEY,
    serverURL: import.meta.env.VITE_LEANCLOUD_SERVER_URL
  })

  // 配置请求
  AV.setRequestTimeout(30000) // 30 秒超时
  AV._config.useMasterKey = false // 禁用 masterKey
  AV._config.production = import.meta.env.PROD // 根据环境设置
  AV._config.disableCurrentUser = false // 启用当前用户

  // 配置 CORS
  if (typeof window !== 'undefined') {
    AV._config.headers = {
      ...AV._config.headers,
      'X-LC-Id': import.meta.env.VITE_LEANCLOUD_APP_ID,
      'X-LC-Key': import.meta.env.VITE_LEANCLOUD_APP_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // 在页面卸载前保存会话状态
    window.addEventListener('beforeunload', () => {
      const currentUser = AV.User.current()
      if (currentUser) {
        localStorage.setItem('lastUser', JSON.stringify({
          id: currentUser.id,
          sessionToken: currentUser.getSessionToken()
        }))
      }
    })

    // 恢复会话状态
    const lastUser = localStorage.getItem('lastUser')
    if (lastUser) {
      try {
        const { id, sessionToken } = JSON.parse(lastUser)
        AV.User.become(sessionToken).catch(error => {
          console.error('Failed to restore session:', error)
          localStorage.removeItem('lastUser')
        })
      } catch (error) {
        console.error('Failed to parse last user:', error)
        localStorage.removeItem('lastUser')
      }
    }
  }
}

// 执行初始化
initLeanCloud()

export default AV