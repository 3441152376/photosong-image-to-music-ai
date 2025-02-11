<template>
  <div class="register-container">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      class="register-form"
      @submit.prevent="handleSubmit"
    >
      <!-- 头像上传区域 -->
      <div class="avatar-upload-section" ref="avatarSectionRef">
        <div class="avatar-upload-title">
          <span class="required-star">*</span>
          {{ $t('auth.form.avatar.label') }}
        </div>
        <div 
          class="avatar-upload-area"
          :class="{ 
            'no-avatar': !form.avatar,
            'error-border': showAvatarError 
          }"
          @click="handleAvatarClick"
        >
          <template v-if="form.avatar">
            <img :src="form.avatar" class="avatar-preview" />
            <div class="avatar-change-mask">
              <el-icon><Edit /></el-icon>
              {{ $t('auth.form.avatar.change') }}
            </div>
          </template>
          <template v-else>
            <el-icon class="upload-icon"><Plus /></el-icon>
            <div class="upload-text">{{ $t('auth.form.avatar.upload') }}</div>
          </template>
        </div>
        <div class="avatar-tip" :class="{ 'error': showAvatarError }">
          {{ showAvatarError ? $t('auth.validation.avatar.required') : $t('auth.form.avatar.tip') }}
        </div>
      </div>

      <!-- 其他表单项 -->
      <el-form-item prop="email">
        <el-input
          v-model="form.email"
          :placeholder="$t('auth.form.email.placeholder')"
        />
      </el-form-item>
      
      <!-- ... 其他表单项 ... -->

      <!-- 注册按钮 -->
      <el-form-item>
        <el-button
          type="primary"
          class="submit-btn"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ $t('auth.buttons.register') }}
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 头像上传弹窗 -->
    <AvatarUploadDialog
      :visible="showAvatarDialog"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogCancel"
    />

    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInputRef"
      type="file"
      class="avatar-upload-input"
      accept="image/jpeg,image/png"
      @change="handleFileChange"
      hidden
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Plus } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import AvatarUploadDialog from '@/components/AvatarUploadDialog.vue'

const { t } = useI18n()
const formRef = ref(null)
const avatarSectionRef = ref(null)
const fileInputRef = ref(null)
const loading = ref(false)
const showAvatarDialog = ref(false)
const showAvatarError = ref(false)

const form = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  avatar: ''
})

// 表单验证规则
const rules = {
  email: [
    { required: true, message: t('auth.validation.email.required'), trigger: 'blur' },
    { type: 'email', message: t('auth.validation.email.invalid'), trigger: 'blur' }
  ],
  // ... 其他验证规则 ...
}

// 处理头像点击
const handleAvatarClick = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 验证文件类型和大小
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    ElMessage.error(t('auth.validation.avatar.format'))
    return
  }
  
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error(t('auth.validation.avatar.size'))
    return
  }

  // 创建预览URL
  form.avatar = URL.createObjectURL(file)
  showAvatarError.value = false
  
  // 显示成功消息
  ElMessage.success(t('auth.validation.avatar.success'))
}

// 处理表单提交
const handleSubmit = async () => {
  if (!form.avatar) {
    showAvatarError.value = true
    showAvatarDialog.value = true
    // 滚动到头像上传区域
    avatarSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  try {
    loading.value = true
    await formRef.value?.validate()
    // ... 提交逻辑 ...
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 处理弹窗确认
const handleDialogConfirm = () => {
  showAvatarDialog.value = false
  handleAvatarClick()
}

// 处理弹窗取消
const handleDialogCancel = () => {
  showAvatarDialog.value = false
  ElMessage({
    type: 'warning',
    message: t('auth.validation.avatar.required'),
    duration: 5000,
    showClose: true,
    offset: 80
  })
  // 保持错误状态
  showAvatarError.value = true
  // 聚焦到头像上传区域
  avatarSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// 在组件挂载时检查是否需要显示头像上传提示
onMounted(() => {
  if (!form.avatar) {
    showAvatarError.value = true
  }
})
</script>

<style scoped>
.register-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.avatar-upload-section {
  margin-bottom: 24px;
  text-align: center;
}

.avatar-upload-title {
  text-align: left;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.required-star {
  color: var(--el-color-danger);
  margin-right: 4px;
}

.avatar-upload-area {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border: 2px dashed var(--el-border-color);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.avatar-upload-area:hover {
  border-color: var(--el-color-primary);
}

.avatar-upload-area.no-avatar:hover {
  background: var(--el-fill-color-lighter);
}

.avatar-upload-area.error-border {
  border-color: var(--el-color-danger);
  animation: shake 0.5s ease-in-out;
}

.upload-icon {
  font-size: 32px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-change-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-upload-area:hover .avatar-change-mask {
  opacity: 1;
}

.avatar-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transition: color 0.3s;
}

.avatar-tip.error {
  color: var(--el-color-danger);
  font-weight: 500;
}

.submit-btn {
  width: 100%;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}
</style> 