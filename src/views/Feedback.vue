<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import TheNavbar from '../components/TheNavbar.vue'
import TheFooter from '../components/TheFooter.vue'
import AV from 'leancloud-storage'
import { useUserStore } from '../stores/user'

const { t } = useI18n()
const userStore = useUserStore()

const feedbackForm = ref({
  type: '',
  title: '',
  description: '',
  screenshot: null,
  email: '',
  contact: ''
})

const formRules = {
  type: [{ required: true, message: t('feedback.validation.typeRequired') }],
  title: [
    { required: true, message: t('feedback.validation.titleRequired') },
    { min: 5, message: t('feedback.validation.titleLength') }
  ],
  description: [
    { required: true, message: t('feedback.validation.descriptionRequired') },
    { min: 10, message: t('feedback.validation.descriptionLength') }
  ]
}

const loading = ref(false)
const formRef = ref(null)

const feedbackTypes = [
  {
    value: 'bug',
    label: t('feedback.types.bug'),
    icon: 'Warning'
  },
  {
    value: 'feature',
    label: t('feedback.types.feature'),
    icon: 'Star'
  },
  {
    value: 'improvement',
    label: t('feedback.types.improvement'),
    icon: 'Edit'
  },
  {
    value: 'other',
    label: t('feedback.types.other'),
    icon: 'More'
  }
]

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    // 创建反馈对象
    const Feedback = AV.Object.extend('Feedback')
    const feedback = new Feedback()
    
    // 设置反馈内容
    feedback.set('type', feedbackForm.value.type)
    feedback.set('title', feedbackForm.value.title)
    feedback.set('description', feedbackForm.value.description)
    feedback.set('email', feedbackForm.value.email || '')
    feedback.set('contact', feedbackForm.value.contact || '')
    feedback.set('status', 'pending') // 设置初始状态
    
    // 如果用户已登录，关联用户信息
    if (userStore.isAuthenticated) {
      feedback.set('user', AV.User.current())
    }
    
    // 如果有截图，上传截图
    if (feedbackForm.value.screenshot) {
      const file = new AV.File(
        'feedback_screenshot.jpg',
        feedbackForm.value.screenshot
      )
      try {
        await file.save()
        feedback.set('screenshot', file)
      } catch (error) {
        console.error('Screenshot upload failed:', error)
        ElMessage.warning(t('feedback.screenshotUploadFailed'))
      }
    }
    
    // 保存反馈
    await feedback.save()
    
    ElMessage.success(t('feedback.success'))
    
    // 重置表单
    feedbackForm.value = {
      type: '',
      title: '',
      description: '',
      screenshot: null,
      email: '',
      contact: ''
    }
    formRef.value.resetFields()
    
  } catch (error) {
    console.error('Submit feedback failed:', error)
    if (error.name === 'ValidationError') {
      ElMessage.warning(t('feedback.validation.formInvalid'))
    } else {
      ElMessage.error(t('feedback.error'))
    }
  } finally {
    loading.value = false
  }
}

const handleScreenshotUpload = (file) => {
  // 验证文件大小（最大 5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.warning(t('feedback.validation.screenshotTooLarge'))
    return false
  }
  
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.raw.type)) {
    ElMessage.warning(t('feedback.validation.invalidImageType'))
    return false
  }
  
  feedbackForm.value.screenshot = file.raw
  return false // 阻止自动上传
}

// 清除截图
const clearScreenshot = () => {
  feedbackForm.value.screenshot = null
}
</script>

<template>
  <div class="feedback-page">
    <TheNavbar />
    
    <div class="container">
      <h1 class="page-title">{{ t('feedback.title') }}</h1>
      
      <div class="feedback-content">
        <div class="feedback-intro">
          <h2>{{ t('feedback.intro.title') }}</h2>
          <p>{{ t('feedback.intro.description') }}</p>
          
          <div class="feedback-types">
            <div v-for="type in feedbackTypes" 
                 :key="type.value"
                 class="type-card"
                 :class="{ 'is-active': feedbackForm.type === type.value }"
                 @click="feedbackForm.type = type.value"
            >
              <el-icon class="type-icon">
                <component :is="type.icon" />
              </el-icon>
              <span>{{ type.label }}</span>
            </div>
          </div>
        </div>
        
        <div class="feedback-form-section">
          <el-form
            ref="formRef"
            :model="feedbackForm"
            :rules="formRules"
            @submit.prevent="handleSubmit"
            class="feedback-form"
          >
            <el-form-item prop="type">
              <el-input
                v-model="feedbackForm.type"
                v-show="false"
              />
            </el-form-item>
            
            <el-form-item prop="title">
              <el-input
                v-model="feedbackForm.title"
                :placeholder="t('feedback.form.title')"
              />
            </el-form-item>
            
            <el-form-item prop="description">
              <el-input
                v-model="feedbackForm.description"
                type="textarea"
                :rows="6"
                :placeholder="t('feedback.form.description')"
              />
            </el-form-item>
            
            <div class="form-group">
              <label>{{ t('feedback.form.screenshot') }}</label>
              <el-upload
                class="screenshot-upload"
                drag
                action="#"
                :auto-upload="false"
                :on-change="handleScreenshotUpload"
                accept="image/*"
                :show-file-list="false"
              >
                <template v-if="!feedbackForm.screenshot">
                  <el-icon class="upload-icon"><Upload /></el-icon>
                  <div class="upload-text">
                    {{ t('feedback.form.upload') }}
                  </div>
                </template>
                <template v-else>
                  <div class="preview-container">
                    <img 
                      :src="URL.createObjectURL(feedbackForm.screenshot)" 
                      class="preview-image"
                    />
                    <el-button
                      class="remove-image"
                      circle
                      @click.stop="clearScreenshot"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </template>
              </el-upload>
            </div>
            
            <el-form-item>
              <el-input
                v-model="feedbackForm.email"
                type="email"
                :placeholder="t('feedback.form.email')"
              />
            </el-form-item>
            
            <el-form-item>
              <el-input
                v-model="feedbackForm.contact"
                :placeholder="t('feedback.form.contact')"
              />
            </el-form-item>
            
            <div class="form-actions">
              <el-button 
                type="primary" 
                native-type="submit"
                :loading="loading"
                :disabled="!feedbackForm.type"
              >
                {{ t('feedback.form.submit') }}
              </el-button>
            </div>
          </el-form>
        </div>
      </div>
      
      <div class="other-channels">
        <h2>{{ t('feedback.channels.title') }}</h2>
        <p>{{ t('feedback.channels.description') }}</p>
        <div class="channel-links">
          <a :href="'mailto:' + t('feedback.channels.emailAddress')" class="channel-link">
            <el-icon><Message /></el-icon>
            {{ t('feedback.channels.email') }}
          </a>
          <a :href="t('feedback.channels.communityUrl')" target="_blank" class="channel-link">
            <el-icon><ChatDotRound /></el-icon>
            {{ t('feedback.channels.community') }}
          </a>
          <a :href="t('feedback.channels.supportUrl')" target="_blank" class="channel-link">
            <el-icon><Service /></el-icon>
            {{ t('feedback.channels.support') }}
          </a>
        </div>
      </div>
    </div>
    
    <TheFooter />
  </div>
</template>

<style scoped lang="scss">
.feedback-page {
  min-height: 100vh;
  padding-top: 80px;
}

.feedback-content {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 3rem;
  margin: 3rem 0;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.feedback-intro {
  h2 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  p {
    color: var(--text-color-secondary);
    margin-bottom: 2rem;
    line-height: 1.6;
  }
}

.feedback-types {
  display: grid;
  gap: 1rem;
}

.type-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-color);
  border-radius: 0.75rem;
  border: var(--glass-border);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &.is-active {
    background: rgba(var(--primary-color-rgb), 0.1);
    border-color: var(--primary-color);
    
    .type-icon {
      color: var(--primary-color);
    }
  }
}

.type-icon {
  font-size: 1.5rem;
  color: var(--text-color-secondary);
}

.feedback-form-section {
  background: var(--surface-color);
  border-radius: 1rem;
  padding: 2rem;
  border: var(--glass-border);
}

.feedback-form {
  display: grid;
  gap: 1.5rem;
}

.form-group {
  display: grid;
  gap: 0.5rem;
  
  label {
    color: var(--text-color-secondary);
    font-size: 0.9rem;
  }
}

.screenshot-upload {
  width: 100%;
  
  :deep(.el-upload) {
    width: 100%;
  }
  
  :deep(.el-upload-dragger) {
    width: 100%;
    background: transparent;
    border: 2px dashed var(--border-color);
    
    &:hover {
      border-color: var(--primary-color);
    }
  }
}

.preview-container {
  position: relative;
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .remove-image {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    
    &:hover {
      background: rgba(0, 0, 0, 0.7);
    }
  }
}

.upload-icon {
  font-size: 2rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.upload-text {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.other-channels {
  margin: 4rem 0;
  text-align: center;
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  
  p {
    color: var(--text-color-secondary);
    margin-bottom: 2rem;
  }
}

.channel-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.channel-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color);
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  background: var(--surface-color);
  border-radius: 0.5rem;
  border: var(--glass-border);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
  }
  
  .el-icon {
    font-size: 1.25rem;
    color: var(--primary-color);
  }
}

@media (max-width: 768px) {
  .feedback-content {
    gap: 2rem;
  }
  
  .channel-links {
    flex-direction: column;
    align-items: stretch;
  }
  
  .channel-link {
    justify-content: center;
  }
}
</style> 