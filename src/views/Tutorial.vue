<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TheNavbar from '../components/TheNavbar.vue'
import TheFooter from '../components/TheFooter.vue'
import { QuestionFilled, Message, ChatDotRound } from '@element-plus/icons-vue'

const { t, locale } = useI18n()

// 生成本地化的路由名称
const getLocalizedRouteName = (baseName) => {
  return `${locale.value}-${baseName}`
}

const tutorials = ref([
  {
    id: 1,
    title: t('tutorial.basics.title'),
    description: t('tutorial.basics.description'),
    steps: [
      {
        title: t('tutorial.basics.step1.title'),
        content: t('tutorial.basics.step1.content'),
        image: '/tutorial/upload.png'
      },
      {
        title: t('tutorial.basics.step2.title'),
        content: t('tutorial.basics.step2.content'),
        image: '/tutorial/generate.png'
      },
      {
        title: t('tutorial.basics.step3.title'),
        content: t('tutorial.basics.step3.content'),
        image: '/tutorial/share.png'
      }
    ]
  },
  {
    id: 2,
    title: t('tutorial.advanced.title'),
    description: t('tutorial.advanced.description'),
    steps: [
      {
        title: t('tutorial.advanced.step1.title'),
        content: t('tutorial.advanced.step1.content'),
        image: '/tutorial/style.png'
      },
      {
        title: t('tutorial.advanced.step2.title'),
        content: t('tutorial.advanced.step2.content'),
        image: '/tutorial/customize.png'
      }
    ]
  }
])
</script>

<template>
  <div class="tutorial-page">
    <TheNavbar />
    
    <div class="container">
      <h1 class="page-title">{{ t('tutorial.title') }}</h1>
      
      <div class="tutorial-sections">
        <div v-for="tutorial in tutorials" :key="tutorial.id" class="tutorial-section">
          <h2 class="section-title">{{ tutorial.title }}</h2>
          <p class="section-description">{{ tutorial.description }}</p>
          
          <div class="steps">
            <div v-for="(step, index) in tutorial.steps" 
                 :key="index" 
                 class="step-card"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <h3>{{ step.title }}</h3>
                <p>{{ step.content }}</p>
                <img :src="step.image" :alt="step.title" class="step-image">
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="help-section">
        <h2>{{ t('tutorial.help.title') }}</h2>
        <p>{{ t('tutorial.help.description') }}</p>
        <div class="help-links">
          <router-link :to="{ name: getLocalizedRouteName('faq') }" class="help-link">
            <el-icon><QuestionFilled /></el-icon>
            {{ t('tutorial.help.faq') }}
          </router-link>
          <router-link :to="{ name: getLocalizedRouteName('contact') }" class="help-link">
            <el-icon><Message /></el-icon>
            {{ t('tutorial.help.contact') }}
          </router-link>
          <router-link :to="{ name: getLocalizedRouteName('feedback') }" class="help-link">
            <el-icon><ChatDotRound /></el-icon>
            {{ t('tutorial.help.feedback') }}
          </router-link>
        </div>
      </div>
    </div>
    
    <TheFooter />
  </div>
</template>

<style scoped lang="scss">
.tutorial-page {
  min-height: 100vh;
  padding-top: 80px;
}

.tutorial-sections {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  margin: 2rem 0;
}

.tutorial-section {
  background: var(--surface-color);
  border-radius: 1rem;
  padding: 2rem;
  border: var(--glass-border);
}

.section-title {
  font-size: 1.75rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.section-description {
  color: var(--text-color-secondary);
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
}

.steps {
  display: grid;
  gap: 2rem;
}

.step-card {
  display: flex;
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.step-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
    color: var(--text-color);
  }
  
  p {
    color: var(--text-color-secondary);
    margin-bottom: 1rem;
    line-height: 1.6;
  }
}

.step-image {
  width: 100%;
  border-radius: 0.5rem;
  margin-top: 1rem;
}

.help-section {
  margin-top: 4rem;
  text-align: center;
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

.help-links {
  display: flex;
  gap: 2rem;
  justify-content: center;
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1rem;
  }
}

.help-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(var(--primary-color-rgb), 0.1);
    transform: translateY(-2px);
  }
  
  .el-icon {
    font-size: 1.25rem;
  }
}
</style> 