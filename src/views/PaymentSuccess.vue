<template>
  <div class="payment-success">
    <div class="success-card glass-card">
      <el-icon class="success-icon"><Check /></el-icon>
      <h1>{{ t('payment.success.title') }}</h1>
      <p>{{ t('payment.success.message') }}</p>
      <el-button type="primary" @click="router.push('/dashboard')">
        {{ t('payment.success.continue') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Check } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

onMounted(() => {
  const sessionId = route.query.session_id
  if (!sessionId) {
    router.push('/pricing')
  }
})
</script>

<style scoped>
.payment-success {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--page-background);
}

.success-card {
  text-align: center;
  padding: 3rem;
  max-width: 400px;
  width: 100%;
}

.success-icon {
  font-size: 4rem;
  color: var(--success-color);
  margin-bottom: 1.5rem;
}

h1 {
  font-size: 1.5rem;
  color: var(--text-color);
  margin-bottom: 1rem;
}

p {
  color: var(--text-color-light);
  margin-bottom: 2rem;
}
</style>
