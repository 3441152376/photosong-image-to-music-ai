<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TheNavbar from '../components/TheNavbar.vue'
import { useResponsive } from '../composables/useResponsive'
import { ElMessage } from 'element-plus'
import AV from 'leancloud-storage'
import { Microphone, Mute, CaretRight, VideoPause, Share, Download, Warning, Calendar, VideoPlay, Loading } from '@element-plus/icons-vue'
import { useHead } from '@vueuse/head'
import SeoMeta from '../components/SEOMeta.vue'
import WorkMeta from '../components/WorkMeta.vue'
import SharePoster from '../components/SharePoster.vue'
import { generateWorkSchema, generateBreadcrumbSchema } from '../utils/structuredData'
import MusicNotes from '../components/MusicNotes.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { isMobile } = useResponsive()

const loading = ref(false)
const error = ref(null)
const work = ref(null)
const checkInterval = ref(null)
const currentLyric = ref('')
const showLyrics = ref(true)
const imageLoaded = ref(false)
const currentLyricIndex = ref(0)
const lyrics = ref([])

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

// 添加页面元信息的响应式数据
const pageTitle = computed(() => {
  if (!work.value) return t('workDetail.defaultTitle')
  return `${work.value.title} | ${work.value.author?.username || 'Photo Song'} - AI 生成的音乐作品`
})

const pageDescription = computed(() => {
  if (!work.value) return t('workDetail.defaultDescription')
  return `${work.value.description || ''}. 由 ${work.value.author?.username || 'Photo Song'} 使用 AI 技术创作的独特音乐作品，基于图片生成。播放次数：${work.value.playCount || 0}。`
})

const pageKeywords = computed(() => {
  if (!work.value) return ['photo music', 'AI music', 'photo song']
  const baseKeywords = ['AI音乐', '图片音乐', '音乐生成', 'AI创作', '照片音乐']
  const titleKeywords = work.value.title?.split(' ') || []
  const authorKeywords = [work.value.author?.username || '']
  const customKeywords = work.value.tags || []
  return [...baseKeywords, ...titleKeywords, ...authorKeywords, ...customKeywords].filter(Boolean)
})

const pageImage = computed(() => work.value?.imageUrl || '/default-og-image.jpg')

const pageUrl = computed(() => `https://photosong.com/work/${work.value?.id}`)

// 添加社交媒体分享函数
const handleSocialShare = async (platform) => {
  if (!work.value) return
  
  const shareUrl = window.location.href
  const title = `${work.value.title} - AI Generated Music on PhotoSong`
  const description = work.value.description || 'Listen to this unique AI-generated music from photos'
  const hashtags = 'AIMusic,PhotoMusic,AIArt,AIGenerated,MusicFromPhotos'
  const via = 'PhotoSongAI'
  
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}&hashtags=${hashtags}&via=${via}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,
    weixin: async () => {
      try {
        await navigator.clipboard.writeText(shareUrl)
        ElMessage.success('链接已复制，请在微信中粘贴分享')
      } catch (err) {
        ElMessage.error('复制链接失败')
      }
    },
    qq: `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n${description}\n${shareUrl}`)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(work.value.imageUrl)}&description=${encodeURIComponent(title)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`,
    tumblr: `https://www.tumblr.com/share/link?url=${encodeURIComponent(shareUrl)}&name=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`
  }
  
  if (typeof shareUrls[platform] === 'function') {
    await shareUrls[platform]()
  } else {
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer')
  }
}

// 添加 meta 计算属性
const meta = computed(() => {
  if (!work.value) return {}

  // 生成面包屑数据
  const breadcrumbItems = [
    { name: t('nav.home'), url: 'https://photosong.com' },
    { name: t('nav.works'), url: 'https://photosong.com/works' },
    { name: work.value.title, url: window.location.href }
  ]

  return {
    title: `${work.value.title} - PhotoSong`,
    meta: [
      {
        name: 'description',
        content: work.value.description || t('works.defaultDescription')
      },
      {
        name: 'keywords',
        content: [
          'AI music',
          'photo to music',
          work.value.style,
          ...work.value.tags || []
        ].join(', ')
      },
      {
        property: 'og:title',
        content: work.value.title
      },
      {
        property: 'og:description',
        content: work.value.description || t('works.defaultDescription')
      },
      {
        property: 'og:image',
        content: work.value.imageUrl
      },
      {
        property: 'og:type',
        content: 'music.song'
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      },
      {
        name: 'twitter:title',
        content: work.value.title
      },
      {
        name: 'twitter:description',
        content: work.value.description || t('works.defaultDescription')
      },
      {
        name: 'twitter:image',
        content: work.value.imageUrl
      },
      {
        name: 'twitter:creator',
        content: '@PhotoSongAI'
      }
    ],
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(generateWorkSchema(work.value))
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems))
      }
    ],
    link: [
      {
        rel: 'canonical',
        href: window.location.href
      }
    ]
  }
})

// 使用 useHead 设置动态 meta 信息
useHead(meta)

// 监听 work 变化来更新元数据
watch(() => work.value, () => {
  // meta 会自动更新，因为它是一个计算属性
}, { immediate: true })

// 优化图片加载
const handleImageLoad = () => {
  imageLoaded.value = true
  // 使用 requestIdleCallback 在空闲时预加载推荐作品的图片
  if (window.requestIdleCallback) {
    requestIdleCallback(() => {
      recommendedWorks.value.forEach(work => {
        if (work.imageUrl) {
          const img = new Image()
          img.src = work.imageUrl
        }
      })
    })
  }
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

// 添加音频可视化相关的函数
const initVisualizer = () => {
  if (!audioContext.value || !audioSource.value || !visualizer.value || !isVisualizing.value) return
  
  try {
    const bufferLength = analyser.value.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const canvas = visualizer.value
    const canvasCtx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    })
    
    let animationFrame
    
    const draw = () => {
      if (!isVisualizing.value) {
        cancelAnimationFrame(animationFrame)
        return
      }
      
      animationFrame = requestAnimationFrame(draw)
      analyser.value.getByteFrequencyData(dataArray)
      
      canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height)
      
      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2
        
        if (barHeight > 0) { // 只绘制有值的部分
          const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height)
          gradient.addColorStop(0, `rgba(${primaryColor.value}, 0.8)`)
          gradient.addColorStop(1, `rgba(${accentColor.value}, 0.4)`)
          
          canvasCtx.fillStyle = gradient
          canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        }
        
        x += barWidth + 1
      }
    }
    
    draw()
  } catch (error) {
    console.error('Error initializing visualizer:', error)
  }
}

// 修改音频初始化逻辑
const initAudioContext = async () => {
  if (!audioInitialized.value && !audioContext.value) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'playback',
        sampleRate: 44100
      })
      
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }
      
      audioContext.value = ctx
      analyser.value = ctx.createAnalyser()
      analyser.value.fftSize = 256 // 降低 FFT 大小以减少内存使用
      audioSource.value = ctx.createMediaElementSource(audioPlayer.value)
      audioSource.value.connect(analyser.value)
      analyser.value.connect(ctx.destination)
      audioInitialized.value = true
      
      return true
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
      ElMessage.error(t('workDetail.error.audioInit'))
      return false
    }
  }
  return true
}

// 修改播放/暂停处理函数
const handlePlayPause = async () => {
  if (!audioPlayer.value) return
  
  try {
    // 确保 AudioContext 已初始化
    const initialized = await initAudioContext()
    if (!initialized) return
    
    if (isPlaying.value) {
      audioPlayer.value.pause()
      isPlaying.value = false
      isVisualizing.value = false
      if (audioContext.value?.state === 'running') {
        await audioContext.value.suspend()
      }
    } else {
      if (audioContext.value?.state === 'suspended') {
        await audioContext.value.resume()
      }
      await audioPlayer.value.play()
      isPlaying.value = true
      isVisualizing.value = true
      initVisualizer()
    }
  } catch (error) {
    console.error('Playback failed:', error)
    ElMessage.error(t('workDetail.error.playFailed'))
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

// 添加歌词相关的响应式变量
const isLyricsExpanded = ref(false)
const maxCollapsedHeight = 200 // 折叠时的最大高度（像素）

// 处理歌词展开/折叠
const toggleLyrics = () => {
  isLyricsExpanded.value = !isLyricsExpanded.value
}

// 更新当前歌词
const updateCurrentLyric = () => {
  if (!work.value?.lyrics || !audioPlayer.value) return
  
  const currentTimeInSeconds = audioPlayer.value.currentTime
  const lyrics = work.value.lyrics.split('\n')
  const currentIndex = Math.floor((currentTimeInSeconds / duration.value) * lyrics.length)
  currentLyric.value = lyrics[currentIndex] || ''
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
      const workObj = AV.Object.createWithoutData('Work', work.value.id)
      
      if (data.data.status === 'SUCCESS') {
        // 更新作品状态为已完成
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
        
        // 保存更新
        await workObj.save()
        
        // 更新本地数据
        work.value.status = 'completed'
        work.value.audioUrl = workObj.get('audioUrl')
        work.value.progress = 100
        
        // 清除定时器
        if (checkInterval.value) {
          clearInterval(checkInterval.value)
          checkInterval.value = null
        }
        
        ElMessage.success('音乐生成成功！')
      } else if (data.data.status === 'FAILED') {
        // 更新作品状态为失败
        workObj.set('status', 'failed')
        workObj.set('error', data.data.fail_reason || '音乐生成失败')
        workObj.set('progress', 0)
        
        // 保存更新
        await workObj.save()
        
        // 更新本地数据
        work.value.status = 'failed'
        work.value.error = data.data.fail_reason || '音乐生成失败'
        work.value.progress = 0
        
        // 清除定时器
        if (checkInterval.value) {
          clearInterval(checkInterval.value)
          checkInterval.value = null
        }
        
        ElMessage.error('音乐生成失败：' + (data.data.fail_reason || '未知错误'))
      } else if (data.data.status === 'IN_PROGRESS') {
        // 更新进度
        const progress = parseInt(data.data.progress) || 0
        workObj.set('progress', progress)
        workObj.set('lastCheckTime', new Date())
        workObj.set('startTime', data.data.start_time)
        
        // 保存更新
        await workObj.save()
        
        // 更新本地数据
        work.value.progress = progress
      }
    }
  } catch (error) {
    console.error('Check generation status failed:', error)
    // 增加重试次数
    const workObj = AV.Object.createWithoutData('Work', work.value.id)
    const retryCount = workObj.get('retryCount') || 0
    workObj.set('retryCount', retryCount + 1)
    
    // 如果重试次数超过限制，标记为失败
    if (retryCount >= 5) {
      workObj.set('status', 'failed')
      workObj.set('error', '检查任务状态失败次数过多')
      
      // 保存更新
      await workObj.save()
      
      // 更新本地数据
      work.value.status = 'failed'
      work.value.error = '检查任务状态失败次数过多'
      
      // 清除定时器
      if (checkInterval.value) {
        clearInterval(checkInterval.value)
        checkInterval.value = null
      }
      
      ElMessage.error('音乐生成失败：检查任务状态失败次数过多')
    } else {
      await workObj.save()
    }
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
      throw new Error(t('workDetail.errors.notFound'))
    }
    
    // 获取播放次数
    const playQuery = new AV.Query('PlayRecord')
    playQuery.equalTo('work', result)
    const playCount = await playQuery.count()
    
    // 获取用户头像
    let avatarUrl = '/default-avatar.png'
    const userAvatar = result.get('user')?.get('avatar')
    if (userAvatar) {
      avatarUrl = userAvatar instanceof AV.File ? userAvatar.url() : userAvatar
    }
    
    work.value = {
      id: result.id,
      title: result.get('title') || t('workDetail.untitledWork'),
      description: result.get('description') || '',
      imageUrl: result.get('imageUrl') || result.get('imageFile')?.url() || '',
      audioUrl: result.get('audioUrl') || result.get('musicFile')?.url() || '',
      style: result.get('style') || '',
      languages: result.get('languages') || [],
      relevance: result.get('relevance') || 'medium',
      imageAnalysis: result.get('imageAnalysis') || '',
      plays: playCount,
      lyrics: result.get('lyrics') || '',
      status: result.get('status') || 'completed',
      progress: result.get('progress') || 0,
      taskId: result.get('taskId'),
      error: result.get('error'),
      createdAt: result.createdAt,
      completedTime: result.get('completedTime'),
      user: {
        id: result.get('user')?.id,
        username: result.get('user')?.get('username') || t('workDetail.anonymousUser'),
        avatar: avatarUrl
      }
    }
    
    // 如果作品状态是生成中，开始定时检查状态
    if (work.value.status === 'generating' && work.value.taskId) {
      // 立即检查一次状态
      await checkGenerationStatus()
      
      // 如果状态仍然是生成中，则启动定时器
      if (work.value.status === 'generating') {
        checkInterval.value = setInterval(checkGenerationStatus, 10000)
      }
    }

    // 获取推荐作品
    await fetchRecommendedWorks()
  } catch (err) {
    console.error('Error fetching work:', err)
    error.value = err.message || t('workDetail.errors.loadFailed')
    ElMessage.error(error.value)
    router.push({ name: `${locale.value}-Community` })
  } finally {
    loading.value = false
  }
}

// 监听路由参数变化
watch(() => route.params.id, async (newId) => {
  if (newId) {
    await fetchWork()
    // 如果是自动播放导航过来的，自动开始播放
    if (autoplayEnabled.value) {
      // 等待 DOM 更新完成
      await nextTick()
      // 确保音频元素已加载
      if (audioPlayer.value) {
        handlePlayPause()
      }
    }
  }
}, { immediate: true })

// 组件挂载时获取数据
onMounted(fetchWork)

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
const handleAudioEnd = async () => {
  isPlaying.value = false
  isVisualizing.value = false
  audioProgress.value = 0
  currentLyricIndex.value = 0
  
  // 如果启用了自动播放，播放下一个推荐作品
  if (autoplayEnabled.value) {
    await playNextRecommendation()
  }
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

// 添加请求限制和重试逻辑
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1秒延迟

const updateWorkWithRetry = async (work, updates, retryCount = 0) => {
  try {
    if (retryCount >= MAX_RETRIES) {
      throw new Error('Maximum retry attempts reached')
    }
    
    await work.save(updates)
  } catch (error) {
    if (error.code === 429) { // Too Many Requests
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
      return updateWorkWithRetry(work, updates, retryCount + 1)
    }
    
    console.error('Failed to update work:', error)
    ElMessage.error(t('workDetail.error.updateFailed'))
    throw error
  }
}

// 修改现有的更新逻辑
const handleUpdate = async (updates) => {
  if (!work.value) return
  
  try {
    loading.value = true
    await updateWorkWithRetry(work.value, updates)
    ElMessage.success(t('workDetail.success.updated'))
  } catch (error) {
    // 错误已在 updateWorkWithRetry 中处理
  } finally {
    loading.value = false
  }
}

// 更新歌词显示
const updateLyrics = () => {
  if (!work.value?.lyrics) return
  const lines = work.value.lyrics.split('\n')
  if (lines.length > 0) {
    currentLyricIndex.value = Math.min(currentLyricIndex.value, lines.length - 1)
    currentLyric.value = lines[currentLyricIndex.value]
  }
}

// 添加推荐作品相关的响应式变量
const recommendedWorks = ref([])
const currentRecommendationIndex = ref(0)
const loadingRecommendations = ref(false)
const autoplayEnabled = ref(true)

// 添加瀑布流相关的响应式变量
const recommendedWorksPage = ref(1)
const recommendedWorksPageSize = ref(6)
const hasMoreRecommendations = ref(true)
const loadingMoreRecommendations = ref(false)
const recommendationsObserver = ref(null)

// 修改获取推荐作品的函数
const fetchRecommendedWorks = async (loadMore = false) => {
  try {
    if (!loadMore) {
      loadingRecommendations.value = true
    } else {
      loadingMoreRecommendations.value = true
    }

    // 创建主查询
    const query = new AV.Query('Work')
    query.equalTo('status', 'completed')
    query.notEqualTo('objectId', work.value?.id)

    // 如果当前作品有风格标签，优先推荐相同风格的作品
    if (work.value?.style) {
      query.equalTo('style', work.value.style)
    }

    // 排除已经加载的作品
    if (recommendedWorks.value.length > 0) {
      query.notContainedIn('objectId', recommendedWorks.value.map(w => w.id))
    }

    // 设置分页
    query.skip((recommendedWorksPage.value - 1) * recommendedWorksPageSize.value)
    query.limit(recommendedWorksPageSize.value)
    
    // 随机排序，每次获取不同的推荐
    query.addDescending('createdAt')
    query.addAscending('updatedAt')

    // 包含必要的关联数据
    query.include('user')

    const results = await query.find()
    
    // 如果相同风格的作品不足，补充其他风格的作品
    if (results.length < recommendedWorksPageSize.value && work.value?.style) {
      const remainingCount = recommendedWorksPageSize.value - results.length
      const otherStylesQuery = new AV.Query('Work')
      otherStylesQuery.equalTo('status', 'completed')
      otherStylesQuery.notEqualTo('objectId', work.value.id)
      otherStylesQuery.notEqualTo('style', work.value.style)
      otherStylesQuery.notContainedIn('objectId', [...recommendedWorks.value.map(w => w.id), ...results.map(r => r.id)])
      otherStylesQuery.limit(remainingCount)
      otherStylesQuery.include('user')
      otherStylesQuery.addDescending('createdAt')
      
      const additionalResults = await otherStylesQuery.find()
      results.push(...additionalResults)
    }

    // 处理结果
    const newWorks = results.map(work => ({
      id: work.id,
      title: work.get('title'),
      description: work.get('description'),
      imageUrl: work.get('imageUrl'),
      audioUrl: work.get('audioUrl'),
      style: work.get('style'),
      createdAt: work.createdAt,
      user: {
        id: work.get('user')?.id,
        username: work.get('user')?.get('username'),
        avatar: work.get('user')?.get('avatar')?.url() || '/default-avatar.png'
      }
    }))

    if (loadMore) {
      recommendedWorks.value = [...recommendedWorks.value, ...newWorks]
    } else {
      recommendedWorks.value = newWorks
    }

    // 更新页码和是否有更多数据
    hasMoreRecommendations.value = results.length >= recommendedWorksPageSize.value

  } catch (error) {
    console.error('Error fetching recommended works:', error)
  } finally {
    if (!loadMore) {
      loadingRecommendations.value = false
    } else {
      loadingMoreRecommendations.value = false
    }
  }
}

// 添加加载更多推荐作品的函数
const loadMoreRecommendations = async () => {
  if (loadingMoreRecommendations.value || !hasMoreRecommendations.value) return
  
  recommendedWorksPage.value++
  await fetchRecommendedWorks(true)
}

// 设置无限滚动观察器
const setupRecommendationsObserver = () => {
  if (recommendationsObserver.value) {
    recommendationsObserver.value.disconnect()
  }

  recommendationsObserver.value = new IntersectionObserver(
    async ([entry]) => {
      if (entry.isIntersecting && !loadingMoreRecommendations.value && hasMoreRecommendations.value) {
        await loadMoreRecommendations()
      }
    },
    {
      rootMargin: '100px'
    }
  )

  const target = document.querySelector('.recommendations-observer')
  if (target) {
    recommendationsObserver.value.observe(target)
  }
}

// 在组件卸载时清理观察器
onUnmounted(() => {
  if (recommendationsObserver.value) {
    recommendationsObserver.value.disconnect()
  }
})

// 在获取到推荐作品后设置观察器
watch(() => recommendedWorks.value, () => {
  nextTick(() => {
    setupRecommendationsObserver()
  })
})

// 切换自动播放
const toggleAutoplay = () => {
  autoplayEnabled.value = !autoplayEnabled.value
}

// 添加播放下一首推荐作品的函数
const playNextRecommendation = async () => {
  if (!recommendedWorks.value.length || currentRecommendationIndex.value >= recommendedWorks.value.length) {
    currentRecommendationIndex.value = 0
  }
  
  const nextWork = recommendedWorks.value[currentRecommendationIndex.value]
  if (nextWork) {
    // 更新索引为下一首
    currentRecommendationIndex.value += 1
    
    // 导航到下一首作品
    await router.push({
      name: `${locale.value}-WorkDetail`,
      params: { id: nextWork.id }
    })
  }
}

// 修改推荐作品卡片的点击处理
const handleRecommendationClick = async (work) => {
  try {
    // 导航到作品详情页
    await router.push({ 
      name: `${locale.value}-WorkDetail`,
      params: { id: work.id }
    })
  } catch (error) {
    console.error('Error navigating to work:', error)
    ElMessage.error(t('workDetail.error.navigationFailed'))
  }
}

// 添加播放推荐作品的处理函数
const handlePlay = async (work) => {
  try {
    // 导航到作品详情页
    await router.push({ 
      name: `${locale.value}-WorkDetail`,
      params: { id: work.id }
    })
  } catch (error) {
    console.error('Error playing work:', error)
    ElMessage.error(t('workDetail.error.playFailed'))
  }
}

// 添加音频播放事件处理函数
const handleAudioPlay = () => {
  isPlaying.value = true
  isVisualizing.value = true
  // 确保音频上下文已初始化
  if (!audioContext.value) {
    initAudioContext()
  }
  initVisualizer()
}

// 添加内存优化相关的变量
const CLEANUP_INTERVAL = 60000 // 60秒清理一次
const MAX_RECOMMENDED_WORKS = 30 // 最大推荐作品数量
const cleanupTimer = ref(null)

// 添加清理函数
const cleanup = () => {
  // 清理超出限制的推荐作品
  if (recommendedWorks.value.length > MAX_RECOMMENDED_WORKS) {
    recommendedWorks.value = recommendedWorks.value.slice(-MAX_RECOMMENDED_WORKS)
  }
  
  // 清理不再需要的音频资源
  if (audioContext.value && !isPlaying.value) {
    audioContext.value.suspend()
  }
  
  // 清理图片缓存
  if (work.value?.imageUrl) {
    URL.revokeObjectURL(work.value.imageUrl)
  }
}

// 修改组件卸载时的清理
onUnmounted(() => {
  if (recommendationsObserver.value) {
    recommendationsObserver.value.disconnect()
  }
  if (cleanupTimer.value) {
    clearInterval(cleanupTimer.value)
  }
  if (checkInterval.value) {
    clearInterval(checkInterval.value)
  }
  if (audioContext.value) {
    audioContext.value.close()
  }
  cleanup()
  document.documentElement.style.removeProperty('--image-url')
})

// 组件挂载时启动清理定时器
onMounted(() => {
  cleanupTimer.value = setInterval(cleanup, CLEANUP_INTERVAL)
})
</script>

<template>
  <div class="work-detail">
    <SeoMeta
      :key="locale"
      :title="pageTitle"
      :description="pageDescription"
      :keywords="pageKeywords"
      :url="pageUrl"
    />
    <TheNavbar />
    <MusicNotes :is-playing="isPlaying" :is-visualizing="isVisualizing" />
    
    <div class="container">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="work-content">
        <div class="work-main glass-card">
          <div class="media-section">
            <div class="skeleton-image"></div>
            <div class="skeleton-player"></div>
          </div>
          <div class="work-info">
            <div class="skeleton-title"></div>
            <div class="skeleton-author"></div>
            <div class="skeleton-meta"></div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="work-content">
        <div class="work-main glass-card">
          <!-- 主要内容区域 -->
          <div class="media-section">
            <div class="image-container">
              <img 
                v-if="work?.imageUrl" 
                :src="work.imageUrl" 
                :alt="work?.title || t('workDetail.untitledWork')"
                class="work-image"
                @load="handleImageLoad"
              >
              <!-- 只保留生成中或失败时的遮罩 -->
              <div class="image-overlay" v-if="work?.status === 'generating' || work?.status === 'failed'">
                <div v-if="work?.status === 'generating'" class="generating-status">
                  <el-progress 
                    type="circle" 
                    :percentage="work.progress"
                    :stroke-width="6"
                    :show-text="false"
                    class="progress-circle"
                  />
                  <span class="status-text">{{ work.progress }}%</span>
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
                    @click="handlePlayPause"
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
                    <el-dropdown trigger="click" @command="handleSocialShare">
                      <el-button class="action-btn share-btn" title="分享作品">
                        <el-icon><Share /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="twitter">
                            <i class="fab fa-twitter"></i>  Twitter
                          </el-dropdown-item>
                          <el-dropdown-item command="facebook">
                            <i class="fab fa-facebook"></i> Facebook
                          </el-dropdown-item>
                          <el-dropdown-item command="linkedin">
                            <i class="fab fa-linkedin"></i> LinkedIn
                          </el-dropdown-item>
                          <el-dropdown-item command="telegram">
                            <i class="fab fa-telegram"></i> Telegram
                          </el-dropdown-item>
                          <el-dropdown-item command="whatsapp">
                            <i class="fab fa-whatsapp"></i>  WhatsApp
                          </el-dropdown-item>
                          <el-dropdown-item command="pinterest">
                            <i class="fab fa-pinterest"></i> Pinterest
                          </el-dropdown-item>
                          <el-dropdown-item command="reddit">
                            <i class="fab fa-reddit"></i> Reddit
                          </el-dropdown-item>
                          <el-dropdown-item command="tumblr">
                            <i class="fab fa-tumblr"></i> Tumblr
                          </el-dropdown-item>
                          <el-dropdown-item command="weixin">
                            <i class="fab fa-weixin"></i>WeChat
                          </el-dropdown-item>
                          <el-dropdown-item command="qq">
                            <i class="fab fa-qq"></i>  QQ
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
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
                @ended="handleAudioEnd"
                @timeupdate="handleTimeUpdate"
                @loadedmetadata="handleMetadataLoaded"
              ></audio>
            </div>
          </div>

          <!-- 作品信息区域 -->
          <div class="work-info">
            <div class="info-header">
              <h1 class="work-title gradient-text">{{ work?.title || t('workDetail.untitledWork') }}</h1>
              <div class="author-section" 
                v-if="work?.user"
                @click="router.push(`/profile/${work.user?.id}`)"
                role="button"
                tabindex="0"
                @keydown.enter="router.push(`/profile/${work.user?.id}`)"
              >
                <div class="author-info">
                  <div class="author-avatar-wrapper">
                    <img 
                      :src="work.user?.avatar || '/default-avatar.png'" 
                      :alt="work.user?.username || t('workDetail.anonymousUser')"
                      class="author-avatar"
                    />
                    <div class="avatar-border"></div>
                  </div>
                  <div class="author-details">
                    <div class="author-name-wrapper">
                      <span class="author-name">{{ work.user?.username || t('workDetail.anonymousUser') }}</span>
                      <span class="creator-badge">
                        <el-icon><VideoPlay /></el-icon>
                        {{ t('creator') }}
                      </span>
                    </div>
                    <div class="author-meta">
                      <el-icon><Calendar /></el-icon>
                      {{ new Date(work?.createdAt).toLocaleDateString() }}
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
                <div class="lyrics-section" v-if="work?.lyrics">
                  <div class="lyrics-header">
                    <h3>{{ t('workDetail.lyrics.title') }}</h3>
                    <el-button 
                      link
                      @click="toggleLyrics"
                      class="toggle-lyrics-btn"
                    >
                      {{ isLyricsExpanded ? t('workDetail.lyrics.hide') : t('workDetail.lyrics.show') }}
                    </el-button>
                  </div>
                  
                  <div 
                    class="lyrics-content"
                    :class="{ 'expanded': isLyricsExpanded }"
                    :style="{ maxHeight: isLyricsExpanded ? 'none' : `${maxCollapsedHeight}px` }"
                  >
                    <div class="current-lyric" v-if="currentLyric">
                      {{ currentLyric }}
                    </div>
                    <div class="lyrics-text">
                      <p 
                        v-for="(line, index) in work.lyrics.split('\n')"
                        :key="index"
                        :class="{ 'active': line === currentLyric }"
                      >
                        {{ line }}
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    class="lyrics-fade"
                    v-if="!isLyricsExpanded && work.lyrics.split('\n').length > 5"
                    @click="toggleLyrics"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 推荐作品部分 -->
    <div class="recommendations-section" v-if="!loading && recommendedWorks.length > 0">
      <div class="container">
        <div class="section-header">
          <div class="header-left">
            <h2 class="section-title gradient-text">{{ t('workDetail.recommendations.title') }}</h2>
            <p class="section-description">{{ t('workDetail.recommendations.description') }}</p>
          </div>
          <div class="header-right">
            <div class="autoplay-toggle">
              <el-tooltip
                :content="autoplayEnabled ? t('workDetail.autoplay.enabled') : t('workDetail.autoplay.disabled')"
                placement="top"
              >
                <el-switch
                  v-model="autoplayEnabled"
                  :active-icon="VideoPlay"
                  :inactive-icon="VideoPause"
                  @change="toggleAutoplay"
                />
              </el-tooltip>
            </div>
          </div>
        </div>

        <div class="recommendations-grid">
          <div
            v-for="work in recommendedWorks"
            :key="work.id"
            class="recommendation-card"
            @click="handleRecommendationClick(work)"
          >
            <div class="card-media">
              <img
                :src="work.imageUrl"
                :alt="work.title"
                loading="lazy"
                class="work-image"
                :fetchpriority="'low'"
                decoding="async"
              >
              <div 
                class="play-overlay"
                v-show="!loadingRecommendations"
              >
                <div class="play-button">
                  <el-icon><VideoPlay /></el-icon>
                </div>
              </div>
            </div>
            <div class="card-content">
              <h3 class="work-title">{{ work.title }}</h3>
              <div class="work-meta">
                <img
                  :src="work.user.avatar"
                  :alt="work.user.username"
                  class="user-avatar"
                  loading="lazy"
                  :fetchpriority="'low'"
                  decoding="async"
                  width="32"
                  height="32"
                >
                <div class="user-info">
                  <span class="username">{{ work.user.username }}</span>
                  <time :datetime="work.createdAt.toISOString()">
                    {{ new Date(work.createdAt).toLocaleDateString() }}
                  </time>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 优化加载更多指示器 -->
        <div 
          class="recommendations-observer"
          role="status"
          v-show="hasMoreRecommendations"
        >
          <div v-if="loadingMoreRecommendations" class="loading-spinner">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>{{ t('workDetail.recommendations.loadingMore') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div v-else-if="loadingRecommendations" class="loading-recommendations">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 无推荐作品状态 -->
    <div v-else-if="!loading && recommendedWorks.length === 0" class="no-recommendations">
      <p>{{ t('workDetail.recommendations.empty') }}</p>
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

  // 只保留遮罩层样式
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
  background: rgb(19 28 46);
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
      
      .el-dropdown {
        display: flex;
      }
      
      :deep(.el-dropdown-menu) {
        background: rgba(19, 28, 46, 0.95);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0.75rem;
        border-radius: 1rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        max-height: 400px;
        overflow-y: auto;
        
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
        
        .el-dropdown-menu__item {
          color: var(--text-color);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.25rem;
          border-radius: 0.75rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          min-width: 200px;
          
          &::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg,
              var(--primary-color),
              var(--accent-color)
            );
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          i {
            font-size: 1.25rem;
            width: 1.5rem;
            text-align: center;
            position: relative;
            z-index: 1;
            transition: all 0.3s ease;
            
            &.fa-twitter { color: #1DA1F2; }
            &.fa-facebook { color: #4267B2; }
            &.fa-linkedin { color: #0077B5; }
            &.fa-telegram { color: #0088cc; }
            &.fa-whatsapp { color: #25D366; }
            &.fa-pinterest { color: #E60023; }
            &.fa-reddit { color: #FF4500; }
            &.fa-tumblr { color: #35465C; }
            &.fa-weixin { color: #07C160; }
            &.fa-qq { color: #12B7F5; }
          }
          
          span {
            position: relative;
            z-index: 1;
            transition: all 0.3s ease;
            font-size: 0.9375rem;
          }
          
          &:hover {
            background: transparent;
            transform: translateX(4px);
            
            &::before {
              opacity: 1;
            }
            
            i, span {
              color: white;
            }
            
            i {
              transform: scale(1.1) rotate(12deg);
            }
          }
          
          &:not(:last-child) {
            margin-bottom: 0.25rem;
          }
          
          &:active {
            transform: translateX(2px);
          }
        }
      }
      
      .action-btn {
        width: 48px;
        height: 48px;
        border: none;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(8px);
        
        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg,
            var(--primary-color),
            var(--accent-color)
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        &::after {
          content: '';
          position: absolute;
          inset: -2px;
          background: inherit;
          filter: blur(8px);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }
        
        .el-icon {
          font-size: 1.5rem;
          color: var(--text-color-light);
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }
        
        &:hover {
          transform: translateY(-4px);
          
          &::before {
            opacity: 1;
          }
          
          &::after {
            opacity: 0.6;
          }
          
          .el-icon {
            color: white;
            transform: scale(1.1);
          }
        }
        
        &:active {
          transform: translateY(-2px);
        }
        
        &.share-btn {
          .el-icon {
            transform-origin: center;
          }
          
          &:hover .el-icon {
            animation: shareRotate 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }
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
      background: rgb(19 28 46);
      border-radius: 1.5rem;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      
      &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(var(--primary-color-rgb), 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        transform: translateY(-4px);
      }
      
      .author-info {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        
        .author-avatar-wrapper {
          position: relative;
          width: 64px;
          height: 64px;
          
          .author-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid transparent;
            background: linear-gradient(135deg,
              var(--primary-color),
              var(--accent-color)
            ) border-box;
            position: relative;
            z-index: 1;
          }
          
          .avatar-border {
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background: linear-gradient(135deg,
              var(--primary-color),
              var(--accent-color)
            );
            opacity: 0.5;
            filter: blur(8px);
            transition: all 0.3s ease;
          }
          
          &:hover .avatar-border {
            opacity: 0.8;
            filter: blur(12px);
          }
        }
        
        .author-details {
          flex: 1;
          
          .author-name-wrapper {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
            
            .author-name {
              font-size: 1.25rem;
              font-weight: 600;
              color: var(--text-color);
              background: linear-gradient(135deg,
                var(--primary-color),
                var(--accent-color)
              );
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }
            
            .creator-badge {
              display: inline-flex;
              align-items: center;
              gap: 0.375rem;
              padding: 0.5rem 1rem;
              font-size: 0.875rem;
              font-weight: 500;
              color: white;
              background: linear-gradient(135deg,
                var(--primary-color),
                var(--accent-color)
              );
              border-radius: 0.75rem;
              border: none;
              transition: all 0.3s ease;
              
              .el-icon {
                font-size: 0.875rem;
              }
              
              &:hover {
                transform: translateY(-1px);
                filter: brightness(1.1);
              }
            }
          }
          
          .author-meta {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-color-light);
            
            .el-icon {
              font-size: 1rem;
              color: var(--primary-color);
            }
          }
        }
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
        background: rgb(19 28 46);
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
  background: rgb(19 28 46);
  border-radius: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(var(--primary-color-rgb), 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
  }
  
  .author-info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    
    .author-avatar-wrapper {
      position: relative;
      width: 64px;
      height: 64px;
      
      .author-avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid transparent;
        background: linear-gradient(135deg,
          var(--primary-color),
          var(--accent-color)
        ) border-box;
        position: relative;
        z-index: 1;
      }
      
      .avatar-border {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        background: linear-gradient(135deg,
          var(--primary-color),
          var(--accent-color)
        );
        opacity: 0.5;
        filter: blur(8px);
        transition: all 0.3s ease;
      }
      
      &:hover .avatar-border {
        opacity: 0.8;
        filter: blur(12px);
      }
    }
    
    .author-details {
      flex: 1;
      
      .author-name-wrapper {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
        
        .author-name {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-color);
          background: linear-gradient(135deg,
            var(--primary-color),
            var(--accent-color)
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .creator-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
          background: linear-gradient(135deg,
            var(--primary-color),
            var(--accent-color)
          );
          border-radius: 0.75rem;
          border: none;
          transition: all 0.3s ease;
          
          .el-icon {
            font-size: 0.875rem;
          }
          
          &:hover {
            transform: translateY(-1px);
            filter: brightness(1.1);
          }
        }
      }
      
      .author-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-color-light);
        
        .el-icon {
          font-size: 1rem;
          color: var(--primary-color);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .author-section {
    padding: 1rem;
    margin-top: 1rem;
    
    .author-info {
      gap: 0.75rem;
      
      .author-avatar-wrapper {
        width: 48px;
        height: 48px;
        
        .avatar-border {
          inset: -2px;
        }
      }
      
      .author-details {
        .author-name-wrapper {
          flex-direction: row;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
          
          .author-name {
            font-size: 1rem;
            line-height: 1.2;
          }
          
          .creator-badge {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            
            .el-icon {
              font-size: 0.75rem;
            }
          }
        }
        
        .author-meta {
          font-size: 0.75rem;
          
          .el-icon {
            font-size: 0.875rem;
          }
        }
      }
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

.lyrics-section {
  position: relative;
  margin: 2rem 0;
  background: var(--card-background);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
}

.lyrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.lyrics-content {
  position: relative;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.current-lyric {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: rgba(var(--primary-color-rgb), 0.1);
  border-radius: 0.75rem;
  text-align: center;
  backdrop-filter: blur(8px);
  box-shadow: inset 0 2px 4px 0 rgba(255, 255, 255, 0.1);
}

.lyrics-text {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text-color);
  
  p {
    margin: 0.75rem 0;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &.active {
      background: rgba(var(--primary-color-rgb), 0.1);
      color: var(--primary-color);
      transform: scale(1.02) translateX(8px);
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    &:hover:not(.active) {
      background: rgba(var(--primary-color-rgb), 0.05);
      transform: translateX(4px);
    }
  }
}

.lyrics-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--card-background) 90%
  );
  pointer-events: none;
  cursor: pointer;
  opacity: 0.9;
  transition: opacity 0.3s ease;
  
  &:hover {
    opacity: 0.7;
  }
}

.toggle-lyrics-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.1);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(var(--primary-color-rgb), 0.15);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .lyrics-section {
    margin: 1rem 0;
    padding: 1rem;
  }
  
  .current-lyric {
    font-size: 1.1rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .lyrics-text {
    font-size: 0.9rem;
    line-height: 1.6;
    
    p {
      margin: 0.5rem 0;
      padding: 0.5rem;
      
      &.active {
        transform: scale(1.01) translateX(4px);
      }
    }
  }
  
  .toggle-lyrics-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
}

.recommendations-section {
  padding: 4rem 0;
  background: linear-gradient(to bottom, transparent, rgba(var(--primary-color-rgb), 0.05));
  border-top: 1px solid rgba(var(--primary-color-rgb), 0.1);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 3rem;
  
  .header-left {
    .section-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    
    .section-description {
      color: var(--text-secondary);
      font-size: 1.1rem;
      max-width: 600px;
    }
  }
  
  .header-right {
    .autoplay-toggle {
      .el-switch {
        --el-switch-on-color: var(--primary-color);
      }
    }
  }
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.recommendation-card {
  background: rgb(19 28 46);
  border-radius: 1rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    transform: translateY(-4px) translateZ(0);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    
    .play-overlay {
      opacity: 1;
    }
    
    .work-image {
      transform: scale(1.05);
    }
  }
}

.card-media {
  position: relative;
  padding-top: 100%;
  overflow: hidden;
  
  .work-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .play-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    
    .play-button {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
      
      .el-icon {
        font-size: 24px;
        color: var(--primary-color);
      }
    }
    
    &:hover .play-button {
      transform: scale(1.1);
    }
  }
}

.card-content {
  padding: 1.5rem;
  
  .work-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.work-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    .username {
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    time {
      font-size: 0.75rem;
      color: var(--text-color-light);
    }
  }
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--text-color-light);
  
  .el-icon {
    font-size: 1.25rem;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式布局 */
@media (max-width: 768px) {
  .recommendations-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .card-content {
    padding: 1rem;
  }
}

.loading-recommendations {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.no-recommendations {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .recommendations-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}

// Add skeleton styles
.skeleton-image {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 1.5rem;
}

.skeleton-player {
  height: 120px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  margin-top: 2rem;
}

.skeleton-title {
  height: 48px;
  width: 80%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.skeleton-author {
  height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  margin-bottom: 2rem;
}

.skeleton-meta {
  height: 120px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes shareRotate {
  0% {
    transform: scale(1) rotate(0);
  }
  50% {
    transform: scale(1.2) rotate(180deg);
  }
  100% {
    transform: scale(1.1) rotate(360deg);
  }
}

@keyframes downloadBounce {
  0% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(4px) scale(0.95);
  }
  75% {
    transform: translateY(-2px) scale(1.1);
  }
  100% {
    transform: translateY(0) scale(1.1);
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  
  .autoplay-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.work-card {
  position: relative;
  transition: all 0.3s ease;
  
  &.next-up {
    border: 2px solid var(--primary-color);
    transform: scale(1.02);
    
    .next-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: var(--primary-color);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      z-index: 10;
      
      .el-icon {
        font-size: 1rem;
      }
    }
    
    &:hover {
      transform: scale(1.03);
    }
  }
}

// 添加过渡动画
.recommendations-grid {
  .work-card {
    animation: fadeInUp 0.6s ease-out;
    animation-fill-mode: both;
    
    @for $i from 1 through 10 {
      &:nth-child(#{$i}) {
        animation-delay: #{$i * 0.1}s;
      }
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加音符动画相关样式 */
.player-section.is-playing {
  position: relative;
  z-index: 2;
  
  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg,
      rgba(var(--primary-color-rgb), 0.2),
      rgba(var(--accent-color-rgb), 0.1)
    );
    border-radius: inherit;
    z-index: -1;
    animation: glowPulse 2s infinite;
  }
}

@keyframes glowPulse {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.5;
  }
}

/* 添加音符动画相关样式 */
:deep(.music-notes) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

:deep(.note) {
  position: absolute;
  font-size: 2.5rem;
  color: var(--primary-color);
  text-shadow: 
    0 0 10px rgba(var(--primary-color-rgb), 0.8),
    0 0 20px rgba(var(--primary-color-rgb), 0.4);
  transition: transform 0.3s ease;
  will-change: transform, opacity;
  animation: glow 2s infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 
      0 0 10px rgba(var(--primary-color-rgb), 0.8),
      0 0 20px rgba(var(--primary-color-rgb), 0.4);
  }
  to {
    text-shadow: 
      0 0 20px rgba(var(--primary-color-rgb), 1),
      0 0 30px rgba(var(--primary-color-rgb), 0.6);
  }
}

/* 添加 will-change 提示浏览器优化渲染 */
.recommendation-card {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 优化图片加载时的占位 */
.work-image {
  background-color: rgba(0, 0, 0, 0.1);
  aspect-ratio: 1;
}

/* 使用 transform 替代 top/left 动画 */
.recommendation-card:hover {
  transform: translateY(-4px) translateZ(0);
}

/* 减少阴影复杂度 */
.card-content {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 优化动画性能 */
.recommendations-grid {
  transform: translateZ(0);
  will-change: contents;
}

/* 使用 opacity 和 transform 进行动画 */
.play-overlay {
  opacity: 0;
  transform: translateZ(0);
  transition: opacity 0.3s ease;
}

.recommendation-card:hover .play-overlay {
  opacity: 1;
}
</style> 