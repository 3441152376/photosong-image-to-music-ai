import { getDeviceFingerprint } from '../utils/deviceFingerprint'
import { db } from '../utils/db'

const MAX_REGISTRATIONS_PER_DEVICE = 3

export async function checkDeviceRegistrationLimit(deviceId) {
  const result = await db.query(
    `SELECT COUNT(*) as count 
     FROM device_registrations 
     WHERE device_id = $1`,
    [deviceId]
  )
  
  return result.rows[0].count >= MAX_REGISTRATIONS_PER_DEVICE
}

export async function registerUser(userData, registrationType = 'email') {
  try {
    const deviceId = await getDeviceFingerprint()
    
    // 检查设备注册限制
    const hasReachedLimit = await checkDeviceRegistrationLimit(deviceId)
    if (hasReachedLimit) {
      throw new Error('DEVICE_REGISTRATION_LIMIT_REACHED')
    }
    
    // 开始事务
    await db.query('BEGIN')
    
    // 创建用户
    const user = await db.query(
      `INSERT INTO users (email, password_hash, username) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [userData.email, userData.passwordHash, userData.username]
    )
    
    // 记录设备注册
    await db.query(
      `INSERT INTO device_registrations (device_id, user_id, registration_type)
       VALUES ($1, $2, $3)`,
      [deviceId, user.rows[0].id, registrationType]
    )
    
    await db.query('COMMIT')
    return user.rows[0]
    
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  }
}

// Google 登录注册
export async function handleGoogleLogin(googleData) {
  try {
    const deviceId = await getDeviceFingerprint()
    
    // 检查是否已存在用户
    let user = await db.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleData.id]
    )
    
    if (!user.rows[0]) {
      // 新用户注册 - 检查设备限制
      const hasReachedLimit = await checkDeviceRegistrationLimit(deviceId)
      if (hasReachedLimit) {
        throw new Error('DEVICE_REGISTRATION_LIMIT_REACHED')
      }
      
      // 创建新用户
      await db.query('BEGIN')
      
      user = await db.query(
        `INSERT INTO users (email, google_id, username) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [googleData.email, googleData.id, googleData.name]
      )
      
      // 记录设备注册
      await db.query(
        `INSERT INTO device_registrations (device_id, user_id, registration_type)
         VALUES ($1, $2, 'google')`,
        [deviceId, user.rows[0].id]
      )
      
      await db.query('COMMIT')
    }
    
    return user.rows[0]
    
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  }
} 