import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AV from 'leancloud-storage'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)

  // 计算属性：用户是否已认证
  const isAuthenticated = computed(() => !!currentUser.value)
  const isVIP = computed(() => {
    if (!currentUser.value) return false
    const endDate = currentUser.value.membershipEndDate
    if (!endDate) return false
    return new Date(endDate) > new Date()
  })

  // 初始化用户状态
  const initializeUser = async () => {
    try {
      const user = AV.User.current()
      if (user) {
        currentUser.value = {
          id: user.id,
          username: user.get('username'),
          email: user.get('email'),
          avatar: user.get('avatar'),
          createdAt: user.get('createdAt'),
          points: user.get('points') || 0,
          membershipEndDate: user.get('membershipEndDate'),
          isVIP: user.get('membershipEndDate') ? new Date(user.get('membershipEndDate')) > new Date() : false,
          isAdmin: user.get('isAdmin') || false
        }
      }
    } catch (err) {
      console.error('Initialize user failed:', err)
      error.value = err.message
    } finally {
      initialized.value = true
    }
  }

  // 登录
  const login = async (email, password) => {
    try {
      loading.value = true
      error.value = null
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('邮箱格式不正确')
      }
      
      // 验证密码长度
      if (password.length < 6) {
        throw new Error('密码长度至少为6位')
      }

      const user = await AV.User.logIn(email, password)
      
      // 检查邮箱是否已验证
      if (!user.get('emailVerified')) {
        // 如果邮箱未验证，重新发送验证邮件
        await AV.User.requestEmailVerify(email)
        throw new Error('EMAIL_NOT_VERIFIED')
      }
      
      currentUser.value = {
        id: user.id,
        username: user.get('username'),
        email: user.get('email'),
        avatar: user.get('avatar'),
        createdAt: user.get('createdAt'),
        points: user.get('points') || 0,
        membershipEndDate: user.get('membershipEndDate'),
        isVIP: user.get('membershipEndDate') ? new Date(user.get('membershipEndDate')) > new Date() : false,
        isAdmin: user.get('isAdmin') || false
      }
      
      return currentUser.value
    } catch (err) {
      console.error('Login failed:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (username, email, password, avatar = null) => {
    try {
      loading.value = true
      error.value = null
      
      // 验证用户名
      if (!username || username.length < 2) {
        throw new Error('用户名长度至少为2位')
      }
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('邮箱格式不正确')
      }
      
      // 验证密码长度
      if (password.length < 6) {
        throw new Error('密码长度至少为6位')
      }

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
      } else {
        try {
          // 获取默认头像图片数据
          const response = await fetch('/default-avatar.png')
          const blob = await response.blob()
          const defaultAvatarFile = new AV.File('default-avatar.png', blob)
          user.set('avatar', defaultAvatarFile)
        } catch (error) {
          console.error('Failed to load default avatar:', error)
          // 如果加载默认头像失败，继续注册流程但不设置头像
        }
      }
      
      // 设置初始积分和会员状态
      user.set('points', 0)
      user.set('membershipEndDate', null)
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
      throw err
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      loading.value = true
      error.value = null
      await AV.User.logOut()
      currentUser.value = null
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
          user.set('avatar', updates.avatar)
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
      loading.value = true
      error.value = null
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('邮箱格式不正确')
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

  // 初始化时检查用户状态
  initializeUser()

  return {
    currentUser,
    loading,
    error,
    initialized,
    isAuthenticated,
    isVIP,
    login,
    register,
    logout,
    updateUserInfo,
    updatePassword,
    resetPassword,
    checkMembership,
    resendVerificationEmail
  }
}) 