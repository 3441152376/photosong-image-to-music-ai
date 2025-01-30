<script setup>
import { useI18n } from 'vue-i18n'
import TheNavbar from '../components/TheNavbar.vue'
import TheFooter from '../components/TheFooter.vue'

const { t } = useI18n()

const sections = [
  {
    id: 'collection',
    title: t('privacy.collection.title'),
    content: t('privacy.collection.content'),
    subsections: [
      {
        title: t('privacy.collection.personal.title'),
        content: t('privacy.collection.personal.content')
      },
      {
        title: t('privacy.collection.usage.title'),
        content: t('privacy.collection.usage.content')
      },
      {
        title: t('privacy.collection.technical.title'),
        content: t('privacy.collection.technical.content')
      }
    ]
  },
  {
    id: 'use',
    title: t('privacy.use.title'),
    content: t('privacy.use.content'),
    subsections: [
      {
        title: t('privacy.use.service.title'),
        content: t('privacy.use.service.content')
      },
      {
        title: t('privacy.use.improvement.title'),
        content: t('privacy.use.improvement.content')
      },
      {
        title: t('privacy.use.communication.title'),
        content: t('privacy.use.communication.content')
      }
    ]
  },
  {
    id: 'sharing',
    title: t('privacy.sharing.title'),
    content: t('privacy.sharing.content')
  },
  {
    id: 'security',
    title: t('privacy.security.title'),
    content: t('privacy.security.content')
  },
  {
    id: 'cookies',
    title: t('privacy.cookies.title'),
    content: t('privacy.cookies.content')
  },
  {
    id: 'rights',
    title: t('privacy.rights.title'),
    content: t('privacy.rights.content')
  },
  {
    id: 'children',
    title: t('privacy.children.title'),
    content: t('privacy.children.content')
  },
  {
    id: 'changes',
    title: t('privacy.changes.title'),
    content: t('privacy.changes.content')
  },
  {
    id: 'contact',
    title: t('privacy.contact.title'),
    content: t('privacy.contact.content')
  }
]
</script>

<template>
  <div class="privacy-page">
    <TheNavbar />
    
    <div class="container">
      <div class="privacy-header">
        <h1 class="page-title">{{ t('privacy.title') }}</h1>
        <p class="last-updated">
          {{ t('privacy.lastUpdated', { date: '2024-01-01' }) }}
        </p>
      </div>
      
      <div class="privacy-content">
        <!-- Table of Contents -->
        <div class="table-of-contents">
          <h2>{{ t('privacy.contents') }}</h2>
          <ul>
            <li v-for="section in sections" :key="section.id">
              <a :href="`#${section.id}`">{{ section.title }}</a>
              <ul v-if="section.subsections">
                <li v-for="(sub, index) in section.subsections" 
                    :key="index"
                >
                  <a :href="`#${section.id}-${index}`">{{ sub.title }}</a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        
        <!-- Privacy Sections -->
        <div class="privacy-sections">
          <section v-for="section in sections" 
                   :key="section.id"
                   :id="section.id"
                   class="privacy-section"
          >
            <h2>{{ section.title }}</h2>
            <div class="section-content" v-html="section.content"></div>
            
            <div v-if="section.subsections" class="subsections">
              <div v-for="(sub, index) in section.subsections"
                   :key="index"
                   :id="`${section.id}-${index}`"
                   class="subsection"
              >
                <h3>{{ sub.title }}</h3>
                <div class="subsection-content" v-html="sub.content"></div>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      <div class="privacy-footer">
        <p>{{ t('privacy.footer.questions') }}</p>
        <div class="footer-actions">
          <router-link to="/contact" class="footer-link">
            {{ t('privacy.footer.contact') }}
          </router-link>
          <router-link to="/terms" class="footer-link">
            {{ t('privacy.footer.terms') }}
          </router-link>
        </div>
      </div>
    </div>
    
    <TheFooter />
  </div>
</template>

<style scoped lang="scss">
.privacy-page {
  min-height: 100vh;
  padding-top: 80px;
}

.privacy-header {
  text-align: center;
  margin-bottom: 3rem;
  
  .last-updated {
    color: var(--text-color-secondary);
    margin-top: 0.5rem;
  }
}

.privacy-content {
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
    
    ul {
      padding-left: 1rem;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      
      li {
        margin-bottom: 0.25rem;
        
        a {
          font-size: 0.8125rem;
        }
      }
    }
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

.privacy-sections {
  background: var(--surface-color);
  border-radius: 1rem;
  padding: 2rem;
  border: var(--glass-border);
}

.privacy-section {
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
    margin-bottom: 2rem;
    
    p {
      margin-bottom: 1rem;
    }
  }
}

.subsections {
  padding-left: 1.5rem;
}

.subsection {
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: var(--text-color);
  }
  
  .subsection-content {
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

.privacy-footer {
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