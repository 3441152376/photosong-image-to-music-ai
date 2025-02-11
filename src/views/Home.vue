切换导航页面的动画太生硬了，不够自然<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TheNavbar from '../components/TheNavbar.vue'
import AV from 'leancloud-storage'
import HeroIllustration from '../components/HeroIllustration.vue'
import TheFooter from '../components/TheFooter.vue'
import { ElMessage } from 'element-plus'
import { useHead } from '@unhead/vue'

const router = useRouter()
const { t, locale } = useI18n()
const loading = ref(false)
const featuredWorks = ref([])
const latestWorks = ref([])
const articles = ref([])
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

// 添加请求限制和重试逻辑
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1秒延迟

const fetchWithRetry = async (query, retryCount = 0) => {
  try {
    if (retryCount >= MAX_RETRIES) {
      throw new Error('Maximum retry attempts reached')
    }
    
    return await query.find()
  } catch (error) {
    if (error.code === 429) { // Too Many Requests
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
      return fetchWithRetry(query, retryCount + 1)
    }
    throw error
  }
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
    
    const results = await fetchWithRetry(query)
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
    ElMessage.error(t('errors.fetchWorks'))
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
    
    const works = await fetchWithRetry(query)
    latestWorks.value = works.map(work => {
      const user = work.get('user')
      return {
        id: work.id,
        title: work.get('title') || t('home.works.untitledWork'),
        imageUrl: work.get('imageUrl'),
        audioUrl: work.get('audioUrl'),
        status: work.get('status'),
        progress: work.get('progress'),
        plays: work.get('plays') || 0,
        createdAt: work.get('createdAt'),
        user: user ? {
          id: user.id,
          username: user.get('username') || t('home.works.anonymousUser'),
          avatar: user.get('avatar') || '/default-avatar.png'
        } : {
          id: null,
          username: t('home.works.anonymousUser'),
          avatar: '/default-avatar.png'
        }
      }
    })
  } catch (error) {
    console.error('Fetch latest works failed:', error)
    ElMessage.error(t('errors.fetchWorks'))
  }
}

// 获取最新文章
const fetchLatestArticles = async () => {
  try {
    const query = new AV.Query('Article')
    query.equalTo('status', 'published')
    query.include('author')
    query.descending('createdAt')
    query.limit(9)
    
    const results = await fetchWithRetry(query)
    articles.value = results.map(article => {
      // 获取作者信息，确保作者是 AV.Object 实例
      const author = article.get('author')
      let authorData = {
        id: null,
        username: t('home.articles.anonymousAuthor'),
        avatar: '/default-avatar.png'
      }

      if (author && author instanceof AV.Object) {
        authorData = {
          id: author.id,
          username: author.get('username') || t('home.articles.anonymousAuthor'),
          avatar: author.get('avatar') || '/default-avatar.png'
        }
      }
      
      return {
        id: article.id,
        title: article.get('title') || t('home.articles.untitledArticle'),
        summary: article.get('summary') || '',
        coverImage: article.get('coverImage') || '/default-article-cover.png',
        createdAt: article.createdAt,
        author: authorData
      }
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    ElMessage.error(t('errors.fetchArticles'))
  }
}

// 跳转到作品详情
const handlePlay = async (work) => {
  try {
    // 只在用户点击时初始化 AudioContext
    if (!audioContext.value) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext.value = new AudioContextClass();
    }
    
    // 如果 AudioContext 被挂起，等待用户交互后恢复
    if (audioContext.value.state === 'suspended') {
      await audioContext.value.resume();
    }
    
    // 导航到作品详情页
    await router.push({ 
      name: `${locale.value}-WorkDetail`,
      params: { id: work.id }
    });
  } catch (error) {
    console.error('Error initializing audio:', error);
    ElMessage.error(t('errors.audioInit'));
  }
}

// 跳转到创作页面
const goToCreate = () => {
  router.push({ name: `${locale.value}-Create` })
}

const goToCommunity = () => {
  router.push({ name: `${locale.value}-Community` })
}

// 跳转到文章详情
const goToArticle = (article) => {
  router.push({ 
    name: `${locale.value}-ArticleDetail`,
    params: { slug: article.slug || article.id }
  })
}

// 跳转到文章列表
const goToArticles = () => {
  router.push({ name: `${locale.value}-Articles` })
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
    icon: "Location",
    link: { name: `${locale.value}-Category`, params: { category: 'travel' } }
  },
  {
    title: t('home.useCases.wedding.title'),
    description: t('home.useCases.wedding.description'),
    icon: "Present",
    link: { name: `${locale.value}-Category`, params: { category: 'wedding' } }
  },
  {
    title: t('home.useCases.business.title'),
    description: t('home.useCases.business.description'),
    icon: "Shop",
    link: { name: `${locale.value}-Category`, params: { category: 'business' } }
  },
  {
    title: t('home.useCases.social.title'),
    description: t('home.useCases.social.description'),
    icon: "Share",
    link: { name: `${locale.value}-Category`, params: { category: 'social' } }
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

// 添加图片加载优化
const optimizeImageUrl = (url) => {
  if (!url) return '/default-image.png'
  
  // 如果是 LeanCloud 文件 URL，添加 no-cookie 参数
  if (url.includes('lc-') && url.includes('lcfile.com')) {
    return `${url}${url.includes('?') ? '&' : '?'}no-cookie=1`
  }
  
  return url
}

// 修改图片 URL 处理
const getAvatarUrl = (user) => {
  const avatar = user.avatar
  if (avatar instanceof AV.File) {
    return optimizeImageUrl(avatar.url())
  }
  return optimizeImageUrl(avatar) || '/default-avatar.png'
}

onMounted(() => {
  fetchFeaturedWorks()
  fetchLatestWorks()
  fetchLatestArticles()
  document.addEventListener('mousemove', handleMouseMove)
  initParticles()
  window.addEventListener('resize', initParticles)
  window.addEventListener('mousemove', handleParallax)
  window.addEventListener('keydown', handleKonami)
})

onUnmounted(() => {
  if (audioContext.value) {
    audioContext.value.close().catch(console.error)
  }
  window.removeEventListener('resize', initParticles)
  window.removeEventListener('mousemove', handleParallax)
  window.removeEventListener('keydown', handleKonami)
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

const goToCategory = (category) => {
  router.push(category.link)
}

const goToFeaturedWork = (work) => {
  router.push({ 
    name: `${locale.value}-WorkDetail`,
    params: { id: work.id }
  })
}

const goToUserProfile = (user) => {
  router.push({ 
    name: `${locale.value}-UserProfile`,
    params: { id: user.id }
  })
}

const goToLatestWorks = () => {
  router.push({ 
    name: `${locale.value}-Community`,
    query: { sort: 'latest' }
  })
}

const goToPopularWorks = () => {
  router.push({ 
    name: `${locale.value}-Community`,
    query: { sort: 'popular' }
  })
}

const meta = {
  title: 'PhotoSong | Transform Your Photos into Beautiful Music with AI',
  meta: [
    {
      name: 'description',
      content: 'PhotoSong turns your photos into unique AI-generated music. Create, share, and discover musical interpretations of images. Join our creative community today.'
    },
    // Open Graph
    {
      property: 'og:title',
      content: 'PhotoSong | Transform Photos into Music with AI'
    },
    {
      property: 'og:description',
      content: 'Turn your photos into unique AI-generated music. Create, share, and discover musical interpretations of images on PhotoSong.'
    },
    {
      property: 'og:image',
      content: '/src/assets/home-preview.jpg'
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      property: 'og:site_name',
      content: 'PhotoSong'
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
      content: 'PhotoSong | Photo to Music AI Creator'
    },
    {
      name: 'twitter:description',
      content: 'Transform your photos into beautiful music using AI. Create and share your unique photo-music creations.'
    },
    {
      name: 'twitter:image',
      content: '/src/assets/home-preview.jpg'
    },
    // Additional SEO
    {
      name: 'keywords',
      content: 'photo to music, AI music generator, image to song, AI music creation, PhotoSong, creative AI tools'
    }
  ],
  // JSON-LD structured data
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'PhotoSong',
        'url': 'https://photosong.com',
        'description': 'Transform your photos into beautiful music using AI technology.',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://photosong.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      })
    }
  ]
}

// 使用 useHead 设置静态 meta 信息
useHead(meta)

// Konami Code 彩蛋
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
const konamiIndex = ref(0)

const handleKonami = (event) => {
  if (event.key === konamiCode[konamiIndex.value]) {
    konamiIndex.value++
    if (konamiIndex.value === konamiCode.length) {
      triggerKonamiEasterEgg()
      konamiIndex.value = 0
    }
  } else {
    konamiIndex.value = 0
  }
}

const triggerKonamiEasterEgg = () => {
  // 创建10个音符元素
  for (let i = 0; i < 10; i++) {
    const note = document.createElement('div')
    note.className = 'konami-note'
    note.style.left = `${Math.random() * 100}vw`
    note.style.animationDelay = `${Math.random() * 2}s`
    note.style.color = `hsl(${Math.random() * 360}, 80%, 60%)`
    note.innerHTML = '♪'
    document.body.appendChild(note)
    
    // 3秒后移除音符
    setTimeout(() => {
      note.remove()
    }, 3000)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKonami)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKonami)
})

// 添加跳转处理函数
const handleSectionClick = (section) => {
  switch(section) {
    case 'features':
      router.push({ name: `${locale.value}-Features` })
      break
    case 'pricing':
      router.push({ name: `${locale.value}-Pricing` })
      break
    case 'cases':
      router.push({ name: `${locale.value}-Cases` })
      break
    case 'articles':
      router.push({ name: `${locale.value}-Articles` })
      break
    case 'about':
      router.push({ name: `${locale.value}-About` })
      break
  }
}

// 添加 Intersection Observer 动画
const useIntersectionObserver = (elementRef, callback) => {
  const observer = new IntersectionObserver(callback, {
    threshold: 0.1,
    rootMargin: '50px'
  })
  
  if (elementRef.value) {
    observer.observe(elementRef.value)
  }
  
  return {
    stop: () => observer.disconnect()
  }
}

// 为每个主要部分添加引用
const howItWorksRef = ref(null)
const casesRef = ref(null)
const featuredWorksRef = ref(null)
const articlesRef = ref(null)
const ctaRef = ref(null)

// 动画状态
const animations = reactive({
  howItWorks: false,
  cases: false,
  featuredWorks: false,
  articles: false,
  cta: false
})

// 监听各个部分的可见性
onMounted(() => {
  const sections = [
    { ref: howItWorksRef, key: 'howItWorks' },
    { ref: casesRef, key: 'cases' },
    { ref: featuredWorksRef, key: 'featuredWorks' },
    { ref: articlesRef, key: 'articles' },
    { ref: ctaRef, key: 'cta' }
  ]
  
  sections.forEach(({ ref, key }) => {
    useIntersectionObserver(ref, ([{ isIntersecting }]) => {
      if (isIntersecting) {
        animations[key] = true
      }
    })
  })
})

useHead({
  title: 'Photo Song - Turn Photos into Music | AI Photo Music Generator',
  meta: [
    {
      name: 'description',
      content: 'Transform your photos into unique musical pieces with our AI-powered platform. Create personalized songs from your images using advanced AI technology.'
    },
    {
      name: 'keywords',
      content: 'photo to music, image to music converter, AI music generator, photo song maker'
    }
  ]
})
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
      
      <!-- 添加音乐动画元素 -->
      <div class="music-waves">
        <div v-for="i in 5" :key="i" class="wave" :style="{ '--delay': i * 0.2 + 's' }"></div>
      </div>
      <div class="music-particles">
        <div v-for="i in 20" :key="i" 
          class="particle" 
          :style="{ 
            '--size': Math.random() * 4 + 2 + 'px',
            '--x': Math.random() * 100 + '%',
            '--y': Math.random() * 100 + '%',
            '--duration': Math.random() * 20 + 10 + 's'
          }">
        </div>
      </div>
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
            <div class="stat-item" @click="goToPopularWorks" role="button" tabindex="0">
              <span class="stat-number">10K+</span>
              <span class="stat-label">{{ t('home.hero.stats.users') }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item" @click="goToLatestWorks" role="button" tabindex="0">
              <span class="stat-number">50K+</span>
              <span class="stat-label">{{ t('home.hero.stats.works') }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item" @click="goToCommunity" role="button" tabindex="0">
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
          <HeroIllustration :latest-work="latestWorks[0]" />
        </div>
      </div>
    </section>
    
    <!-- How It Works Section -->
    <section 
      ref="howItWorksRef"
      class="how-it-works"
      :class="{ 'animate-in': animations.howItWorks }"
    >
      <div class="section-header">
        <h2 class="section-title">{{ t('home.howItWorks.title') }}</h2>
        <p class="section-description">{{ t('home.howItWorks.description') }}</p>
      </div>
      
      <div class="steps-grid" :aria-label="t('home.howItWorks.title')">
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
    <section 
      ref="casesRef"
      class="cases-section"
      :class="{ 'animate-in': animations.cases }"
    >
      <div class="section-header">
        <h2 class="section-title">{{ t('home.useCases.title') }}</h2>
        <p class="section-description">{{ t('home.useCases.description') }}</p>
      </div>
      
      <div class="cases-grid" :aria-label="t('home.useCases.title')">
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
    <section 
      ref="featuredWorksRef"
      class="featured-works"
      :class="{ 'animate-in': animations.featuredWorks }"
    >
      <div class="section-header">
        <h2 class="section-title">{{ t('home.featuredWorks.title') }}</h2>
        <p class="section-description">{{ t('home.featuredWorks.description') }}</p>
        <div class="title-decoration">
          <span class="line"></span>
          <span class="dot"></span>
        </div>
      </div>
      
      <div class="works-grid">
        <div 
          v-for="work in latestWorks" 
          :key="work.id"
          class="work-card"
          @click="handlePlay(work)"
          role="button"
          tabindex="0"
          :aria-label="t('home.works.playWork', { title: work.title })"
        >
          <div class="work-media">
            <img 
              :src="optimizeImageUrl(work.imageUrl)" 
              :alt="work.title"
              class="work-image"
              loading="lazy"
              crossorigin="anonymous"
            >
            <div class="work-overlay">
              <div class="play-button" aria-hidden="true">
                <el-icon><CaretRight /></el-icon>
              </div>
            </div>
          </div>
          
          <div class="work-info">
            <div class="work-main">
              <h3 class="work-title">{{ work.title }}</h3>
              <div class="work-meta">
                <div class="creator" @click.stop="goToUserProfile(work.user)">
                  <img 
                    :src="getAvatarUrl(work.user)"
                    :alt="work.user.username"
                    class="creator-avatar"
                    loading="lazy"
                    crossorigin="anonymous"
                  >
                  <span class="creator-name">{{ work.user.username }}</span>
                </div>
                <div class="stats">
                  <span class="plays" v-if="work.plays">
                    <el-icon><VideoPlay /></el-icon>
                    {{ work.plays }}
                  </span>
                  <span class="date">
                    {{ new Date(work.createdAt).toLocaleDateString() }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="view-more">
        <button class="view-more-btn" @click="goToLatestWorks">
          {{ t('home.works.viewMore') }}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </section>
    
    <!-- Articles Section -->
    <section 
      ref="articlesRef"
      class="articles-section"
      :class="{ 'animate-in': animations.articles }"
    >
      <div class="section-header">
        <h2 class="section-title">{{ t('home.articles.title') }}</h2>
        <p class="section-description">{{ t('home.articles.description') }}</p>
      </div>
      
      <div class="articles-grid">
        <!-- 骨架屏加载动画 -->
        <template v-if="loading">
          <div v-for="i in 6" :key="i" class="article-card is-loading">
            <div class="article-image skeleton"></div>
            <div class="article-content">
              <div class="article-title skeleton"></div>
              <div class="article-summary skeleton"></div>
              <div class="article-meta">
                <div class="skeleton" style="width: 80px;"></div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- 实际文章内容 -->
        <article v-else v-for="article in articles" 
                :key="article.id" 
                class="article-card"
                @click="goToArticle(article)">
          <div class="article-image">
            <img :src="article.coverImage" 
                 :alt="article.title" />
          </div>
          <div class="article-content">
            <h3 class="article-title">{{ article.title }}</h3>
            <p class="article-summary">{{ article.summary }}</p>
            <div class="article-meta">
              <time>{{ new Date(article.createdAt).toLocaleDateString() }}</time>
            </div>
          </div>
        </article>
      </div>

      <div class="view-more">
        <button class="view-more-btn" @click="goToArticles">
          {{ t('home.articles.viewMore') }}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </section>
    
    <!-- CTA Section -->
    <section 
      ref="ctaRef"
      class="cta-section"
      :class="{ 'animate-in': animations.cta }"
    >
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
  min-height: 85vh;
  padding: 40px 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(var(--primary-color-rgb), 0.08) 0%,
    rgba(var(--accent-color-rgb), 0.05) 50%,
    transparent 100%
  );
  
  @media (max-width: 768px) {
    padding: 30px 0;
    min-height: calc(90vh - 60px);
  }
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  
  .gradient-sphere {
    position: absolute;
    top: -10%;
    right: -5%;
    width: 800px;
    height: 800px;
    background: radial-gradient(
      circle,
      rgba(var(--primary-color-rgb), 0.2) 0%,
      rgba(var(--accent-color-rgb), 0.15) 30%,
      transparent 70%
    );
    filter: blur(80px);
    animation: float 20s infinite ease-in-out;
    transform-origin: center;
    
    @media (max-width: 768px) {
      width: 400px;
      height: 400px;
      top: -5%;
      right: -15%;
    }
  }
  
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(var(--primary-color-rgb), 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(var(--primary-color-rgb), 0.03) 1px, transparent 1px);
    background-size: 30px 30px;
    mask-image: radial-gradient(circle at 50% 50%, black, transparent 70%);
    opacity: 0.5;
    animation: gridMove 30s linear infinite;
  }
  
  .floating-particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--primary-color);
      filter: blur(1px);
      opacity: 0.4;
      animation: float 15s linear infinite;
    }
    
    &::before {
      top: 25%;
      left: 15%;
      animation-delay: -3s;
    }
    
    &::after {
      top: 35%;
      right: 25%;
      animation-delay: -7s;
    }
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 3rem;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 2.5rem;
  }
  
  @media (max-width: 768px) {
    padding: 0 1rem;
    gap: 2rem;
  }
}

.hero-text {
  .hero-title {
    font-size: clamp(2.5rem, 4vw, 3.75rem);
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    letter-spacing: -0.02em;
    opacity: 0;
    animation: fadeInUp 0.8s ease-out forwards;
    
    .gradient-text {
      background: linear-gradient(135deg, 
        var(--primary-color), 
        var(--accent-color)
      );
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      position: relative;
      display: inline-block;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -0.1em;
        left: 0;
        width: 100%;
        height: 0.1em;
        background: linear-gradient(90deg,
          transparent,
          var(--primary-color),
          transparent
        );
        opacity: 0.2;
        transform-origin: left;
        animation: expandWidth 1.5s ease-out forwards;
      }
    }
  }
  
  .hero-description {
    font-size: clamp(1.125rem, 1.5vw, 1.25rem);
    color: var(--text-color-secondary);
    margin-bottom: 2.5rem;
    line-height: 1.6;
    max-width: 540px;
    opacity: 0;
    animation: fadeInUp 0.8s ease-out forwards;
    animation-delay: 0.2s;
    
    @media (max-width: 1024px) {
      margin-left: auto;
      margin-right: auto;
    }
  }
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  margin-bottom: 2.5rem;
  opacity: 0;
  animation: fadeInUp 0.8s ease-out forwards;
  animation-delay: 0.4s;
  
  @media (max-width: 1024px) {
    justify-content: center;
  }
  
  @media (max-width: 768px) {
    gap: 1.5rem;
    flex-wrap: wrap;
    justify-content: center;
    
    .stat-item {
      flex: 1 1 calc(33.33% - 1rem);
      min-width: 100px;
    }
  }
  
  .stat-item {
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(var(--primary-color-rgb), 0.1);
    backdrop-filter: blur(10px);
    
    &:hover {
      transform: translateY(-3px);
      background: rgba(var(--primary-color-rgb), 0.05);
      border-color: rgba(var(--primary-color-rgb), 0.2);
    }
    
    .stat-number {
      font-size: clamp(1.75rem, 2.5vw, 2.25rem);
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      margin-bottom: 0.25rem;
    }
    
    .stat-label {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
      font-weight: 500;
    }
  }
  
  .stat-divider {
    display: none;
  }
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.5rem;
  opacity: 0;
  animation: fadeInUp 0.8s ease-out forwards;
  animation-delay: 0.6s;
  
  @media (max-width: 1024px) {
    justify-content: center;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
    width: 100%;
    max-width: 300px;
    margin: 0 auto 2rem;
  }
  
  .start-btn {
    min-width: 180px;
    height: 48px;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    border: none;
    background: linear-gradient(135deg, 
      var(--primary-color) 0%,
      var(--accent-color) 100%
    );
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(var(--primary-color-rgb), 0.15);
    
    @media (max-width: 768px) {
      width: 100%;
      min-width: unset;
    }
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(var(--primary-color-rgb), 0.25);
      
      .glow {
        transform: translateX(100%);
      }
      
      .el-icon {
        transform: translateX(3px);
      }
    }
    
    &:active {
      transform: translateY(1px);
      box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.15);
    }
    
    .el-icon {
      margin-left: 0.5rem;
      transition: transform 0.3s ease;
    }
  }
  
  .explore-btn {
    min-width: 160px;
    height: 48px;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    position: relative;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(var(--primary-color-rgb), 0.15);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    border-radius: 12px;
    color: var(--text-color);
    
    @media (max-width: 768px) {
      width: 100%;
      min-width: unset;
    }
    
    &:hover {
      background: rgba(var(--primary-color-rgb), 0.08);
      border-color: var(--primary-color);
      color: var(--primary-color);
      transform: translateY(-2px);
    }
    
    &:active {
      transform: translateY(1px);
    }
  }
}

.tech-badges {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  opacity: 0;
  animation: fadeInUp 0.8s ease-out forwards;
  animation-delay: 0.8s;
  
  @media (max-width: 1024px) {
    justify-content: center;
  }
  
  .badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(var(--primary-color-rgb), 0.1);
    backdrop-filter: blur(10px);
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(var(--primary-color-rgb), 0.05);
      border-color: rgba(var(--primary-color-rgb), 0.2);
      transform: translateY(-2px);
    }
    
    .el-icon {
      color: var(--primary-color);
      font-size: 1rem;
    }
  }
}

.hero-visual {
  position: relative;
  opacity: 0;
  animation: fadeInRight 1s ease-out forwards;
  animation-delay: 0.4s;
  
  @media (max-width: 1024px) {
    max-width: 500px;
    margin: 0 auto;
  }
  
  @media (max-width: 768px) {
    max-width: 100%;
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
    
    .deco-circle {
      position: absolute;
      top: 10%;
      right: 10%;
      width: 80px;
      height: 80px;
      border: 2px dashed var(--primary-color);
      border-radius: 50%;
      opacity: 0.2;
      animation: rotate 20s linear infinite;
    }
    
    .deco-line {
      position: absolute;
      bottom: 20%;
      left: -5%;
      width: 120px;
      height: 2px;
      background: linear-gradient(90deg,
        transparent,
        var(--primary-color),
        transparent
      );
      transform: rotate(-45deg);
      opacity: 0.3;
    }
    
    .deco-dots {
      position: absolute;
      top: 30%;
      left: 10%;
      width: 60px;
      height: 60px;
      background-image: radial-gradient(
        var(--primary-color) 1px,
        transparent 1px
      );
      background-size: 8px 8px;
      opacity: 0.2;
    }
    
    @media (max-width: 768px) {
      inset: -10px;
      
      .deco-circle {
        width: 50px;
        height: 50px;
      }
      
      .deco-line {
        width: 80px;
      }
      
      .deco-dots {
        width: 40px;
        height: 40px;
      }
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

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes expandWidth {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

@keyframes gridMove {
  0% {
    transform: translateX(0) translateY(0);
  }
  100% {
    transform: translateX(-30px) translateY(-30px);
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
  padding: 80px 0; // 修改padding
  margin-top: -40px; // 向上移动一点
  background: linear-gradient(135deg,
    rgba(var(--primary-color-rgb), 0.05),
    rgba(var(--accent-color-rgb), 0.02)
  );
  
  @media (max-width: 640px) {
    padding: 60px 0;
    margin-top: -20px;
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

.cases-section {
  padding: 80px 0; // 修改padding
  margin-top: -20px; // 向上移动一点
  background: linear-gradient(135deg,
    rgba(var(--primary-color-rgb), 0.05),
    rgba(var(--accent-color-rgb), 0.02)
  );
  position: relative;
  overflow: hidden;
  
  @media (max-width: 640px) {
    padding: 60px 0;
    margin-top: -10px;
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
  padding: 80px 0; // 修改padding
  margin-top: -20px; // 向上移动一点
  background: linear-gradient(135deg,
    rgba(var(--primary-color-rgb), 0.05),
    rgba(var(--accent-color-rgb), 0.02)
  );
  
  @media (max-width: 640px) {
    padding: 60px 0;
    margin-top: -10px;
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
  margin: 40px auto; // 减小margin
  padding: 80px 0; // 修改padding
  border-radius: 2rem;
  position: relative;
  overflow: hidden;
  max-width: 1400px;
  background: linear-gradient(
    135deg,
    rgba(var(--primary-color-rgb), 0.1),
    rgba(var(--accent-color-rgb), 0.05)
  );
  border: 1px solid rgba(var(--primary-color-rgb), 0.1);
  backdrop-filter: blur(10px);
  
  @media (max-width: 640px) {
    margin: 30px 1rem;
    padding: 60px 1.5rem;
  }
  
  .cta-content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 700px;
    margin: 0 auto;
    animation: fadeInUp 1s ease-out forwards;
  }
  
  .cta-title {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 800;
    margin-bottom: 1.5rem;
    line-height: 1.2;
    background: linear-gradient(135deg, 
      var(--primary-color), 
      var(--accent-color)
    );
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
      width: 100px;
      height: 4px;
      background: linear-gradient(90deg,
        transparent,
        var(--primary-color),
        transparent
      );
      border-radius: 2px;
      opacity: 0.5;
    }
  }
  
  .cta-description {
    font-size: clamp(1.125rem, 2vw, 1.25rem);
    color: var(--text-color-secondary);
    margin-bottom: 3rem;
    line-height: 1.6;
    opacity: 0.8;
  }
  
  .cta-button {
    min-width: 220px;
    height: 56px;
    font-size: 1.25rem;
    font-weight: 600;
    background: linear-gradient(135deg,
      var(--primary-color),
      var(--accent-color)
    );
    border: none;
    border-radius: 28px;
    color: white;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(var(--primary-color-rgb), 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(var(--primary-color-rgb), 0.4);
      
      .glow {
        transform: translateX(100%);
      }
    }
    
    &:active {
      transform: translateY(1px);
      box-shadow: 0 2px 10px rgba(var(--primary-color-rgb), 0.3);
    }
  }
  
  .cta-decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.5;
    
    .decoration-circle {
      position: absolute;
      top: -20%;
      right: -10%;
      width: 600px;
      height: 600px;
      background: radial-gradient(
        circle,
        rgba(var(--accent-color-rgb), 0.15),
        transparent 70%
      );
      filter: blur(60px);
      animation: float 30s infinite ease-in-out;
    }
    
    .decoration-line {
      position: absolute;
      bottom: 20%;
      left: -10%;
      width: 200px;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent,
        var(--primary-color),
        transparent
      );
      transform: rotate(-45deg);
      animation: pulse 4s infinite ease-in-out;
    }
    
    .decoration-dots {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(
        rgba(var(--primary-color-rgb), 0.1) 1px,
        transparent 1px
      );
      background-size: 30px 30px;
      opacity: 0.3;
      animation: moveDots 50s linear infinite;
      mask-image: radial-gradient(circle at 50% 50%, black, transparent 70%);
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
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
}

@keyframes moveDots {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 100% 100%;
  }
}

.featured-works {
  padding: 80px 0; // 修改padding
  margin-top: -20px; // 向上移动一点
  
  @media (max-width: 640px) {
    padding: 60px 0;
    margin-top: -10px;
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
            padding: 0.5rem;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
            cursor: pointer;
            
            &:hover {
              background: rgba(var(--primary-color-rgb), 0.1);
            }
            
            .creator-avatar {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid var(--primary-color);
            }
            
            .creator-name {
              font-size: 0.875rem;
              color: var(--text-color-light);
              max-width: 120px;
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

.articles-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 0;
  
  @media (max-width: 640px) {
    padding: 40px 0;
    margin: 0 auto;
  }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.article-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    transform: translateY(-5px);
    border-color: rgba(var(--primary-color-rgb), 0.2);
  }
  
  .article-image {
    position: relative;
    aspect-ratio: 16/9;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
  }
  
  .article-content {
    padding: 1.5rem;
    
    .article-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      display: box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      box-orient: vertical;
    }
    
    .article-summary {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin-bottom: 1rem;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      display: box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      box-orient: vertical;
    }
    
    .article-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-color-light);
      
      time {
        opacity: 0.8;
      }
    }
  }
}

.view-more {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  
  .view-more-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--glass-background);
    border: 1px solid var(--glass-border);
    border-radius: 9999px;
    color: var(--text-primary);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    
    svg {
      width: 1.25rem;
      height: 1.25rem;
      transition: transform 0.3s ease;
    }
    
    &:hover {
      background: var(--glass-background-hover);
      border-color: var(--primary-color);
      color: var(--primary-color);
      transform: translateY(-2px);
      
      svg {
        transform: translateX(4px);
      }
    }
  }
}

@media (max-width: 768px) {
  .articles-section {
    padding: 3rem 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes floatNote {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

.konami-note {
  position: fixed;
  bottom: -20px;
  font-size: 2rem;
  animation: floatUp 3s ease-in-out;
  z-index: 1000;
  pointer-events: none;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes floatUp {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

// 添加骨架屏样式
.is-loading {
  pointer-events: none;
  
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--surface-secondary) 25%,
      var(--surface-tertiary) 50%,
      var(--surface-secondary) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }
  
  .article-image.skeleton {
    width: 100%;
    height: 200px;
  }
  
  .article-title.skeleton {
    height: 24px;
    margin-bottom: 1rem;
    width: 90%;
  }
  
  .article-summary.skeleton {
    height: 60px;
    margin-bottom: 1rem;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 添加可点击板块的样式 */
section[role="button"] {
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 添加滚动动画
.how-it-works,
.cases-section,
.featured-works,
.articles-section,
.cta-section {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.animate-in {
    opacity: 1;
    transform: translateY(0);
  }
}

// 为不同部分添加不同的动画延迟
.how-it-works {
  transition-delay: 0.2s;
}

.cases-section {
  transition-delay: 0.3s;
}

.featured-works {
  transition-delay: 0.4s;
}

.articles-section {
  transition-delay: 0.5s;
}

.cta-section {
  transition-delay: 0.6s;
}

// 添加卡片悬停动画
.case-card,
.work-card,
.article-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
}

// 添加按钮悬停动画
.start-btn,
.explore-btn,
.cta-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 添加背景动画
.hero-background {
  .gradient-sphere {
    animation: float 20s infinite ease-in-out;
  }
  
  .grid-pattern {
    animation: gridMove 40s linear infinite;
  }
}

@keyframes gridMove {
  0% {
    transform: translateX(0) translateY(0);
  }
  100% {
    transform: translateX(-20px) translateY(-20px);
  }
}

// 添加文字渐变动画
.gradient-text {
  background-size: 200% auto;
  animation: textGradient 4s linear infinite;
}

@keyframes textGradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

// 添加装饰元素动画
.decoration-container {
  .floating-circle,
  .floating-square,
  .floating-dots {
    animation: float 20s infinite ease-in-out;
  }
  
  .gradient-line {
    animation: pulse 4s infinite ease-in-out;
  }
}

/* 添加音乐动画样式 */
.music-waves {
  position: absolute;
  top: 20%;
  right: 10%;
  width: 100px;
  height: 100px;
  opacity: 0.3;
}

.wave {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: waveExpand 3s ease-out infinite;
  animation-delay: var(--delay);
}

.music-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: var(--primary-color);
  border-radius: 50%;
  left: var(--x);
  top: var(--y);
  opacity: 0.3;
  animation: float var(--duration) linear infinite;
}

@keyframes waveExpand {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style> 