<script setup>
import { useI18n } from 'vue-i18n'
import TheNavbar from '../components/TheNavbar.vue'
import TheFooter from '../components/TheFooter.vue'

const { t } = useI18n()
</script>

<template>
  <div class="disclaimer-page">
    <TheNavbar />
    
    <div class="container">
      <div class="disclaimer-header">
        <h1 class="page-title">{{ t('disclaimer.title') }}</h1>
        <p class="last-updated">
          {{ t('disclaimer.lastUpdated', { date: '2024-01-01' }) }}
        </p>
      </div>
      
      <div class="disclaimer-content">
        <div class="disclaimer-sections">
          <section v-for="section in t('disclaimer.sections')" 
                   :key="section.id"
                   :id="section.id"
                   class="disclaimer-section"
          >
            <h2>{{ section.title }}</h2>
            <div class="section-content" v-html="section.content"></div>
          </section>
        </div>
      </div>
      
      <div class="disclaimer-footer">
        <p>{{ t('disclaimer.footer.questions') }}</p>
        <div class="footer-actions">
          <router-link to="/contact" class="footer-link">
            {{ t('disclaimer.footer.contact') }}
          </router-link>
          <router-link to="/terms" class="footer-link">
            {{ t('disclaimer.footer.terms') }}
          </router-link>
        </div>
      </div>
    </div>
    
    <TheFooter />
  </div>
</template>

<style scoped lang="scss">
.disclaimer-page {
  min-height: 100vh;
  padding-top: 80px;
}

.disclaimer-header {
  text-align: center;
  margin-bottom: 3rem;
  
  .last-updated {
    color: var(--text-color-secondary);
    margin-top: 0.5rem;
  }
}

.disclaimer-content {
  margin: 3rem 0;
}

.disclaimer-sections {
  background: var(--surface-color);
  border-radius: 1rem;
  padding: 2rem;
  border: var(--glass-border);
}

.disclaimer-section {
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

.disclaimer-footer {
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