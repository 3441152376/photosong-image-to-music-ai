<template>
    <div 
      class="skeleton-loader" 
      :class="[type, { 'shimmer': shimmer }]"
      :style="{ 
        width: width,
        height: height,
        borderRadius: radius
      }"
    ></div>
  </template>
  
  <script setup>
  defineProps({
    type: {
      type: String,
      default: 'text', // text, image, avatar, card
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '1rem'
    },
    radius: {
      type: String,
      default: '4px'
    },
    shimmer: {
      type: Boolean,
      default: true
    }
  })
  </script>
  
  <style scoped lang="scss">
  .skeleton-loader {
    background: var(--skeleton-color, #e2e8f0);
    position: relative;
    overflow: hidden;
    
    &.text {
      margin-bottom: 0.5rem;
    }
    
    &.image {
      aspect-ratio: 16/9;
    }
    
    &.avatar {
      border-radius: 50%;
    }
    
    &.card {
      border-radius: 0.5rem;
    }
    
    &.shimmer {
      &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.2) 50%,
          transparent 100%
        );
        animation: shimmer 1.5s infinite;
      }
    }
  }
  
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  </style>`