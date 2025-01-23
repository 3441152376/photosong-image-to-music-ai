import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: 'Photo Song - AI 驱动的照片音乐创作平台',
      description: '使用 AI 技术，将您的照片转化为独特的音乐作品',
      requiresAuth: false
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
      title: '创作中心 - Photo Song',
      description: '使用 AI 技术，将照片转换为独特的音乐作品',
      requiresAuth: true,
      requiresVIP: false
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
      title: '社区 - Photo Song',
      description: '发现来自社区的精彩音乐作品',
      requiresAuth: false
    }
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: () => import('../views/Pricing.vue'),
    meta: {
      title: '会员服务 - Photo Song',
      description: '解锁更多创作功能，享受优质服务',
      requiresAuth: false
    }
  },
  {
    path: '/work/:id',
    name: 'WorkDetail',
    component: () => import('../views/WorkDetail.vue'),
    meta: {
      title: '作品详情 - Photo Song',
      requiresAuth: false
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

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 等待用户状态初始化
  if (!userStore.initialized) {
    // 这里可以显示一个加载动画
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