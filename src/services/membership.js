import { membershipMiddleware } from '../middleware/security'
import { encryptData, decryptData, generateTransactionId, SECURITY_CONFIG } from '../utils/security'
import AV from 'leancloud-storage'

// 会员操作类型
const MEMBERSHIP_OPERATION_TYPE = {
  UPGRADE: 'upgrade',
  RENEW: 'renew',
  CANCEL: 'cancel',
  SYSTEM: 'system'
}

// 更新用户会员状态
export const updateMembership = async (user, targetLevel, duration) => {
  try {
    // 验证操作
    await membershipMiddleware(user, targetLevel)
    
    // 生成事务ID
    const transactionId = generateTransactionId()
    
    // 创建会员历史记录
    const MembershipHistory = AV.Object.extend('MembershipHistory')
    const history = new MembershipHistory()
    
    // 计算到期时间
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + duration)
    
    // 加密敏感数据
    const encryptedData = encryptData({
      level: targetLevel,
      duration,
      expiryDate: expiryDate.toISOString(),
      timestamp: Date.now()
    })
    
    history.set('transactionId', transactionId)
    history.set('userId', user.id)
    history.set('level', targetLevel)
    history.set('duration', duration)
    history.set('expiryDate', expiryDate)
    history.set('encryptedData', encryptedData)
    
    // 使用 LeanCloud 原子操作更新用户会员状态
    const userQuery = new AV.Query('_User')
    const userToUpdate = await userQuery.get(user.id)
    
    userToUpdate.set('membershipLevel', targetLevel)
    userToUpdate.set('membershipExpiryDate', expiryDate)
    
    // 在事务中执行会员状态更新
    return await AV.Object.saveAll([history, userToUpdate], {
      fetchWhenSave: true,
      transaction: true
    }).then(() => {
      return {
        success: true,
        level: targetLevel,
        expiryDate,
        transactionId
      }
    })
    
  } catch (error) {
    console.error('Failed to update membership:', error)
    throw error
  }
}

// 检查会员状态
export const checkMembershipStatus = async (user) => {
  try {
    const userQuery = new AV.Query('_User')
    const currentUser = await userQuery.get(user.id)
    
    const level = currentUser.get('membershipLevel') || SECURITY_CONFIG.MEMBERSHIP_LEVELS.FREE
    const expiryDate = currentUser.get('membershipExpiryDate')
    
    // 检查是否过期
    const isExpired = expiryDate ? new Date() > new Date(expiryDate) : false
    
    return {
      level: isExpired ? SECURITY_CONFIG.MEMBERSHIP_LEVELS.FREE : level,
      expiryDate: isExpired ? null : expiryDate,
      isExpired
    }
  } catch (error) {
    console.error('Failed to check membership:', error)
    throw error
  }
}

// 获取会员历史记录
export const getMembershipHistory = async (user, limit = 10, skip = 0) => {
  try {
    const query = new AV.Query('MembershipHistory')
    query.equalTo('userId', user.id)
    query.descending('createdAt')
    query.limit(limit)
    query.skip(skip)
    
    const history = await query.find()
    
    // 解密并验证每条记录
    return history.map(record => {
      const encryptedData = record.get('encryptedData')
      const decryptedData = decryptData(encryptedData)
      
      return {
        id: record.id,
        transactionId: record.get('transactionId'),
        level: decryptedData.level,
        duration: decryptedData.duration,
        expiryDate: new Date(decryptedData.expiryDate),
        timestamp: decryptedData.timestamp,
        createdAt: record.createdAt
      }
    })
  } catch (error) {
    console.error('Failed to get membership history:', error)
    throw error
  }
}

// 初始化新用户会员状态
export const initializeMembership = async (user) => {
  try {
    return await updateMembership(
      user,
      SECURITY_CONFIG.MEMBERSHIP_LEVELS.FREE,
      30 // 30天免费试用期
    )
  } catch (error) {
    console.error('Failed to initialize membership:', error)
    throw error
  }
}

export default {
  MEMBERSHIP_OPERATION_TYPE,
  updateMembership,
  checkMembershipStatus,
  getMembershipHistory,
  initializeMembership
} 