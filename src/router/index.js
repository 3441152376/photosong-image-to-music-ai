import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import AV from 'leancloud-storage'
import { generateWorksSitemap, generateMainSitemap } from '../utils/sitemap'
import i18n from '../i18n'
import { useI18n } from 'vue-i18n'

// 定义支持的语言列表
const supportedLocales = ['zh', 'en', 'ru']

// 获取翻译函数
const t = i18n.global.t

// 基础路由配置
const baseRoutes = [
  {
    path: '/payment/success',
    name: 'PaymentSuccess',
    component: () => import('../views/PaymentSuccess.vue'),
    meta: {
      title: 'payment.success.title',
      description: 'Your payment has been processed successfully.',
      requiresAuth: true
    }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: 'Photo Song - Turn Photos into Music | AI Photo Music Generator',
      description: 'Transform your photos into unique musical pieces with our AI-powered platform. Create personalized songs from your images using advanced AI technology.',
      keywords: 'photo to music, image to music converter, AI music generator, photo song maker',
      requiresAuth: false,
      schema: {
        '@type': 'WebPage',
        name: 'Photo Song - Home',
        description: 'Transform photos into music with AI technology'
      }
    }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('../views/Auth.vue'),
    meta: {
      title: '登录/注册 - Photo Song',
      description: '加入 Photo Song，开启您的音乐创作之旅',
      requiresGuest: true,
      layout: 'auth'
    }
  },
  {
    path: '/create',
    name: 'Create',
    component: () => import('../views/Create.vue'),
    meta: {
      title: 'Create Music from Photos | Photo Song',
      description: 'Turn your photos into beautiful music using AI technology. Upload an image and get a unique musical piece.',
      keywords: 'create photo music, convert image to song, AI music creation',
      requiresAuth: true,
      requiresVIP: false,
      schema: {
        '@type': 'CreativeWork',
        name: 'Create Photo Music',
        description: 'Create music from your photos'
      }
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: {
      title: '个人中心 - Photo Song',
      description: '管理您的个人信息和创作作品',
      requiresAuth: true
    }
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('../views/Community.vue'),
    meta: {
      title: 'Community - Share Your Photo Music Creations | Photo Song',
      description: 'Discover amazing musical creations from our community. Share your own photo-generated music and connect with other creators.',
      keywords: 'photo music community, music sharing, AI music community, photo song sharing',
      requiresAuth: false,
      schema: {
        '@type': 'CollectionPage',
        name: 'Photo Song Community',
        description: 'Discover and share photo-generated music'
      }
    }
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: () => import('../views/Pricing.vue'),
    meta: {
      title: 'Pricing - Photo Music Generator Plans | Photo Song',
      description: 'Choose the perfect plan for your photo music creation needs. From free trials to professional subscriptions.',
      keywords: 'photo music pricing, AI music plans, photo to song subscription',
      requiresAuth: false,
      schema: {
        '@type': 'PriceSpecification',
        name: 'Photo Song Pricing Plans',
        description: 'Subscription plans for photo music generation'
      }
    }
  },
  {
    path: '/work/:id',
    name: 'WorkDetail',
    component: () => import('../views/WorkDetail.vue'),
    meta: {
      title: route => t('workDetail.meta.title'),
      description: route => t('workDetail.meta.description'),
      keywords: 'photo music creation, AI generated music, photo song',
      requiresAuth: false,
      schema: {
        '@type': 'MusicComposition',
        name: route => t('workDetail.meta.schemaName'),
        description: route => t('workDetail.meta.schemaDescription')
      }
    },
    props: true
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPassword.vue'),
    meta: {
      title: '重置密码 - Photo Song',
      description: '重置您的账户密码',
      requiresGuest: true,
      layout: 'auth'
    }
  },
  {
    path: '/tutorial',
    name: 'tutorial',
    component: () => import('../views/Tutorial.vue'),
    meta: {
      title: 'Tutorial - Photo Song',
      description: 'Learn how to use Photo Song to create music from your photos'
    }
  },
  {
    path: '/faq',
    name: 'faq',
    component: () => import('../views/FAQ.vue'),
    meta: {
      title: 'FAQ - Photo Song',
      description: 'Frequently asked questions about Photo Song'
    }
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('../views/Contact.vue'),
    meta: {
      title: 'Contact Us - Photo Song',
      description: 'Get in touch with the Photo Song team'
    }
  },
  {
    path: '/feedback',
    name: 'feedback',
    component: () => import('../views/Feedback.vue'),
    meta: {
      title: 'Feedback - Photo Song',
      description: 'Share your feedback and suggestions for Photo Song'
    }
  },
  {
    path: '/terms',
    name: 'terms',
    component: () => import('../views/Terms.vue'),
    meta: {
      title: 'Terms of Service - Photo Song',
      description: 'Photo Song terms of service and user agreement'
    }
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('../views/Privacy.vue'),
    meta: {
      title: 'Privacy Policy - Photo Song',
      description: 'Photo Song privacy policy and data protection'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '页面未找到 - Photo Song',
      requiresAuth: false
    }
  }
]

// 生成带语言前缀的路由
const generateLocalizedRoutes = (routes) => {
  const localizedRoutes = []
  
  // 添加默认路由（无语言前缀，重定向到用户首选语言）
  localizedRoutes.push({
    path: '/',
    redirect: () => `/${i18n.global.locale.value}`
  })

  // 为每种语言生成路由
  supportedLocales.forEach(locale => {
    routes.forEach(route => {
      const localizedRoute = {
        ...route,
        path: route.path === '/' ? `/${locale}` : `/${locale}${route.path}`,
        name: route.name ? `${locale}-${route.name}` : undefined,
        props: route.props
      }
      localizedRoutes.push(localizedRoute)
    })
  })

  // 添加404路由
  localizedRoutes.push({
    path: '/:pathMatch(.*)*',
    redirect: () => `/${i18n.global.locale.value}`
  })

  return localizedRoutes
}

const router = createRouter({
  history: createWebHistory(),
  routes: generateLocalizedRoutes(baseRoutes)
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  // 从路径中提取语言
  const locale = to.path.split('/')[1]
  
  // 如果是支持的语言，设置为当前语言
  if (supportedLocales.includes(locale)) {
    i18n.global.locale.value = locale
    localStorage.setItem('language', locale)
  }

  // 检查用户权限等
  const userStore = useUserStore()
  
  // 等待用户状态初始化完成
  if (!userStore.initialized) {
    await userStore.initializeUser()
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const requiresVIP = to.matched.some(record => record.meta.requiresVIP)

  if (requiresAuth && !userStore.isAuthenticated) {
    ElMessage.warning(t('auth.errors.loginRequired'))
    next({ 
      name: `${locale}-Auth`,
      query: { redirect: to.fullPath }
    })
    return
  }

  if (requiresGuest && userStore.isAuthenticated) {
    next({ name: `${locale}-Home` })
    return
  }

  if (requiresVIP && !userStore.isVIP) {
    ElMessage.warning(t('auth.errors.vipRequired'))
    next({ name: `${locale}-Pricing` })
    return
  }

  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 更新页面标题和元数据
  if (to.meta.title) {
    document.title = to.meta.title
  }
})

export default router  