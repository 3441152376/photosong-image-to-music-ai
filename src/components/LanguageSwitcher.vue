<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDown } from '@element-plus/icons-vue'

const { locale } = useI18n()

const languages = [
  {
    code: 'zh',
    label: '中文',
    icon: '🇨🇳'
  },
  {
    code: 'en',
    label: 'English',
    icon: '🇺🇸'
  },
  {
    code: 'ru',
    label: 'Русский',
    icon: '🇷🇺'
  }
]

const currentLanguage = computed(() => {
  return languages.find(lang => lang.code === locale.value) || languages[0]
})

const isDropdownVisible = ref(false)

// 处理点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  const switcher = document.querySelector('.language-switcher')
  if (switcher && !switcher.contains(event.target)) {
    isDropdownVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 从localStorage读取语言设置
  const savedLanguage = localStorage.getItem('language')
  if (savedLanguage && languages.some(lang => lang.code === savedLanguage)) {
    locale.value = savedLanguage
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const switchLanguage = (langCode) => {
  if (langCode === locale.value) return
  
  locale.value = langCode
  localStorage.setItem('language', langCode)
  isDropdownVisible.value = false
  
  // 触发自定义事件，通知父组件语言已更改
  window.dispatchEvent(new CustomEvent('language-changed', { detail: langCode }))
  
  // 添加短暂延迟后刷新页面，确保语言设置已保存
  setTimeout(() => {
    window.location.reload()
  }, 100)
}
</script>

<template>
  <div class="language-switcher">
    <button 
      class="language-button"
      @click.stop="isDropdownVisible = !isDropdownVisible"
      aria-label="Switch language"
      :aria-expanded="isDropdownVisible"
    >
      <span class="language-icon">{{ currentLanguage.icon }}</span>
      <span class="language-label">{{ currentLanguage.label }}</span>
      <el-icon class="dropdown-icon" :class="{ 'is-active': isDropdownVisible }">
        <ArrowDown />
      </el-icon>
    </button>
    
    <div 
      v-show="isDropdownVisible" 
      class="language-dropdown"
      role="listbox"
      :aria-label="'Select language'"
    >
      <button
        v-for="lang in languages"
        :key="lang.code"
        class="language-option"
        :class="{ 'is-active': lang.code === locale }"
        @click="switchLanguage(lang.code)"
        role="option"
        :aria-selected="lang.code === locale"
      >
        <span class="language-icon">{{ lang.icon }}</span>
        <span class="language-label">{{ lang.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.language-switcher {
  position: relative;
  display: inline-block;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--glass-background);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-color);
  
  &:hover {
    border-color: var(--primary-color);
    background: rgba(var(--primary-color-rgb), 0.1);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-color);
  }
}

.language-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.language-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

.dropdown-icon {
  transition: transform 0.3s ease;
  font-size: 1rem;
  margin-left: 0.25rem;
  
  &.is-active {
    transform: rotate(180deg);
  }
}

.language-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--glass-background);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 0.5rem;
  min-width: 150px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 0.25rem;
  color: var(--text-color);
  
  &:hover {
    background: rgba(var(--primary-color-rgb), 0.1);
  }
  
  &.is-active {
    background: rgba(var(--primary-color-rgb), 0.15);
    color: var(--primary-color);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-color);
  }
}

@media (max-width: 768px) {
  .language-label {
    display: none;
  }
  
  .language-button {
    padding: 0.5rem;
  }

  .language-dropdown {
    right: auto;
    left: 0;
  }
}

// 动画效果
.language-dropdown {
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform-origin: top;
  
  &[v-show="false"] {
    opacity: 0;
    transform: scaleY(0.8);
    pointer-events: none;
  }
}
</style> 