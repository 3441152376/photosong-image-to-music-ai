import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import AV from 'leancloud-storage'
import { generateWorksSitemap, generateMainSitemap } from '../utils/sitemap'

const routes = [
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
      title: 'Photo Music Creation | Photo Song',
      description: 'Listen to this unique musical piece generated from a photo using AI technology.',
      keywords: 'photo music creation, AI generated music, photo song',
      requiresAuth: false,
      schema: {
        '@type': 'MusicComposition',
        name: 'Photo Music Creation',
        description: 'AI-generated music from photo'
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

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 添加站点地图路由处理
router.beforeEach(async (to, from, next) => {
  // 手动更新站点地图的路由
  if (to.path === '/update-sitemaps') {
    try {
      // 检查用户是否是管理员
      const userStore = useUserStore()
      if (!userStore.currentUser?.isAdmin) {
        next('/404')
        return
      }

      // 生成并更新站点地图
      const mainSitemap = generateMainSitemap()
      const worksSitemap = await generateWorksSitemap()
      
      // 保存主站点地图
      const mainSitemapFile = new AV.File('sitemap.xml', { base64: btoa(mainSitemap) })
      await mainSitemapFile.save()
      
      // 保存作品站点地图
      const worksSitemapFile = new AV.File('works-sitemap.xml', { base64: btoa(worksSitemap) })
      await worksSitemapFile.save()
      
      ElMessage.success('站点地图已更新')
      next('/')
      return
    } catch (error) {
      console.error('更新站点地图失败:', error)
      ElMessage.error('更新站点地图失败')
      next('/404')
      return
    }
  }
  
  // 处理站点地图请求
  if (to.path === '/sitemap.xml') {
    try {
      // 获取主站点地图
      const query = new AV.Query('_File')
      query.equalTo('name', 'sitemap.xml')
      query.descending('createdAt')
      const file = await query.first()
      
      if (!file) {
        next('/404')
        return
      }
      
      window.location.href = file.get('url')
      return
    } catch (error) {
      console.error('获取主站点地图失败:', error)
      next('/404')
      return
    }
  }
  
  if (to.path === '/works-sitemap.xml') {
    try {
      // 获取作品站点地图
      const query = new AV.Query('_File')
      query.equalTo('name', 'works-sitemap.xml')
      query.descending('createdAt')
      const file = await query.first()
      
      if (!file) {
        next('/404')
        return
      }
      
      window.location.href = file.get('url')
      return
    } catch (error) {
      console.error('获取作品站点地图失败:', error)
      next('/404')
      return
    }
  }
  
  // 用户认证检查
  const userStore = useUserStore()
  
  // 等待用户状态初始化
  if (!userStore.initialized) {
    await new Promise(resolve => {
      const checkInitialized = () => {
        if (userStore.initialized) {
          resolve()
        } else {
          setTimeout(checkInitialized, 100)
        }
      }
      checkInitialized()
    })
  }

  const isLoggedIn = !!userStore.currentUser
  const isVIP = userStore.currentUser?.isVIP || false

  // 设置页面标题
  document.title = to.meta.title || 'Photo Song'

  // 需要登录的页面
  if (to.meta.requiresAuth && !isLoggedIn) {
    ElMessage.warning('请先登录')
    next({
      path: '/auth',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 需要会员的页面
  if (to.meta.requiresVIP && !isVIP) {
    ElMessage.warning('该功能需要会员权限')
    next('/pricing')
    return
  }

  // 已登录用户不能访问游客页面
  if (to.meta.requiresGuest && isLoggedIn) {
    next('/')
    return
  }

  // 动态设置作品详情页的标题
  if (to.name === 'WorkDetail' && to.params.work) {
    to.meta.title = `${to.params.work.title} - Photo Song`
    to.meta.description = to.params.work.description
  }

  // 动态设置用户主页的标题
  if (to.name === 'Profile' && userStore.currentUser) {
    to.meta.title = `${userStore.currentUser.username} 的主页 - Photo Song`
    to.meta.description = `查看 ${userStore.currentUser.username} 在 Photo Song 上的创作作品`
  }

  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 这里可以添加页面访问统计等逻辑
})

export default router 