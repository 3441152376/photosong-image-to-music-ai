<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

const router = useRouter()
const { t } = useI18n()
const currentYear = new Date().getFullYear()

// 友情链接数据
const friendlyLinks = ref([
  {
    name: 'MuseScore',
    url: 'https://musescore.com'
  },
  {
    name: 'Music Tech News',
    url: 'https://www.musictech.net'
  },
  {
    name: 'Sound On Sound',
    url: 'https://www.soundonsound.com'
  },
  {
    name: 'Music Radar',
    url: 'https://www.musicradar.com'
  },
  {
    name: 'KVR Audio',
    url: 'https://www.kvraudio.com'
  },
  {
    name: 'Splice',
    url: 'https://splice.com'
  },
  {
    name: 'Bandcamp',
    url: 'https://bandcamp.com'
  },
  {
    name: 'Hugging Face',
    url: 'https://huggingface.co'
  }
])
</script>

<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-grid">
        <div class="footer-section">
          <h3 class="footer-title">Photo Song</h3>
          <p class="footer-description">
            {{ t('footer.description') }}
          </p>
          <div class="social-links">
            <a href="#" class="social-link">
              <el-icon><Message /></el-icon>
            </a>
            <a href="#" class="social-link">
              <el-icon><Share /></el-icon>
            </a>
            <a href="#" class="social-link">
              <el-icon><Link /></el-icon>
            </a>
          </div>
        </div>
        
        <div class="footer-section">
          <h4>{{ t('footer.quickLinks.title') }}</h4>
          <ul class="footer-links">
            <li><a @click="router.push('/')">{{ t('footer.quickLinks.home') }}</a></li>
            <li><a @click="router.push('/create')">{{ t('footer.quickLinks.create') }}</a></li>
            <li><a @click="router.push('/community')">{{ t('footer.quickLinks.community') }}</a></li>
            <li><a @click="router.push('/pricing')">{{ t('footer.quickLinks.pricing') }}</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>{{ t('footer.help.title') }}</h4>
          <ul class="footer-links">
            <li><a @click="router.push('/tutorial')">{{ t('footer.help.tutorial') }}</a></li>
            <li><a @click="router.push('/faq')">{{ t('footer.help.faq') }}</a></li>
            <li><a @click="router.push('/contact')">{{ t('footer.help.contact') }}</a></li>
            <li><a @click="router.push('/feedback')">{{ t('footer.help.feedback') }}</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>{{ t('footer.newsletter.title') }}</h4>
          <p class="newsletter-text">{{ t('footer.newsletter.description') }}</p>
          <div class="newsletter-form">
            <el-input 
              :placeholder="t('footer.newsletter.placeholder')"
              class="newsletter-input"
            >
              <template #append>
                <el-button>{{ t('footer.newsletter.subscribe') }}</el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <div class="copyright">
          {{ t('footer.copyright', { year: currentYear }) }}
        </div>
        <div class="legal-links">
          <a @click="router.push('/privacy')">{{ t('footer.links.privacy') }}</a>
          <a @click="router.push('/terms')">{{ t('footer.links.terms') }}</a>
          <a @click="router.push('/disclaimer')">{{ t('footer.links.disclaimer') }}</a>
        </div>
      </div>
      
      <!-- 添加友情链接部分 -->
      <div class="footer-section friendly-links">
        <h3>{{ t('footer.friendlyLinks.title') }}</h3>
        <div class="links-grid">
          <a 
            v-for="link in friendlyLinks" 
            :key="link.url" 
            :href="link.url" 
            target="_blank" 
            rel="noopener noreferrer"
            class="friendly-link"
          >
            {{ link.name }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  background: var(--surface-color);
  border-top: 1px solid var(--border-color);
  padding: 4rem 0 2rem;
  margin-top: 4rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 3rem;
  margin-bottom: 3rem;
}

.footer-section {
  h3, h4 {
    color: var(--text-color);
    margin-bottom: 1.5rem;
    font-weight: 600;
  }
  
  h3 {
    font-size: 1.5rem;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  h4 {
    font-size: 1.125rem;
  }
}

.footer-description {
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.social-links {
  display: flex;
  gap: 1rem;
  
  .social-link {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--glass-background);
    border: var(--glass-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      background: var(--primary-color);
      color: white;
    }
  }
}

.footer-links {
  list-style: none;
  padding: 0;
  
  li {
    margin-bottom: 0.75rem;
    
    a {
      color: var(--text-color-secondary);
      text-decoration: none;
      transition: all 0.3s ease;
      cursor: pointer;
      
      &:hover {
        color: var(--primary-color);
        padding-left: 0.5rem;
      }
    }
  }
}

.newsletter-text {
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
  line-height: 1.6;
}

.newsletter-form {
  .newsletter-input {
    :deep(.el-input__wrapper) {
      background: var(--glass-background);
      border: var(--glass-border);
      
      &:hover {
        border-color: var(--primary-color);
      }
      
      &.is-focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 1px var(--primary-color);
      }
    }
    
    :deep(.el-input-group__append) {
      background: var(--primary-color);
      border-color: var(--primary-color);
      
      .el-button {
        color: white;
        
        &:hover {
          background: var(--primary-color-dark);
        }
      }
    }
  }
}

.footer-bottom {
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-color-secondary);
  
  .copyright {
    font-size: 0.875rem;
  }
  
  .legal-links {
    display: flex;
    gap: 2rem;
    
    a {
      color: var(--text-color-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.3s ease;
      
      &:hover {
        color: var(--primary-color);
      }
    }
  }
}

.friendly-links {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: var(--text-color);
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.friendly-link {
  color: var(--text-color-secondary);
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  
  &:hover {
    color: var(--text-color);
    background: rgba(var(--primary-color-rgb), 0.1);
    transform: translateY(-2px);
  }
}

@media (max-width: 768px) {
  .footer {
    padding: 3rem 0 1.5rem;
  }
  
  .footer-content {
    padding: 0 1rem;
  }
  
  .footer-grid {
    gap: 2rem;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    
    .legal-links {
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
  }
}
</style> 