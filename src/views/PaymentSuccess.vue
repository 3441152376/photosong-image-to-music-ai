<template>
  <div class="payment-success">
    <div class="status-container" v-if="!isProcessing && status === 'success'">
      <el-icon class="success-icon"><Check /></el-icon>
      <h1>{{ t('payment.success.title') }}</h1>
      <p>{{ t('payment.success.message') }}</p>
      <el-button type="primary" @click="handleContinue">
        {{ t('payment.success.continue') }}
      </el-button>
    </div>
    
    <div class="status-container" v-else-if="isProcessing">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <h1>{{ t('payment.status.processing') }}</h1>
      <p>{{ t('payment.status.processingMessage') }}</p>
      <el-progress :percentage="progress" />
    </div>
    
    <div class="status-container" v-else>
      <el-icon class="error-icon"><Close /></el-icon>
      <h1>{{ t('payment.status.failed') }}</h1>
      <p>{{ t('payment.status.failedMessage') }}</p>
      <el-button type="primary" @click="handleRetry">
        {{ t('payment.status.retry') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { handlePaymentSuccess } from '../services/payment'
import { Check, Close, Loading } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const status = ref('')
const isProcessing = ref(true)
const progress = ref(0)

// 处理支付结果
const processPayment = async () => {
  const sessionId = route.query.session_id
  
  if (!sessionId) {
    ElMessage.error(t('payment.error.noSession'))
    router.push('/')
    return
  }
  
  try {
    // 显示处理进度
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 10
      }
    }, 1000)
    
    // 处理支付
    const success = await handlePaymentSuccess(sessionId)
    
    // 清理进度条
    clearInterval(progressInterval)
    progress.value = 100
    
    // 更新状态
    isProcessing.value = false
    status.value = success ? 'success' : 'failed'
    
  } catch (error) {
    console.error('Payment processing failed:', error)
    isProcessing.value = false
    status.value = 'failed'
    ElMessage.error(t('payment.status.error'))
  }
}

// 继续按钮处理
const handleContinue = () => {
  router.push('/profile')
}

// 重试按钮处理
const handleRetry = () => {
  isProcessing.value = true
  progress.value = 0
  processPayment()
}

onMounted(() => {
  processPayment()
})
</script>

<style scoped>
.payment-success {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem;
}

.status-container {
  text-align: center;
  max-width: 400px;
}

.success-icon {
  font-size: 4rem;
  color: var(--el-color-success);
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 4rem;
  color: var(--el-color-danger);
  margin-bottom: 1rem;
}

.loading-icon {
  font-size: 4rem;
  color: var(--el-color-primary);
  margin-bottom: 1rem;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

h1 {
  margin: 1rem 0;
  font-size: 1.5rem;
  color: var(--el-text-color-primary);
}

p {
  margin-bottom: 2rem;
  color: var(--el-text-color-regular);
}

.el-progress {
  margin: 2rem 0;
}
</style>
