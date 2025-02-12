import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import AV from 'leancloud-storage'
import { generateWorksSitemap, generateMainSitemap } from '../utils/sitemap'
import i18n from '../i18n'
import { useI18n } from 'vue-i18n'
import SitemapUpdate from '../views/SitemapUpdate.vue'

// 定义支持的语言列表
const supportedLocales = ['zh', 'en', 'ru']

// 获取翻译函数
const t = i18n.global.t

// 添加基础路由重定向
const routes = [
  {
    path: '/',
    redirect: to => {
      // 获取浏览器语言
      const browserLang = navigator.language.split('-')[0]
      // 检查是否支持该语言
      const supportedLang = ['zh', 'en', 'ru'].includes(browserLang) ? browserLang : 'zh'
      // 重定向到对应语言的首页
      return `/${supportedLang}`
    }
  },
  {
    path: '/payment/success',
    name: 'PaymentSuccess',
    component: () => import('../views/PaymentSuccess.vue'),
    meta: {
      title: 'payment.success.title',
      description: 'Your payment has been completed successfully.',
      requiresAuth: true,
      preserveQuery: true
    }
  },
  {
    path: '/payment/cancel',
    name: 'PaymentCancel',
    component: () => import('../views/PaymentCancel.vue'),
    meta: {
      title: 'payment.cancel.title',
      description: 'Your payment has been cancelled.',
      requiresAuth: true,
      preserveQuery: true
    }
  },
  {
    path: '/pricing/success',
    redirect: to => {
      const locale = to.params.locale || i18n.global.locale.value || 'en'
      return {
        path: `/${locale}/payment/success`,
        query: { 
          session_id: to.query.session_id
        }
      }
    }
  },
  {
    path: '/pricing/cancel',
    redirect: to => {
      const locale = to.params.locale || i18n.global.locale.value || 'en'
      return {
        path: `/${locale}/payment/cancel`,
        query: to.query
      }
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
      isCreatePage: true
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
    path: '/profile/:id',
    name: 'UserProfile',
    component: () => import('../views/UserProfile.vue'),
    meta: {
      title: route => t('profile.meta.title', { username: route.params.id }),
      description: route => t('profile.meta.description', { username: route.params.id })
    }
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('../views/Community.vue'),
    meta: {
      title: 'Community - Share Your Photo Music Creations | Photo Song',
      description: 'Discover amazing musical creations from our community. Share your own photo-generated music and connect with other creators.',
      keywords: ['photo music community', 'music sharing', 'AI music community', 'photo song sharing'],
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
      keywords: ['photo music pricing', 'AI music plans', 'photo to song subscription'],
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
    beforeEnter: async (to, from, next) => {
      try {
        // 验证作品ID格式
        const workId = to.params.id
        if (!workId || !/^[a-zA-Z0-9]{24}$/.test(workId)) {
          next({ name: 'NotFound' })
          return
        }

        // 尝试获取作品信息
        const work = await new AV.Query('Work')
          .equalTo('objectId', workId)
          .first()

        if (!work) {
          next({ name: 'NotFound' })
          return
        }

        // 生成作品的 SEO 关键词
        const keywords = generateWorkKeywords(work)

        // 设置作品信息到路由元数据
        to.meta.work = {
          title: work.get('title'),
          description: work.get('description'),
          imageUrl: work.get('imageUrl'),
          author: work.get('user')?.get('username') || t('workDetail.anonymousUser'),
          style: work.get('style'),
          keywords: keywords,
          publishedAt: work.get('createdAt'),
          updatedAt: work.get('updatedAt')
        }
        
        next()
      } catch (error) {
        console.error('Failed to fetch work:', error)
        next({ name: 'NotFound' })
      }
    },
    meta: {
      title: route => {
        const workTitle = route?.meta?.work?.title || t('workDetail.defaultTitle')
        const author = route?.meta?.work?.author || t('workDetail.anonymousUser')
        const style = route?.meta?.work?.style || t('workDetail.defaultStyle')
        return `${workTitle} by ${author} | ${style} Style Music | PhotoSong`
      },
      description: route => t('workDetail.meta.description', { 
        title: route?.meta?.work?.title || t('workDetail.defaultTitle'), 
        author: route?.meta?.work?.author || t('workDetail.anonymousUser'),
        style: route?.meta?.work?.style || t('workDetail.defaultStyle')
      }),
      keywords: route => route?.meta?.work?.keywords || []
    }
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
  },
  {
    path: '/:lang?/sitemap/update',
    name: 'SitemapUpdate',
    component: SitemapUpdate,
    meta: {
      title: 'Sitemap Update - Photo Song',
      description: 'Update sitemap for Photo Song',
      requiresAuth: true,
      requiresAdmin: true
    },
    beforeEnter: async (to, from, next) => {
      try {
        const currentUser = AV.User.current()
        if (!currentUser) {
          ElMessage.error(t('sitemap.errors.notLoggedIn'))
          next('/login')
          return
        }

        // 检查是否是管理员
        const isAdmin = currentUser.get('isAdmin')
        if (!isAdmin) {
          try {
            await currentUser.fetch()
            const refreshedIsAdmin = currentUser.get('isAdmin')
            if (!refreshedIsAdmin) {
              ElMessage.error(t('sitemap.errors.permissionDenied'))
              next('/')
              return
            }
          } catch (fetchErr) {
            console.error('刷新用户数据失败:', fetchErr)
            ElMessage.error(t('sitemap.errors.permissionDenied'))
            next('/')
            return
          }
        }
        next()
      } catch (err) {
        console.error('权限检查失败:', err)
        ElMessage.error(t('sitemap.errors.permissionDenied'))
        next('/')
      }
    }
  },
  {
    path: '/articles',
    name: 'Articles',
    component: () => import('@/views/Articles.vue'),
    meta: {
      title: 'articles.title'
    }
  },
  {
    path: '/articles/:slug',
    name: 'ArticleDetail',
    component: () => import('@/views/ArticleDetail.vue'),
    meta: {
      title: route => t('articles.detail.title'),
      description: route => t('articles.detail.description'),
      requiresAuth: false
    }
  },
  {
    path: '/admin/articles',
    name: 'ArticleManager',
    component: () => import('@/views/admin/ArticleManager.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: 'articles.manager'
    }
  },
  {
    path: '/prerender',
    name: 'PreRenderManager',
    component: () => import('../views/PreRenderManager.vue'),
    meta: {
      title: 'Pre-render Manager - PhotoSong',
      description: 'Manage pre-rendered pages for SEO optimization',
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/admin/article-generator',
    name: 'ArticleGenerator',
    component: () => import('@/views/admin/ArticleGenerator.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: 'articleGenerator.title'
    }
  }
]

// 生成带语言前缀的路由
const generateLocalizedRoutes = (routes) => {
  const localizedRoutes = []
  
  // 添加默认路由（无语言前缀，重定向到用户首选语言）
  localizedRoutes.push({
    path: '/',
    redirect: to => {
      // 获取用户首选语言或浏览器语言
      const browserLang = navigator.language.split('-')[0]
      const userLang = localStorage.getItem('language')
      const locale = userLang || (supportedLocales.includes(browserLang) ? browserLang : 'en')
      
      // 如果有 query 参数，保留它们
      return {
        path: `/${locale}${to.path}`,
        query: to.query
      }
    }
  })

  // 为每种语言生成路由
  supportedLocales.forEach(locale => {
    routes.forEach(route => {
      // 跳过重定向路由的本地化
      if (route.redirect) {
        localizedRoutes.push(route)
        return
      }
      
      const localizedRoute = {
        ...route,
        path: route.path === '/' ? `/${locale}` : `/${locale}${route.path}`,
        name: route.name ? `${locale}-${route.name}` : undefined,
        props: route.props,
        meta: {
          ...route.meta,
          locale,
          preserveQuery: route.meta?.preserveQuery || false
        }
      }
      localizedRoutes.push(localizedRoute)
    })
  })

  // 添加404路由
  localizedRoutes.push({
    path: '/:pathMatch(.*)*',
    redirect: to => {
      // 获取用户首选语言或浏览器语言
      const browserLang = navigator.language.split('-')[0]
      const userLang = localStorage.getItem('language')
      const locale = userLang || (supportedLocales.includes(browserLang) ? browserLang : 'en')
      
      return {
        path: `/${locale}${to.path}`,
        query: to.query
      }
    }
  })

  return localizedRoutes
}

const router = createRouter({
  history: createWebHistory(),
  routes: generateLocalizedRoutes(routes)
})

// 全局路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const { locale } = i18n.global
  
  // 从路径中获取语言
  const pathLang = to.path.split('/')[1]
  
  // 如果路径中包含有效的语言代码
  if (supportedLocales.includes(pathLang)) {
    // 设置当前语言
    locale.value = pathLang
    localStorage.setItem('language', pathLang)
  } else {
    // 获取用户首选语言
    const savedLang = localStorage.getItem('language')
    const browserLang = navigator.language.split('-')[0]
    const userLang = savedLang || (supportedLocales.includes(browserLang) ? browserLang : 'en')
    
    // 如果当前路径不包含语言前缀，重定向到带语言前缀的路径
    if (!supportedLocales.includes(pathLang)) {
      return next({
        path: `/${userLang}${to.path}`,
        query: to.query,
        hash: to.hash
      })
    }
  }
  
  // 确保用户状态已初始化
  if (!userStore.initialized) {
    await userStore.initializeUser()
  }

  // 处理需要登录的路由
  if (to.matched.some(record => record.meta.requiresAuth)) {
    try {
      // 验证当前登录状态
      const isAuthenticated = userStore.isAuthenticated
      
      if (!isAuthenticated) {
        // 尝试从本地存储恢复会话
        const lastUser = localStorage.getItem('lastUser')
        if (lastUser) {
          try {
            const { sessionToken } = JSON.parse(lastUser)
            const user = await AV.User.become(sessionToken)
            if (user) {
              await userStore.setCurrentUser(user)
              // 如果恢复成功，继续导航
              next()
              return
            }
          } catch (error) {
            console.error('[Auth Error] Session restore failed:', error)
            localStorage.removeItem('lastUser')
          }
        }

        // 如果恢复失败，尝试自动登录
        try {
          await userStore.fetchCurrentUser()
          
          if (userStore.isAuthenticated) {
            next()
            return
          }
        } catch (error) {
          console.error('[Auth Error] Auto login failed:', error)
        }

        // 如果所有尝试都失败，重定向到登录页
        localStorage.setItem('redirectPath', to.fullPath)
        ElMessage({
          message: t('auth.errors.loginRequired'),
          type: 'warning',
          duration: 3000
        })
        
        next({
          path: '/auth',
          query: { 
            redirect: to.fullPath,
            message: 'login_required'
          }
        })
        return
      }
    } catch (error) {
      console.error('[Auth Error] Route guard check failed:', error)
      next({
        path: '/auth',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  // 处理只允许未登录用户访问的路由（如登录页）
  if (to.matched.some(record => record.meta.requiresGuest) && userStore.isAuthenticated) {
    const redirectPath = localStorage.getItem('redirectPath') || '/'
    localStorage.removeItem('redirectPath')
    next(redirectPath)
    return
  }

  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 更新页面标题和元数据
  if (to.meta.title) {
    const title = typeof to.meta.title === 'function' 
      ? to.meta.title(to)
      : to.meta.title
    document.title = title
  }
})

// 生成作品的 SEO 关键词
function generateWorkKeywords(work) {
  const baseKeywords = ['photo music', 'AI music', 'photo song']
  const styleKeywords = generateStyleKeywords(work.get('style'))
  const titleKeywords = generateTitleKeywords(work.get('title'))
  const authorKeywords = generateAuthorKeywords(work.get('user')?.get('username'))
  
  // 合并所有关键词并去重
  return [...new Set([
    ...baseKeywords,
    ...styleKeywords,
    ...titleKeywords,
    ...authorKeywords
  ])]
}

// 根据音乐风格生成关键词
function generateStyleKeywords(style) {
  const styleMap = {
    classical: ['classical music', 'orchestra', 'symphony', 'classical composition'],
    jazz: ['jazz music', 'jazz composition', 'jazz style', 'jazz arrangement'],
    rock: ['rock music', 'rock style', 'rock arrangement', 'electric guitar'],
    electronic: ['electronic music', 'EDM', 'synthesizer', 'electronic beats'],
    pop: ['pop music', 'popular music', 'pop style', 'pop arrangement']
  }
  
  return styleMap[style] || []
}

// 从标题生成关键词
function generateTitleKeywords(title) {
  if (!title) return []
  
  // 移除特殊字符并分词
  const words = title.toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2)
  
  // 生成长尾关键词组合
  const combinations = []
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j <= Math.min(i + 3, words.length); j++) {
      combinations.push(words.slice(i, j).join(' '))
    }
  }
  
  return combinations
}

// 根据作者生成关键词
function generateAuthorKeywords(username) {
  if (!username) return []
  
  return [
    `${username} music`,
    `${username} compositions`,
    `${username} photo music`,
    `music by ${username}`
  ]
}

export default router  