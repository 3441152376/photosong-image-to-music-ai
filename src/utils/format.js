// 音频格式处理工具
import audioContextManager from './audio'

// 获取文件扩展名
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase()
}

// 检查是否是支持的音频格式
export const isSupportedAudioFormat = (filename) => {
  const ext = getFileExtension(filename)
  const supportedFormats = audioContextManager.getSupportedFormats()
  return supportedFormats.some(format => format.ext.includes(ext))
}

// 获取备选音频URL
export const getAlternativeAudioUrl = (url) => {
  const supportedFormats = audioContextManager.getSupportedFormats()
  const baseUrl = url.replace(/\.[^/.]+$/, '')
  
  // 返回所有支持的格式的URL
  return supportedFormats.map(format => ({
    url: `${baseUrl}${format.ext}`,
    type: format.type
  }))
}

// 规范化音频URL
export const normalizeAudioUrl = (url) => {
  if (!url) return null
  
  // 如果URL已经包含协议，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 添加基础URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  return `${baseUrl}${url}`
}

// 检查音频文件是否可用
export const checkAudioAvailability = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.error('Failed to check audio availability:', error)
    return false
  }
}

// 获取最佳音频源
export const getBestAudioSource = async (url) => {
  const alternatives = getAlternativeAudioUrl(url)
  
  // 并行检查所有可能的音频源
  const checks = alternatives.map(async (alt) => {
    const available = await checkAudioAvailability(alt.url)
    return {
      ...alt,
      available
    }
  })
  
  const results = await Promise.all(checks)
  
  // 返回第一个可用的音频源
  const bestSource = results.find(source => source.available)
  return bestSource || null
}

// 预加载音频
export const preloadAudio = async (url) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    
    audio.addEventListener('canplaythrough', () => {
      resolve(audio)
    })
    
    audio.addEventListener('error', (error) => {
      reject(error)
    })
    
    audio.src = url
    audio.load()
  })
}

// 检查浏览器音频支持
export const checkBrowserAudioSupport = () => {
  const support = {
    webAudio: false,
    audioElement: false,
    formats: []
  }
  
  // 检查 Web Audio API 支持
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    support.webAudio = !!window.AudioContext
  } catch (e) {
    support.webAudio = false
  }
  
  // 检查 <audio> 元素支持
  try {
    support.audioElement = !!document.createElement('audio').canPlayType
  } catch (e) {
    support.audioElement = false
  }
  
  // 获取支持的格式
  if (support.audioElement) {
    support.formats = audioContextManager.getSupportedFormats()
  }
  
  return support
}

// 安全的 base64 编码函数
export const safeBase64Encode = (str) => {
  try {
    // 首先尝试直接编码
    return btoa(str)
  } catch (e) {
    // 如果失败，使用 encodeURIComponent 处理非 Latin1 字符
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode('0x' + p1)
      }))
  }
}

// 安全的 base64 解码函数
export const safeBase64Decode = (str) => {
  try {
    // 首先尝试直接解码
    return atob(str)
  } catch (e) {
    // 如果失败，处理编码后的字符
    return decodeURIComponent(atob(str).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
  }
}

export default {
  getFileExtension,
  isSupportedAudioFormat,
  getAlternativeAudioUrl,
  normalizeAudioUrl,
  checkAudioAvailability,
  getBestAudioSource,
  preloadAudio,
  checkBrowserAudioSupport
}