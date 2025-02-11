<template>
  <div class="lazy-image-container" :style="containerStyle">
    <!-- 骨架屏 -->
    <div 
      v-if="loading" 
      class="skeleton"
      :style="{ paddingBottom: `${aspectRatio * 100}%` }"
    >
      <div class="shimmer"></div>
    </div>
    
    <!-- 图片 -->
    <img
      :src="loadedSrc || placeholder"
      :alt="alt"
      class="lazy-image"
      :class="{ 'is-loading': loading, 'has-error': error }"
      @load="handleLoad"
      @error="handleError"
      :style="imageStyle"
      loading="lazy"
      decoding="async"
      fetchpriority="high"
    />
    
    <!-- 错误状态 -->
    <div v-if="error" class="error-container">
      <div class="error-message">
        <slot name="error">
          <span>加载失败</span>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4='
  },
  aspectRatio: {
    type: Number,
    default: 9/16 // 默认16:9
  },
  objectFit: {
    type: String,
    default: 'cover'
  },
  background: {
    type: String,
    default: '#f3f4f6'
  }
})

const loading = ref(true)
const error = ref(false)
const loadedSrc = ref('')
const imageElement = ref(null)

// 计算样式
const containerStyle = computed(() => ({
  backgroundColor: props.background,
  position: 'relative',
  overflow: 'hidden',
  width: '100%'
}))

const imageStyle = computed(() => ({
  objectFit: props.objectFit,
  opacity: loading.value ? 0 : 1,
  transition: 'opacity 0.3s ease'
}))

// 处理图片加载
const handleLoad = () => {
  loading.value = false
  error.value = false
}

// 处理加载错误
const handleError = () => {
  loading.value = false
  error.value = true
}

// 加载图片
const loadImage = () => {
  const img = new Image()
  img.src = props.src
  
  img.onload = () => {
    loadedSrc.value = props.src
  }
  
  img.onerror = handleError
}

// 使用 Intersection Observer 实现懒加载
const { stop } = useIntersectionObserver(
  imageElement,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      loadImage()
      stop()
    }
  },
  { threshold: 0.1 }
)

onMounted(() => {
  if ('loading' in HTMLImageElement.prototype) {
    // 原生懒加载支持
    loadedSrc.value = props.src
  } else {
    // 降级使用 Intersection Observer
    loadImage()
  }
})
</script>

<style scoped>
.lazy-image-container {
  border-radius: 0.5rem;
}

.lazy-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background-color: var(--skeleton-color, #e2e8f0);
  overflow: hidden;
}

.shimmer {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.5s infinite;
}

.error-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--error-background, rgba(0, 0, 0, 0.05));
}

.error-message {
  padding: 0.5rem 1rem;
  background-color: var(--error-message-background, rgba(0, 0, 0, 0.7));
  color: white;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style> 