<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import TheNavbar from '../components/TheNavbar.vue'
import TheFooter from '../components/TheFooter.vue'

const { t } = useI18n()

const feedbackForm = ref({
  type: '',
  title: '',
  description: '',
  screenshot: null,
  email: ''
})

const loading = ref(false)

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
  try {
    loading.value = true
    // TODO: 实现发送反馈的逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success(t('feedback.success'))
    feedbackForm.value = {
      type: '',
      title: '',
      description: '',
      screenshot: null,
      email: ''
    }
  } catch (error) {
    ElMessage.error(t('feedback.error'))
  } finally {
    loading.value = false
  }
}

const handleScreenshotUpload = (file) => {
  feedbackForm.value.screenshot = file
  return false // 阻止自动上传
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
          <form @submit.prevent="handleSubmit" class="feedback-form">
            <el-input
              v-model="feedbackForm.title"
              :placeholder="t('feedback.form.title')"
              required
            />
            
            <el-input
              v-model="feedbackForm.description"
              type="textarea"
              :rows="6"
              :placeholder="t('feedback.form.description')"
              required
            />
            
            <div class="form-group">
              <label>{{ t('feedback.form.screenshot') }}</label>
              <el-upload
                class="screenshot-upload"
                drag
                action="#"
                :auto-upload="false"
                :on-change="handleScreenshotUpload"
                accept="image/*"
              >
                <el-icon class="upload-icon"><Upload /></el-icon>
                <div class="upload-text">
                  {{ t('feedback.form.upload') }}
                </div>
              </el-upload>
            </div>
            
            <el-input
              v-model="feedbackForm.email"
              type="email"
              :placeholder="t('feedback.form.email')"
            />
            
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
          </form>
        </div>
      </div>
      
      <div class="other-channels">
        <h2>{{ t('feedback.channels.title') }}</h2>
        <p>{{ t('feedback.channels.description') }}</p>
        <div class="channel-links">
          <a href="#" class="channel-link">
            <el-icon><Message /></el-icon>
            {{ t('feedback.channels.email') }}
          </a>
          <a href="#" class="channel-link">
            <el-icon><ChatDotRound /></el-icon>
            {{ t('feedback.channels.community') }}
          </a>
          <a href="#" class="channel-link">
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
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-color);
  }
}

.screenshot-upload {
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--primary-color);
  }
}

.upload-icon {
  font-size: 2rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.upload-text {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.other-channels {
  text-align: center;
  margin: 4rem 0;
  padding: 3rem;
  background: var(--surface-color);
  border-radius: 1rem;
  border: var(--glass-border);
  
  h2 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
    color: var(--text-color);
  }
  
  p {
    color: var(--text-color-secondary);
    margin-bottom: 2rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
}

.channel-links {
  display: flex;
  gap: 2rem;
  justify-content: center;
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1rem;
  }
}

.channel-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
  
  .el-icon {
    font-size: 1.25rem;
  }
}
</style> 