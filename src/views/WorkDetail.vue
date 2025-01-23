<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TheNavbar from '../components/TheNavbar.vue'
import { useResponsive } from '../composables/useResponsive'
import { ElMessage } from 'element-plus'
import AV from 'leancloud-storage'
import { Microphone, Mute, CaretRight, VideoPause, Share, Download, Warning, Calendar, VideoPlay } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { isMobile } = useResponsive()

const loading = ref(false)
const error = ref(null)
const work = ref(null)
const checkInterval = ref(null)
const currentLyric = ref('')
const showLyrics = ref(true)
const imageLoaded = ref(false)

// 音频相关的响应式变量
const audioPlayer = ref(null)
const audioContext = ref(null)
const audioSource = ref(null)
const analyser = ref(null)
const visualizer = ref(null)
const isPlaying = ref(false)
const isVisualizing = ref(false)
const volume = ref(1)
const audioProgress = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const showFullImage = ref(false)
const showFullLyrics = ref(false)
const showVolumeControl = ref(false)
const isMuted = ref(false)
const previousVolume = ref(1)
const audioInitialized = ref(false)
const showProgressHandle = ref(false)

// Add primary and accent colors for visualization
const primaryColor = ref('75, 123, 255') // RGB values for primary color
const accentColor = ref('127, 159, 255') // RGB values for accent color

// 优化图片加载
const handleImageLoad = () => {
  imageLoaded.value = true
}

// 下载音乐
const handleDownload = async () => {
  if (!work.value?.audioUrl) {
    ElMessage.warning(t('workDetail.error.audioNotFound'))
    return
  }
  
  try {
    const response = await fetch(work.value.audioUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${work.value.title || 'music'}.mp3`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    ElMessage.success(t('workDetail.actions.download.success'))
  } catch (error) {
    console.error('Download failed:', error)
    ElMessage.error(t('workDetail.actions.download.failed'))
  }
}

// 格式化时间
const formatTime = (time) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 更新音频进度
const handleTimeUpdate = () => {
  if (!audioPlayer.value) return
  currentTime.value = audioPlayer.value.currentTime
  duration.value = audioPlayer.value.duration
  audioProgress.value = (currentTime.value / duration.value) * 100
  updateCurrentLyric()
}

// 处理元数据加载
const handleMetadataLoaded = () => {
  if (!audioPlayer.value) return
  duration.value = audioPlayer.value.duration
}

// 处理进度条点击
const handleProgressClick = (event) => {
  if (!audioPlayer.value) return
  const progressBar = event.currentTarget
  const rect = progressBar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const newTime = percent * duration.value
  audioPlayer.value.currentTime = newTime
  currentTime.value = newTime
}

// Add initVisualizer function
const initVisualizer = () => {
  if (!audioContext.value || !audioSource.value || !visualizer.value) return
  
  try {
    if (!analyser.value) {
      analyser.value = audioContext.value.createAnalyser()
      audioSource.value.connect(analyser.value)
      analyser.value.connect(audioContext.value.destination)
    }
    
    analyser.value.fftSize = 256
    const bufferLength = analyser.value.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const canvas = visualizer.value
    const canvasCtx = canvas.getContext('2d')
    
    const draw = () => {
      if (!isVisualizing.value) return
      
      requestAnimationFrame(draw)
      analyser.value.getByteFrequencyData(dataArray)
      
      canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height)
      
      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2
        
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, `rgba(${primaryColor.value}, 0.8)`)
        gradient.addColorStop(1, `rgba(${accentColor.value}, 0.4)`)
        
        canvasCtx.fillStyle = gradient
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        
        x += barWidth + 1
      }
    }
    
    isVisualizing.value = true
    draw()
  } catch (error) {
    console.error('Error initializing visualizer:', error)
  }
}

// 修改音频上下文初始化
const initAudioContext = () => {
  try {
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume()
    }
    return true
  } catch (error) {
    console.error('Failed to initialize AudioContext:', error)
    ElMessage.error(t('errors.audioInit'))
    return false
  }
}

// 修改播放函数
const handlePlay = async () => {
  try {
    if (!audioPlayer.value) return
    
    if (!audioInitialized.value) {
      audioInitialized.value = initAudioContext()
      if (!audioInitialized.value) return
    }

    if (isPlaying.value) {
      audioPlayer.value.pause()
      isPlaying.value = false
      isVisualizing.value = false
    } else {
      await audioPlayer.value.play()
      isPlaying.value = true
      if (audioInitialized.value) {
        isVisualizing.value = true
        initVisualizer()
      }
    }
  } catch (error) {
    console.error('Play failed:', error)
    ElMessage.error(t('workDetail.error.playFailed'))
  }
}

// 处理音频播放
const handleAudioPlay = async () => {
  try {
    await initAudioContext()
    isPlaying.value = true
  } catch (error) {
    console.error('Error playing audio:', error)
    ElMessage.error(t('workDetail.error.playFailed'))
  }
}

// 处理音频暂停
const handleAudioPause = () => {
  isPlaying.value = false
}

// 修改音频播放控制
const togglePlay = async () => {
  if (!audioPlayer.value) return
  
  try {
    if (isPlaying.value) {
      audioPlayer.value.pause()
      isPlaying.value = false
      isVisualizing.value = false
    } else {
      // 在播放前初始化 AudioContext
      if (!audioContext.value) {
        await initAudioContext()
      }
      
      // 确保 AudioContext 已恢复
      if (audioContext.value?.state === 'suspended') {
        await audioContext.value.resume()
      }
      
      // 设置音频源
      if (audioContext.value && !audioSource.value && audioPlayer.value) {
        audioSource.value = audioContext.value.createMediaElementSource(audioPlayer.value)
        audioSource.value.connect(audioContext.value.destination)
      }
      
      try {
        await audioPlayer.value.play()
        isPlaying.value = true
        isVisualizing.value = true
        
        // 初始化可视化效果
        if (!analyser.value) {
          initVisualizer()
        }
      } catch (playError) {
        console.error('Play failed:', playError)
        if (playError.name === 'NotAllowedError') {
          ElMessage.warning('请点击播放按钮开始播放')
        } else {
          ElMessage.error('播放失败，请重试')
        }
      }
    }
  } catch (error) {
    console.error('Failed to toggle play:', error)
    ElMessage.error('音频初始化失败，请重试')
  }
}

// 修改音量控制
const handleVolumeChange = (value) => {
  if (!audioPlayer.value) return
  volume.value = value
  audioPlayer.value.volume = value
}

// 切换全屏图片显示
const toggleFullImage = () => {
  showFullImage.value = !showFullImage.value
}

// 切换全屏歌词显示
const toggleFullLyrics = () => {
  showFullLyrics.value = !showFullLyrics.value
}

// 更新当前歌词显示
const updateCurrentLyric = () => {
  if (!work.value?.lyrics) return
  currentLyric.value = work.value.lyrics
}

// 分享功能
const handleShare = async () => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: work.value.title,
        text: work.value.description || '来自 Photo Song 的音乐作品',
        url: window.location.href
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      ElMessage.success('分享链接已复制到剪贴板')
    }
  } catch (err) {
    console.error('Share failed:', err)
    ElMessage.error('分享失败')
  }
}

// 添加生成状态检查
const checkGenerationStatus = async () => {
  if (!work.value?.taskId || work.value?.status !== 'generating') return
  
  try {
    const response = await fetch(`https://api.whatai.cc/suno/fetch/${work.value.taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUNO_API_KEY}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('检查任务状态失败')
    }

    const data = await response.json()
    console.log('Task status:', data)

    if (data.code === 'success' && data.data) {
      if (data.data.status === 'SUCCESS') {
        // 更新作品状态为已完成
        const workObj = AV.Object.createWithoutData('Work', work.value.id)
        workObj.set('status', 'completed')
        if (data.data.data && data.data.data.length > 0) {
          const musicData = data.data.data[0]
          workObj.set('audioUrl', musicData.audio_url)
          workObj.set('videoUrl', musicData.video_url || '')
          workObj.set('modelName', musicData.model_name)
          workObj.set('metadata', musicData.metadata)
        }
        workObj.set('progress', 100)
        workObj.set('completedTime', new Date())
        workObj.set('finishTime', data.data.finish_time)
        await workObj.save()
        
        // 更新本地数据
        work.value.status = 'completed'
        work.value.audioUrl = workObj.get('audioUrl')
        work.value.progress = 100
        
        ElMessage.success('音乐生成成功！')
      } else if (data.data.status === 'FAILED') {
        // 更新作品状态为失败
        const workObj = AV.Object.createWithoutData('Work', work.value.id)
        workObj.set('status', 'failed')
        workObj.set('error', data.data.fail_reason || '音乐生成失败')
        workObj.set('progress', 0)
        await workObj.save()
        
        // 更新本地数据
        work.value.status = 'failed'
        work.value.error = data.data.fail_reason || '音乐生成失败'
        work.value.progress = 0
        
        ElMessage.error('音乐生成失败：' + (data.data.fail_reason || '未知错误'))
      } else if (data.data.status === 'IN_PROGRESS') {
        // 更新进度
        const progress = parseInt(data.data.progress) || 0
        const workObj = AV.Object.createWithoutData('Work', work.value.id)
        workObj.set('progress', progress)
        workObj.set('lastCheckTime', new Date())
        workObj.set('startTime', data.data.start_time)
        await workObj.save()
        
        // 更新本地数据
        work.value.progress = progress
      }
    }
  } catch (error) {
    console.error('Check generation status failed:', error)
  }
}

// 修改 fetchWork 函数
const fetchWork = async () => {
  loading.value = true
  error.value = null
  
  try {
    const query = new AV.Query('Work')
    query.include('user')
    const result = await query.get(route.params.id)
    
    if (!result) {
      throw new Error('作品不存在')
    }
    
    work.value = {
      id: result.id,
      title: result.get('title'),
      description: result.get('description'),
      imageUrl: result.get('imageUrl') || result.get('imageFile')?.url() || '',
      audioUrl: result.get('audioUrl') || result.get('musicFile')?.url() || '',
      style: result.get('style'),
      languages: result.get('languages') || [],
      relevance: result.get('relevance') || 'medium',
      imageAnalysis: result.get('imageAnalysis') || '',
      plays: result.get('plays') || 0,
      lyrics: result.get('lyrics') || '',
      status: result.get('status') || 'completed', // 设置默认状态为 completed
      progress: result.get('progress') || 0,
      taskId: result.get('taskId'),
      error: result.get('error'),
      createdAt: result.createdAt,
      completedTime: result.get('completedTime'),
      user: {
        id: result.get('user')?.id,
        username: result.get('user')?.get('username') || '匿名用户',
        avatar: result.get('user')?.get('avatar') || '/default-avatar.png'
      }
    }
    
    // 如果作品状态是生成中，开始定时检查状态
    if (work.value.status === 'generating' && work.value.taskId) {
      checkInterval.value = setInterval(checkGenerationStatus, 10000)
    }
  } catch (err) {
    console.error('Error fetching work:', err)
    error.value = err.message || '作品加载失败'
    ElMessage.error(error.value)
    router.push('/community')
  } finally {
    loading.value = false
  }
}

// 清理事件监听
onUnmounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value.removeEventListener('play', handleAudioPlay)
    audioPlayer.value.removeEventListener('pause', handleAudioPause)
    audioPlayer.value.removeEventListener('timeupdate', handleTimeUpdate)
  }
  if (audioContext.value) {
    audioContext.value.close().catch(console.error)
  }
  if (audioSource.value) {
    audioSource.value.disconnect()
  }
  if (checkInterval.value) {
    clearInterval(checkInterval.value)
  }
  isVisualizing.value = false
})

onMounted(() => {
  fetchWork()
  
  // 添加用户交互监听器
  const handleUserInteraction = async () => {
    try {
      if (!audioContext.value) {
        await initAudioContext()
      }
    } catch (error) {
      console.warn('Failed to initialize audio context:', error)
    }
  }
  
  // 监听用户交互事件
  document.addEventListener('click', handleUserInteraction)
  document.addEventListener('touchstart', handleUserInteraction)
  
  // 组件卸载时移除监听器
  onUnmounted(() => {
    document.removeEventListener('click', handleUserInteraction)
    document.removeEventListener('touchstart', handleUserInteraction)
  })
})

// Add computed property for avatar URL
const userAvatarUrl = computed(() => {
  const avatar = work.value?.user?.avatar
  if (avatar instanceof AV.File) {
    return avatar.url()
  }
  return avatar || '/default-avatar.png'
})

const relevanceOptions = [
  { value: 'high', label: '高度相关' },
  { value: 'medium', label: '中度相关' },
  { value: 'low', label: '低度相关' },
  { value: 'creative', label: '创意发挥' }
]

// Add languageOptions as well since it's referenced in the template
const languageOptions = [
  { value: 'chinese', label: '中文' },
  { value: 'english', label: '英语' },
  { value: 'japanese', label: '日语' },
  { value: 'korean', label: '韩语' },
  { value: 'french', label: '法语' },
  { value: 'spanish', label: '西班牙语' },
  { value: 'german', label: '德语' },
  { value: 'italian', label: '意大利语' },
  { value: 'russian', label: '俄语' },
  { value: 'instrumental', label: '纯音乐' }
]

// 添加计算属性来设置背景图片
const imageUrl = computed(() => {
  if (work.value?.imageUrl) {
    return `url(${work.value.imageUrl})`
  }
  return 'none'
})

// 添加 CSS 变量
watch(imageUrl, (newUrl) => {
  if (newUrl) {
    document.documentElement.style.setProperty('--image-url', newUrl)
  }
})

onUnmounted(() => {
  document.documentElement.style.removeProperty('--image-url')
})

// 添加音频结束处理函数
const handleAudioEnd = () => {
  isPlaying.value = false
  isVisualizing.value = false
  audioProgress.value = 0
  currentLyricIndex.value = 0
}

// 添加静音切换功能
const toggleMute = () => {
  if (!audioPlayer.value) return
  
  if (isMuted.value) {
    volume.value = previousVolume.value
    audioPlayer.value.volume = previousVolume.value
    isMuted.value = false
  } else {
    previousVolume.value = volume.value
    volume.value = 0
    audioPlayer.value.volume = 0
    isMuted.value = true
  }
}

// 添加鼠标事件处理函数
const handleLyricsMouseEnter = () => {
  // 阻止图片hover效果
  if (showLyrics.value) {
    const container = document.querySelector('.image-container')
    if (container) {
      container.style.pointerEvents = 'none'
    }
  }
}

const handleLyricsMouseLeave = () => {
  // 恢复图片hover效果
  const container = document.querySelector('.image-container')
  if (container) {
    container.style.pointerEvents = 'auto'
  }
}
</script>

<template>
  <div class="work-detail">
    <TheNavbar />
    
    <div class="container">
      <div class="work-content">
        <!-- 主要内容区域 -->
        <div class="work-main glass-card">
          <!-- 图片和音频播放区域 -->
          <div class="media-section">
            <div class="image-container">
              <img 
                v-if="work?.imageUrl" 
                :src="work.imageUrl" 
                :alt="work.title"
                class="work-image"
                @load="handleImageLoad"
              >
              <!-- 修改歌词覆盖层 -->
              <div 
                v-if="work?.lyrics && showLyrics" 
                class="lyrics-overlay"
                :class="{ 'show': showLyrics }"
                @mouseenter="handleLyricsMouseEnter"
                @mouseleave="handleLyricsMouseLeave"
              >
                <div class="lyrics-header">
                  <h3>{{ t('workDetail.lyrics.title') }}</h3>
                  <el-switch
                    v-model="showLyrics"
                    :active-text="t('workDetail.lyrics.show')"
                    :inactive-text="t('workDetail.lyrics.hide')"
                    class="lyrics-switch"
                  />
                </div>
                <div class="lyrics-scroll">
                  <p 
                    v-for="(line, index) in work.lyrics.split('\n')"
                    :key="index"
                    class="lyric-line"
                    :class="{ 'current': currentLyric === line }"
                  >{{ line || '&nbsp;' }}</p>
                </div>
              </div>
              <!-- 只在生成中或失败时显示遮罩 -->
              <div class="image-overlay" v-if="work?.status === 'generating' || work?.status === 'failed'">
                <div v-if="work?.status === 'generating'" class="generating-status">
                  <el-progress 
                    type="circle" 
                    :percentage="work.progress"
                    :stroke-width="6"
                    :show-text="false"
                    class="progress-circle"
                  />
                  <span class="status-text">生成中 {{ work.progress }}%</span>
                </div>
                <div v-else-if="work?.status === 'failed'" class="failed-status">
                  <el-icon class="error-icon"><Warning /></el-icon>
                  <span class="status-text">生成失败</span>
                  <p class="error-message">{{ work.error }}</p>
                </div>
              </div>
            </div>

            <!-- 音频播放器 -->
            <div 
              v-if="work?.audioUrl && work.status === 'completed'" 
              class="player-section"
              :class="{ 'is-playing': isPlaying }"
            >
              <div class="player-controls">
                <div class="main-controls">
                  <el-button 
                    class="play-btn"
                    :class="{ 'is-playing': isPlaying }"
                    @click="togglePlay"
                  >
                    <el-icon v-if="!isPlaying"><CaretRight /></el-icon>
                    <el-icon v-else><VideoPause /></el-icon>
                  </el-button>
                  
                  <div class="track-info">
                    <div class="time-info">
                      <span>{{ formatTime(currentTime) }}</span>
                      <span class="separator">/</span>
                      <span>{{ formatTime(duration) }}</span>
                    </div>
                    <div class="progress-bar" @click="handleProgressClick">
                      <div class="progress-bg"></div>
                      <div 
                        class="progress-current"
                        :style="{ width: (currentTime / duration * 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>

                <div class="secondary-controls">
                  <div class="volume-control">
                    <el-button 
                      class="volume-btn"
                      @click="toggleMute"
                    >
                      <el-icon v-if="volume === 0"><Mute /></el-icon>
                      <el-icon v-else><Microphone /></el-icon>
                    </el-button>
                    <el-slider 
                      v-model="volume" 
                      :min="0" 
                      :max="1" 
                      :step="0.01"
                      @input="handleVolumeChange"
                    />
                  </div>
                  
                  <div class="action-buttons">
                    <el-button 
                      class="action-btn share-btn"
                      @click="handleShare"
                      title="分享作品"
                    >
                      <el-icon><Share /></el-icon>
                    </el-button>
                    <el-button 
                      class="action-btn download-btn"
                      @click="handleDownload"
                      title="下载音乐"
                    >
                      <el-icon><Download /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>

              <audio 
                ref="audioPlayer"
                :src="work.audioUrl"
                preload="metadata"
                crossorigin="anonymous"
                @play="handleAudioPlay"
                @pause="handleAudioPause"
                @timeupdate="handleTimeUpdate"
                @loadedmetadata="handleMetadataLoaded"
              ></audio>
            </div>
          </div>

          <!-- 作品信息区域 -->
          <div class="work-info">
            <div class="info-header">
              <h1 class="work-title gradient-text">{{ work?.title }}</h1>
              <div class="author-section">
                <div class="author-card">
                  <div class="author-main">
                    <div class="author-avatar-wrapper">
                      <el-avatar 
                        :size="64" 
                        :src="userAvatarUrl"
                        class="author-avatar"
                      />
                      <div class="avatar-border"></div>
                    </div>
                    <div class="author-info">
                      <div class="author-name-wrapper">
                        <span class="author-name">{{ work?.user?.username }}</span>
                        <el-tag size="small" class="creator-tag">{{ t('workDetail.user.creator') }}</el-tag>
                      </div>
                      <div class="author-meta">
                        <span class="creation-time">
                          <el-icon><Calendar /></el-icon>
                          {{ new Date(work?.createdAt).toLocaleDateString() }}
                        </span>
                        <span class="play-count" v-if="work?.plays">
                          <el-icon><VideoPlay /></el-icon>
                          {{ work.plays }} {{ t('workDetail.stats.plays') }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="info-content">
              <div class="info-section">
                <h3 class="section-title">{{ t('workDetail.style.title') }}</h3>
                <div class="style-tags">
                  <el-tag 
                    v-if="work?.style"
                    class="style-tag"
                  >{{ work.style }}</el-tag>
                  <el-tag 
                    v-for="lang in work?.languages"
                    :key="lang"
                    class="language-tag"
                  >{{ languageOptions.find(opt => opt.value === lang)?.label }}</el-tag>
                </div>
              </div>

              <div class="info-section" v-if="work?.description">
                <h3 class="section-title">{{ t('workDetail.description.title') }}</h3>
                <p class="description-text">{{ work.description }}</p>
              </div>

              <div class="info-section" v-if="work?.lyrics">
                <h3 class="section-title">
                  {{ t('workDetail.lyrics.title') }}
                  <el-switch
                    v-model="showLyrics"
                    :active-text="t('workDetail.lyrics.show')"
                    :inactive-text="t('workDetail.lyrics.hide')"
                    class="lyrics-switch"
                  />
                </h3>
                <div 
                  v-show="showLyrics"
                  class="lyrics-content"
                >
                  <p 
                    v-for="(line, index) in work.lyrics.split('\n')"
                    :key="index"
                    class="lyric-line"
                    :class="{ 'current': currentLyric === line }"
                  >{{ line || '&nbsp;' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.work-detail {
  min-height: 100vh;
  padding: 64px 0;
  background: radial-gradient(
    circle at top right,
    rgba(var(--primary-color-rgb), 0.1),
    rgba(var(--accent-color-rgb), 0.05),
    transparent 70%
  );
  
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background: 
      linear-gradient(45deg, rgba(var(--primary-color-rgb), 0.03) 25%, transparent 25%) -50px 0,
      linear-gradient(-45deg, rgba(var(--primary-color-rgb), 0.03) 25%, transparent 25%) -50px 0;
    background-size: 100px 100px;
    z-index: -1;
  }
}

.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 2rem;
}

.work-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.work-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  padding: 3rem;
  border-radius: 2rem;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.media-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  border-radius: 1.5rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.1);
  
  .work-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  // 修改歌词覆盖层样式
  .lyrics-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    opacity: 0;
    transform: translateY(100%);
    transition: all 0.3s ease;
    pointer-events: auto; // 确保可以接收鼠标事件
    
    &.show {
      opacity: 1;
      transform: translateY(0);
    }
    
    .lyrics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      h3 {
        color: white;
        font-size: 1.25rem;
        font-weight: 600;
      }
    }
    
    .lyrics-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      margin-right: -1rem;
      padding-right: 2rem;
      
      /* 自定义滚动条样式 */
      &::-webkit-scrollbar {
        width: 4px;
      }
      
      &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        border-radius: 2px;
      }
      
      .lyric-line {
        color: rgba(255, 255, 255, 0.8);
        font-size: 1.125rem;
        line-height: 2;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
        text-align: center;
        white-space: pre-wrap;
        
        &.current {
          color: var(--primary-color);
          transform: scale(1.05);
          font-weight: 500;
        }
      }
    }
  }
  
  // 修改遮罩层样式，只在特定状态下显示
  .image-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    transition: opacity 0.3s ease;
    
    .generating-status,
    .failed-status {
      text-align: center;
      color: white;
      
      .status-text {
        margin-top: 1rem;
        font-size: 1.125rem;
        font-weight: 500;
      }
    }
  }
}

.player-section {
  padding: 2rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  .player-controls {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .main-controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    
    .play-btn {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg,
        var(--primary-color),
        var(--accent-color)
      );
      transition: all 0.3s ease;
      
      .el-icon {
        font-size: 24px;
        color: white;
      }
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 20px rgba(var(--primary-color-rgb), 0.3);
      }
      
      &.is-playing {
        animation: pulse 2s infinite;
      }
    }
  }
  
  .track-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    
    .time-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Monaco', monospace;
      font-size: 0.875rem;
      color: var(--text-color-light);
      
      .separator {
        opacity: 0.5;
      }
    }
    
    .progress-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      
      .progress-bg {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.05);
      }
      
      .progress-current {
        position: absolute;
        height: 100%;
        background: linear-gradient(90deg,
          var(--primary-color),
          var(--accent-color)
        );
        transition: width 0.1s linear;
      }
      
      &:hover {
        height: 8px;
      }
    }
  }
  
  .secondary-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .volume-control {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 180px;
      
      .volume-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        
        .el-icon {
          color: var(--text-color-light);
        }
        
        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      }
      
      :deep(.el-slider) {
        margin: 0;
      }
    }
    
    .action-buttons {
      display: flex;
      gap: 1rem;
      
      .action-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        transition: all 0.3s ease;
        
        &.share-btn {
          background: linear-gradient(135deg, #4b7bff, #7f9fff);
        }
        
        &.download-btn {
          background: linear-gradient(135deg, #4CAF50, #45a049);
        }
        
        .el-icon {
          color: white;
        }
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
      }
    }
  }
}

.work-info {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  
  .info-header {
    .work-title {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    
    .author-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 1.5rem;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(var(--primary-color-rgb), 0.2);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }
    }
  }
  
  .info-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    
    .info-section {
      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .style-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        
        .style-tag,
        .language-tag {
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          border: none;
          background: linear-gradient(135deg,
            var(--primary-color),
            var(--accent-color)
          );
          color: white;
          font-weight: 500;
        }
      }
      
      .description-text {
        font-size: 1rem;
        line-height: 1.6;
        color: var(--text-color-light);
      }
      
      .lyrics-content {
        margin-top: 1rem;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        
        .lyric-line {
          font-size: 1.125rem;
          line-height: 1.8;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
          
          &.current {
            color: var(--primary-color);
            transform: scale(1.05);
            font-weight: 500;
          }
        }
      }
    }
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--primary-color-rgb), 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--primary-color-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--primary-color-rgb), 0);
  }
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .work-main {
    padding: 1.5rem;
    gap: 2rem;
  }
  
  .work-info {
    .info-header {
      .work-title {
        font-size: 2rem;
      }
    }
  }
  
  .player-section {
    padding: 1.5rem;
    
    .main-controls {
      .play-btn {
        width: 56px;
        height: 56px;
      }
    }
    
    .secondary-controls {
      flex-direction: column;
      gap: 1.5rem;
      
      .volume-control {
        width: 100%;
      }
      
      .action-buttons {
        width: 100%;
        justify-content: center;
      }
    }
  }
}

.author-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(var(--primary-color-rgb), 0.2);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
}

.author-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.author-main {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem;
}

.author-avatar-wrapper {
  position: relative;
  padding: 3px;
  
  .author-avatar {
    border: 2px solid transparent;
    background: linear-gradient(135deg,
      var(--primary-color),
      var(--accent-color)
    );
    position: relative;
    z-index: 1;
  }
  
  .avatar-border {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg,
      var(--primary-color),
      var(--accent-color)
    );
    opacity: 0.5;
    filter: blur(8px);
    transition: all 0.3s ease;
  }
}

.author-info {
  flex: 1;
  min-width: 0;
  
  .author-name-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    
    .author-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .creator-tag {
      background: linear-gradient(135deg,
        var(--primary-color),
        var(--accent-color)
      );
      border: none;
      color: white;
      font-size: 0.75rem;
      padding: 0 0.75rem;
      height: 20px;
      line-height: 20px;
      border-radius: 10px;
      flex-shrink: 0;
    }
  }
  
  .author-meta {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    color: var(--text-color-light);
    font-size: 0.875rem;
    
    .creation-time,
    .play-count {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      .el-icon {
        font-size: 1rem;
        color: var(--primary-color);
        opacity: 0.8;
      }
    }
  }
}

@media (max-width: 768px) {
  .author-main {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }
  
  .author-info {
    .author-name-wrapper {
      justify-content: center;
    }
    
    .author-meta {
      justify-content: center;
    }
  }
}

// 添加播放动画
@keyframes musicWave {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.4;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

.player-section {
  &.is-playing {
    .play-btn {
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        inset: -8px;
        border-radius: 50%;
        background: linear-gradient(135deg,
          var(--primary-color),
          var(--accent-color)
        );
        opacity: 0.4;
        z-index: -1;
        animation: musicWave 2s ease-in-out infinite;
      }
    }
    
    .progress-current {
      position: relative;
      overflow: hidden;
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 8px;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        filter: blur(4px);
        animation: progressGlow 2s linear infinite;
      }
    }
  }
}

@keyframes progressGlow {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style> 