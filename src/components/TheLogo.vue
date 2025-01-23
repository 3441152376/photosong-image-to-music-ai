<script setup>
defineProps({
  size: {
    type: String,
    default: 'default' // 'small', 'default', 'large'
  },
  animated: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <div 
    class="logo" 
    :class="[
      `logo--${size}`,
      { 'logo--animated': animated }
    ]"
  >
    <div class="logo-container">
      <!-- 相机镜头部分 -->
      <div class="camera-lens">
        <div class="lens-outer"></div>
        <div class="lens-inner">
          <div class="lens-reflection"></div>
        </div>
        <!-- 音符装饰 -->
        <div class="music-notes">
          <div class="note note-1"></div>
          <div class="note note-2"></div>
          <div class="note note-3"></div>
        </div>
      </div>
      
      <!-- 光圈装饰 -->
      <div class="aperture-blades">
        <div class="blade" v-for="n in 6" :key="n" :style="{ '--rotation': `${n * 60}deg` }"></div>
      </div>
      
      <!-- 装饰圆环 -->
      <div class="decorative-rings">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
      </div>
      
      <!-- Logo 文字 -->
      <div class="logo-text" v-if="size !== 'small'">
        <span class="text-photo">Photo</span>
        <span class="text-song">Song</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.logo {
  --logo-primary: var(--primary-color);
  --logo-accent: var(--accent-color);
  --logo-size: 48px;
  
  &--small {
    --logo-size: 32px;
  }
  
  &--large {
    --logo-size: 64px;
  }
}

.logo-container {
  position: relative;
  width: var(--logo-size);
  height: var(--logo-size);
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-lens {
  position: relative;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--logo-primary), var(--logo-accent));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(var(--primary-color-rgb), 0.3);
  
  .lens-outer {
    position: absolute;
    inset: 2px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2c3e50, #1a2634);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .lens-inner {
    position: relative;
    width: 60%;
    height: 60%;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--logo-primary), var(--logo-accent));
    overflow: hidden;
    
    .lens-reflection {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent);
      transform: rotate(-45deg);
    }
  }
}

.music-notes {
  position: absolute;
  inset: 0;
  
  .note {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--logo-accent);
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 100%;
      width: 6px;
      height: 2px;
      background: var(--logo-accent);
      transform-origin: left center;
    }
  }
  
  .note-1 {
    top: 20%;
    right: -20%;
    transform: scale(0.8);
  }
  
  .note-2 {
    top: -20%;
    right: 20%;
    transform: scale(0.6);
  }
  
  .note-3 {
    top: 40%;
    left: -20%;
    transform: scale(0.7);
  }
}

.aperture-blades {
  position: absolute;
  inset: 0;
  
  .blade {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40%;
    height: 2px;
    background: linear-gradient(90deg, var(--logo-primary), transparent);
    transform-origin: left center;
    transform: rotate(var(--rotation));
    opacity: 0.3;
  }
}

.decorative-rings {
  position: absolute;
  inset: 0;
  
  .ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid var(--logo-primary);
    opacity: 0.2;
    
    &-1 {
      transform: scale(1.2);
    }
    
    &-2 {
      transform: scale(1.4);
    }
    
    &-3 {
      transform: scale(1.6);
    }
  }
}

.logo-text {
  position: absolute;
  left: 120%;
  white-space: nowrap;
  font-weight: 700;
  font-size: calc(var(--logo-size) * 0.4);
  display: flex;
  gap: 0.25em;
  
  .text-photo {
    background: linear-gradient(135deg, var(--logo-primary), var(--logo-accent));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  .text-song {
    color: var(--text-color);
    opacity: 0.9;
  }
}

// 动画效果
.logo--animated {
  .camera-lens {
    animation: pulse 3s ease-in-out infinite;
  }
  
  .lens-reflection {
    animation: moveReflection 4s linear infinite;
  }
  
  .music-notes .note {
    animation: float 3s ease-in-out infinite;
    
    &::after {
      animation: wag 2s ease-in-out infinite;
    }
    
    &-1 {
      animation-delay: 0s;
    }
    
    &-2 {
      animation-delay: 0.5s;
    }
    
    &-3 {
      animation-delay: 1s;
    }
  }
  
  .aperture-blades .blade {
    animation: rotateBlade 10s linear infinite;
  }
  
  .decorative-rings .ring {
    animation: expandRing 3s ease-in-out infinite;
    
    &-1 {
      animation-delay: 0s;
    }
    
    &-2 {
      animation-delay: 0.5s;
    }
    
    &-3 {
      animation-delay: 1s;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes moveReflection {
  0% {
    transform: rotate(-45deg) translateY(0);
  }
  100% {
    transform: rotate(315deg) translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(0.8);
  }
  50% {
    transform: translate(3px, -3px) scale(0.8);
  }
}

@keyframes wag {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-15deg);
  }
}

@keyframes rotateBlade {
  from {
    transform: rotate(var(--rotation));
  }
  to {
    transform: rotate(calc(var(--rotation) + 360deg));
  }
}

@keyframes expandRing {
  0%, 100% {
    opacity: 0.2;
    transform: scale(var(--scale, 1));
  }
  50% {
    opacity: 0.3;
    transform: scale(calc(var(--scale, 1) + 0.05));
  }
}
</style> 