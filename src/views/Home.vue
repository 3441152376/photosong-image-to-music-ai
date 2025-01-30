<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TheNavbar from '../components/TheNavbar.vue'
import AV from 'leancloud-storage'
import HeroIllustration from '../components/HeroIllustration.vue'
import TheFooter from '../components/TheFooter.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const { t } = useI18n()
const loading = ref(false)
const featuredWorks = ref([])
const latestWorks = ref([])
const audioContext = ref(null)

const perspective = ref({ x: 0, y: 0 })

const handlePerspective = (e) => {
  if (!window.matchMedia('(min-width: 1024px)').matches) return
  
  const card = e.currentTarget
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  const rotateX = (y - centerY) / 80
  const rotateY = (centerX - x) / 80
  
  perspective.value = { x: rotateX, y: rotateY }
}

const resetPerspective = () => {
  perspective.value = { x: 0, y: 0 }
}

// 获取精选作品
const fetchFeaturedWorks = async () => {
  loading.value = true
  try {
    const query = new AV.Query('Work')
    query.equalTo('status', 'completed')
    query.descending('createdAt')
    query.include('user')
    query.limit(6)
    const results = await query.find()
    
    featuredWorks.value = results.map(work => ({
      id: work.id,
      title: work.get('title') || t('home.works.untitledWork'),
      imageUrl: work.get('imageUrl'),
      style: work.get('style'),
      plays: work.get('plays') || 0,
      createdAt: work.createdAt,
      user: {
        id: work.get('user')?.id,
        username: work.get('user')?.get('username') || t('home.works.anonymousUser'),
        avatar: (() => {
          const avatar = work.get('user')?.get('avatar')
          if (avatar instanceof AV.File) {
            return avatar.url()
          }
          return avatar || '/default-avatar.png'
        })()
      }
    }))
  } catch (error) {
    console.error('Error fetching featured works:', error)
  } finally {
    loading.value = false
  }
}

// 获取最新作品
const fetchLatestWorks = async () => {
  try {
    const query = new AV.Query('Work')
    query.equalTo('status', 'completed')
    query.include('user')
    query.descending('createdAt')
    query.limit(8)
    const works = await query.find()
    latestWorks.value = works.map(work => ({
      id: work.id,
      title: work.get('title'),
      imageUrl: work.get('imageUrl'),
      audioUrl: work.get('audioUrl'),
      status: work.get('status'),
      progress: work.get('progress'),
      plays: work.get('plays') || 0,
      createdAt: work.get('createdAt'),
      user: {
        id: work.get('user').id,
        username: work.get('user').get('username'),
        avatar: work.get('user').get('avatar')
      }
    }))
  } catch (error) {
    console.error('Fetch latest works failed:', error)
    ElMessage.error(t('errors.fetchWorks'))
  }
}

// 跳转到作品详情
const handlePlay = async (work) => {
  try {
    // 确保 AudioContext 在用户交互时初始化
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
    }
    
    // 如果 AudioContext 被挂起，则恢复它
    if (audioContext.value.state === 'suspended') {
      await audioContext.value.resume()
    }
    
    // 导航到作品详情页
    await router.push(`/work/${work.id}`)
  } catch (error) {
    console.error('Error initializing audio:', error)
    ElMessage.error(t('errors.audioInit'))
  }
}

// 跳转到创作页面
const goToCreate = () => {
  router.push('/create')
}

const goToCommunity = () => {
  router.push('/community')
}

const testimonials = [
  {
    id: 1,
    content: t('home.testimonials.1.content'),
    author: t('home.testimonials.1.author'),
    title: t('home.testimonials.1.title'),
    avatar: "https://s1.aigei.com/src/img/gif/e1/e1764fac3f6d4da984d5a2cdbe272d95.gif?e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:PtPqmw1HhaztHIgenk-XtKKwDEc="
  },
  {
    id: 2,
    content: t('home.testimonials.2.content'),
    author: t('home.testimonials.2.author'),
    title: t('home.testimonials.2.title'),
    avatar: "https://s1.aigei.com/src/img/jpg/fc/fc5a95c39b1c440ca5a5738002d83b8b.jpg?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:m_O3tqMBwIFzvoL9WnZQflJxdT0="
  },
  {
    id: 3,
    content: t('home.testimonials.3.content'),
    author: t('home.testimonials.3.author'),
    title: t('home.testimonials.3.title'),
    avatar: "https://s1.aigei.com/src/img/png/fa/fa1174fa911444399a73aedf1223f1bd.png?imageMogr2/auto-orient/thumbnail/!229x320r/gravity/Center/crop/229x320/quality/85/%7CimageView2/2/w/229&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:Tp7bPBnfPDJ3FJfPYG_pr_EQA-8="
  }
]

const useCases = [
  {
    title: t('home.useCases.travel.title'),
    description: t('home.useCases.travel.description'),
    icon: "Location"
  },
  {
    title: t('home.useCases.wedding.title'),
    description: t('home.useCases.wedding.description'),
    icon: "Present"
  },
  {
    title: t('home.useCases.business.title'),
    description: t('home.useCases.business.description'),
    icon: "Shop"
  },
  {
    title: t('home.useCases.social.title'),
    description: t('home.useCases.social.description'),
    icon: "Share"
  }
]

const steps = [
  {
    number: "01",
    title: t('home.steps.1.title'),
    description: t('home.steps.1.description')
  },
  {
    number: "02",
    title: t('home.steps.2.title'),
    description: t('home.steps.2.description')
  },
  {
    number: "03",
    title: t('home.steps.3.title'),
    description: t('home.steps.3.description')
  },
  {
    number: "04",
    title: t('home.steps.4.title'),
    description: t('home.steps.4.description')
  }
]

// 添加鼠标移动效果
const handleMouseMove = (e) => {
  const x = e.clientX / window.innerWidth
  const y = e.clientY / window.innerHeight
  document.documentElement.style.setProperty('--mouse-x', `${x * 100}%`)
  document.documentElement.style.setProperty('--mouse-y', `${y * 100}%`)
}

// 粒子动画
const particles = ref([])
const particleCount = 50
const particleContainer = ref(null)

const createParticle = () => {
  const particle = document.createElement('div')
  particle.className = 'particle'
  
  // 随机位置和大小
  const size = Math.random() * 4 + 2
  const x = Math.random() * window.innerWidth
  const y = Math.random() * window.innerHeight
  
  particle.style.width = `${size}px`
  particle.style.height = `${size}px`
  particle.style.left = `${x}px`
  particle.style.top = `${y}px`
  
  // 随机动画延迟
  particle.style.animationDelay = `${Math.random() * 5}s`
  
  return particle
}

const initParticles = () => {
  if (!particleContainer.value) return
  
  // 清除现有粒子
  particles.value.forEach(particle => particle.remove())
  particles.value = []
  
  // 创建新粒子
  for (let i = 0; i < particleCount; i++) {
    const particle = createParticle()
    particleContainer.value.appendChild(particle)
    particles.value.push(particle)
  }
}

// 视差效果
const handleParallax = (e) => {
  const parallaxElements = document.querySelectorAll('.parallax')
  const mouseX = e.clientX / window.innerWidth
  const mouseY = e.clientY / window.innerHeight
  
  parallaxElements.forEach(element => {
    const speed = element.getAttribute('data-speed') || 1
    const x = (0.5 - mouseX) * speed * 50
    const y = (0.5 - mouseY) * speed * 50
    element.style.transform = `translate(${x}px, ${y}px)`
  })
}

// 获取用户头像
const getAvatarUrl = (user) => {
  const avatar = user.avatar
  if (avatar instanceof AV.File) {
    return avatar.url()
  }
  return avatar || '/default-avatar.png'
}

onMounted(() => {
  fetchFeaturedWorks()
  fetchLatestWorks()
  document.addEventListener('mousemove', handleMouseMove)
  initParticles()
  window.addEventListener('resize', initParticles)
  window.addEventListener('mousemove', handleParallax)
})

onUnmounted(() => {
  window.removeEventListener('resize', initParticles)
  window.removeEventListener('mousemove', handleParallax)
})

// 音乐科技新闻数据
const musicTechNews = ref([
  {
    id: 1,
    title: t('home.newsAndCommunity.musicTech.news1.title'),
    description: t('home.newsAndCommunity.musicTech.news1.description'),
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&w=800&h=450&fit=crop',
    url: 'https://www.billboard.com/business/streaming/universal-music-group-ai-music-streaming-policy-1235584439/',
    source: 'Billboard',
    date: '2024-02-20'
  },
  {
    id: 2,
    title: t('home.newsAndCommunity.musicTech.news2.title'),
    description: t('home.newsAndCommunity.musicTech.news2.description'),
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&w=800&h=450&fit=crop',
    url: 'https://www.rollingstone.com/culture/culture-news/grimes-ai-voice-clone-platform-elf-tech-1234961019/',
    source: 'Rolling Stone',
    date: '2024-02-08'
  },
  {
    id: 3,
    title: t('home.newsAndCommunity.musicTech.news3.title'),
    description: t('home.newsAndCommunity.musicTech.news3.description'),
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&w=800&h=450&fit=crop',
    url: 'https://www.musicbusinessworldwide.com/youtube-launches-dream-track-ai-music-tool-with-major-labels-backing1/',
    source: 'Music Business Worldwide',
    date: '2024-02-15'
  }
])

// 社区动态数据
const communityPosts = ref([
  {
    id: 1,
    title: t('home.newsAndCommunity.community.post1.title'),
    description: t('home.newsAndCommunity.community.post1.description'),
    image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&w=800&h=450&fit=crop',
    url: 'https://huggingface.co/blog/musicgen',
    author: 'Hugging Face',
    date: '2024-02-01'
  },
  {
    id: 2,
    title: t('home.newsAndCommunity.community.post2.title'),
    description: t('home.newsAndCommunity.community.post2.description'),
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&w=800&h=450&fit=crop',
    url: 'https://pytorch.org/blog/pytorch-2-2/',
    author: 'PyTorch Team',
    date: '2024-01-24'
  },
  {
    id: 3,
    title: t('home.newsAndCommunity.community.post3.title'),
    description: t('home.newsAndCommunity.community.post3.description'),
    image: 'https://images.unsplash.com/photo-1513829596324-4bb2800c5efb?auto=format&w=800&h=450&fit=crop',
    url: 'https://stability.ai/news/stable-audio-one-point-zero-release',
    author: 'Stability AI',
    date: '2024-01-30'
  }
])
</script>

<template>
  <div class="home">
    <!-- 粒子容器 -->
    <div ref="particleContainer" class="particle-container"></div>
    
    <TheNavbar />
    
    <!-- 装饰元素 -->
    <div class="decoration-container">
      <div class="floating-circle"></div>
      <div class="floating-square"></div>
      <div class="floating-dots"></div>
      <div class="gradient-line"></div>
    </div>
    
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background">
        <div class="gradient-sphere"></div>
        <div class="grid-pattern"></div>
        <div class="floating-particles"></div>
      </div>
      
      <div class="hero-content container">
        <div class="hero-text">
          <h1 class="hero-title">
            <span class="gradient-text">{{ t('home.hero.title') }}</span>
            <div class="title-decoration">
              <span class="line"></span>
              <span class="dot"></span>
            </div>
          </h1>
          <p class="hero-description">
            {{ t('home.hero.description') }}
          </p>
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-number">10K+</span>
              <span class="stat-label">{{ t('home.hero.stats.users') }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">50K+</span>
              <span class="stat-label">{{ t('home.hero.stats.works') }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">4.9</span>
              <span class="stat-label">{{ t('home.hero.stats.rating') }}</span>
            </div>
          </div>
          <div class="hero-actions">
            <el-button 
              type="primary" 
              size="large"
              class="start-btn glow-effect"
              @click="goToCreate"
            >
              {{ t('home.hero.buttons.start') }}
              <el-icon class="el-icon-right"><ArrowRight /></el-icon>
              <span class="glow-container">
                <span class="glow"></span>
              </span>
            </el-button>
            <el-button 
              size="large"
              class="explore-btn"
              @click="goToCommunity"
            >
              {{ t('home.hero.buttons.explore') }}
              <div class="btn-background"></div>
            </el-button>
          </div>
          <div class="tech-badges">
            <div class="badge">
              <el-icon><Picture /></el-icon>
              {{ t('home.hero.features.imageProcessing') }}
            </div>
            <div class="badge">
              <el-icon><MagicStick /></el-icon>
              {{ t('home.hero.features.musicCreation') }}
            </div>
            <div class="badge">
              <el-icon><Share /></el-icon>
              {{ t('home.hero.features.sharing') }}
            </div>
          </div>
        </div>
        
        <div class="hero-visual">
          <HeroIllustration />
          <div class="visual-decoration">
            <div class="deco-circle"></div>
            <div class="deco-line"></div>
            <div class="deco-dots"></div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- How It Works Section -->
    <section class="how-it-works">
      <div class="section-header">
        <h2 class="section-title">{{ t('home.howItWorks.title') }}</h2>
        <p class="section-description">{{ t('home.howItWorks.description') }}</p>
      </div>
      
      <div class="steps-grid" role="list" aria-label="{{ t('home.howItWorks.title') }}">
        <div 
          v-for="step in steps" 
          :key="step.number"
          class="step-card glass"
          role="listitem"
          :aria-label="t('home.steps.ariaLabel', { number: step.number, title: step.title })"
        >
          <div class="step-number" aria-hidden="true">{{ step.number }}</div>
          <div class="step-icon" aria-hidden="true">
            <el-icon>
              <component :is="
                step.number === '01' ? 'Upload' :
                step.number === '02' ? 'Monitor' :
                step.number === '03' ? 'MagicStick' :
                'Share'
              " />
            </el-icon>
          </div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
          <div class="step-decoration" aria-hidden="true">
            <div class="decoration-line"></div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Use Cases Section -->
    <section class="use-cases">
      <div class="section-header text-center">
        <h2 class="section-title">{{ t('home.useCases.title') }}</h2>
        <p class="section-description">{{ t('home.useCases.description') }}</p>
      </div>
      
      <div class="cases-grid" role="list" aria-label="{{ t('home.useCases.title') }}">
        <div 
          v-for="(useCase, index) in useCases" 
          :key="useCase.title"
          class="case-card glass"
          :style="{ '--delay': `${index * 0.1}s` }"
          role="listitem"
          :aria-label="t('home.useCases.ariaLabel', { title: useCase.title })"
        >
          <div class="case-icon" aria-hidden="true">
            <el-icon><component :is="useCase.icon" /></el-icon>
          </div>
          <h3>{{ useCase.title }}</h3>
          <p>{{ useCase.description }}</p>
          <div class="case-decoration" aria-hidden="true">
            <div class="decoration-circle"></div>
            <div class="decoration-line"></div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Featured Works Section -->
    <section class="featured-works">
      <div class="section-header">
        <h2 class="gradient-text">{{ t('home.featuredWorks.title') }}</h2>
        <p class="section-desc">{{ t('home.featuredWorks.description') }}</p>
      </div>
      
      <div class="works-grid">
        <div 
          v-for="work in latestWorks.slice(0, 8)" 
          :key="work.id"
          class="work-card"
          @click="handlePlay(work)"
          role="button"
          tabindex="0"
          :aria-label="t('home.works.playWork', { title: work.title })"
        >
          <div class="work-media">
            <img 
              :src="work.imageUrl" 
              :alt="work.title || t('workDetail.untitledWork')"
              class="work-image"
              loading="lazy"
            >
            <div class="work-overlay">
              <div class="work-status" v-if="work.status !== 'completed'" aria-live="polite">
                <template v-if="work.status === 'generating'">
                  <el-progress 
                    type="circle" 
                    :percentage="work.progress"
                    :width="40"
                    :stroke-width="4"
                    class="progress-circle"
                    :aria-label="t('home.works.status.generating')"
                  />
                  <span class="status-text">{{ t('home.works.status.generating') }}</span>
                </template>
                <template v-else-if="work.status === 'failed'">
                  <el-icon class="error-icon"><Warning /></el-icon>
                  <span class="status-text">{{ t('home.works.status.failed') }}</span>
                </template>
              </div>
              <div v-else class="play-button" aria-hidden="true">
                <el-icon><CaretRight /></el-icon>
              </div>
            </div>
          </div>
          
          <div class="work-info">
            <div class="work-main">
              <h3 class="work-title">{{ work.title }}</h3>
              <div class="work-meta">
                <div class="creator">
                  <el-avatar 
                    :size="24" 
                    :src="getAvatarUrl(work.user)"
                    class="creator-avatar"
                  />
                  <span class="creator-name">{{ work.user.username }}</span>
                </div>
                <div class="stats">
                  <span class="plays" v-if="work.plays">
                    <el-icon><VideoPlay /></el-icon>
                    {{ work.plays }} {{ t('common.plays') }}
                  </span>
                  <span class="date">
                    {{ new Date(work.createdAt).toLocaleDateString(undefined, { 
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric'
                    }) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Testimonials Section -->
    <section class="testimonials">
      <div class="section-header text-center">
        <h2 class="section-title">{{ t('home.testimonials.title') }}</h2>
        <p class="section-description">{{ t('home.testimonials.description') }}</p>
      </div>
      
      <div class="testimonials-grid" role="list" aria-label="{{ t('home.testimonials.title') }}">
        <div 
          v-for="testimonial in testimonials" 
          :key="testimonial.id"
          class="testimonial-card glass"
          role="listitem"
          :aria-label="t('home.testimonials.ariaLabel', { author: testimonial.author, title: testimonial.title })"
        >
          <div class="testimonial-content">
            <div class="quote-icon" aria-hidden="true">
              <el-icon><ChatRound /></el-icon>
            </div>
            <p>{{ testimonial.content }}</p>
          </div>
          <div class="testimonial-author">
            <el-avatar 
              :size="48" 
              :src="testimonial.avatar"
              :alt="testimonial.author"
            />
            <div class="author-info">
              <h4>{{ testimonial.author }}</h4>
              <span>{{ testimonial.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- CTA Section -->
    <section class="cta-section glass">
      <div class="cta-content">
        <h2 class="cta-title">{{ t('home.cta.title') }}</h2>
        <p class="cta-description">
          {{ t('home.cta.description') }}
        </p>
        <el-button 
          type="primary"
          size="large"
          class="cta-button glow-effect"
          @click="goToCreate"
        >
          {{ t('home.cta.button') }}
          <span class="glow-container">
            <span class="glow"></span>
          </span>
        </el-button>
      </div>
      
      <div class="cta-decoration">
        <div class="decoration-circle"></div>
        <div class="decoration-line"></div>
        <div class="decoration-dots"></div>
      </div>
    </section>
    
    <!-- 在 featured works section 后添加 -->
    <div class="section news-community">
      <div class="section-header">
        <h2 class="section-title">{{ t('home.newsAndCommunity.title') }}</h2>
        <p class="section-description">{{ t('home.newsAndCommunity.description') }}</p>
      </div>
      
      <div class="news-grid">
        <!-- 音乐科技新闻 -->
        <div class="news-category">
          <h3>{{ t('home.newsAndCommunity.musicTech.title') }}</h3>
          <div class="news-list">
            <a v-for="news in musicTechNews" 
               :key="news.id"
               :href="news.url"
               target="_blank"
               rel="noopener noreferrer"
               class="news-card"
            >
              <img :src="news.image" :alt="news.title" class="news-image">
              <div class="news-content">
                <h4>{{ news.title }}</h4>
                <p>{{ news.description }}</p>
                <div class="news-meta">
                  <span class="news-source">{{ news.source }}</span>
                  <span class="news-date">{{ news.date }}</span>
                </div>
              </div>
            </a>
          </div>
        </div>
        
        <!-- 社区动态 -->
        <div class="news-category">
          <h3>{{ t('home.newsAndCommunity.community.title') }}</h3>
          <div class="news-list">
            <a v-for="post in communityPosts" 
               :key="post.id"
               :href="post.url"
               target="_blank"
               rel="noopener noreferrer"
               class="news-card"
            >
              <img :src="post.image" :alt="post.title" class="news-image">
              <div class="news-content">
                <h4>{{ post.title }}</h4>
                <p>{{ post.description }}</p>
                <div class="news-meta">
                  <span class="news-author">{{ post.author }}</span>
                  <span class="news-date">{{ post.date }}</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <TheFooter />
  </div>
</template>

<style scoped lang="scss">
.home {
  min-height: 100vh;
  background: radial-gradient(
    circle at top right,
    rgba(var(--primary-color-rgb), 0.1),
    rgba(var(--accent-color-rgb), 0.05),
    transparent 70%
  );
}

.decoration-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  
  .floating-circle {
    position: absolute;
    top: 10%;
    right: 15%;
    width: 300px;
    height: 300px;
    background: radial-gradient(
      circle,
      rgba(var(--primary-color-rgb), 0.1),
      transparent 70%
    );
    border-radius: 50%;
    animation: float 30s infinite ease-in-out;
    filter: blur(25px);
    opacity: 0.4;
  }
  
  .floating-square {
    position: absolute;
    bottom: 20%;
    left: 10%;
    width: 200px;
    height: 200px;
    background: radial-gradient(
      circle,
      rgba(var(--accent-color-rgb), 0.1),
      transparent 70%
    );
    transform: rotate(45deg);
    animation: float 25s infinite ease-in-out reverse;
    filter: blur(20px);
    opacity: 0.4;
  }
  
  .floating-dots {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(
      rgba(var(--primary-color-rgb), 0.1) 1px,
      transparent 1px
    );
    background-size: 30px 30px;
    animation: moveDots 80s linear infinite;
    opacity: 0.3;
  }
  
  .gradient-line {
    position: absolute;
    top: 50%;
    left: -10%;
    right: -10%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--primary-color),
      transparent
    );
    transform: rotate(-30deg);
    animation: pulse 4s ease-in-out infinite;
    filter: blur(8px);
    opacity: 0.4;
  }
}

.hero-section {
  position: relative;
  min-height: 100vh;
  padding: 120px 0 80px;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 80px 0 40px;
    min-height: auto;
  }
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  
  .gradient-sphere {
    position: absolute;
    top: -20%;
    right: -10%;
    width: 600px;
    height: 600px;
    background: radial-gradient(
      circle,
      rgba(var(--primary-color-rgb), 0.1) 0%,
      rgba(var(--accent-color-rgb), 0.05) 30%,
      transparent 70%
    );
    filter: blur(60px);
  }
  
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at 50% 50%, black, transparent 70%);
  }
  
  .floating-particles {
    position: absolute;
    inset: 0;
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--primary-color);
      animation: float 20s linear infinite;
    }
    
    &::before {
      top: 20%;
      left: 20%;
      animation-delay: -5s;
    }
    
    &::after {
      top: 40%;
      right: 30%;
      animation-delay: -10s;
    }
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 2rem;
  }
}

.hero-text {
  .hero-title {
    font-size: 4rem;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 1.5rem;
    
    @media (max-width: 768px) {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  }
  
  .hero-description {
    font-size: 1.25rem;
    color: var(--text-color-secondary);
    margin-bottom: 2rem;
    line-height: 1.6;
    max-width: 600px;
    
    @media (max-width: 1024px) {
      margin-left: auto;
      margin-right: auto;
    }
    
    @media (max-width: 768px) {
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }
  }
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2.5rem;
  
  @media (max-width: 1024px) {
    justify-content: center;
  }
  
  @media (max-width: 768px) {
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    justify-content: center;
    
    .stat-item {
      flex: 0 0 calc(50% - 1rem);
      
      .stat-number {
        font-size: 1.5rem;
      }
      
      .stat-label {
        font-size: 0.75rem;
      }
    }
    
    .stat-divider {
      display: none;
    }
  }
}

.hero-actions {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  
  @media (max-width: 1024px) {
    justify-content: center;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
    
    .start-btn,
    .explore-btn {
      width: 100%;
      min-width: 0;
    }
  }
}

.tech-badges {
  display: flex;
  gap: 1rem;
  
  @media (max-width: 1024px) {
    justify-content: center;
  }
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.5rem;
    
    .badge {
      flex: 1 1 calc(33.33% - 0.5rem);
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      
      .el-icon {
        font-size: 1rem;
      }
    }
  }
}

.hero-visual {
  position: relative;
  
  @media (max-width: 768px) {
    margin: 0 -1rem;
    
    :deep(svg) {
      width: 100%;
      height: auto;
    }
  }
  
  .visual-decoration {
    position: absolute;
    inset: -20px;
    pointer-events: none;
    
    @media (max-width: 768px) {
      inset: -10px;
      
      .deco-circle {
        width: 60px;
        height: 60px;
      }
      
      .deco-line {
        width: 100px;
      }
      
      .deco-dots {
        width: 60px;
        height: 60px;
      }
    }
  }
}

@keyframes float {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(100px, 50px);
  }
  100% {
    transform: translate(0, 0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.5);
    opacity: 1;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.how-it-works {
  padding: 6rem 2rem;
  background: linear-gradient(135deg,
    rgba(var(--primary-color-rgb), 0.05),
    rgba(var(--accent-color-rgb), 0.02)
  );
  
  @media (max-width: 640px) {
    padding: 4rem 1rem;
  }
  
  .section-header {
    position: relative;
    text-align: center;
    margin-bottom: 4rem;
    
    &::before {
      content: '';
      position: absolute;
      top: -2rem;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 60px;
      background: radial-gradient(
        circle,
        rgba(var(--primary-color-rgb), 0.1),
        transparent 70%
      );
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    .section-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      position: relative;
      display: inline-block;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -0.5rem;
        left: 50%;
        transform: translateX(-50%);
        width: 50%;
        height: 2px;
        background: linear-gradient(90deg,
          transparent,
          var(--primary-color),
          transparent
        );
      }
    }
    
    .section-description {
      font-size: 1.125rem;
      color: var(--text-color-secondary);
      max-width: 600px;
      margin: 0 auto;
    }
  }
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      var(--primary-color),
      transparent
    );
    opacity: 0.2;
    transform: translateY(-50%);
    
    @media (max-width: 1200px) {
      display: none;
    }
  }
}

.step-card {
  position: relative;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      rgba(var(--primary-color-rgb), 0.1),
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-5px);
    border-color: rgba(var(--primary-color-rgb), 0.2);
    
    &::before {
      opacity: 1;
    }
    
    .step-number {
      transform: scale(1.1);
      
      &::before {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 0.2;
      }
    }
    
    .step-icon {
      transform: rotate(360deg);
    }
  }
  
  .step-number {
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    position: relative;
    display: inline-block;
    transition: all 0.3s ease;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80px;
      height: 80px;
      background: var(--primary-color);
      border-radius: 50%;
      opacity: 0.1;
      transition: all 0.3s ease;
      z-index: -1;
    }
  }
  
  .step-icon {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--primary-color-rgb), 0.1);
    border-radius: 50%;
    transition: all 0.6s ease;
    
    .el-icon {
      font-size: 1.25rem;
      color: var(--primary-color);
    }
  }
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -0.5rem;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 2px;
      background: var(--primary-color);
      opacity: 0.5;
    }
  }
  
  p {
    color: var(--text-color-secondary);
    line-height: 1.6;
  }
  
  .step-decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    
    .decoration-line {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg,
        transparent,
        var(--primary-color),
        transparent
      );
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }
  }
  
  &:hover .step-decoration .decoration-line {
    transform: scaleX(1);
  }
}

.use-cases {
  padding: 6rem 2rem;
  background: linear-gradient(135deg,
    rgba(var(--primary-color-rgb), 0.05),
    rgba(var(--accent-color-rgb), 0.02)
  );
  position: relative;
  overflow: hidden;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    filter: blur(60px);
  }
  
  &::before {
    top: -100px;
    right: -100px;
    background: radial-gradient(
      circle,
      rgba(var(--primary-color-rgb), 0.1),
      transparent 70%
    );
  }
  
  &::after {
    bottom: -100px;
    left: -100px;
    background: radial-gradient(
      circle,
      rgba(var(--accent-color-rgb), 0.1),
      transparent 70%
    );
  }
  
  @media (max-width: 640px) {
    padding: 4rem 1rem;
  }
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
}

.case-card {
  position: relative;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease forwards;
  animation-delay: var(--delay);
  opacity: 0;
  
  &:hover {
    transform: translateY(-5px);
    
    .case-icon {
      transform: scale(1.1) rotate(10deg);
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      
      .el-icon {
        color: white;
      }
    }
    
    .case-decoration {
      .decoration-circle {
        transform: scale(1.2);
      }
      
      .decoration-line {
        transform: rotate(180deg);
      }
    }
  }
  
  .case-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    background: rgba(var(--primary-color-rgb), 0.1);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    .el-icon {
      font-size: 40px;
      color: var(--primary-color);
      transition: color 0.3s ease;
    }
  }
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  p {
    color: var(--text-color-secondary);
    line-height: 1.6;
  }
  
  .case-decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    border-radius: 1rem;
    
    .decoration-circle {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 10px;
      height: 10px;
      border: 2px solid var(--primary-color);
      border-radius: 50%;
      transition: transform 0.3s ease;
    }
    
    .decoration-line {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      width: 30px;
      height: 2px;
      background: var(--accent-color);
      transition: transform 0.3s ease;
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

.testimonials {
  padding: 6rem 2rem;
  background: linear-gradient(135deg,
    rgba(var(--primary-color-rgb), 0.05),
    rgba(var(--accent-color-rgb), 0.02)
  );
  
  @media (max-width: 640px) {
    padding: 4rem 1rem;
  }
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
}

.testimonial-card {
  padding: 2rem;
  border-radius: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    
    .quote-icon {
      transform: scale(1.1);
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      
      .el-icon {
        color: white;
      }
    }
  }
  
  .testimonial-content {
    position: relative;
    margin-bottom: 2rem;
    
    .quote-icon {
      width: 48px;
      height: 48px;
      background: rgba(var(--primary-color-rgb), 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      transition: all 0.3s ease;
      
      .el-icon {
        font-size: 24px;
        color: var(--primary-color);
        transition: color 0.3s ease;
      }
    }
    
    p {
      font-size: 1.125rem;
      line-height: 1.6;
      color: var(--text-color);
    }
  }
  
  .testimonial-author {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    .author-info {
      h4 {
        font-size: 1.125rem;
        margin-bottom: 0.25rem;
      }
      
      span {
        color: var(--text-color-secondary);
        font-size: 0.875rem;
      }
    }
  }
}

.cta-section {
  margin: 6rem 2rem;
  padding: 4rem;
  border-radius: 2rem;
  position: relative;
  overflow: hidden;
  
  @media (max-width: 640px) {
    margin: 4rem 1rem;
    padding: 2rem;
  }
  
  .cta-content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .cta-title {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    
    @media (max-width: 640px) {
      font-size: 2rem;
    }
  }
  
  .cta-description {
    font-size: 1.25rem;
    color: var(--text-color-secondary);
    margin-bottom: 2rem;
    line-height: 1.6;
    
    @media (max-width: 640px) {
      font-size: 1.125rem;
    }
  }
  
  .cta-button {
    min-width: 200px;
    height: 48px;
    font-size: 1.125rem;
  }
  
  .cta-decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;
    
    .decoration-circle {
      position: absolute;
      top: -20%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(
        circle,
        rgba(var(--accent-color-rgb), 0.1),
        transparent 70%
      );
      filter: blur(40px);
    }
    
    .decoration-line {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        var(--primary-color),
        transparent
      );
    }
    
    .decoration-dots {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: radial-gradient(
        rgba(var(--primary-color-rgb), 0.1) 1px,
        transparent 1px
      );
      background-size: 20px 20px;
    }
  }
}

.glow-effect {
  position: relative;
  overflow: hidden;
  
  .glow-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  
  .glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
      circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      rgba(255, 255, 255, 0.3),
      transparent 40%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover .glow {
    opacity: 1;
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(10px, -10px) rotate(2deg);
  }
  50% {
    transform: translate(-5px, 10px) rotate(-2deg);
  }
  75% {
    transform: translate(-10px, -5px) rotate(1deg);
  }
}

@keyframes moveDots {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}

.featured-works {
  margin-top: 4rem;
  
  .section-header {
    text-align: center;
    margin-bottom: 3rem;
    
    .gradient-text {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg,
        var(--primary-color),
        var(--accent-color)
      );
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      margin-bottom: 1rem;
    }
    
    .section-desc {
      color: var(--text-color-light);
      font-size: 1.125rem;
    }
  }
  
  .works-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
    
    .work-card {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 1.5rem;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
      cursor: pointer;
      
      &:hover {
        transform: translateY(-5px);
        border-color: rgba(var(--primary-color-rgb), 0.2);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        
        .work-image {
          transform: scale(1.05);
        }
        
        .work-overlay {
          opacity: 1;
        }
      }
      
      .work-media {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        
        .work-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .work-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;
          
          .work-status {
            text-align: center;
            color: white;
            
            .progress-circle {
              :deep(.el-progress-circle__track) {
                stroke: rgba(255, 255, 255, 0.2);
              }
              
              :deep(.el-progress-circle__path) {
                stroke: var(--primary-color);
              }
            }
            
            .error-icon {
              font-size: 32px;
              color: #ff4d4f;
              margin-bottom: 0.5rem;
            }
            
            .status-text {
              font-size: 0.875rem;
              margin-top: 0.5rem;
            }
          }
          
          .play-button {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg,
              var(--primary-color),
              var(--accent-color)
            );
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
            
            .el-icon {
              font-size: 24px;
              color: white;
            }
            
            &:hover {
              transform: scale(1.1);
            }
          }
        }
      }
      
      .work-info {
        padding: 1.5rem;
        
        .work-main {
          .work-title {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-color);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .work-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            
            .creator {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              
              .creator-avatar {
                border: 2px solid var(--primary-color);
              }
              
              .creator-name {
                font-size: 0.875rem;
                color: var(--text-color-light);
                max-width: 100px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
            
            .stats {
              display: flex;
              align-items: center;
              gap: 1rem;
              font-size: 0.75rem;
              color: var(--text-color-light);
              
              .plays {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                
                .el-icon {
                  font-size: 1rem;
                  color: var(--primary-color);
                }
              }
              
              .date {
                opacity: 0.8;
              }
            }
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .featured-works {
    .section-header {
      .gradient-text {
        font-size: 2rem;
      }
    }
    
    .works-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.5rem;
    }
  }
}

.section-header {
  margin-bottom: 3rem;
  text-align: center;
  
  .section-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(to right, var(--primary-color), var(--accent-color));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .section-description {
    font-size: 1.125rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto;
  }
}

.text-center {
  text-align: center;
}

.news-community {
  background: var(--surface-color);
  border-radius: 1.5rem;
  padding: 4rem 0;
  margin: 4rem 0;
}

.news-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-top: 3rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.news-category {
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: var(--text-color);
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.news-list {
  display: grid;
  gap: 1.5rem;
}

.news-card {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.05);
  }
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.news-image {
  width: 200px;
  height: 120px;
  object-fit: cover;
  border-radius: 0.5rem;
  
  @media (max-width: 640px) {
    width: 100%;
    height: 160px;
  }
}

.news-content {
  flex: 1;
  
  h4 {
    font-size: 1.125rem;
    color: var(--text-color);
    margin-bottom: 0.5rem;
  }
  
  p {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }
}

.news-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  
  .news-source,
  .news-author {
    color: var(--primary-color);
    font-weight: 500;
  }
}
</style> 