<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import TheNavbar from '../components/TheNavbar.vue'
import TheFooter from '../components/TheFooter.vue'

const { t, locale } = useI18n()
const router = useRouter()

// 生成本地化的路由名称
const getLocalizedRouteName = (baseName) => {
  return `${locale.value}-${baseName}`
}

const sections = [
  {
    id: 'acceptance',
    title: t('terms.acceptance.title'),
    content: t('terms.acceptance.content')
  },
  {
    id: 'services',
    title: t('terms.services.title'),
    content: t('terms.services.content')
  },
  {
    id: 'account',
    title: t('terms.account.title'),
    content: t('terms.account.content')
  },
  {
    id: 'content',
    title: t('terms.content.title'),
    content: t('terms.content.content')
  },
  {
    id: 'intellectual',
    title: t('terms.intellectual.title'),
    content: t('terms.intellectual.content')
  },
  {
    id: 'payment',
    title: t('terms.payment.title'),
    content: t('terms.payment.content')
  },
  {
    id: 'termination',
    title: t('terms.termination.title'),
    content: t('terms.termination.content')
  },
  {
    id: 'liability',
    title: t('terms.liability.title'),
    content: t('terms.liability.content')
  },
  {
    id: 'changes',
    title: t('terms.changes.title'),
    content: t('terms.changes.content')
  },
  {
    id: 'contact',
    title: t('terms.contact.title'),
    content: t('terms.contact.content')
  }
]
</script>

<template>
  <div class="terms-page">
    <TheNavbar />
    
    <div class="container">
      <div class="terms-header">
        <h1 class="page-title">{{ t('terms.title') }}</h1>
        <p class="last-updated">
          {{ t('terms.lastUpdated', { date: '2024-01-01' }) }}
        </p>
      </div>
      
      <div class="terms-content">
        <!-- Table of Contents -->
        <div class="table-of-contents">
          <h2>{{ t('terms.contents') }}</h2>
          <ul>
            <li v-for="section in sections" :key="section.id">
              <a :href="`#${section.id}`">{{ section.title }}</a>
            </li>
          </ul>
        </div>
        
        <!-- Terms Sections -->
        <div class="terms-sections">
          <section v-for="section in sections" 
                   :key="section.id"
                   :id="section.id"
                   class="terms-section"
          >
            <h2>{{ section.title }}</h2>
            <div class="section-content" v-html="section.content"></div>
          </section>
        </div>
      </div>
      
      <div class="terms-footer">
        <p>{{ t('terms.footer.questions') }}</p>
        <div class="footer-actions">
          <router-link :to="{ name: getLocalizedRouteName('contact') }" class="footer-link">
            {{ t('terms.footer.contact') }}
          </router-link>
          <router-link :to="{ name: getLocalizedRouteName('privacy') }" class="footer-link">
            {{ t('terms.footer.privacy') }}
          </router-link>
        </div>
      </div>
    </div>
    
    <TheFooter />
  </div>
</template>

<style scoped lang="scss">
.terms-page {
  min-height: 100vh;
  padding-top: 80px;
}

.terms-header {
  text-align: center;
  margin-bottom: 3rem;
  
  .last-updated {
    color: var(--text-color-secondary);
    margin-top: 0.5rem;
  }
}

.terms-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 3rem;
  margin: 3rem 0;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.table-of-contents {
  position: sticky;
  top: 100px;
  height: fit-content;
  background: var(--surface-color);
  border-radius: 1rem;
  padding: 1.5rem;
  border: var(--glass-border);
  
  @media (max-width: 1024px) {
    position: static;
  }
  
  h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: var(--text-color);
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  li {
    margin-bottom: 0.5rem;
    
    a {
      color: var(--text-color-secondary);
      text-decoration: none;
      transition: all 0.3s ease;
      font-size: 0.875rem;
      
      &:hover {
        color: var(--primary-color);
      }
    }
  }
}

.terms-sections {
  background: var(--surface-color);
  border-radius: 1rem;
  padding: 2rem;
  border: var(--glass-border);
}

.terms-section {
  margin-bottom: 3rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-color);
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  .section-content {
    color: var(--text-color-secondary);
    line-height: 1.8;
    
    p {
      margin-bottom: 1rem;
    }
    
    ul, ol {
      margin: 1rem 0;
      padding-left: 1.5rem;
      
      li {
        margin-bottom: 0.5rem;
      }
    }
  }
}

.terms-footer {
  text-align: center;
  margin: 4rem 0;
  padding: 3rem;
  background: var(--surface-color);
  border-radius: 1rem;
  border: var(--glass-border);
  
  p {
    color: var(--text-color-secondary);
    margin-bottom: 1.5rem;
  }
}

.footer-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.footer-link {
  display: inline-flex;
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
}
</style> 