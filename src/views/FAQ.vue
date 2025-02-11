<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import { generateFAQSchema } from '../utils/structuredData'
import TheNavbar from '../components/TheNavbar.vue'
import TheFooter from '../components/TheFooter.vue'

const { t } = useI18n()

const categories = ref([
  {
    id: 'general',
    title: t('faq.general.title'),
    questions: [
      {
        id: 'what-is',
        question: t('faq.general.what.question'),
        answer: t('faq.general.what.answer')
      },
      {
        id: 'how-works',
        question: t('faq.general.how.question'),
        answer: t('faq.general.how.answer')
      }
    ]
  },
  {
    id: 'account',
    title: t('faq.account.title'),
    questions: [
      {
        id: 'signup',
        question: t('faq.account.signup.question'),
        answer: t('faq.account.signup.answer')
      },
      {
        id: 'points',
        question: t('faq.account.points.question'),
        answer: t('faq.account.points.answer')
      }
    ]
  },
  {
    id: 'technical',
    title: t('faq.technical.title'),
    questions: [
      {
        id: 'supported-formats',
        question: t('faq.technical.formats.question'),
        answer: t('faq.technical.formats.answer')
      },
      {
        id: 'quality',
        question: t('faq.technical.quality.question'),
        answer: t('faq.technical.quality.answer')
      }
    ]
  },
  {
    id: 'pricing',
    title: t('faq.pricing.title'),
    questions: [
      {
        id: 'cost',
        question: t('faq.pricing.cost.question'),
        answer: t('faq.pricing.cost.answer')
      },
      {
        id: 'refund',
        question: t('faq.pricing.refund.question'),
        answer: t('faq.pricing.refund.answer')
      }
    ]
  }
])

const activeQuestions = ref(new Set())

const toggleQuestion = (questionId) => {
  if (activeQuestions.value.has(questionId)) {
    activeQuestions.value.delete(questionId)
  } else {
    activeQuestions.value.add(questionId)
  }
}

const isQuestionActive = (questionId) => {
  return activeQuestions.value.has(questionId)
}

// FAQ 数据
const faqs = computed(() => [
  {
    question: t('faq.questions.howItWorks'),
    answer: t('faq.answers.howItWorks')
  },
  {
    question: t('faq.questions.pricing'),
    answer: t('faq.answers.pricing')
  },
  {
    question: t('faq.questions.copyright'),
    answer: t('faq.answers.copyright')
  },
  {
    question: t('faq.questions.quality'),
    answer: t('faq.answers.quality')
  },
  {
    question: t('faq.questions.support'),
    answer: t('faq.answers.support')
  }
])

// 使用 useHead 添加结构化数据
useHead({
  title: `${t('faq.title')} - PhotoSong`,
  meta: [
    {
      name: 'description',
      content: t('faq.description')
    }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: computed(() => JSON.stringify(generateFAQSchema(faqs.value)))
    }
  ]
})
</script>

<template>
  <div class="faq-page">
    <TheNavbar />
    
    <div class="container">
      <h1 class="page-title">{{ t('faq.title') }}</h1>
      
      <div class="search-section">
        <el-input
          :placeholder="t('faq.search')"
          prefix-icon="Search"
          clearable
        />
      </div>
      
      <div class="faq-categories">
        <div v-for="category in categories" 
             :key="category.id" 
             class="faq-category"
        >
          <h2 class="category-title">{{ category.title }}</h2>
          
          <div class="questions">
            <div v-for="question in category.questions" 
                 :key="question.id"
                 class="question-card"
                 :class="{ 'is-active': isQuestionActive(question.id) }"
                 @click="toggleQuestion(question.id)"
            >
              <div class="question-header">
                <h3>{{ question.question }}</h3>
                <el-icon class="toggle-icon">
                  <ArrowDown />
                </el-icon>
              </div>
              
              <div class="question-answer" v-show="isQuestionActive(question.id)">
                <p>{{ question.answer }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="contact-section">
        <h2>{{ t('faq.contact.title') }}</h2>
        <p>{{ t('faq.contact.description') }}</p>
        <div class="contact-actions">
          <router-link to="/contact" class="contact-btn primary">
            {{ t('faq.contact.support') }}
          </router-link>
          <router-link to="/feedback" class="contact-btn secondary">
            {{ t('faq.contact.feedback') }}
          </router-link>
        </div>
      </div>
    </div>
    
    <TheFooter />
  </div>
</template>

<style scoped lang="scss">
.faq-page {
  min-height: 100vh;
  padding-top: 80px;
}

.search-section {
  max-width: 600px;
  margin: 2rem auto;
}

.faq-categories {
  display: grid;
  gap: 3rem;
  margin: 3rem 0;
}

.faq-category {
  background: var(--surface-color);
  border-radius: 1rem;
  padding: 2rem;
  border: var(--glass-border);
}

.category-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-color);
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.questions {
  display: grid;
  gap: 1rem;
}

.question-card {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &.is-active {
    background: rgba(var(--primary-color-rgb), 0.1);
    
    .toggle-icon {
      transform: rotate(180deg);
    }
  }
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  
  h3 {
    font-size: 1.1rem;
    color: var(--text-color);
    margin: 0;
  }
  
  .toggle-icon {
    font-size: 1.25rem;
    color: var(--text-color-secondary);
    transition: transform 0.3s ease;
  }
}

.question-answer {
  padding: 0 1.25rem 1.25rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
  
  p {
    margin: 0;
  }
}

.contact-section {
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

.contact-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.contact-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &.primary {
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);
    }
  }
  
  &.secondary {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-color);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }
  }
}
</style> 