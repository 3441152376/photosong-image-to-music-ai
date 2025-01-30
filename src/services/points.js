import { pointsMiddleware } from '../middleware/security'
import { encryptData, decryptData, generateTransactionId, SECURITY_CONFIG } from '../utils/security'
import AV from 'leancloud-storage'

// 积分历史记录类型
const POINTS_HISTORY_TYPE = {
  CREATION: 'creation',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  SYSTEM: 'system'
}

// 更新用户积分
export const updateUserPoints = async (user, points, type, description) => {
  try {
    // 验证操作
    const validatedOperation = await pointsMiddleware(user, points, type)
    
    // 生成事务ID
    const transactionId = generateTransactionId()
    
    // 创建积分历史记录
    const PointsHistory = AV.Object.extend('PointsHistory')
    const history = new PointsHistory()
    
    // 加密敏感数据
    const encryptedData = encryptData({
      points,
      type,
      description,
      timestamp: validatedOperation.timestamp
    })
    
    history.set('transactionId', transactionId)
    history.set('userId', user.id)
    history.set('points', points)
    history.set('type', type)
    history.set('description', description)
    history.set('signature', validatedOperation.signature)
    history.set('encryptedData', encryptedData)
    
    // 使用 LeanCloud 原子操作更新用户积分
    const userQuery = new AV.Query('_User')
    const userToUpdate = await userQuery.get(user.id)
    
    // 在事务中执行积分更新
    return await AV.Object.saveAll([history, userToUpdate], {
      fetchWhenSave: true,
      transaction: true
    }).then(() => {
      // 更新成功后返回新的积分余额
      return {
        success: true,
        newBalance: userToUpdate.get('points'),
        transactionId
      }
    })
    
  } catch (error) {
    console.error('Failed to update points:', error)
    throw error
  }
}

// 检查用户积分余额
export const checkUserPoints = async (user) => {
  try {
    const userQuery = new AV.Query('_User')
    const currentUser = await userQuery.get(user.id)
    return currentUser.get('points') || 0
  } catch (error) {
    console.error('Failed to check points:', error)
    throw error
  }
}

// 获取用户积分历史
export const getUserPointsHistory = async (user, limit = 10, skip = 0) => {
  try {
    const query = new AV.Query('PointsHistory')
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
        points: decryptedData.points,
        type: decryptedData.type,
        description: decryptedData.description,
        timestamp: decryptedData.timestamp,
        createdAt: record.createdAt
      }
    })
  } catch (error) {
    console.error('Failed to get points history:', error)
    throw error
  }
}

// 初始化新用户积分
export const initializeUserPoints = async (user) => {
  try {
    return await updateUserPoints(
      user,
      SECURITY_CONFIG.INITIAL_POINTS,
      POINTS_HISTORY_TYPE.SYSTEM,
      '新用户初始积分'
    )
  } catch (error) {
    console.error('Failed to initialize points:', error)
    throw error
  }
}

export default {
  POINTS_HISTORY_TYPE,
  updateUserPoints,
  checkUserPoints,
  getUserPointsHistory,
  initializeUserPoints
} 