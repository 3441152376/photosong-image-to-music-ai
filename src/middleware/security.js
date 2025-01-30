import { validatePointsOperation, validateMembership, validateCreationPermission } from '../utils/security'

// 操作频率限制记录
const rateLimitRecords = new Map()

// 清理过期的频率限制记录
const cleanupRateLimitRecords = () => {
  const now = Date.now()
  for (const [key, record] of rateLimitRecords.entries()) {
    if (now - record.timestamp > 60000) { // 1分钟后清理
      rateLimitRecords.delete(key)
    }
  }
}

// 频率限制检查
const checkRateLimit = (userId, operationType, limit) => {
  const key = `${userId}_${operationType}`
  const now = Date.now()
  
  let record = rateLimitRecords.get(key)
  if (!record) {
    record = {
      count: 0,
      timestamp: now
    }
    rateLimitRecords.set(key, record)
  }
  
  // 如果是新的一分钟，重置计数
  if (now - record.timestamp > 60000) {
    record.count = 0
    record.timestamp = now
  }
  
  record.count++
  
  // 检查是否超过限制
  if (record.count > limit) {
    throw new Error('Rate limit exceeded')
  }
  
  return true
}

// 积分操作中间件
export const pointsMiddleware = async (user, points, operation) => {
  try {
    // 清理过期记录
    cleanupRateLimitRecords()
    
    // 检查频率限制
    checkRateLimit(user.id, 'points', 10)
    
    // 验证积分操作
    const validatedOperation = validatePointsOperation(points, operation)
    
    // 在这里可以添加其他验证逻辑
    
    return validatedOperation
  } catch (error) {
    console.error('Points operation failed:', error)
    throw error
  }
}

// 会员操作中间件
export const membershipMiddleware = async (user, targetLevel) => {
  try {
    // 清理过期记录
    cleanupRateLimitRecords()
    
    // 检查频率限制
    checkRateLimit(user.id, 'membership', 3)
    
    // 验证会员状态
    if (!validateMembership(user, targetLevel)) {
      throw new Error('Invalid membership operation')
    }
    
    return true
  } catch (error) {
    console.error('Membership operation failed:', error)
    throw error
  }
}

// 创作操作中间件
export const creationMiddleware = async (user) => {
  try {
    // 清理过期记录
    cleanupRateLimitRecords()
    
    // 检查频率限制
    checkRateLimit(user.id, 'creation', 5)
    
    // 验证创作权限
    validateCreationPermission(user)
    
    return true
  } catch (error) {
    console.error('Creation operation failed:', error)
    throw error
  }
}

// 导出清理函数用于定期执行
export const startRateLimitCleanup = () => {
  setInterval(cleanupRateLimitRecords, 60000) // 每分钟清理一次
} 