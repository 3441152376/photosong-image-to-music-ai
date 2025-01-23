<script setup>
// 动画效果的控制
import { ref, onMounted } from 'vue'

const isVisible = ref(false)
onMounted(() => {
  isVisible.value = true
})
</script>

<template>
  <div class="hero-illustration" :class="{ 'is-visible': isVisible }">
    <svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景圆形 -->
      <circle cx="300" cy="200" r="150" fill="url(#gradient1)" opacity="0.1" />
      <circle cx="300" cy="200" r="100" fill="url(#gradient2)" opacity="0.15" />
      
      <!-- 音符动画 -->
      <g class="music-notes">
        <path d="M250 150 Q270 130 290 150" stroke="url(#gradient3)" stroke-width="2" class="note-1" />
        <circle cx="290" cy="150" r="4" fill="url(#gradient3)" class="note-1" />
        
        <path d="M310 180 Q330 160 350 180" stroke="url(#gradient3)" stroke-width="2" class="note-2" />
        <circle cx="350" cy="180" r="4" fill="url(#gradient3)" class="note-2" />
        
        <path d="M270 210 Q290 190 310 210" stroke="url(#gradient3)" stroke-width="2" class="note-3" />
        <circle cx="310" cy="210" r="4" fill="url(#gradient3)" class="note-3" />
      </g>
      
      <!-- 照片框 -->
      <rect x="200" y="150" width="200" height="150" rx="10" fill="url(#gradient4)" class="photo-frame" />
      <rect x="210" y="160" width="180" height="130" rx="5" fill="url(#gradient5)" class="photo-content" />
      
      <!-- 波形图 -->
      <path d="M150 300 Q200 250 250 300 T350 300 T450 300" stroke="url(#gradient3)" stroke-width="2" class="wave" />
      
      <!-- 渐变定义 -->
      <defs>
        <linearGradient id="gradient1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--primary-color)" />
          <stop offset="100%" stop-color="var(--accent-color)" />
        </linearGradient>
        
        <linearGradient id="gradient2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--primary-color)" />
          <stop offset="100%" stop-color="var(--accent-color)" />
        </linearGradient>
        
        <linearGradient id="gradient3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--primary-color)" />
          <stop offset="100%" stop-color="var(--accent-color)" />
        </linearGradient>
        
        <linearGradient id="gradient4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2C3E50" />
          <stop offset="100%" stop-color="#1A2634" />
        </linearGradient>
        
        <linearGradient id="gradient5" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3498DB" />
          <stop offset="100%" stop-color="#2980B9" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<style scoped>
.hero-illustration {
  opacity: 0;
  transform: translateY(20px);
  transition: all 1s ease;
}

.hero-illustration.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.music-notes path,
.music-notes circle {
  opacity: 0;
  animation: fadeInUp 0.6s ease forwards;
}

.note-1 {
  animation-delay: 0.3s;
}

.note-2 {
  animation-delay: 0.6s;
}

.note-3 {
  animation-delay: 0.9s;
}

.photo-frame {
  transform-origin: center;
  animation: pulse 3s ease-in-out infinite;
}

.photo-content {
  animation: glow 3s ease-in-out infinite;
}

.wave {
  stroke-dasharray: 300;
  stroke-dashoffset: 300;
  animation: dash 3s ease-in-out infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

@keyframes glow {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.2);
  }
}

@keyframes dash {
  0% {
    stroke-dashoffset: 300;
  }
  50% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -300;
  }
}
</style> 