<template>
  <div class="payment-cancel">
    <TheNavbar />
    <div class="container">
      <div class="card">
        <!-- 头部区域 -->
        <div class="card-header">
          <div class="header-content">
            <div class="icon-wrapper">
              <XCircleIcon class="icon-error" />
            </div>
            <h2 class="title">
              {{ t('payment.cancel.title') }}
            </h2>
            <p class="message">
              {{ t('payment.cancel.message') }}
            </p>
          </div>
        </div>

        <!-- 表单区域 -->
        <div class="card-body">
          <!-- 取消原因 -->
          <div class="form-group">
            <label class="form-label">
              {{ t('payment.cancel.reasonLabel') }}
            </label>
            <select
              v-model="cancelReason"
              class="form-select"
            >
              <option value="">{{ t('payment.cancel.selectReason') }}</option>
              <option v-for="reason in cancelReasons" :key="reason" :value="reason">
                {{ t(`payment.cancel.reasons.${reason}`) }}
              </option>
            </select>
          </div>

          <!-- 其他原因反馈 -->
          <div v-if="cancelReason === 'other'" class="form-group">
            <label class="form-label">
              {{ t('payment.cancel.feedbackLabel') }}
            </label>
            <textarea
              v-model="feedback"
              rows="3"
              class="form-textarea"
              :placeholder="t('payment.cancel.feedbackPlaceholder')"
            ></textarea>
          </div>

          <!-- 按钮组 -->
          <div class="button-group">
            <button
              @click="handleRetry"
              class="btn btn-primary"
            >
              <ArrowPathIcon class="btn-icon" />
              {{ t('payment.cancel.retry') }}
            </button>

            <button
              @click="handleBack"
              class="btn btn-secondary"
            >
              <ArrowLeftIcon class="btn-icon" />
              {{ t('payment.cancel.backToHome') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 支持信息 -->
      <div class="support-info">
        <p class="support-text">
          {{ t('payment.cancel.supportMessage') }}
          <a 
            href="mailto:	wuyanzu@photosong.com" 
            class="support-link"
          >	
          wuyanzu@photosong.com
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { XCircleIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { API_BASE_URL } from '@/config/constants'
import TheNavbar from '../components/TheNavbar.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

// 取消原因选项
const cancelReasons = ['price', 'features', 'technical', 'temporary', 'other']
const cancelReason = ref('')
const feedback = ref('')

// 记录取消原因
const recordCancellation = async () => {
  if (!cancelReason.value) return

  try {
    const sessionId = route.query.session_id
    if (!sessionId) return

    const cancellationData = {
      sessionId,
      reason: cancelReason.value,
      feedback: feedback.value,
      timestamp: new Date().toISOString(),
      language: locale.value
    }

    await fetch(`${API_BASE_URL}/api/payment/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      },
      body: JSON.stringify(cancellationData)
    })
  } catch (error) {
    console.error('Failed to record cancellation:', error)
  }
}

// 处理重试支付
const handleRetry = async () => {
  try {
    await recordCancellation()
    router.push(`/${locale.value}/pricing`)
  } catch (error) {
    console.error('Retry payment failed:', error)
  }
}

// 处理返回首页
const handleBack = async () => {
  try {
    await recordCancellation()
    router.push(`/${locale.value}`)
  } catch (error) {
    console.error('Back to home failed:', error)
  }
}

// 在组件卸载前记录取消原因
onBeforeUnmount(() => {
  if (cancelReason.value) {
    recordCancellation()
  }
})
</script>

<style scoped>
.payment-cancel {
  min-height: 100vh;
  background: rgb(19 28 46);
  padding-top: 64px; /* Add padding to prevent navbar overlap */
  color: #e5e7eb;
}

.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 48px 16px;
  position: relative; /* Ensure proper stacking context */
  z-index: 1; /* Place content above navbar */
}

.card {
  background: rgb(26 36 58);  /* 稍微浅一点的深蓝色 */
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 1px solid rgb(37 49 75);
  overflow: hidden;
}

.card-header {
  padding: 24px;
  background: linear-gradient(to right, rgba(244, 63, 94, 0.1), rgba(234, 179, 8, 0.1));
  border-bottom: 1px solid rgb(37 49 75);
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.icon-wrapper {
  padding: 12px;
  background: rgba(244, 63, 94, 0.15);
  border-radius: 50%;
  margin-bottom: 16px;
}

.icon-error {
  width: 32px;
  height: 32px;
  color: #f43f5e;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
  background: linear-gradient(to right, #f43f5e, #eab308);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.message {
  color: rgb(148 163 184);
  font-size: 16px;
  line-height: 1.5;
}

.card-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #e5e7eb;
  margin-bottom: 8px;
}

.form-select,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid rgb(37 49 75);
  border-radius: 8px;
  background: rgb(19 28 46);
  color: #e5e7eb;
  transition: all 0.3s ease;
}

.form-select:focus,
.form-textarea:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  outline: none;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
}

.btn-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.btn-primary {
  background: linear-gradient(to right, rgb(59 130 246), rgb(96 165 250));
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.btn-primary:hover {
  background: linear-gradient(to right, rgb(37 99 235), rgb(59 130 246));
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgb(26 36 58);
  color: #e5e7eb;
  border: 1px solid rgb(37 49 75);
}

.btn-secondary:hover {
  background: rgb(19 28 46);
  border-color: rgb(51 65 85);
}

.support-info {
  margin-top: 24px;
  text-align: center;
}

.support-text {
  font-size: 14px;
  color: rgb(148 163 184);
}

.support-link {
  color: rgb(96 165 250);
  text-decoration: none;
  transition: all 0.3s ease;
}

.support-link:hover {
  color: rgb(147 197 253);
  text-decoration: underline;
}

@media (max-width: 480px) {
  .payment-cancel {
    padding-top: 56px; /* Adjust padding for mobile navbar height */
  }

  .container {
    padding: 24px 16px;
  }
  
  .title {
    font-size: 20px;
  }
  
  .message {
    font-size: 14px;
  }
  
  .card-body {
    padding: 20px;
  }
  
  .btn {
    padding: 10px 16px;
    font-size: 14px;
  }
}
</style> 