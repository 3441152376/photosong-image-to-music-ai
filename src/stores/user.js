import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import AV from 'leancloud-storage'
import i18n from '../i18n'
import { generateDeviceFingerprint, getDeviceInfo, getDeviceType } from '../utils/deviceFingerprint'

export const useUserStore = defineStore('user', () => {
  const { t } = i18n.global
  const currentUser = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)

  // 计算属性：用户是否已认证
  const isAuthenticated = computed(() => {
    // 检查当前用户和 LeanCloud 会话状态
    const user = AV.User.current()
    const hasValidSession = !!user && !!user.getSessionToken()
    const lastUserData = localStorage.getItem('lastUser')
    const lastUser = lastUserData ? JSON.parse(lastUserData) : null
    
    // 检查本地存储的会话是否有效，延长有效期到7天
    const isSessionValid = lastUser && 
      lastUser.sessionToken === user?.getSessionToken() && 
      Date.now() - lastUser.timestamp < 7 * 24 * 60 * 60 * 1000 // 延长到7天

    // 如果会话即将过期（还剩1天），自动刷新
    if (isSessionValid && 
        lastUser.timestamp && 
        Date.now() - lastUser.timestamp > 6 * 24 * 60 * 60 * 1000) {
      refreshSession()
    }

    return !!currentUser.value && hasValidSession && isSessionValid && user.id === currentUser.value.id
  })

  // 计算是否是VIP
  const isVIP = computed(() => {
    if (!currentUser.value || !currentUser.value.membershipEndDate) return false
    const membership = currentUser.value.membershipEndDate
    if (!membership.endTime) return false
    return membership.endTime > Date.now()
  })

  // 设置当前用户
  const setCurrentUser = async (user, retryCount = 0) => {
    if (!user) {
      console.log('[User Debug] Setting current user to null')
      currentUser.value = null
      return
    }
    
    try {
      loading.value = true
      error.value = null
      
      console.log('[User Debug] Setting current user:', user.id)
      
      // 添加超时处理
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      // 验证用户会话
      const authPromise = Promise.race([
        user.isAuthenticated(),
        timeout
      ])
      
      try {
        await authPromise
      } catch (authError) {
        console.error('[Auth Error] User session invalid:', authError)
        currentUser.value = null
        throw authError
      }

      // 获取最新用户数据
      await user.fetch()
      
      // 数据验证和清理
      const cleanBio = user.get('bio')?.replace(/[^\w\s\u4e00-\u9fa5]/g, '') || ''
      const cleanUsername = user.get('username')?.replace(/[^\w\s\u4e00-\u9fa5]/g, '') || 'User'
      
      const userData = {
        id: user.id,
        username: cleanUsername,
        email: user.get('email'),
        avatar: user.get('avatar')?.url() || '/src/assets/default-avatar.svg',
        createdAt: user.get('createdAt'),
        points: Math.max(0, user.get('points') || 0),
        membershipEndDate: user.get('membershipEndDate'),
        isVIP: user.get('membershipEndDate')?.endTime > Date.now(),
        isAdmin: user.get('isAdmin') || false,
        bio: cleanBio,
        gender: user.get('gender') || 'notSpecified',
        sessionToken: user.getSessionToken(),
        lastUpdated: Date.now()
      }

      // 保存到本地存储
      localStorage.setItem('lastUser', JSON.stringify({
        id: user.id,
        sessionToken: user.getSessionToken(),
        timestamp: Date.now(),
        lastUpdated: Date.now()
      }))

      await nextTick(() => {
        currentUser.value = userData
        loading.value = false
      })
      
      // 触发更新事件
      window.dispatchEvent(new CustomEvent('userUpdated', { 
        detail: { user: userData }
      }))
      
    } catch (err) {
      console.error('[User Error] Set current user failed:', err)
      error.value = err.message
      
      if (err.code === 429 && retryCount < 3) {
        console.warn(`[User Debug] Retrying setCurrentUser (attempt ${retryCount + 1}/3)...`)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        return setCurrentUser(user, retryCount + 1)
      }
      
      loading.value = false
      throw err
    }
  }

  // 刷新会话
  const refreshSession = async () => {
    try {
      const user = AV.User.current()
      if (user) {
        await user.fetch()
        const sessionToken = user.getSessionToken()
        if (sessionToken) {
          localStorage.setItem('lastUser', JSON.stringify({
            id: user.id,
            sessionToken: sessionToken,
            timestamp: Date.now(),
            lastUpdated: Date.now()
          }))
        }
      }
    } catch (error) {
      console.error('[Session Refresh Error]:', error)
    }
  }

  // 初始化用户状态
  const initializeUser = async () => {
    if (loading.value) return
    
    try {
      loading.value = true
      error.value = null
      console.log('[User Debug] Initializing user state')
      
      // 尝试从 localStorage 恢复会话
      const lastUser = localStorage.getItem('lastUser')
      if (lastUser) {
        try {
          const { sessionToken, timestamp } = JSON.parse(lastUser)
          console.log('[User Debug] Found stored session:', { timestamp })
          
          // 延长会话有效期到7天
          if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
            try {
              const user = await AV.User.become(sessionToken)
              await user.isAuthenticated()
              await setCurrentUser(user)
              return
            } catch (sessionError) {
              console.error('[Auth Error] Session validation failed:', sessionError)
              localStorage.removeItem('lastUser')
              await AV.User.logOut()
            }
          } else {
            console.log('[User Debug] Stored session expired')
            localStorage.removeItem('lastUser')
          }
        } catch (error) {
          console.error('[User Error] Failed to restore session:', error)
          localStorage.removeItem('lastUser')
        }
      }
      
      // 如果没有恢复会话，检查当前用户
      const user = AV.User.current()
      if (user) {
        try {
          await user.isAuthenticated()
          await setCurrentUser(user)
        } catch (authError) {
          console.error('[Auth Error] User session expired:', authError)
          localStorage.removeItem('lastUser')
          await AV.User.logOut()
          currentUser.value = null
        }
      } else {
        console.log('[User Debug] No current user found')
        currentUser.value = null
      }
    } catch (err) {
      console.error('[User Error] Initialize user failed:', err)
      error.value = err.message
      currentUser.value = null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  // 获取当前用户最新信息
  const fetchCurrentUser = async () => {
    try {
      const user = AV.User.current()
      if (user) {
        try {
          await user.isAuthenticated()
          await setCurrentUser(user)
          return currentUser.value
        } catch (authError) {
          console.error('User session expired:', authError)
          localStorage.removeItem('lastUser')
          await AV.User.logOut()
          currentUser.value = null
          return null
        }
      }
      return null
    } catch (err) {
      console.error('Fetch current user failed:', err)
      error.value = err.message
      return null
    }
  }

  // 登录
  const login = async (email, password) => {
    try {
      // 将邮箱转换为小写
      email = email.toLowerCase()
      
      loading.value = true
      error.value = null
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error(t('auth.validation.email.invalid'))
      }
      
      // 验证密码长度
      if (password.length < 6) {
        throw new Error('PASSWORD_TOO_SHORT')
      }

      let user
      try {
        user = await AV.User.logIn(email, password)
      } catch (loginError) {
        // 处理登录错误
        if (loginError.code === 211) {
          throw new Error('USER_NOT_FOUND')
        } else if (loginError.code === 210) {
          throw new Error('INVALID_PASSWORD')
        } else if (loginError.code === 219) {
          throw new Error('TOO_MANY_ATTEMPTS')
        } else if (loginError.message && loginError.message.includes("Email address isn't verified")) {
          // 邮箱未验证的错误
          throw new Error('EMAIL_NOT_VERIFIED')
        } else {
          throw loginError
        }
      }
      
      // 检查邮箱是否已验证
      if (!user.get('emailVerified')) {
        // 如果邮箱未验证，重新发送验证邮件
        await AV.User.requestEmailVerify(email)
        await AV.User.logOut() // 确保未验证用户不会保持登录状态
        throw new Error('EMAIL_NOT_VERIFIED')
      }
      
      // 更新用户信息
      await setCurrentUser(user)
      
      // 触发登录成功事件
      window.dispatchEvent(new CustomEvent('userLoggedIn', { 
        detail: { userId: currentUser.value.id }
      }))
      
      return currentUser.value
    } catch (err) {
      console.error('Login failed:', err)
      error.value = err.message
      
      // 处理不同类型的错误，使用更友好的提示信息
      switch (err.message) {
        case 'FORMAT_ERROR':
          throw new Error(t('auth.errors.emailFormatInvalid'))
        case 'PASSWORD_TOO_SHORT':
          throw new Error(t('auth.errors.passwordTooShort'))
        case 'USER_NOT_FOUND':
          throw new Error(t('auth.errors.accountNotExist'))
        case 'INVALID_PASSWORD':
          throw new Error(t('auth.errors.wrongPassword'))
        case 'EMAIL_NOT_VERIFIED':
          // 邮箱未验证的错误提示
          throw new Error(
            t('auth.errors.emailVerificationRequired') + '\n' +
            t('auth.tips.verificationEmailResent')
          )
        case 'TOO_MANY_ATTEMPTS':
          throw new Error(t('auth.errors.tooManyLoginAttempts'))
        default:
          if (err.message && err.message.includes("Email address isn't verified")) {
            // 捕获 LeanCloud 返回的邮箱未验证错误
            throw new Error(
              t('auth.errors.emailVerificationRequired') + '\n' +
              t('auth.tips.verificationEmailResent')
            )
          } else if (err.code === 211 || err.message.includes('Could not find user')) {
            throw new Error(t('auth.errors.accountNotExist'))
          } else if (err.code === 210 || err.message.includes('The username and password mismatch')) {
            throw new Error(t('auth.errors.wrongPassword'))
          } else {
            throw new Error(t('auth.errors.loginSystemError'))
          }
      }
    } finally {
      loading.value = false
    }
  }

  // 检查设备注册限制
  const checkDeviceRegistration = async () => {
    try {
      // 获取设备指纹和设备信息
      const deviceId = await generateDeviceFingerprint()
      const deviceInfo = getDeviceInfo()
      const deviceType = getDeviceType()
      
      const DeviceRegistration = AV.Object.extend('DeviceRegistration')
      const query = new AV.Query(DeviceRegistration)
      
      // 使用设备指纹查询
      query.equalTo('deviceId', deviceId)
      
      // 添加创建时间限制，只查询最近30天的记录
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      query.greaterThan('createdAt', thirtyDaysAgo)
      
      const registrations = await query.find()
      
      // 计算此设备的有效注册次数
      const validRegistrations = registrations.filter(reg => {
        const regInfo = reg.get('deviceInfo') || {}
        // 检查关键设备信息是否匹配
        return regInfo.userAgent === deviceInfo.userAgent &&
               regInfo.platform === deviceInfo.platform &&
               regInfo.screenResolution === deviceInfo.screenResolution
      })
      
      // 根据设备类型设置不同的限制
      let maxRegistrations = 3
      if (deviceType === 'mobile' || deviceType === 'tablet') {
        maxRegistrations = 2 // 移动设备限制更严格
      }
      
      if (validRegistrations.length >= maxRegistrations) {
        throw new Error(t('auth.errors.deviceLimit'))
      }
      
      // 创建新的注册记录
      const newRegistration = new DeviceRegistration()
      newRegistration.set('deviceId', deviceId)
      newRegistration.set('deviceInfo', deviceInfo)
      newRegistration.set('deviceType', deviceType)
      newRegistration.set('lastRegistration', new Date())
      await newRegistration.save()
      
      return true
    } catch (error) {
      console.error('Device registration check failed:', error)
      throw error
    }
  }

  // 注册
  const register = async (username, email, password, avatar = null) => {
    try {
      // 将邮箱转换为小写
      email = email.toLowerCase()
      
      loading.value = true
      error.value = null
      
      // 验证用户名
      if (!username || username.length < 2) {
        throw new Error(t('auth.validation.username.minLength'))
      }
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error(t('auth.validation.email.invalid'))
      }
      
      // 验证密码长度
      if (password.length < 6) {
        throw new Error(t('auth.validation.password.minLength'))
      }

      // 检查设备注册限制
      await checkDeviceRegistration()

      // 创建用户
      const user = new AV.User()
      user.setUsername(username)
      user.setEmail(email)
      user.setPassword(password)
      
      // 设置默认头像
      if (avatar) {
        if (avatar instanceof AV.File) {
          user.set('avatar', avatar)
        } else if (typeof avatar === 'string') {
          // 如果是字符串URL，创建File对象
          const avatarFile = new AV.File('avatar.jpg', { base64: avatar })
          user.set('avatar', avatarFile)
        }
      }

      // 设置新用户福利：180积分和1天会员
      const now = new Date()
      const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 一天后的时间
      
      user.set('points', 180) // 设置180积分
      user.set('membershipEndDate', {
        endTime: oneDayLater.getTime(),
        endDate: oneDayLater.toISOString()
      }) // 使用对象格式存储会员期限
      user.set('emailVerified', false)
      
      await user.signUp()
      
      // 注册成功后立即登出，确保用户在验证邮箱前不会处于登录状态
      await AV.User.logOut()
      currentUser.value = null
      
      return {
        success: true,
        message: 'REGISTER_SUCCESS_CHECK_EMAIL'
      }
    } catch (err) {
      console.error('Registration failed:', err)
      error.value = err.message
      
      // 处理不同类型的错误
      if (err.message === t('auth.errors.deviceLimit')) {
        throw new Error(t('auth.errors.deviceLimit'))
      } else if (err.code === 202 || err.message.includes('Username has already been taken')) {
        throw new Error(t('auth.errors.usernameExists'))
      } else if (err.code === 203 || err.message.includes('Email address has already been taken')) {
        throw new Error(t('auth.errors.emailExists'))
      } else if (err.code === 214) {
        throw new Error(t('auth.errors.mobilePhoneExists'))
      } else if (err.code === 404 && err.message.includes("Class or object doesn't exists")) {
        // 如果是类不存在的错误，我们已经处理了，不需要抛出错误
        console.log('DeviceRegistration class created successfully')
      } else {
        throw new Error(t('auth.errors.registerFailed'))
      }
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      loading.value = true
      error.value = null
      
      // 清理本地存储的会话信息
      localStorage.removeItem('lastUser')
      localStorage.removeItem('redirectPath')
      
      // 清理 LeanCloud 会话
      await AV.User.logOut()
      
      // 清理状态
      currentUser.value = null
      initialized.value = false
      
      // 触发登出事件
      window.dispatchEvent(new CustomEvent('userLoggedOut'))
      
      return true
    } catch (err) {
      console.error('Logout failed:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新用户信息
  const updateUserInfo = async (updates) => {
    try {
      loading.value = true
      error.value = null
      
      const user = AV.User.current()
      if (!user) throw new Error('用户未登录')

      // 特殊处理头像更新
      if (updates.avatar) {
        if (updates.avatar instanceof AV.File) {
          user.set('avatar', updates.avatar)
          updates.avatar = updates.avatar.url()
        } else if (typeof updates.avatar === 'string') {
          // 如果是字符串URL，创建File对象
          const avatarFile = new AV.File('avatar.jpg', { base64: updates.avatar })
          user.set('avatar', avatarFile)
        }
      }

      // 更新其他字段
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'avatar') {
          user.set(key, value)
        }
      })

      await user.save()
      
      // 更新本地状态
      currentUser.value = {
        ...currentUser.value,
        ...updates
      }
      
      // 触发用户信息更新事件
      window.dispatchEvent(new CustomEvent('userUpdated', { 
        detail: { user: currentUser.value }
      }))
      
      return currentUser.value
    } catch (err) {
      console.error('Update user info failed:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新密码
  const updatePassword = async (oldPassword, newPassword) => {
    try {
      loading.value = true
      error.value = null
      
      const user = AV.User.current()
      if (!user) throw new Error('用户未登录')
      
      // 验证新密码长度
      if (newPassword.length < 6) {
        throw new Error('新密码长度至少为6位')
      }
      
      await AV.User.logIn(user.get('email'), oldPassword)
      user.setPassword(newPassword)
      await user.save()
      
      return true
    } catch (err) {
      console.error('Update password failed:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 重置密码
  const resetPassword = async (email) => {
    try {
      // 将邮箱转换为小写
      email = email.toLowerCase()
      
      loading.value = true
      error.value = null
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error(t('auth.validation.email.invalid'))
      }
      
      await AV.User.requestPasswordReset(email)
      return true
    } catch (err) {
      console.error('Reset password failed:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 检查用户会员状态
  const checkMembership = () => {
    if (!currentUser.value) return false
    
    const endDate = currentUser.value.membershipEndDate
    if (!endDate) return false
    
    return new Date(endDate) > new Date()
  }

  // 重新发送验证邮件
  const resendVerificationEmail = async (email) => {
    try {
      // 将邮箱转换为小写
      email = email.toLowerCase()
      
      loading.value = true
      error.value = null
      
      await AV.User.requestEmailVerify(email)
      return true
    } catch (err) {
      console.error('Resend verification email failed:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 谷歌登录
  const loginWithGoogle = async (googleUser) => {
    try {
      loading.value = true
      error.value = null

      const { id, email, name, access_token } = googleUser

      // 设置 Google 认证数据
      const authData = {
        openid: id,
        access_token,
        expires_in: 3600
      }

      try {
        // 直接尝试使用 Google 登录
        let user = await AV.User.loginWithAuthData(authData, 'google')
        
        // 检查是否是新用户（通过检查 points 是否存在）
        if (!user.get('points')) {
          // 创建默认头像
          try {
            const avatarFile = new AV.File('avatar.svg', { 
              base64: 'data:image/svg+xml;base64,' + btoa(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="100" fill="url(#gradient)"/>
  <path d="M100 90C113.807 90 125 78.8071 125 65C125 51.1929 113.807 40 100 40C86.1929 40 75 51.1929 75 65C75 78.8071 86.1929 90 100 90Z" fill="white"/>
  <path d="M140 145C140 122.909 122.091 105 100 105C77.9086 105 60 122.909 60 145V160H140V145Z" fill="white"/>
</svg>`)
            })
            await avatarFile.save()
            user.set('avatar', avatarFile)
          } catch (avatarErr) {
            console.error('Failed to save avatar:', avatarErr)
          }
          
          // 设置用户基本信息
          if (!user.get('username')) {
            const uniqueUsername = await generateUniqueUsername()
            user.setUsername(uniqueUsername)
          }
          if (!user.get('email')) {
            user.setEmail(email)
          }
          
          user.set('emailVerified', true)
          user.set('authProvider', 'google')
          user.set('googleId', id)
          
          // 设置新用户福利
          const now = new Date()
          const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          user.set('points', 180)
          user.set('membershipEndDate', {
            endTime: oneDayLater.getTime(),
            endDate: oneDayLater.toISOString()
          })

          // 保存用户信息
          await user.save(null, { fetchWhenSave: true })
          
          // 重新获取用户信息
          user = await AV.User.loginWithAuthData(authData, 'google')
        }

        // 更新当前用户状态
        const membershipEndDate = user.get('membershipEndDate')
        const endTime = membershipEndDate?.endTime || 0
        const avatar = user.get('avatar')

        currentUser.value = {
          id: user.id,
          username: user.get('username') || name,
          email: user.get('email') || email,
          avatar: avatar ? avatar.url() : '/src/assets/default-avatar.svg',
          createdAt: user.get('createdAt'),
          points: user.get('points') || 0,
          membershipEndDate: membershipEndDate || null,
          isVIP: endTime > Date.now(),
          isAdmin: user.get('isAdmin') || false,
          authProvider: 'google'
        }

        // 触发用户信息更新事件
        window.dispatchEvent(new CustomEvent('userUpdated', { 
          detail: { user: currentUser.value }
        }))
        
        return currentUser.value
      } catch (err) {
        // 如果登录失败，创建新用户
        const user = new AV.User()
        
        // 设置基本信息
        user.setUsername(name)
        user.setEmail(email)
        
        // 设置一个随机密码
        const randomPassword = Math.random().toString(36).slice(-8)
        user.setPassword(randomPassword)

        // 注册用户并关联 Google 账号
        await user.signUpOrlogInWithAuthData(authData, 'google')
        
        // 重新尝试登录以设置用户福利
        return await loginWithGoogle(googleUser)
      }
    } catch (err) {
      console.error('Google login failed:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 生成唯一用户名的函数
  const generateUniqueUsername = async () => {
    let attempts = 0
    const maxAttempts = 10
    
    while (attempts < maxAttempts) {
      try {
        // 首先尝试使用5位数字
        let username
        if (attempts === 0) {
          const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
          username = `user_${randomNum}`
        } else {
          // 如果第一次尝试失败，使用时间戳后5位 + 3位随机数
          const timestamp = Date.now().toString().slice(-5)
          const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
          username = `user_${timestamp}${randomNum}`
        }
        
        // 检查用户名是否已存在
        const query = new AV.Query('_User')
        query.equalTo('username', username)
        const count = await query.count()
        
        if (count === 0) {
          return username
        }
      } catch (error) {
        console.error('Generate username failed:', error)
      }
      attempts++
    }
    
    // 如果所有尝试都失败了，使用 uuid 的前8位
    const uuid = 'xxxxxxxx'.replace(/[x]/g, () => {
      return (Math.random() * 16 | 0).toString(16)
    })
    return `user_${uuid}`
  }

  // 初始化时检查用户状态
  initializeUser()

  return {
    currentUser,
    loading,
    error,
    initialized,
    isAuthenticated,
    isVIP,
    initializeUser,
    login,
    register,
    logout,
    updateUserInfo,
    updatePassword,
    resetPassword,
    checkMembership,
    resendVerificationEmail,
    setCurrentUser,
    loginWithGoogle,
    fetchCurrentUser
  }
}) 