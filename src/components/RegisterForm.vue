<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { registerUser } from '../api/auth'

const { t } = useI18n()
const error = ref('')
const showLimitError = ref(false)

const handleSubmit = async (formData) => {
  try {
    await registerUser(formData)
    // 注册成功处理
  } catch (err) {
    if (err.message === 'DEVICE_REGISTRATION_LIMIT_REACHED') {
      showLimitError.value = true
      error.value = t('auth.error.deviceLimit')
    } else {
      error.value = t('auth.error.registerFailed')
    }
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto">
    <!-- 设备限制错误提示 -->
    <div v-if="showLimitError" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center mb-2">
        <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <h3 class="text-lg font-medium text-red-800">{{ t('auth.error.deviceLimitTitle') }}</h3>
      </div>
      <p class="text-sm text-red-700">{{ error }}</p>
      <div class="mt-4 text-sm text-red-700">
        <p>{{ t('auth.error.deviceLimitHelp') }}</p>
        <ul class="list-disc list-inside mt-2">
          <li>{{ t('auth.error.deviceLimitOption1') }}</li>
          <li>{{ t('auth.error.deviceLimitOption2') }}</li>
        </ul>
      </div>
    </div>

    <!-- 原有的注册表单内容 -->
    <form @submit.prevent="handleSubmit" class="space-y-6" v-if="!showLimitError">
      <!-- ... 原有的表单内容 ... -->
    </form>

    <!-- 当显示限制错误时的底部操作区 -->
    <div v-if="showLimitError" class="mt-6 flex justify-center space-x-4">
      <button
        type="button"
        @click="$router.push('/login')"
        class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"
      >
        {{ t('auth.login') }}
      </button>
      <button
        type="button"
        @click="$router.push('/contact-support')"
        class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-500"
      >
        {{ t('auth.contactSupport') }}
      </button>
    </div>
  </div>
</template> 