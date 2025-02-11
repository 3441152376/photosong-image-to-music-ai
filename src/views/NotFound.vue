<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import TheNavbar from '../components/TheNavbar.vue'
import { HomeFilled, Plus, User, Document, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const { t, locale } = useI18n()

// 推荐内容
const recommendedContent = computed(() => [
  {
    title: t('create.title'),
    description: t('create.description'),
    image: '/images/create-preview.svg',
    path: '/create',
    icon: Plus,
    delay: 0
  },
  {
    title: t('community.title'),
    description: t('community.description'),
    image: '/images/community-preview.svg',
    path: '/community',
    icon: User,
    delay: 200
  },
  {
    title: t('articles.title'),
    description: t('articles.description'),
    image: '/images/articles-preview.svg',
    path: '/articles',
    icon: Document,
    delay: 400
  }
])

// SEO优化
useHead({
  title: computed(() => `${t('errors.notFound.title')} | PhotoSong`),
  meta: [
    {
      name: 'description',
      content: computed(() => t('errors.notFound.description'))
    },
    {
      name: 'robots',
      content: 'noindex'
    }
  ]
})

// 记录404错误
onMounted(() => {
  console.error('404 error:', {
    path: window.location.pathname,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    language: locale.value
  })
})
</script>

<template>
  <div class="not-found-page">
    <TheNavbar />
    
      <div class="not-found-content">
      <div class="error-container">
        <div class="error-header">
          <div class="glitch-wrapper">
            <h1 class="error-title glitch" data-text="404">404</h1>
          </div>
          <p class="error-message">{{ t('errors.notFound.title') }}</p>
          <p class="error-description">{{ t('errors.notFound.description') }}</p>
          
          <!-- 装饰性线条 -->
          <div class="tech-lines">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
        </div>
        
        <!-- 快速导航 -->
        <div class="quick-links">
          <h2 class="section-title">{{ t('errors.notFound.quickLinks') }}</h2>
          <div class="links-grid">
            <router-link to="/" class="quick-link">
              <el-icon><HomeFilled /></el-icon>
              <span>{{ t('nav.home') }}</span>
              <div class="quick-link-bg"></div>
            </router-link>
            <router-link to="/create" class="quick-link">
              <el-icon><Plus /></el-icon>
              <span>{{ t('nav.create') }}</span>
              <div class="quick-link-bg"></div>
            </router-link>
            <router-link to="/community" class="quick-link">
              <el-icon><User /></el-icon>
              <span>{{ t('nav.community') }}</span>
              <div class="quick-link-bg"></div>
            </router-link>
            <router-link to="/articles" class="quick-link">
              <el-icon><Document /></el-icon>
              <span>{{ t('nav.articles') }}</span>
              <div class="quick-link-bg"></div>
            </router-link>
          </div>
        </div>
        
        <!-- 推荐内容 -->
        <div class="recommendations">
          <h2 class="section-title">{{ t('errors.notFound.recommendations') }}</h2>
          <div class="recommendations-grid">
            <div 
              v-for="item in recommendedContent" 
              :key="item.path" 
              class="recommendation-card" 
              :style="{ animationDelay: `${item.delay}ms` }"
              @click="router.push(item.path)"
            >
              <div class="recommendation-image">
                <img 
                  :src="item.image" 
                  :alt="item.title"
                  loading="lazy"
                />
                <div class="recommendation-icon">
                  <el-icon>
                    <component :is="item.icon" />
                  </el-icon>
                </div>
                <div class="tech-overlay">
                  <div class="tech-line"></div>
                  <div class="tech-line"></div>
                  <div class="tech-line"></div>
                </div>
              </div>
              <div class="recommendation-content">
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 返回按钮 -->
        <div class="action-buttons">
          <el-button type="primary" class="tech-button" @click="router.back()">
            <el-icon><ArrowLeft /></el-icon>
            {{ t('errors.notFound.backPrev') }}
            <div class="tech-button-bg"></div>
          </el-button>
          <el-button class="tech-button" @click="router.push('/')">
            <el-icon><HomeFilled /></el-icon>
            {{ t('errors.notFound.backHome') }}
            <div class="tech-button-bg"></div>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  background: var(--bg-gradient);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 10% 20%, rgba(var(--primary-color-rgb), 0.1) 0%, transparent 20%),
      radial-gradient(circle at 90% 80%, rgba(var(--accent-color-rgb), 0.1) 0%, transparent 20%);
    pointer-events: none;
  }
}

.not-found-content {
  max-width: 1200px;
  margin: 80px auto 0;
  padding: 2rem;
  text-align: center;
  position: relative;
}

.error-container {
  background: var(--surface-primary);
  border-radius: 1.5rem;
  padding: 3rem 2rem;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
  width: 100%;
    height: 4px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      var(--primary-color) 50%, 
      transparent 100%
    );
    animation: scan 3s linear infinite;
  }
}

.error-header {
  max-width: 600px;
  margin: 0 auto 3rem;
  position: relative;
}

// 故障风格标题
.glitch-wrapper {
  position: relative;
  width: fit-content;
  margin: 0 auto;
}

.error-title {
  font-size: 8rem;
  font-weight: 800;
  line-height: 1;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  position: relative;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  animation: glitch 3s infinite;
  
  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  &::before {
    left: 2px;
    text-shadow: -2px 0 var(--primary-color);
    animation: glitch-1 3s infinite;
  }
  
  &::after {
    left: -2px;
    text-shadow: 2px 0 var(--accent-color);
    animation: glitch-2 3s infinite;
  }
}

.error-message {
  font-size: 2rem;
  font-weight: 600;
  margin: 1rem 0;
  color: var(--text-primary);
  animation: fadeInUp 0.6s ease-out;
}

.error-description {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 1rem auto;
  max-width: 500px;
  line-height: 1.6;
  animation: fadeInUp 0.8s ease-out;
}

// 装饰性科技线条
.tech-lines {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  .line {
    position: absolute;
    height: 1px;
    width: 100%;
    background: linear-gradient(90deg, 
      transparent 0%, 
      var(--primary-color) 50%, 
      transparent 100%
    );
    opacity: 0.2;
    
    &:nth-child(1) {
      top: 0;
      animation: scanline 3s linear infinite;
    }
    
    &:nth-child(2) {
      top: 33%;
      animation: scanline 3s linear infinite 1s;
    }
    
    &:nth-child(3) {
      top: 66%;
      animation: scanline 3s linear infinite 2s;
    }
  }
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: var(--text-primary);
  position: relative;
  display: inline-block;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      var(--primary-color) 50%, 
      transparent 100%
    );
  }
}

.quick-links {
  margin: 2rem 0;
  animation: fadeInUp 1s ease-out;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
  padding: 0 1rem;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-secondary);
  border-radius: 0.75rem;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  
  .quick-link-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--primary-color);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  z-index: 0;
}

  .el-icon, span {
    position: relative;
    z-index: 1;
    transition: color 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-color);
    
    .quick-link-bg {
      transform: translateX(0);
    }
    
    .el-icon, span {
      color: white;
    }
  }
  
  .el-icon {
    font-size: 1.5rem;
  }
}

.recommendations {
  margin: 3rem 0;
  animation: fadeInUp 1.2s ease-out;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
  padding: 0 1rem;
}

.recommendation-card {
  background: var(--surface-secondary);
  border-radius: 1rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  animation: fadeInUp 0.6s ease-out both;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-color);
    
    .recommendation-image img {
      transform: scale(1.05);
    }
    
    .recommendation-icon {
      background: var(--primary-color);
      color: white;
    }
    
    .tech-overlay {
      opacity: 1;
    }
  }
}

.recommendation-image {
  position: relative;
  padding-top: 56.25%;
  overflow: hidden;
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
}

.tech-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  
  .tech-line {
    position: absolute;
    height: 1px;
    width: 100%;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(var(--primary-color-rgb), 0.5) 50%, 
      transparent 100%
    );
    
    &:nth-child(1) {
      top: 33%;
      animation: scanline 2s linear infinite;
    }
    
    &:nth-child(2) {
      top: 66%;
      animation: scanline 2s linear infinite 0.6s;
    }
    
    &:nth-child(3) {
      top: 100%;
      animation: scanline 2s linear infinite 1.2s;
    }
  }
}

.recommendation-icon {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--surface-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1;
  
  .el-icon {
    font-size: 1.5rem;
  }
}

.recommendation-content {
  padding: 1.5rem;
  position: relative;
  z-index: 1;
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    color: var(--text-primary);
  }
  
  p {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
  }
}

.action-buttons {
  margin-top: 3rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  animation: fadeInUp 1.4s ease-out;
  
  .tech-button {
    min-width: 160px;
    position: relative;
    overflow: hidden;
    
    .el-icon {
      margin-right: 0.5rem;
    }
    
    .tech-button-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      transform: translateX(-100%);
      animation: shine 3s infinite;
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
}

@keyframes glitch-1 {
  0%, 100% { transform: translate(0); }
  40% { transform: translate(-2px, 2px); }
  60% { transform: translate(2px, -2px); }
}

@keyframes glitch-2 {
  0%, 100% { transform: translate(0); }
  40% { transform: translate(2px, -2px); }
  60% { transform: translate(-2px, 2px); }
}

@keyframes scan {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

@keyframes scanline {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

@keyframes shine {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

@media (max-width: 768px) {
  .not-found-content {
    margin-top: 60px;
    padding: 1rem;
  }
  
  .error-container {
    padding: 2rem 1rem;
  }
  
  .error-title {
    font-size: 5rem;
  }
  
  .error-message {
    font-size: 1.5rem;
  }
  
  .recommendations-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
    padding: 0 1rem;
    
    .el-button {
      width: 100%;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style> 