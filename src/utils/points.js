import AV from 'leancloud-storage'
import { ElMessage } from 'element-plus'
import pricingConfig from '../config/pricing.json'

// 积分消耗配置
export const POINTS_CONFIG = {
  CREATE_MUSIC: pricingConfig.points.create_music
}

// 获取用户积分
export const getUserPoints = async () => {
  try {
    const currentUser = AV.User.current()
    if (!currentUser) return 0
    
    await currentUser.fetch()
    return currentUser.get('points') || 0
  } catch (error) {
    console.error('获取积分失败:', error)
    return 0
  }
}

// 检查用户是否有足够积分
export const hasEnoughPoints = async (required) => {
  const points = await getUserPoints()
  return points >= required
}

// 更新用户积分
export const updateUserPoints = async (amount, reason) => {
  try {
    const currentUser = AV.User.current()
    if (!currentUser) throw new Error('用户未登录')
    
    const currentPoints = await getUserPoints()
    const newPoints = currentPoints + amount
    
    if (newPoints < 0) {
      throw new Error('积分不足')
    }
    
    currentUser.set('points', newPoints)
    await currentUser.save(null, { fetchWhenSave: true })
    
    // 记录积分变动历史
    const PointsHistory = AV.Object.extend('PointsHistory')
    const history = new PointsHistory()
    history.set({
      user: currentUser,
      amount,
      reason,
      balance: newPoints,
      time: new Date()
    })
    await history.save()
    
    return newPoints
  } catch (error) {
    console.error('更新积分失败:', error)
    throw error
  }
}

// 获取用户积分历史
export const getPointsHistory = async (limit = 10, skip = 0) => {
  try {
    const currentUser = AV.User.current()
    if (!currentUser) throw new Error('用户未登录')
    
    const query = new AV.Query('PointsHistory')
    query.equalTo('user', currentUser)
    query.descending('createdAt')
    query.limit(limit)
    query.skip(skip)
    
    const results = await query.find()
    return results.map(item => ({
      id: item.id,
      amount: item.get('amount'),
      reason: item.get('reason'),
      balance: item.get('balance'),
      time: item.get('time'),
      createdAt: item.createdAt
    }))
  } catch (error) {
    console.error('获取积分历史失败:', error)
    throw error
  }
}

// 获取积分包列表
export const getPointsPackages = () => {
  return pricingConfig.points.packages
}

// 购买积分
export const purchasePoints = async (packageId) => {
  try {
    const packages = getPointsPackages()
    const selectedPackage = packages.find(p => p.id === packageId)
    if (!selectedPackage) {
      throw new Error('无效的积分包')
    }
    
    // TODO: 接入支付系统
    // 这里应该调用支付接口,成功后再增加积分
    
    await updateUserPoints(selectedPackage.points, '购买积分')
    return true
  } catch (error) {
    console.error('购买积分失败:', error)
    throw error
  }
} 