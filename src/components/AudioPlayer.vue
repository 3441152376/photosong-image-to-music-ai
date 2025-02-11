<template>
  <div class="audio-player">
    <div v-if="needsUserInteraction" class="audio-interaction-notice">
      {{ t('player.clickToPlay') }}
    </div>
    <div class="audio-controls">
      <button 
        class="play-button"
        :class="{ 'is-playing': isPlaying }"
        @click="handlePlayPause"
        :disabled="!isInitialized"
      >
        <el-icon v-if="isPlaying"><VideoPause /></el-icon>
        <el-icon v-else><VideoPlay /></el-icon>
      </button>
      <div class="audio-progress" v-if="duration > 0">
        <div class="progress-bar" ref="progressBar" @click="handleProgressClick">
          <div class="progress-current" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="time-display">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import audioContextManager from '../utils/audio'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  autoplay: {
    type: Boolean,
    default: false
  }
})

const { t } = useI18n()
const isPlaying = ref(false)
const audioElement = ref(null)
const isInitialized = ref(false)
const needsUserInteraction = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const progressBar = ref(null)

// 格式化时间
const formatTime = (time) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 初始化音频
const initializeAudio = async () => {
  try {
    // 创建新的音频元素
    audioElement.value = new Audio()
    
    // 添加音频源，包括多种格式支持
    const sourceFormats = [
      { type: 'audio/mpeg', ext: '.mp3' },
      { type: 'audio/wav', ext: '.wav' },
      { type: 'audio/ogg', ext: '.ogg' }
    ]
    
    // 检测浏览器支持的格式
    const baseUrl = props.src.replace(/\.[^/.]+$/, '')
    let formatSupported = false
    
    for (const format of sourceFormats) {
      if (audioElement.value.canPlayType(format.type)) {
        const source = document.createElement('source')
        source.src = `${baseUrl}${format.ext}`
        source.type = format.type
        audioElement.value.appendChild(source)
        formatSupported = true
      }
    }
    
    if (!formatSupported) {
      throw new Error('No supported audio format found')
    }

    // 设置事件监听器
    audioElement.value.addEventListener('loadedmetadata', () => {
      duration.value = audioElement.value.duration
      isInitialized.value = true
    })

    audioElement.value.addEventListener('timeupdate', () => {
      currentTime.value = audioElement.value.currentTime
      progress.value = (currentTime.value / duration.value) * 100
    })

    audioElement.value.addEventListener('ended', () => {
      isPlaying.value = false
      currentTime.value = 0
      progress.value = 0
    })

    audioElement.value.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      ElMessage.error(t('player.errors.loadFailed'))
    })

    // 检查是否需要用户交互
    const context = audioContextManager.getContext()
    if (context && context.state === 'suspended') {
      needsUserInteraction.value = true
    }

  } catch (error) {
    console.error('Failed to initialize audio:', error)
    ElMessage.error(t('player.errors.initFailed'))
  }
}

// 播放/暂停控制
const handlePlayPause = async () => {
  try {
    if (needsUserInteraction.value) {
      await audioContextManager.resume()
      needsUserInteraction.value = false
    }

    if (!isInitialized.value) {
      ElMessage.warning(t('player.errors.notReady'))
      return
    }

    if (isPlaying.value) {
      await audioElement.value.pause()
    } else {
      await audioElement.value.play()
    }
    isPlaying.value = !isPlaying.value
  } catch (error) {
    console.error('Playback control failed:', error)
    ElMessage.error(t('player.errors.playbackFailed'))
  }
}

// 进度条点击处理
const handleProgressClick = (event) => {
  if (!progressBar.value || !duration.value) return
  
  const rect = progressBar.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = x / rect.width
  const newTime = percentage * duration.value
  
  if (audioElement.value) {
    audioElement.value.currentTime = newTime
  }
}

// 监听源变化
watch(() => props.src, () => {
  if (audioElement.value) {
    audioElement.value.pause()
    isPlaying.value = false
    currentTime.value = 0
    progress.value = 0
    initializeAudio()
  }
})

onMounted(() => {
  initializeAudio()
})

onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.remove()
  }
})
</script>

<style scoped>
.audio-player {
  width: 100%;
  padding: 1rem;
  background: var(--surface-primary);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.audio-interaction-notice {
  text-align: center;
  padding: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.play-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--primary-color);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.play-button:hover {
  background: var(--primary-color-dark);
}

.play-button:disabled {
  background: var(--surface-secondary);
  cursor: not-allowed;
}

.audio-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--surface-secondary);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.progress-current {
  position: absolute;
  height: 100%;
  background: var(--primary-color);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-secondary);
}
</style>