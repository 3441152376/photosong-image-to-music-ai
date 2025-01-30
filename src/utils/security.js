import CryptoJS from 'crypto-js'
import { nanoid } from 'nanoid'

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

export default SECURITY_CONFIG 