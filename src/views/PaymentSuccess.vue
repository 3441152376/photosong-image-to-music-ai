<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { handlePaymentSuccess } from '../services/payment'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import TheNavbar from '../components/TheNavbar.vue'
import AV from 'leancloud-storage'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const userStore = useUserStore()
const loading = ref(true)
const paymentResult = ref(null)

onMounted(async () => {
  const sessionId = route.query.session_id
  
  if (!sessionId) {
    ElMessage.error(t('payment.error.noSession'))
    router.push('/')
    return
  }

  try {
    const result = await handlePaymentSuccess(sessionId)
    paymentResult.value = result.result
    
    // 更新用户数据
    await userStore.$patch(result.user)
    
    // 显示成功消息
    ElMessage.success({
      message: paymentSuccessMessage.value,
      type: 'success',
      duration: 5000
    })

    // 延迟一段时间后再次检查数据更新
    setTimeout(async () => {
      const currentUser = AV.User.current()
      if (currentUser) {
        await currentUser.fetch({
          include: [
            'points',
            'membershipEnd',
            'membershipPlan',
            'membershipStart',
            'membershipStatus',
            'subscriptionId',
            'subscriptionStatus',
            'paymentStats',
            'lastPaymentAt'
          ]
        })
        await userStore.$patch(currentUser.toJSON())
      }
    }, 2000)
  } catch (error) {
    console.error('Payment processing failed:', error)
    
    // 处理重复处理的错误
    if (error.message.includes('该支付已处理完成')) {
      ElMessage.warning({
        message: error.message,
        type: 'warning',
        duration: 5000
      })
      // 延迟后跳转到首页
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } else {
      ElMessage.error(t('payment.error.processing'))
    }
  } finally {
    loading.value = false
  }
})

const handleBackToHome = () => {
  router.push('/')
}

const handleGoToProfile = () => {
  router.push('/profile')
}

const paymentSuccessMessage = computed(() => {
  if (!paymentResult.value) return ''
  
  const { type, points, plan } = paymentResult.value
  const user = userStore.currentUser
  
  if (type === 'points') {
    const currentPoints = user?.points || 0
    return t('payment.notification.pointsAdded', { points, total: currentPoints })
  } else {
    const endDate = user?.membershipEnd?.iso || user?.membershipEndDate?.endDate
    return t('payment.notification.membershipUpdated', { 
      plan,
      endDate: new Date(endDate).toLocaleDateString()
    })
  }
})
</script>

<template>
  <div class="payment-success">
    <TheNavbar />
    
    <div class="success-container">
      <div v-if="loading" class="loading-state">
        <el-icon class="loading-icon" :size="48">
          <div class="animate-spin">
            <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </el-icon>
        <p class="loading-text">{{ t('payment.status.processing') }}</p>
      </div>
      
      <div v-else class="success-content">
        <div class="success-icon-wrapper">
          <el-icon class="success-icon" :size="64">
            <Check />
          </el-icon>
        </div>
        
        <h1 class="success-title">{{ t('payment.status.successTitle') }}</h1>
        <p class="success-message">{{ paymentSuccessMessage }}</p>
        
        <div class="action-buttons">
          <el-button type="primary" @click="handleGoToProfile" class="profile-btn">
            {{ t('payment.status.viewProfile') }}
          </el-button>
          <el-button @click="handleBackToHome" class="home-btn">
            {{ t('payment.status.backToHome') }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-success {
  min-height: 100vh;
  background: rgb(19, 28, 46);
  color: #e5e7eb;
}

.success-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 4rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-icon {
  color: #10b981;
}

.loading-text {
  font-size: 1.125rem;
  color: #94a3b8;
}

.success-content {
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

.success-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.2);
  margin: 0 auto 2rem;
}

.success-icon {
  color: #10b981;
}

.success-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.success-message {
  font-size: 1.125rem;
  color: #94a3b8;
  margin-bottom: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.profile-btn {
  background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

.home-btn {
  background: transparent;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .success-container {
    padding: 2rem 1rem;
  }
  
  .success-title {
    font-size: 1.5rem;
  }
  
  .success-message {
    font-size: 1rem;
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .profile-btn,
  .home-btn {
    width: 100%;
  }
}
</style> 