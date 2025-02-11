<template>
  <el-dialog
    :modelValue="visible"
    :title="$t('auth.form.avatar.dialog.title')"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    width="400px"
    class="avatar-upload-dialog"
  >
    <div class="dialog-content">
      <el-icon class="warning-icon"><WarningFilled /></el-icon>
      <div class="message">{{ $t('auth.form.avatar.dialog.content') }}</div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">
          {{ $t('auth.form.avatar.dialog.cancel') }}
        </el-button>
        <el-button type="primary" @click="handleConfirm" class="confirm-btn">
          {{ $t('auth.form.avatar.dialog.confirm') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { WarningFilled } from '@element-plus/icons-vue'

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.avatar-upload-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  text-align: center;
  font-weight: bold;
  padding: 20px;
  background-color: var(--el-color-warning-light-9);
  border-bottom: 1px solid var(--el-color-warning-light-5);
}

.avatar-upload-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  color: var(--el-color-warning-dark-2);
}

.dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  animation: fadeIn 0.3s ease-in-out;
}

.warning-icon {
  font-size: 56px;
  color: var(--el-color-warning);
  margin-bottom: 20px;
  animation: bounce 1s ease-in-out infinite;
}

.message {
  text-align: center;
  color: var(--el-text-color-primary);
  line-height: 1.6;
  font-size: 15px;
  max-width: 300px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 10px 20px 20px;
}

.confirm-btn {
  padding-left: 25px;
  padding-right: 25px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.avatar-upload-dialog :deep(.el-dialog) {
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.avatar-upload-dialog :deep(.el-button) {
  padding: 12px 24px;
  font-size: 15px;
}
</style> 