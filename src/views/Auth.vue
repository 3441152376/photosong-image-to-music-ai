<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Lock, Message, User, UserFilled } from '@element-plus/icons-vue'
import AV from 'leancloud-storage'
import TheNavbar from '../components/TheNavbar.vue'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

const isLogin = ref(true)
const loading = ref(false)
const avatarInput = ref(null)

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  avatar: ''
})

const formErrors = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  avatar: ''
})

const avatarUrl = computed(() => {
  if (form.value.avatar) {
    return form.value.avatar
  }
  // 根据用户名生成不同颜色的默认头像
  const colors = [
    '#409EFF', // 蓝色
    '#67C23A', // 绿色
    '#E6A23C', // 黄色
    '#F56C6C', // 红色
    '#909399'  // 灰色
  ]
  const index = form.value.username ? form.value.username.length % colors.length : 0
  return {
    backgroundColor: colors[index],
    text: form.value.username ? form.value.username.charAt(0).toUpperCase() : '?'
  }
})

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

const validatePassword = (password) => {
  return password.length >= 6
}

const validateForm = () => {
  let isValid = true
  formErrors.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: ''
  }

  if (!isLogin.value) {
    if (!form.value.username) {
      formErrors.value.username = t('auth.validation.username.required')
      isValid = false
    } else if (form.value.username.length < 2) {
      formErrors.value.username = t('auth.validation.username.minLength')
      isValid = false
    }

    // Add avatar validation for registration
    if (!form.value.avatar) {
      formErrors.value.avatar = t('auth.validation.avatar.required')
      isValid = false
    }
  }

  if (!form.value.email) {
    formErrors.value.email = t('auth.validation.email.required')
    isValid = false
  } else if (!validateEmail(form.value.email)) {
    formErrors.value.email = t('auth.validation.email.invalid')
    isValid = false
  }

  if (!form.value.password) {
    formErrors.value.password = t('auth.validation.password.required')
    isValid = false
  } else if (!validatePassword(form.value.password)) {
    formErrors.value.password = t('auth.validation.password.minLength')
    isValid = false
  }

  if (!isLogin.value && form.value.password !== form.value.confirmPassword) {
    formErrors.value.confirmPassword = t('auth.validation.password.notMatch')
    isValid = false
  }

  return isValid
}

const triggerAvatarUpload = () => {
  if (avatarInput.value) {
    avatarInput.value.click()
  }
  // 如果用户点击上传头像区域但还没有选择图片，显示错误提示
  if (!isLogin.value && !form.value.avatar) {
    formErrors.value.avatar = t('auth.validation.avatar.required')
  }
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
    ElMessage.error(t('auth.validation.avatar.format'))
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error(t('auth.validation.avatar.size'))
    return
  }

  try {
    loading.value = true
    const avFile = new AV.File(file.name, file)
    const savedFile = await avFile.save()
    form.value.avatar = savedFile.url()
    formErrors.value.avatar = '' // Clear any avatar error
    ElMessage.success(t('auth.success.avatarUpload'))
  } catch (error) {
    console.error('Avatar upload failed:', error)
    ElMessage.error(t('auth.errors.avatarUpload'))
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  try {
    loading.value = true
    
    if (!isLogin.value) {
      let avatarFile = null
      if (form.value.avatar) {
        const response = await fetch(form.value.avatar)
        if (!response.ok) {
          throw new Error(t('errors.uploadFailed'))
        }
        const blob = await response.blob()
        avatarFile = new AV.File('avatar.jpg', { 
          blob,
          mimeType: blob.type || 'image/jpeg'
        })
        await avatarFile.save()
      }
      
      try {
        const result = await userStore.register(
          form.value.username,
          form.value.email,
          form.value.password,
          avatarFile
        )
        
        if (result.success) {
          ElMessage.success(t('auth.success.register'))
          // Show email verification message
          ElMessageBox.alert(
            t('auth.emailVerification.checkInbox'),
            t('auth.emailVerification.required'),
            {
              confirmButtonText: t('common.ok'),
              type: 'success',
              showClose: false
            }
          )
          isLogin.value = true
        }
      } catch (error) {
        console.error('Registration error:', error)
        if (error.message === t('auth.errors.deviceLimit')) {
          ElMessageBox.alert(
            t('auth.errors.deviceLimitHelp'),
            t('auth.errors.deviceLimitTitle'),
            {
              confirmButtonText: t('auth.login'),
              cancelButtonText: t('auth.contactSupport'),
              type: 'error',
              showClose: false,
              showCancelButton: true,
              callback: (action) => {
                if (action === 'confirm') {
                  isLogin.value = true
                } else if (action === 'cancel') {
                  router.push('/contact-support')
                }
              }
            }
          )
        } else if (error.message === t('auth.errors.usernameExists')) {
          ElMessage.error(t('auth.errors.usernameExists'))
        } else if (error.message === t('auth.errors.emailExists')) {
          ElMessage.error(t('auth.errors.emailExists'))
        } else {
          ElMessage.error(error.message || t('auth.errors.registerFailed'))
        }
        return // 阻止继续抛出错误
      }
    } else {
      try {
        await userStore.login(form.value.email, form.value.password)
        ElMessage.success(t('auth.success.login'))
        router.push(router.currentRoute.value.query.redirect || '/')
      } catch (error) {
        if (error.message === t('auth.errors.emailNotVerified')) {
          ElMessageBox.confirm(
            t('auth.emailVerification.instruction'),
            t('auth.emailVerification.required'),
            {
              confirmButtonText: t('auth.buttons.verifyEmail'),
              cancelButtonText: t('common.cancel'),
              type: 'warning'
            }
          ).then(() => {
            resendVerificationEmail()
          }).catch(() => {})
        } else if (error.message === t('auth.errors.invalidPassword')) {
          ElMessage({
            type: 'error',
            message: t('auth.errors.invalidPassword'),
            duration: 5000,
            showClose: true
          })
        } else if (error.message === t('auth.errors.userNotFound')) {
          ElMessage({
            type: 'error',
            message: t('auth.errors.userNotFound'),
            duration: 5000,
            showClose: true
          })
        } else if (error.message === t('auth.errors.tooManyAttempts')) {
          ElMessage({
            type: 'error',
            message: t('auth.errors.tooManyAttempts'),
            duration: 5000,
            showClose: true
          })
        } else {
          ElMessage.error(error.message || t('auth.errors.loginFailed'))
        }
      }
    }
  } catch (error) {
    console.error(isLogin.value ? 'Login failed:' : 'Registration failed:', error)
    // 不再在这里显示错误消息，因为已经在内部 catch 中处理了
  } finally {
    loading.value = false
  }
}

// 添加重新发送验证邮件的功能
const resendVerificationEmail = async () => {
  try {
    loading.value = true
    // 这里需要调用 LeanCloud 的重新发送验证邮件 API
    await AV.User.requestEmailVerify(form.value.email)
    ElMessage.success(t('auth.errors.emailVerificationSent'))
  } catch (error) {
    console.error('Failed to resend verification email:', error)
    ElMessage.error(t('auth.errors.networkError'))
  } finally {
    loading.value = false
  }
}

const switchMode = () => {
  isLogin.value = !isLogin.value
  form.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: ''
  }
  formErrors.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: ''
  }
}

// 密码可见性控制
const passwordVisible = ref(false)
const confirmPasswordVisible = ref(false)

const togglePasswordVisibility = (field) => {
  if (field === 'password') {
    passwordVisible.value = !passwordVisible.value
  } else {
    confirmPasswordVisible.value = !confirmPasswordVisible.value
  }
}

// 表单字段验证状态
const getFieldStatus = (field) => {
  if (formErrors.value[field]) {
    return 'error'
  }
  if (form.value[field]) {
    return 'success'
  }
  return ''
}

const handleRegister = async () => {
  try {
    loading.value = true
    await userStore.register(
      form.value.username,
      form.value.email,
      form.value.password
    )
    ElMessage.success(t('auth.success.register'))
    // 不再自动登录，显示验证邮件提示
    ElMessageBox.alert(
      t('auth.emailVerification.checkInbox'),
      t('auth.emailVerification.required'),
      {
        confirmButtonText: t('common.ok'),
        type: 'success',
        showClose: false
      }
    )
    // 切换到登录表单
    isLogin.value = true
  } catch (error) {
    if (error.code === 203) {
      ElMessage.error(t('auth.register.emailExists'))
    } else if (error.code === 202) {
      ElMessage.error(t('auth.register.usernameExists'))
    } else {
      ElMessage.error(error.message || t('auth.error.register'))
    }
  } finally {
    loading.value = false
  }
}

const handleLogin = async () => {
  try {
    loading.value = true
    await userStore.login(form.value.email, form.value.password)
    ElMessage.success(t('auth.login.success'))
    router.push(router.currentRoute.value.query.redirect || '/')
  } catch (error) {
    if (error.message === 'EMAIL_NOT_VERIFIED') {
      ElMessageBox.confirm(
        t('auth.emailVerification.checkInbox'),
        t('auth.emailVerification.required'),
        {
          confirmButtonText: t('auth.emailVerification.resend'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }
      ).then(() => {
        handleResendVerification()
      }).catch(() => {})
    } else if (error.code === 211) {
      ElMessage.error(t('auth.login.invalidCredentials'))
    } else if (error.code === 219) {
      ElMessage.error(t('auth.login.tooManyAttempts'))
    } else {
      ElMessage.error(error.message || t('auth.login.failed'))
    }
  } finally {
    loading.value = false
  }
}

const handleResendVerification = async () => {
  try {
    loading.value = true
    await userStore.resendVerificationEmail(form.value.email)
    ElMessage.success(t('auth.emailVerification.sent'))
  } catch (error) {
    ElMessage.error(error.message || t('auth.emailVerification.failed'))
  } finally {
    loading.value = false
  }
}

// 谷歌登录相关
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
let googleAuth = null

onMounted(() => {
  // 加载新版本的 Google Identity Services
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  document.head.appendChild(script)

  script.onload = () => {
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      ux_mode: 'popup',
      itp_support: true
    })

    // 配置按钮
    window.google.accounts.id.renderButton(
      document.getElementById('google-login-button'),
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '100%'
      }
    )
  }
})

const handleGoogleCredentialResponse = async (response) => {
  try {
    if (!response.credential) {
      console.error('No credential received')
      ElMessage.error(t('auth.errors.googleLogin'))
      return
    }

    // 解码 JWT token 获取用户信息
    const base64Url = response.credential.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))

    const { sub, email, name, picture } = JSON.parse(jsonPayload)

    const userData = {
      id: sub,
      email,
      name,
      picture,
      access_token: response.credential
    }

    await userStore.loginWithGoogle(userData)
    ElMessage.success(t('auth.success.googleLogin'))
    router.push('/')
  } catch (error) {
    console.error('Google login error:', error)
    ElMessage.error(t('auth.errors.googleLogin'))
  }
}

const handleGoogleLogin = () => {
  window.google.accounts.id.prompt()
}
</script>

<template>
  <div class="auth-page">
    <TheNavbar />
    
    <div class="auth-container">
      <div class="auth-card glass">
        <div class="auth-header">
          <h2 class="auth-title gradient-text">{{ t(isLogin ? 'auth.title.welcome' : 'auth.title.join') }}</h2>
          <p class="auth-subtitle">{{ isLogin ? t('auth.title.login') : t('auth.title.register') }}</p>
        </div>
        
        <!-- 添加新用户福利提示 -->
        <div v-if="!isLogin" class="new-user-benefits">
          <h3 class="benefits-title">{{ t('auth.newUserBenefits.title') }}</h3>
          <div class="benefits-items">
            <div class="benefit-item">
              <div class="benefit-icon">🎁</div>
              <div class="benefit-text">{{ t('auth.newUserBenefits.points') }}</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">⭐️</div>
              <div class="benefit-text">{{ t('auth.newUserBenefits.membership') }}</div>
            </div>
          </div>
          <p class="benefits-description">{{ t('auth.newUserBenefits.description') }}</p>
        </div>

        <div v-if="!isLogin" class="avatar-upload">
          <div class="avatar-tip">{{ t('auth.form.avatar.tip') }}</div>
          <div 
            class="avatar-wrapper"
            :class="{ 
              'is-loading': loading,
              'has-error': formErrors.avatar 
            }"
            @click="triggerAvatarUpload"
          >
            <template v-if="form.avatar">
              <img :src="form.avatar" class="avatar-preview" :alt="t('auth.form.avatar.upload')" />
            </template>
            <template v-else>
              <div class="default-avatar" :style="{ backgroundColor: avatarUrl.backgroundColor }">
                <span class="avatar-text">{{ avatarUrl.text }}</span>
              </div>
            </template>
            <div class="upload-overlay">
              <el-icon><Plus /></el-icon>
              <span>{{ form.avatar ? t('auth.form.avatar.change') : t('auth.form.avatar.upload') }}</span>
            </div>
          </div>
          <input
            ref="avatarInput"
            type="file"
            accept=".jpg,.jpeg,.png"
            style="display: none"
            @change="handleAvatarUpload"
          />
          <div v-if="formErrors.avatar" class="error-message text-center">{{ t(formErrors.avatar) }}</div>
        </div>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div v-if="!isLogin" class="form-group" :class="{ 'has-error': formErrors.username }">
            <label>{{ t('auth.form.username.label') }}</label>
            <div class="input-wrapper">
              <el-icon><User /></el-icon>
              <input
                v-model="form.username"
                type="text"
                :placeholder="t('auth.form.username.placeholder')"
                :class="{ 'is-invalid': formErrors.username }"
              />
            </div>
            <span class="error-message" v-if="formErrors.username">{{ formErrors.username }}</span>
          </div>
          
          <div class="form-group" :class="{ 'has-error': formErrors.email }">
            <label>{{ t('auth.form.email.label') }}</label>
            <div class="input-wrapper">
              <el-icon><Message /></el-icon>
              <input
                v-model="form.email"
                type="email"
                :placeholder="t('auth.form.email.placeholder')"
                :class="{ 'is-invalid': formErrors.email }"
              />
            </div>
            <span class="error-message" v-if="formErrors.email">{{ formErrors.email }}</span>
          </div>
          
          <div class="form-group" :class="{ 'has-error': formErrors.password }">
            <label>{{ t('auth.form.password.label') }}</label>
            <div class="input-wrapper">
              <el-icon><Lock /></el-icon>
              <input
                v-model="form.password"
                :type="passwordVisible ? 'text' : 'password'"
                :placeholder="t('auth.form.password.placeholder')"
                :class="{ 'is-invalid': formErrors.password }"
              />
              <button 
                type="button"
                class="toggle-password"
                @click="togglePasswordVisibility('password')"
              >
                <el-icon>
                  <component :is="passwordVisible ? 'View' : 'Hide'" />
                </el-icon>
              </button>
            </div>
            <span class="error-message" v-if="formErrors.password">{{ formErrors.password }}</span>
          </div>

          <div v-if="!isLogin" class="form-group" :class="{ 'has-error': formErrors.confirmPassword }">
            <label>{{ t('auth.form.confirmPassword.label') }}</label>
            <div class="input-wrapper">
              <el-icon><Lock /></el-icon>
              <input
                v-model="form.confirmPassword"
                :type="confirmPasswordVisible ? 'text' : 'password'"
                :placeholder="t('auth.form.confirmPassword.placeholder')"
                :class="{ 'is-invalid': formErrors.confirmPassword }"
              />
              <button 
                type="button"
                class="toggle-password"
                @click="togglePasswordVisibility('confirmPassword')"
              >
                <el-icon>
                  <component :is="confirmPasswordVisible ? 'View' : 'Hide'" />
                </el-icon>
              </button>
            </div>
            <span class="error-message" v-if="formErrors.confirmPassword">{{ formErrors.confirmPassword }}</span>
          </div>

          <button 
            type="submit"
            class="submit-btn"
            :disabled="loading"
            :class="{ 'loading': loading }"
          >
            <span class="btn-text">{{ t(isLogin ? 'auth.buttons.login' : 'auth.buttons.register') }}</span>
            <span class="loading-spinner" v-if="loading"></span>
          </button>
        </form>

        <div class="auth-footer">
          <span class="switch-mode" @click="switchMode">
            {{ t(isLogin ? 'auth.buttons.noAccount' : 'auth.buttons.hasAccount') }}
          </span>
          <div class="footer-links">
            <span v-if="isLogin" class="forgot-password" @click="router.push('/reset-password')">
              {{ t('auth.buttons.forgotPassword') }}
            </span>
            <span v-if="isLogin" class="verify-email" @click="resendVerificationEmail">
              {{ t('auth.errors.requestEmailVerification') }}
            </span>
          </div>
        </div>

        <!-- 添加分割线 -->
        <div class="divider">
          <span>{{ t('auth.or') }}</span>
        </div>
        
        <!-- 谷歌登录按钮 -->
        <div 
          id="google-login-button"
          class="google-login-wrapper"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
  padding: 80px 1rem;
}

.auth-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.auth-card {
  background: var(--glass-background);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: var(--text-color-light);
  font-size: 1rem;
}

.new-user-benefits {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.benefits-title {
  color: #FFD700;
  font-size: 1.2rem;
  margin-bottom: 16px;
  font-weight: 600;
}

.benefits-items {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
}

.benefit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.benefit-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.benefit-text {
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
}

.benefits-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-top: 12px;
}

.avatar-upload {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar-tip {
  color: var(--primary-color);
  font-weight: 500;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem 1rem;
  background: rgba(var(--primary-color-rgb), 0.1);
  border-radius: 0.5rem;
  width: fit-content;
}

.default-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  font-weight: 600;
  text-transform: uppercase;
  
  .avatar-text {
    line-height: 1;
  }
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid var(--border-color);
  background: var(--glass-background);
  
  &:hover .upload-overlay {
    opacity: 1;
  }
  
  &.is-loading {
    opacity: 0.7;
    pointer-events: none;
  }
  
  &:hover {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px var(--primary-color-alpha);
  }
  
  &.has-error {
    border-color: var(--error-color);
    box-shadow: 0 0 0 2px rgba(var(--error-color-rgb), 0.1);
  }
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  gap: 0.5rem;
  
  .el-icon {
    font-size: 1.5rem;
  }
  
  span {
    font-size: 0.875rem;
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &.has-error {
    .input-wrapper {
      border-color: var(--error-color);
    }
  }
}

.form-group label {
  font-size: 0.875rem;
  color: var(--text-color);
  font-weight: 500;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--glass-background);
  transition: all 0.3s ease;
  
  &:focus-within {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color-alpha);
  }
  
  .el-icon {
    padding: 0 0.75rem;
    color: var(--text-color-light);
  }
}

.input-wrapper input {
  flex: 1;
  padding: 0.75rem 0;
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: 1rem;
  
  &::placeholder {
    color: var(--text-color-light);
  }
  
  &:focus {
    outline: none;
  }
  
  &.is-invalid {
    color: var(--error-color);
  }
}

.toggle-password {
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  color: var(--text-color-light);
  cursor: pointer;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--text-color);
  }
}

.error-message {
  font-size: 0.875rem;
  color: var(--error-color);
  margin-top: 0.5rem;
  font-weight: 500;
  background: rgba(var(--error-color-rgb), 0.1);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  width: fit-content;
}

.submit-btn {
  position: relative;
  padding: 0.875rem;
  border-radius: 0.5rem;
  border: none;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--primary-color-alpha);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  &.loading {
    .btn-text {
      opacity: 0;
    }
    
    .loading-spinner {
      opacity: 1;
    }
  }
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  opacity: 0;
  animation: spin 0.8s linear infinite;
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.switch-mode,
.forgot-password,
.verify-email {
  color: var(--primary-color);
  cursor: pointer;
  font-size: 0.875rem;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--accent-color);
    text-decoration: underline;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
  }
  
  .auth-title {
    font-size: 1.5rem;
  }
  
  .avatar-wrapper {
    width: 100px;
    height: 100px;
  }
}

.text-center {
  text-align: center;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--border-color);
  }
  
  span {
    padding: 0 1rem;
    color: var(--text-color-secondary);
    font-size: 0.875rem;
  }
}

.google-login-wrapper {
  width: 100%;
  margin-top: 1rem;
  min-height: 40px;
  display: flex;
  justify-content: center;
}
</style> 