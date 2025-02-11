<template>
  <Transition name="fade">
    <div v-if="show" class="loading-screen">
      <div class="loading-content">
        <!-- 科技感背景 -->
        <div class="tech-background">
          <div class="grid"></div>
          <div class="hexagon-grid">
            <div v-for="n in 20" :key="n" class="hexagon"></div>
          </div>
          <div class="particles">
            <div v-for="n in 30" :key="n" class="particle"></div>
          </div>
          <div class="circuit-lines">
            <div v-for="n in 5" :key="n" class="circuit-line"></div>
          </div>
        </div>
        
        <!-- Logo容器 -->
        <div class="logo-container">
          <div class="logo-wrapper">
            <div class="logo-shield">
              <div class="shield-segment" v-for="n in 6" :key="n"></div>
            </div>
            <img src="/logo.svg" alt="PhotoSong Logo" class="logo" />
            <div class="logo-ring"></div>
            <div class="logo-ring ring-2"></div>
            <div class="logo-ring ring-3"></div>
            <!-- 能量光束效果 -->
            <div class="energy-beams">
              <div class="beam" v-for="n in 8" :key="n"></div>
            </div>
          </div>
          
          <!-- 全息投影效果 -->
          <div class="hologram-effect">
            <div class="hologram-line" v-for="n in 10" :key="n"></div>
          </div>
        </div>
        
        <!-- 进度条系统 -->
        <div class="progress-system">
          <div class="progress-track">
            <div class="progress-segments">
              <div v-for="n in 20" :key="n" 
                   class="segment"
                   :class="{ active: progress >= n * 5 }">
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-glow"></div>
            </div>
          </div>
          <div class="progress-info">
            <div class="progress-status">
              <span class="status-text">SYSTEM LOADING</span>
              <span class="status-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </span>
            </div>
            <div class="progress-percentage">{{ progress.toFixed(0) }}%</div>
          </div>
        </div>
        
        <!-- 系统状态文本 -->
        <div class="system-status">
          <div class="status-line" v-for="(status, index) in statusMessages" 
               :key="index"
               :class="{ 'status-active': progress >= status.threshold }">
            <span class="status-icon">⚡</span>
            <span class="status-text">{{ status.text }}</span>
            <span class="status-check" v-if="progress >= status.threshold">✓</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const show = ref(false)
const progress = ref(0)

const statusMessages = [
  { threshold: 20, text: 'INITIALIZING CORE SYSTEMS' },
  { threshold: 40, text: 'LOADING NEURAL NETWORKS' },
  { threshold: 60, text: 'CALIBRATING AI ENGINES' },
  { threshold: 80, text: 'OPTIMIZING PERFORMANCE' },
  { threshold: 100, text: 'SYSTEM READY' }
]

// 只在首次访问时显示加载动画
const hasVisited = sessionStorage.getItem('hasVisited')

onMounted(() => {
  if (!hasVisited) {
    show.value = true
    sessionStorage.setItem('hasVisited', 'true')
    
    // 使用 requestAnimationFrame 实现更流畅的进度增加
    let startTime = null
    const duration = 2000 // 总持续时间缩短到2秒
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      
      progress.value = Math.min((elapsed / duration) * 100, 100)
      
      if (progress.value < 100) {
        requestAnimationFrame(animate)
      } else {
        setTimeout(() => {
          show.value = false
        }, 300)
      }
    }
    
    requestAnimationFrame(animate)
  }
})
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #000B1E 0%, #0A1A3B 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  overflow: hidden;
}

.loading-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

/* 科技背景增强 */
.tech-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.grid {
  position: absolute;
  width: 200%;
  height: 200%;
  background-image: 
    linear-gradient(rgba(0, 149, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 149, 255, 0.1) 1px, transparent 1px);
  background-size: 30px 30px;
  transform: perspective(1000px) rotateX(60deg) translateY(-50%) scale(2);
  animation: gridMove 15s linear infinite;
  opacity: 0.5;
}

/* 六边形网格 */
.hexagon-grid {
  position: absolute;
  width: 100%;
  height: 100%;
}

.hexagon {
  position: absolute;
  width: 100px;
  height: 115.47px;
  background: rgba(0, 149, 255, 0.1);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  animation: hexagonPulse 3s infinite;
}

.hexagon:nth-child(even) {
  animation-delay: -1.5s;
}

/* 电路线条 */
.circuit-lines {
  position: absolute;
  width: 100%;
  height: 100%;
}

.circuit-line {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent,
    rgba(0, 149, 255, 0.5),
    rgba(0, 149, 255, 0.8),
    rgba(0, 149, 255, 0.5),
    transparent
  );
  animation: circuitFlow 3s linear infinite;
}

/* Logo 增强 */
.logo-shield {
  position: absolute;
  width: 120%;
  height: 120%;
  top: -10%;
  left: -10%;
  animation: shieldRotate 10s linear infinite;
}

.shield-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(0, 149, 255, 0.3);
  border-radius: 50%;
  animation: shieldPulse 2s ease-in-out infinite;
}

.energy-beams {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  animation: beamRotate 10s linear infinite;
}

.beam {
  position: absolute;
  width: 2px;
  height: 100%;
  background: linear-gradient(
    to top,
    transparent,
    rgba(0, 149, 255, 0.5),
    rgba(0, 149, 255, 0.8),
    rgba(0, 149, 255, 0.5),
    transparent
  );
  left: 50%;
  transform-origin: bottom center;
}

/* 全息效果 */
.hologram-effect {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: hologramFlicker 5s linear infinite;
}

.hologram-line {
  position: absolute;
  width: 100%;
  height: 1px;
  background: rgba(0, 149, 255, 0.2);
  animation: hologramScan 2s linear infinite;
}

/* 进度系统增强 */
.progress-system {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-segments {
  display: flex;
  gap: 2px;
  position: absolute;
  top: -2px;
  width: 100%;
}

.segment {
  flex: 1;
  height: 8px;
  background: rgba(0, 149, 255, 0.2);
  transform: skewX(-20deg);
  transition: all 0.3s ease;
}

.segment.active {
  background: rgba(0, 149, 255, 0.8);
  box-shadow: 0 0 10px rgba(0, 149, 255, 0.5);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(0, 149, 255, 0.8);
  font-family: monospace;
  font-size: 0.875rem;
}

.progress-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dots .dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  background: rgba(0, 149, 255, 0.8);
  border-radius: 50%;
  margin: 0 2px;
  animation: dotPulse 1s infinite;
}

.status-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.status-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* 系统状态文本增强 */
.system-status {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-family: monospace;
  font-size: 0.75rem;
  color: rgba(0, 149, 255, 0.6);
}

.status-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.status-line.status-active {
  opacity: 1;
  color: rgba(0, 149, 255, 0.8);
}

.status-icon {
  font-size: 0.875rem;
}

.status-check {
  color: #00ff00;
  margin-left: auto;
}

/* 动画关键帧增强 */
@keyframes gridMove {
  0% {
    transform: perspective(1000px) rotateX(60deg) translateY(-50%) scale(2);
  }
  100% {
    transform: perspective(1000px) rotateX(60deg) translateY(0%) scale(2);
  }
}

@keyframes hexagonPulse {
  0%, 100% {
    opacity: 0.1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.1);
  }
}

@keyframes circuitFlow {
  0% {
    transform: translateX(-100%) scaleX(0);
  }
  50% {
    transform: translateX(0%) scaleX(1);
  }
  100% {
    transform: translateX(100%) scaleX(0);
  }
}

@keyframes shieldRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes shieldPulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

@keyframes beamRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes hologramFlicker {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes hologramScan {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

@keyframes dotPulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .progress-system {
    width: 250px;
  }
  
  .logo-container {
    transform: scale(0.8);
  }
  
  .system-status {
    font-size: 0.7rem;
  }
}

/* 性能优化 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style> 