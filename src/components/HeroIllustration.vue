<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const props = defineProps({
  latestWork: {
    type: Object,
    default: () => ({})
  }
})

const router = useRouter()
const isPlaying = ref(false)
const audioElement = ref(null)
const visualizer = ref(null)
const audioContext = ref(null)
const analyser = ref(null)
const dataArray = ref(null)
const animationFrame = ref(null)

// 音频可视化动画
const initAudio = async () => {
  try {
    if (!audioElement.value) {
      audioElement.value = new Audio()
    }
    
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
      analyser.value = audioContext.value.createAnalyser()
      analyser.value.fftSize = 256
      const bufferLength = analyser.value.frequencyBinCount
      dataArray.value = new Uint8Array(bufferLength)
      
      const source = audioContext.value.createMediaElementSource(audioElement.value)
      source.connect(analyser.value)
      analyser.value.connect(audioContext.value.destination)
    }
    
    if (audioContext.value.state === 'suspended') {
      await audioContext.value.resume()
    }
  } catch (error) {
    console.error('Error initializing audio:', error)
    ElMessage.error('Failed to initialize audio')
  }
}

const drawVisualizer = () => {
  if (!visualizer.value || !analyser.value || !isPlaying.value) return
  
  const canvas = visualizer.value
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  const centerX = width / 2
  const centerY = height / 2
  
  analyser.value.getByteFrequencyData(dataArray.value)
  
  ctx.clearRect(0, 0, width, height)
  
  // 绘制环形频谱
  const barWidth = (2 * Math.PI) / dataArray.value.length
  ctx.beginPath()
  
  for (let i = 0; i < dataArray.value.length; i++) {
    const value = dataArray.value[i]
    const amplitude = value / 255
    const radius = 80 + amplitude * 30
    
    const x = centerX + Math.cos(i * barWidth) * radius
    const y = centerY + Math.sin(i * barWidth) * radius
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  
  ctx.closePath()
  ctx.strokeStyle = 'rgba(var(--primary-color-rgb), 0.5)'
  ctx.lineWidth = 2
  ctx.stroke()
  
  // 添加发光效果
  ctx.shadowBlur = 15
  ctx.shadowColor = 'var(--primary-color)'
  
  animationFrame.value = requestAnimationFrame(drawVisualizer)
}

const togglePlay = async () => {
  try {
    if (!props.latestWork?.audioUrl) {
      ElMessage.warning('No audio available')
      return
    }
    
    // 确保 audioElement 已初始化
    if (!audioElement.value) {
      audioElement.value = new Audio()
      audioElement.value.crossOrigin = 'anonymous' // 添加跨域支持
    }
    
    // 如果音频源未设置或已更改，则重新设置
    if (!audioElement.value.src || audioElement.value.src !== props.latestWork.audioUrl) {
      audioElement.value.src = props.latestWork.audioUrl
      await initAudio()
    }
    
    if (isPlaying.value) {
      audioElement.value.pause()
      isPlaying.value = false
      cancelAnimationFrame(animationFrame.value)
    } else {
      try {
        await audioElement.value.play()
        isPlaying.value = true
        drawVisualizer()
      } catch (playError) {
        console.error('Playback failed:', playError)
        ElMessage.error('Failed to play audio: ' + playError.message)
      }
    }
  } catch (error) {
    console.error('Error playing audio:', error)
    ElMessage.error('Failed to play audio')
  }
}

const handleWorkClick = () => {
  if (props.latestWork?.id) {
    router.push({ name: 'WorkDetail', params: { id: props.latestWork.id } })
  }
}

onMounted(() => {
  if (visualizer.value) {
    const dpr = window.devicePixelRatio || 1
    const rect = visualizer.value.getBoundingClientRect()
    visualizer.value.width = rect.width * dpr
    visualizer.value.height = rect.height * dpr
    const ctx = visualizer.value.getContext('2d')
    ctx.scale(dpr, dpr)
  }
  
  // 预加载音频
  if (props.latestWork?.audioUrl) {
    audioElement.value = new Audio()
    audioElement.value.crossOrigin = 'anonymous'
    audioElement.value.src = props.latestWork.audioUrl
    audioElement.value.load()
  }
})

onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }
  if (audioContext.value) {
    audioContext.value.close()
  }
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }
})
</script>

<template>
  <div class="turntable-container" @click="handleWorkClick">
    <!-- 音频可视化画布 -->
    <canvas ref="visualizer" class="visualizer"></canvas>
    
    <!-- 唱片机主体 -->
    <div class="turntable-base">
      <div class="base-top"></div>
      <div class="base-front"></div>
      
      <!-- 装饰性光效 -->
      <div class="glow-effects">
        <div class="glow-circle"></div>
        <div class="glow-line"></div>
      </div>
    </div>
    
    <!-- 唱臂 -->
    <div class="tonearm" :class="{ playing: isPlaying }">
      <div class="tonearm-base">
        <div class="tonearm-light"></div>
      </div>
      <div class="tonearm-head"></div>
    </div>
    
    <!-- 转盘和唱片 -->
    <div class="platter" :class="{ spinning: isPlaying }">
      <div class="vinyl" :style="{ backgroundImage: props.latestWork?.imageUrl ? `url(${props.latestWork.imageUrl})` : 'none' }">
        <div class="vinyl-reflection"></div>
        <div class="vinyl-label">
          <div class="label-text">{{ props.latestWork?.title || 'PhotoSong' }}</div>
        </div>
        <div class="grooves"></div>
      </div>
    </div>
    
    <!-- 控制按钮 -->
    <button 
      class="play-button" 
      @click.stop="togglePlay"
      :aria-label="isPlaying ? 'Pause' : 'Play'"
    >
      <div class="button-icon">
        <div v-if="!isPlaying" class="play-icon"></div>
        <div v-else class="pause-icon"></div>
      </div>
      <div class="button-ripple"></div>
    </button>
    
    <!-- 装饰性音符 -->
    <div class="music-notes" v-if="isPlaying">
      <span 
        v-for="i in 5" 
        :key="i" 
        class="note" 
        :style="{ 
          '--delay': `${i * 0.5}s`,
          '--x': `${Math.random() * 100}%`,
          '--rotate': `${Math.random() * 360}deg`
        }"
      >♪</span>
    </div>
    
    <!-- 播放信息 -->
    <div class="play-info" v-if="props.latestWork?.title">
      <div class="info-content">
        <div class="title">{{ props.latestWork.title }}</div>
        <div class="artist">{{ props.latestWork.user?.username }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.turntable-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  aspect-ratio: 1;
  margin: 0 auto;
  cursor: pointer;
  perspective: 1000px;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.turntable-container:hover {
  transform: scale(1.02) translateY(-5px);
}

.visualizer {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.6;
  z-index: 1;
}

.turntable-base {
  position: absolute;
  inset: 10%;
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
  border-radius: 20px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transform: translateZ(0);
  transition: transform 0.3s ease;
}

.glow-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glow-circle {
  position: absolute;
  top: 20%;
  right: 20%;
  width: 100px;
  height: 100px;
  background: radial-gradient(
    circle,
    rgba(var(--primary-color-rgb), 0.2),
    transparent 70%
  );
  border-radius: 50%;
  filter: blur(10px);
  animation: pulse 4s ease-in-out infinite;
}

.glow-line {
  position: absolute;
  bottom: 30%;
  left: 20%;
  width: 150px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--primary-color-rgb), 0.3),
    transparent
  );
  transform: rotate(-45deg);
  filter: blur(2px);
  animation: pulse 3s ease-in-out infinite alternate;
}

.platter {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70%;
  height: 70%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.platter.spinning {
  animation: spin 4s linear infinite;
}

.vinyl {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #111;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 
    0 0 0 10px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(0, 0, 0, 0.3);
  transform-origin: center center;
}

.vinyl-reflection {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1),
    transparent 50%
  );
  animation: reflection 4s linear infinite;
}

.vinyl-label {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 35%;
  height: 35%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-shadow: 
    0 0 15px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.vinyl-label::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.15),
    transparent 70%
  );
}

.vinyl-label::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 15%;
  height: 15%;
  background: #111;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.vinyl-label .label-text {
  position: relative;
  width: 100%;
  text-align: center;
  font-size: clamp(0.6rem, 1.5vw, 0.8rem);
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: counter-spin 4s linear infinite;
}

@keyframes counter-spin {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

.grooves {
  position: absolute;
  inset: 0;
  background: repeating-radial-gradient(
    circle at 50% 50%,
    rgba(0, 0, 0, 0.15) 0,
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 3px
  );
  opacity: 0.8;
  pointer-events: none;
}

.grooves::before {
  content: '';
  position: absolute;
  inset: 32.5%;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    transparent,
    rgba(0, 0, 0, 0.2)
  );
}

.tonearm {
  position: absolute;
  top: 20%;
  right: 25%;
  width: 35%;
  height: 8px;
  background: linear-gradient(to right, #444, #333);
  transform-origin: right center;
  transform: rotate(-30deg);
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 3;
  
  &.playing {
    transform: rotate(0deg);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
  }

  .tonearm-base {
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #555, #333);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .tonearm-head {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 15px;
    height: 15px;
    background: linear-gradient(135deg, #666, #444);
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 8px;
      background: #666;
      border-radius: 1px;
    }
  }

  .tonearm-light {
    position: absolute;
    width: 6px;
    height: 6px;
    background: var(--primary-color);
    border-radius: 50%;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    box-shadow: 0 0 10px var(--primary-color);
    animation: blink 2s ease-in-out infinite;
  }
}

.play-button {
  position: absolute;
  bottom: 15%;
  right: 15%;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(var(--primary-color-rgb), 0.3);
  transition: all 0.3s ease;
  z-index: 2;
  overflow: hidden;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(var(--primary-color-rgb), 0.4);
    
    .button-ripple {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  .play-icon {
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 10px 0 10px 16px;
    border-color: transparent transparent transparent #fff;
    margin-left: 4px;
  }

  .pause-icon {
    width: 16px;
    height: 16px;
    position: relative;
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 4px;
      height: 100%;
      background: #fff;
      border-radius: 2px;
    }
    
    &::before {
      left: 2px;
    }
    
    &::after {
      right: 2px;
    }
  }
}

.button-ripple {
  position: absolute;
  inset: -4px;
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  transition: all 0.5s ease;
  opacity: 0.5;
}

.play-info {
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 10px 20px;
  border-radius: 10px;
  text-align: center;
  opacity: 0;
  transition: all 0.3s ease;
  
  .title {
    font-weight: 600;
    color: white;
    margin-bottom: 4px;
  }
  
  .artist {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }
}

.turntable-container:hover .play-info {
  opacity: 1;
  transform: translateX(-50%) translateY(-10px);
}

.note {
  position: absolute;
  font-size: 24px;
  color: var(--primary-color);
  opacity: 0;
  left: var(--x);
  animation: float 2s ease-in-out infinite;
  animation-delay: var(--delay);
  transform: rotate(var(--rotate));
  text-shadow: 0 0 10px var(--primary-color);
}

@keyframes spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes float {
  0% {
    transform: translateY(0) rotate(var(--rotate));
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(calc(var(--rotate) + 20deg));
    opacity: 0;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes reflection {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .turntable-container {
    max-width: 300px;
  }
  
  .vinyl-label {
    font-size: 0.6rem;
  }
  
  .play-button {
    width: 40px;
    height: 40px;
  }
  
  .glow-circle {
    width: 60px;
    height: 60px;
  }
  
  .glow-line {
    width: 100px;
  }
  
  .note {
    font-size: 20px;
  }
}
</style> 