<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import TheLogo from './TheLogo.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import { useI18n } from 'vue-i18n'
import AV from 'leancloud-storage'
import { CaretBottom, User, Close } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const { t, locale } = useI18n()

const mobileMenuOpen = ref(false)

// 使用计算属性监听用户状态
const isLoggedIn = computed(() => !!userStore.currentUser)
const currentUser = computed(() => userStore.currentUser)
const avatarUrl = computed(() => {
  const user = userStore.currentUser
  if (!user) return '/src/assets/default-avatar.svg'
  
  return user.avatar || '/src/assets/default-avatar.svg'
})

// 添加用户名计算属性
const username = computed(() => {
  const user = userStore.currentUser
  return user ? user.username : ''
})

const handleAvatarClick = () => {
  router.push({ name: getLocalizedRouteName('Profile') })
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const handleLogout = async () => {
  try {
    await userStore.logout()
    ElMessage.success(t('logout.success'))
    router.push({ name: getLocalizedRouteName('Home') })
  } catch (error) {
    ElMessage.error(t('logout.error'))
  }
}

// 生成本地化的路由名称
const getLocalizedRouteName = (baseName) => {
  return `${locale.value}-${baseName}`
}

</script>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <router-link :to="{ name: getLocalizedRouteName('Home') }" class="navbar-brand">
        <TheLogo />
      </router-link>

      <!-- Desktop Navigation -->
      <div class="nav-links desktop">
        <router-link :to="{ name: getLocalizedRouteName('Home') }" @click="closeMobileMenu">{{ t('nav.home') }}</router-link>
        <router-link 
          v-if="isLoggedIn" 
          :to="{ name: getLocalizedRouteName('Create') }" 
          @click="closeMobileMenu"
        >{{ t('nav.create') }}</router-link>
        <router-link :to="{ name: getLocalizedRouteName('Community') }" @click="closeMobileMenu">{{ t('nav.community') }}</router-link>
        <router-link :to="{ name: getLocalizedRouteName('Articles') }" @click="closeMobileMenu">{{ t('nav.articles') }}</router-link>
        <router-link :to="{ name: getLocalizedRouteName('Pricing') }" @click="closeMobileMenu">{{ t('nav.pricing') }}</router-link>
      </div>

      <div class="nav-auth desktop">
        <LanguageSwitcher />
        <template v-if="isLoggedIn">
          <div class="user-avatar" @click="handleAvatarClick" role="button" tabindex="0">
            <el-avatar 
              :size="32" 
              :src="avatarUrl"
              class="avatar"
            />
          </div>
        </template>
        <template v-else>
          <router-link 
            :to="{ name: getLocalizedRouteName('Auth') }" 
            class="btn btn-primary"
            @click="closeMobileMenu"
          >{{ t('nav.login') }} / {{ t('nav.register') }}</router-link>
        </template>
      </div>

      <!-- Mobile Menu Button -->
      <button 
        class="mobile-menu-btn"
        @click="toggleMobileMenu"
        :aria-expanded="mobileMenuOpen"
        aria-label="Toggle navigation menu"
      >
        <span class="hamburger"></span>
      </button>

      <!-- Mobile Navigation -->
      <div 
        v-show="mobileMenuOpen" 
        class="mobile-menu"
      >
        <router-link :to="{ name: getLocalizedRouteName('Home') }" @click="closeMobileMenu">{{ t('nav.home') }}</router-link>
        <router-link 
          v-if="isLoggedIn" 
          :to="{ name: getLocalizedRouteName('Create') }" 
          @click="closeMobileMenu"
        >{{ t('nav.create') }}</router-link>
        <router-link :to="{ name: getLocalizedRouteName('Community') }" @click="closeMobileMenu">{{ t('nav.community') }}</router-link>
        <router-link :to="{ name: getLocalizedRouteName('Articles') }" @click="closeMobileMenu">{{ t('nav.articles') }}</router-link>
        <router-link :to="{ name: getLocalizedRouteName('Pricing') }" @click="closeMobileMenu">{{ t('nav.pricing') }}</router-link>
        
        <template v-if="isLoggedIn">
          <router-link :to="{ name: getLocalizedRouteName('Profile') }" @click="closeMobileMenu">{{ t('nav.profile') }}</router-link>
          <a href="#" @click.prevent="handleLogout">{{ t('nav.logout') }}</a>
        </template>
        <template v-else>
          <router-link :to="{ name: getLocalizedRouteName('Auth') }" @click="closeMobileMenu">{{ t('nav.login') }} / {{ t('nav.register') }}</router-link>
        </template>
        <LanguageSwitcher />
      </div>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 1.5rem 2rem;
    
    .navbar-container {
      background: var(--glass-background);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      padding: 0.75rem 1.5rem;
    }
  }
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    margin: 0 1rem;
    padding: 0.75rem 1rem;
    background: var(--glass-background);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
  }
}

.navbar-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links a {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: var(--primary-color);
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-link {
  display: flex;
  align-items: center;
  padding: 0.25rem;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.avatar-link:hover {
  transform: scale(1.05);
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
}

.hamburger {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--text-color);
  position: relative;
  transition: background 0.3s ease;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background: var(--text-color);
  transition: transform 0.3s ease;
}

.hamburger::before {
  top: -6px;
}

.hamburger::after {
  bottom: -6px;
}

[aria-expanded="true"] .hamburger {
  background: transparent;
}

[aria-expanded="true"] .hamburger::before {
  transform: rotate(45deg);
  top: 0;
}

[aria-expanded="true"] .hamburger::after {
  transform: rotate(-45deg);
  bottom: 0;
}

.mobile-menu {
  display: none;
}

@media (max-width: 768px) {
  .desktop {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-menu {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 1rem;
    right: 1rem;
    background: var(--glass-background);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 0.75rem;
  }

  .mobile-menu a {
    color: var(--text-color);
    text-decoration: none;
    padding: 0.75rem;
    transition: color 0.3s ease;
  }

  .mobile-menu a:hover,
  .mobile-menu a.router-link-active {
    color: var(--primary-color);
  }
}

.user-avatar {
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    transform: scale(1.05);
  }
  
  .avatar {
    border: 2px solid transparent;
    transition: border-color 0.2s ease;
    
    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

/* 添加内容区域的padding */
:deep(main), :deep(.main-content) {
  padding-top: calc(4rem + 16px); /* 导航栏高度 + 额外间距 */
  
  @media (min-width: 768px) {
    padding-top: calc(5rem + 16px);
  }
}
</style> 