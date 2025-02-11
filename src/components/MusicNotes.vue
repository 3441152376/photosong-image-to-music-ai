<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  isPlaying: {
    type: Boolean,
    default: false
  },
  isVisualizing: {
    type: Boolean,
    default: false
  }
})

const notes = ref([])
const container = ref(null)
const animationFrame = ref(null)
const lastUpdate = ref(0)
const MAX_NOTES = 6 // 减少最大音符数量

const createNote = () => {
  // 如果已经达到最大数量，先移除最老的音符
  if (notes.value.length >= MAX_NOTES) {
    notes.value.shift()
  }

  const note = {
    id: Date.now(),
    x: Math.random() * (container.value?.offsetWidth || window.innerWidth),
    y: window.innerHeight,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    velocity: 2 + Math.random() * 2, // 降低速度范围
    opacity: 1,
    symbol: ['♪', '♫'][Math.floor(Math.random() * 2)] // 减少音符种类
  }
  notes.value.push(note)
}

const updateNotes = (timestamp) => {
  if (!props.isPlaying) {
    notes.value = []
    return
  }

  // 限制更新频率为每秒30次
  if (timestamp - lastUpdate.value < 33) { // 约33ms，即30fps
    animationFrame.value = requestAnimationFrame(updateNotes)
    return
  }

  lastUpdate.value = timestamp

  notes.value = notes.value.filter(note => {
    note.y -= note.velocity
    note.rotation += 1 // 降低旋转速度
    note.opacity = Math.max(0, note.opacity - 0.008)
    return note.y > -50 && note.opacity > 0
  })

  // 降低音符生成概率
  if (Math.random() < 0.1 && notes.value.length < MAX_NOTES) {
    createNote()
  }

  animationFrame.value = requestAnimationFrame(updateNotes)
}

watch(() => props.isPlaying, (newVal) => {
  if (newVal) {
    if (animationFrame.value) {
      cancelAnimationFrame(animationFrame.value)
    }
    animationFrame.value = requestAnimationFrame(updateNotes)
  } else {
    if (animationFrame.value) {
      cancelAnimationFrame(animationFrame.value)
    }
    notes.value = []
  }
}, { immediate: true })

onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }
  notes.value = []
})
</script>

<template>
  <div ref="container" class="music-notes" v-show="isPlaying">
    <div
      v-for="note in notes"
      :key="note.id"
      class="note"
      :style="{
        '--x': `${note.x}px`,
        '--y': `${note.y}px`,
        '--rotation': `${note.rotation}deg`,
        '--scale': note.scale,
        '--opacity': note.opacity
      }"
    >
      {{ note.symbol }}
    </div>
  </div>
</template>

<style scoped>
.music-notes {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.note {
  position: absolute;
  font-size: 2rem;
  color: var(--primary-color);
  left: var(--x);
  top: var(--y);
  opacity: var(--opacity);
  transform: rotate(var(--rotation)) scale(var(--scale));
  will-change: transform, opacity;
  text-shadow: 0 0 10px rgba(var(--primary-color-rgb), 0.5);
}
</style> 