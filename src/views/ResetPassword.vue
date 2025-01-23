<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Message, Check } from '@element-plus/icons-vue'
import TheNavbar from '../components/TheNavbar.vue'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

const email = ref('')
const loading = ref(false)
const emailError = ref('')
const resetSent = ref(false)

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const handleSubmit = async () => {
  // 重置错误状态
  emailError.value = ''
  
  // 验证邮箱
  if (!email.value) {
    emailError.value = t('auth.resetPassword.errors.emailRequired')
    return
  }
  
  if (!validateEmail(email.value)) {
    emailError.value = t('auth.resetPassword.errors.emailInvalid')
    return
  }
  
  try {
    loading.value = true
    await userStore.resetPassword(email.value)
    resetSent.value = true
    ElMessage.success(t('auth.resetPassword.success.message'))
  } catch (error) {
    console.error('Reset password failed:', error)
    ElMessage.error(error.message || t('auth.resetPassword.errors.resetFailed'))
  } finally {
    loading.value = false
  }
}

const backToLogin = () => {
  router.push('/auth')
}
</script>

<template>
  <div class="reset-password-page">
    <TheNavbar />
    
    <div class="reset-password-container">
      <div class="reset-password-card glass">
        <div class="card-header">
          <h2 class="title gradient-text">{{ t('auth.resetPassword.title') }}</h2>
          <p class="subtitle">
            {{ resetSent ? t('auth.resetPassword.success.title') : t('auth.resetPassword.subtitle') }}
          </p>
        </div>
        
        <template v-if="!resetSent">
          <form @submit.prevent="handleSubmit" class="reset-form">
            <div class="form-group" :class="{ 'has-error': emailError }">
              <label>{{ t('auth.resetPassword.form.email.label') }}</label>
              <div class="input-wrapper">
                <el-icon><Message /></el-icon>
                <input
                  v-model="email"
                  type="email"
                  :placeholder="t('auth.resetPassword.form.email.placeholder')"
                  :class="{ 'is-invalid': emailError }"
                />
              </div>
              <span class="error-message" v-if="emailError">{{ emailError }}</span>
            </div>

            <button 
              type="submit"
              class="submit-btn"
              :disabled="loading"
              :class="{ 'loading': loading }"
            >
              <span class="btn-text">{{ t('auth.resetPassword.buttons.submit') }}</span>
              <span class="loading-spinner" v-if="loading"></span>
            </button>
          </form>
        </template>
        
        <template v-else>
          <div class="success-message">
            <div class="icon-wrapper">
              <el-icon class="success-icon"><Check /></el-icon>
            </div>
            <p class="message">
              {{ t('auth.resetPassword.success.message') }}
            </p>
            <p class="tip">
              {{ t('auth.resetPassword.success.tip') }}
            </p>
          </div>
        </template>
        
        <div class="card-footer">
          <span class="back-link" @click="backToLogin">
            {{ t('auth.resetPassword.buttons.backToLogin') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.reset-password-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
  padding: 80px 1rem;
}

.reset-password-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.reset-password-card {
  background: var(--glass-background);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-color-light);
  font-size: 1rem;
}

.reset-form {
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

.error-message {
  font-size: 0.75rem;
  color: var(--error-color);
  margin-top: 0.25rem;
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

.success-message {
  text-align: center;
  padding: 2rem 0;
  
  .icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--success-color);
    margin-bottom: 1.5rem;
  }
  
  .success-icon {
    font-size: 32px;
    color: white;
  }
  
  .message {
    font-size: 1rem;
    color: var(--text-color);
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  
  .tip {
    font-size: 0.875rem;
    color: var(--text-color-light);
  }
}

.card-footer {
  margin-top: 1.5rem;
  text-align: center;
}

.back-link {
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
  .reset-password-card {
    padding: 1.5rem;
  }
  
  .title {
    font-size: 1.5rem;
  }
}
</style> 