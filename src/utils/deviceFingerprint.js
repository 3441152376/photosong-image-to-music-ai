import { nanoid } from 'nanoid'
import Fingerprint2 from 'fingerprintjs2'

// 生成设备指纹
export const generateDeviceFingerprint = async () => {
  try {
    // 等待页面字体加载完成
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 收集设备信息
    const components = await Fingerprint2.getPromise({
      excludes: {
        // 排除一些不稳定的组件
        enumerateDevices: true,
        deviceMemory: true,
        hardwareConcurrency: true,
        // 排除可能随时间变化的组件
        availableScreenResolution: true,
        timezoneOffset: true,
        sessionStorage: true,
        localStorage: true,
        indexedDb: true,
        addBehavior: true,
        openDatabase: true,
        cpuClass: true,
        plugins: true,
        canvas: true,
        webgl: true,
        // 保留稳定的组件
        userAgent: false,
        language: false,
        colorDepth: false,
        screenResolution: false,
        timezone: false,
        platform: false,
        fonts: false
      }
    })
    
    // 过滤并组合关键组件
    const values = components
      .filter(component => component.value !== undefined)
      .map(component => component.value)
    
    // 生成基础指纹
    const baseFingerprint = Fingerprint2.x64hash128(values.join(''), 31)
    
    // 添加额外的设备特征
    const extraFeatures = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      `${window.screen.width}x${window.screen.height}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    ].join('|')
    
    // 组合最终指纹
    const finalFingerprint = Fingerprint2.x64hash128(baseFingerprint + extraFeatures, 31)
    
    return finalFingerprint
  } catch (error) {
    console.error('Failed to generate device fingerprint:', error)
    // 降级方案：使用更可靠的设备信息组合
    const fallbackInfo = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      `${window.screen.width}x${window.screen.height}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      Date.now()
    ].join('|')
    
    return Fingerprint2.x64hash128(fallbackInfo, 31)
  }
}

// 验证设备指纹
export const validateDeviceFingerprint = (fingerprint) => {
  if (!fingerprint || typeof fingerprint !== 'string') {
    return false
  }
  
  // 验证指纹格式（32位十六进制字符串）
  return /^[a-f0-9]{32}$/.test(fingerprint)
}

// 获取基本设备信息
export const getDeviceInfo = () => {
  const info = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString()
  }
  
  // 添加更多稳定的设备特征
  try {
    info.colorDepth = window.screen.colorDepth
    info.pixelRatio = window.devicePixelRatio
    info.orientation = window.screen.orientation?.type || 'unknown'
    info.cookiesEnabled = navigator.cookieEnabled
    info.doNotTrack = navigator.doNotTrack
  } catch (e) {
    console.error('Error collecting additional device info:', e)
  }
  
  return info
}

// 新增：获取设备类型
export const getDeviceType = () => {
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
} 