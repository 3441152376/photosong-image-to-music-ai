<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const isVisible = ref(false)

const acceptCookies = () => {
  localStorage.setItem('cookieConsent', 'accepted')
  isVisible.value = false
}

const declineCookies = () => {
  localStorage.setItem('cookieConsent', 'declined')
  isVisible.value = false
}

onMounted(() => {
  const consent = localStorage.getItem('cookieConsent')
  if (!consent) {
    isVisible.value = true
  }
})
</script>

<template>
  <div v-if="isVisible" class="cookie-consent">
    <div class="cookie-content">
      <div class="cookie-text">
        <h3>{{ t('cookies.title') }}</h3>
        <p>{{ t('cookies.description') }}</p>
      </div>
      <div class="cookie-actions">
        <button class="btn-accept" @click="acceptCookies">{{ t('cookies.accept') }}</button>
        <button class="btn-decline" @click="declineCookies">{{ t('cookies.decline') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cookie-consent {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--glass-background);
  backdrop-filter: var(--glass-backdrop-filter);
  border-top: var(--glass-border);
  padding: 1rem;
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
}

.cookie-text {
  flex: 1;
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: var(--text-color);
  }
  
  p {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
    line-height: 1.5;
  }
}

.cookie-actions {
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.btn-accept,
.btn-decline {
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  
  &:hover {
    transform: translateY(-1px);
  }
}

.btn-accept {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.4);
  }
}

.btn-decline {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style> 