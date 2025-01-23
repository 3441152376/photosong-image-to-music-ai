<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import TheLogo from './TheLogo.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

const mobileMenuOpen = ref(false)

// 使用计算属性监听用户状态
const isLoggedIn = computed(() => !!userStore.currentUser)
const currentUser = computed(() => userStore.currentUser)
const avatarUrl = computed(() => {
  const avatar = currentUser.value?.avatar
  // Handle AV.File object
  if (avatar && avatar.url) {
    return avatar.url()
  }
  // Handle string URL
  return avatar || '/default-avatar.png'
})

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
    router.push('/')
  } catch (error) {
    ElMessage.error(t('logout.error'))
  }
}

</script>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <router-link to="/" class="navbar-brand">
        <TheLogo />
      </router-link>

      <!-- Desktop Navigation -->
      <div class="nav-links desktop">
        <router-link to="/" @click="closeMobileMenu">{{ t('nav.home') }}</router-link>
        <router-link 
          v-if="isLoggedIn" 
          to="/create" 
          @click="closeMobileMenu"
        >{{ t('nav.create') }}</router-link>
        <router-link to="/community" @click="closeMobileMenu">{{ t('nav.community') }}</router-link>
        <router-link to="/pricing" @click="closeMobileMenu">{{ t('nav.pricing') }}</router-link>
      </div>

      <div class="nav-auth desktop">
        <LanguageSwitcher />
        <template v-if="isLoggedIn">
          <router-link 
            to="/profile" 
            class="avatar-link"
            @click="closeMobileMenu"
          >
            <el-avatar 
              :size="32" 
              :src="avatarUrl"
            />
          </router-link>
        </template>
        <template v-else>
          <router-link 
            to="/auth" 
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
        <router-link to="/" @click="closeMobileMenu">{{ t('nav.home') }}</router-link>
        <router-link 
          v-if="isLoggedIn" 
          to="/create" 
          @click="closeMobileMenu"
        >{{ t('nav.create') }}</router-link>
        <router-link to="/community" @click="closeMobileMenu">{{ t('nav.community') }}</router-link>
        <router-link to="/pricing" @click="closeMobileMenu">{{ t('nav.pricing') }}</router-link>
        
        <template v-if="isLoggedIn">
          <router-link to="/profile" @click="closeMobileMenu">{{ t('nav.profile') }}</router-link>
          <a href="#" @click.prevent="handleLogout">{{ t('nav.logout') }}</a>
        </template>
        <template v-else>
          <router-link to="/auth" @click="closeMobileMenu">{{ t('nav.login') }} / {{ t('nav.register') }}</router-link>
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
  background: var(--glass-background);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
    top: 100%;
    left: 0;
    right: 0;
    background: var(--glass-background);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-color);
    padding: 1rem;
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
</style> 