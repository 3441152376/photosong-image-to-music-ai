import CryptoJS from 'crypto-js'
import { nanoid } from 'nanoid'
import { AES, enc } from 'crypto-js'

// 安全配置
const SECURITY_CONFIG = {
  // 积分相关
  INITIAL_POINTS: 100,
  MIN_POINTS: 0,
  MAX_POINTS_PER_TRANSACTION: 10000,
  POINTS_PER_CREATION: 100,
  
  // 会员相关
  MEMBERSHIP_LEVELS: {
    FREE: 'free',
    BASIC: 'basic',
    PRO: 'pro'
  },
  
  // 操作限制
  RATE_LIMITS: {
    POINTS_OPERATIONS: 10, // 每分钟
    CREATION_OPERATIONS: 5, // 每分钟
    MEMBERSHIP_OPERATIONS: 3 // 每分钟
  },
  
  // 加密密钥 (在生产环境中应从环境变量获取)
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your-secret-key'
}

// 用于加密用户数据
export const encryptData = (data) => {
  try {
    const jsonStr = JSON.stringify(data)
    return CryptoJS.AES.encrypt(jsonStr, SECURITY_CONFIG.ENCRYPTION_KEY).toString()
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Data encryption failed')
  }
}

// 用于解密用户数据
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECURITY_CONFIG.ENCRYPTION_KEY)
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8)
    return JSON.parse(decryptedStr)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Data decryption failed')
  }
}

// 生成安全的事务ID
export const generateTransactionId = () => {
  return `txn_${nanoid()}`
}

// 验证积分操作
export const validatePointsOperation = (points, operation) => {
  if (typeof points !== 'number' || isNaN(points)) {
    throw new Error('Invalid points value')
  }
  
  if (points < SECURITY_CONFIG.MIN_POINTS) {
    throw new Error('Points cannot be negative')
  }
  
  if (points > SECURITY_CONFIG.MAX_POINTS_PER_TRANSACTION) {
    throw new Error('Points exceed maximum allowed per transaction')
  }
  
  // 生成操作签名
  const signature = CryptoJS.HmacSHA256(
    `${points}_${operation}_${Date.now()}`,
    SECURITY_CONFIG.ENCRYPTION_KEY
  ).toString()
  
  return {
    points,
    operation,
    signature,
    timestamp: Date.now()
  }
}

// 验证会员状态
export const validateMembership = (user, requiredLevel) => {
  if (!user || !user.membershipLevel) {
    return false
  }
  
  const levels = Object.values(SECURITY_CONFIG.MEMBERSHIP_LEVELS)
  const userLevelIndex = levels.indexOf(user.membershipLevel)
  const requiredLevelIndex = levels.indexOf(requiredLevel)
  
  return userLevelIndex >= requiredLevelIndex
}

// 创作权限检查
export const validateCreationPermission = (user) => {
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  if (user.points < SECURITY_CONFIG.POINTS_PER_CREATION) {
    throw new Error('Insufficient points for creation')
  }
  
  // 检查用户状态
  if (user.status === 'blocked') {
    throw new Error('User is blocked from creating')
  }
  
  return true
}

// 防篡改数据校验
export const verifyDataIntegrity = (data, signature) => {
  const calculatedSignature = CryptoJS.HmacSHA256(
    JSON.stringify(data),
    SECURITY_CONFIG.ENCRYPTION_KEY
  ).toString()
  
  return calculatedSignature === signature
}

// XSS 防护
export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// CSRF Token 管理
export function setupCSRFProtection() {
  const token = generateCSRFToken()
  const cookieOptions = {
    path: '/',
    secure: true,
    samesite: 'Strict',
    partitioned: location.protocol === 'https:'
  }
  setCookie('XSRF-TOKEN', token, cookieOptions)
  return token
}

function generateCSRFToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 敏感数据加密
export function encryptSensitiveData(data, key) {
  return AES.encrypt(JSON.stringify(data), key).toString()
}

export function decryptSensitiveData(encryptedData, key) {
  const bytes = AES.decrypt(encryptedData, key)
  return JSON.parse(bytes.toString(enc.Utf8))
}

// 输入验证
export function validateInput(input, type) {
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    username: /^[a-zA-Z0-9_]{3,20}$/,
    password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
    url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    phone: /^\+?[\d\s-]{10,}$/
  }
  return patterns[type]?.test(input) ?? false
}

// 内容安全策略
export function setupCSP() {
  const csp = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https:', 'data:'],
    'connect-src': ["'self'", 'https:'],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': ["'self'"],
    'worker-src': ["'self'", 'blob:']
  }
  
  return Object.entries(csp)
    .map(([key, value]) => `${key} ${value.join(' ')}`)
    .join('; ')
}

// 安全头部配置
export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

// 文件上传安全验证
export function validateFileUpload(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的文件类型')
  }
  
  if (file.size > maxSize) {
    throw new Error('文件大小超过限制')
  }
  
  return true
}

// API 请求速率限制
export class RateLimiter {
  constructor(limit = 60, interval = 60000) {
    this.limit = limit
    this.interval = interval
    this.requests = new Map()
  }
  
  checkLimit(ip) {
    const now = Date.now()
    const userRequests = this.requests.get(ip) || []
    
    // 清除过期的请求记录
    const validRequests = userRequests.filter(time => now - time < this.interval)
    
    if (validRequests.length >= this.limit) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(ip, validRequests)
    return true
  }
}

// Cookie 管理函数
export const cookieUtils = {
  set(name, value, options = {}) {
    const defaultOptions = {
      path: '/',
      secure: true,
      samesite: 'Lax',
      maxAge: 31536000,
      partitioned: location.protocol === 'https:'
    }
    
    const cookieOptions = { ...defaultOptions, ...options }
    let cookieString = `${name}=${encodeURIComponent(value)}`
    
    if (cookieOptions.path) {
      cookieString += `; path=${cookieOptions.path}`
    }
    if (cookieOptions.maxAge) {
      cookieString += `; max-age=${cookieOptions.maxAge}`
    }
    if (cookieOptions.secure) {
      cookieString += '; Secure'
    }
    if (cookieOptions.samesite) {
      cookieString += `; SameSite=${cookieOptions.samesite}`
    }
    if (cookieOptions.partitioned) {
      cookieString += '; Partitioned'
    }
    
    document.cookie = cookieString
  },
  
  get(name) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop().split(';').shift())
    }
    return null
  },
  
  delete(name) {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=Strict`
  }
}

export default SECURITY_CONFIG 