<script setup>
import { ref, onMounted, computed, onUnmounted, watch, nextTick } from 'vue'
import { useUserStore } from '../stores/user'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import TheNavbar from '../components/TheNavbar.vue'
import AV from 'leancloud-storage'
import { useRouter, useRoute } from 'vue-router'
import { Edit, Upload, Refresh, Star, CaretRight, Loading, Warning, VideoPlay, Menu, Select, Check, Close, User, Calendar, Delete } from '@element-plus/icons-vue'
import { handlePaymentSuccess } from '@/services/payment'
import { useHead } from 'unhead'
import { WorkStatus } from '../utils/workStatusChecker'
import { contentModeration } from '../middleware/contentModeration'

const userStore = useUserStore()
const { t, locale } = useI18n()
const loading = ref(false)
const uploadRef = ref(null)
const works = ref([])
const router = useRouter()
const route = useRoute()
const isEditing = ref(false)
const filterStatus = ref('all')
const checkIntervals = ref({})
const newAvatarFile = ref(null)
const avatarPreview = ref(null)
const userPoints = ref(0)
const showPaymentSuccess = ref(false)
const paymentResult = ref(null)
const isEditingUsername = ref(false)
const tempUsername = ref('')
const pollTimer = ref(null)

const form = ref({
  username: userStore.currentUser ? userStore.currentUser.username : '',
  email: userStore.currentUser ? userStore.currentUser.email : '',
  bio: userStore.currentUser ? userStore.currentUser.bio || '' : '',
  gender: userStore.currentUser ? userStore.currentUser.gender || 'notSpecified' : 'notSpecified',
  createdAt: userStore.currentUser ? userStore.currentUser.createdAt : new Date(),
  points: userStore.currentUser ? userStore.currentUser.points || 0 : 0,
  membershipEndDate: userStore.currentUser ? userStore.currentUser.membershipEndDate : null
})

// 添加加载状态管理
const loadingStates = ref({
  profile: false,
  gender: false,
  avatar: false,
  works: false
})

// 添加错误状态管理
const errors = ref({
  profile: null,
  gender: null,
  avatar: null,
  works: null
})

// Add computed property for avatar URL
const avatarUrl = computed(() => {
  const user = userStore.currentUser
  if (!user) return '/src/assets/default-avatar.svg'
  return user.avatar || '/src/assets/default-avatar.svg'
})

const truncatedUsername = computed(() => {
  const username = form.value.username
  if (username.length > 10) {
    return username.slice(0, 10) + '...'
  }
  return username
})

// 作品状态选项
const statusOptions = computed(() => [
  { value: 'all', label: t('profile.works.filter.all') },
  { value: 'generating', label: t('profile.works.status.GENERATING') },
  { value: 'completed', label: t('profile.works.status.COMPLETED') },
  { value: 'failed', label: t('profile.works.status.FAILED') }
])

// 过滤后的作品列表
const filteredWorks = computed(() => {
  if (filterStatus.value === 'all') return works.value
  return works.value.filter(work => work.status.toUpperCase() === filterStatus.value)
})

// 已完成作品数量
const completedWorksCount = computed(() => 
  works.value.filter(w => w.status.toUpperCase() === 'COMPLETED').length
)

// 检查单个任务状态
const checkTaskStatus = async (taskId, workId) => {
  try {
    console.log(`Checking status for work ${workId} with taskId ${taskId}`)
    
    const apiUrl = `${import.meta.env.VITE_AI_BASE_URL}/suno/fetch/${taskId}`
    console.log('Using API URL:', apiUrl)
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_AI_TOKEN}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`API request failed for work ${workId}: ${response.status} ${response.statusText}`)
      return false
    }

    const data = await response.json()
    console.log(`API response for work ${workId}:`, JSON.stringify(data, null, 2))

    // 获取 LeanCloud 中的作品对象
    const work = AV.Object.createWithoutData('Work', workId)
    await work.fetch()
    
    const currentStatus = work.get('status')?.toLowerCase()
    let newStatus = currentStatus
    let shouldUpdate = false

    // 检查 API 响应中的状态和数据
    if (data.code === 'success' && data.data) {
      const apiStatus = data.data.status?.toUpperCase()
      
      if (apiStatus === 'SUCCESS') {
        // 只有当前状态不是 completed 时才更新
        if (currentStatus !== 'completed') {
          // 如果生成成功且有音频数据
          if (data.data.data && data.data.data.length > 0) {
            const musicData = data.data.data[0]
            newStatus = 'completed'
            shouldUpdate = true
            
            // 更新音频相关数据
            work.set('audioUrl', musicData.audio_url)
            work.set('videoUrl', musicData.video_url || '')
            work.set('modelName', musicData.model_name)
            work.set('metadata', musicData.metadata)
            work.set('progress', 100)
            work.set('completedTime', new Date())
            work.set('finishTime', data.data.finish_time)
            
            // 更新歌词和其他元数据
            if (musicData.metadata) {
              work.set('lyrics', musicData.metadata.prompt || '')
              work.set('duration', musicData.metadata.duration || 0)
            }
            
            console.log(`Work ${workId} completed with audio URL:`, musicData.audio_url)
            
            // 创建完成通知
            const Notification = AV.Object.extend('Notification')
            const notification = new Notification()
            notification.set('user', work.get('user'))
            notification.set('type', 'work_completed')
            notification.set('work', work)
            notification.set('read', false)
            await notification.save()
            
            ElMessage.success(t('profile.works.workCompleted'))
          }
        }
      } else if (apiStatus === 'FAILED') {
        // 只有当前状态不是 failed 时才更新
        if (currentStatus !== 'failed') {
          newStatus = 'failed'
          shouldUpdate = true
          
          work.set('error', data.data.fail_reason || '音乐生成失败')
          work.set('progress', 0)
          
          console.log(`Work ${workId} failed with error:`, data.data.fail_reason)
          
          // 创建失败通知
          const Notification = AV.Object.extend('Notification')
          const notification = new Notification()
          notification.set('user', work.get('user'))
          notification.set('type', 'work_failed')
          notification.set('work', work)
          notification.set('read', false)
          await notification.save()
          
          ElMessage.error(t('profile.works.workFailed'))
        }
      } else if (apiStatus === 'IN_PROGRESS') {
        // 如果正在生成中，更新进度
        const progress = parseInt(data.data.progress) || 0
        work.set('progress', progress)
        work.set('lastCheckTime', new Date())
        work.set('startTime', data.data.start_time)
        await work.save()
        
        // 不需要更新状态，保持 generating
        console.log(`Work ${workId} is still generating, progress: ${progress}%`)
      }
      
      // 只有在状态需要更新时才保存
      if (shouldUpdate && newStatus !== currentStatus) {
        console.log(`Updating work ${workId} status from ${currentStatus} to ${newStatus}`)
        work.set('status', newStatus)
        await work.save()
        
        // 更新本地状态
        const workIndex = works.value.findIndex(w => w.id === workId)
        if (workIndex !== -1) {
          works.value[workIndex] = {
            ...works.value[workIndex],
            status: newStatus,
            audioUrl: work.get('audioUrl'),
            videoUrl: work.get('videoUrl'),
            modelName: work.get('modelName'),
            metadata: work.get('metadata'),
            lyrics: work.get('lyrics'),
            duration: work.get('duration'),
            completedTime: work.get('completedTime'),
            finishTime: work.get('finishTime'),
            error: work.get('error'),
            progress: work.get('progress')
          }
          works.value = [...works.value] // 触发视图更新
        }
      }
    }
    
    // 返回是否完成或失败
    return newStatus === 'completed' || newStatus === 'failed'
  } catch (error) {
    console.error(`Error checking work ${workId} status:`, error)
    return false
  }
}

// 添加检查状态标志
const isChecking = ref(false)

// 刷新作品状态
const handleRefresh = async () => {
  // 如果正在检查中，直接返回
  if (isChecking.value) {
    console.log('Already checking works, skipping...')
    return
  }

  try {
    isChecking.value = true
    loading.value = true
    
    // 重新获取作品列表以确保数据最新
    await fetchWorks()
    
    // 获取需要检查的作品
    const worksToCheck = works.value.filter(work => 
      ['generating', 'pending', 'IN_PROGRESS'].includes(work.status?.toLowerCase())
    )
    
    if (worksToCheck.length > 0) {
      // 只在手动刷新时显示提示
      if (!pollTimer.value) {
        ElMessage.info(t('profile.works.checkingWorks', { count: worksToCheck.length }))
      }
      
      // 并行检查所有作品
      const results = await Promise.all(worksToCheck.map(async (work) => {
        if (!work.taskId) {
          console.log(`Work ${work.id} has no taskId, skipping...`)
          return { success: false, workId: work.id, error: 'No taskId' }
        }
        
        try {
          const success = await checkTaskStatus(work.taskId, work.id)
          return { success, workId: work.id }
        } catch (error) {
          console.error(`Error checking work ${work.id}:`, error)
          return { success: false, workId: work.id, error: error.message }
        }
      }))
      
      // 统计结果
      const successCount = results.filter(r => r.success).length
      const failedCount = results.filter(r => !r.success).length
      
      // 只在手动刷新时显示结果消息
      if (!pollTimer.value) {
        if (successCount > 0) {
          ElMessage.success(t('profile.works.refreshSuccess', { count: successCount }))
        }
        if (failedCount > 0) {
          ElMessage.warning(t('profile.works.refreshPartialFail', { count: failedCount }))
        }
      }
      
      // 如果还有未完成的作品，继续轮询
      const remainingPendingWorks = works.value.filter(work => 
        ['generating', 'pending', 'IN_PROGRESS'].includes(work.status?.toLowerCase())
      )
      
      if (remainingPendingWorks.length > 0) {
        startPolling()
      } else {
        stopPolling()
      }
    } else {
      // 只在手动刷新时显示提示
      if (!pollTimer.value) {
        ElMessage.info(t('profile.works.noWorksToCheck'))
      }
      stopPolling()
    }
  } catch (error) {
    console.error('Error refreshing works:', error)
    // 只在手动刷新时显示错误消息
    if (!pollTimer.value) {
      ElMessage.error(t('profile.works.refreshError'))
    }
  } finally {
    loading.value = false
    isChecking.value = false
  }
}

// 开始轮询未完成的作品
const startPolling = () => {
  // 如果已经在轮询中，不要重复启动
  if (pollTimer.value) {
    console.log('Polling already active, skipping...')
    return
  }
  
  console.log('Starting polling...')
  
  // 设置新的定时器，每10秒检查一次
  pollTimer.value = setInterval(async () => {
    // 获取所有需要检查的作品
    const worksToCheck = works.value.filter(work => 
      ['generating', 'pending', 'IN_PROGRESS'].includes(work.status?.toLowerCase())
    )
    
    if (worksToCheck.length > 0) {
      console.log(`Polling: checking ${worksToCheck.length} works...`)
      await handleRefresh()
    } else {
      console.log('No works need checking, stopping polling')
      stopPolling()
    }
  }, 10000) // 10秒检查一次
}

// 停止轮询
const stopPolling = () => {
  if (pollTimer.value) {
    console.log('Stopping polling')
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
}

// 获取用户作品
const fetchWorks = async () => {
  try {
    loading.value = true
    
    const query = new AV.Query('Work')
    query.equalTo('user', AV.User.current())
    query.include('user')
    query.descending('createdAt')
    query.limit(1000)
    
    const results = await query.find()
    works.value = results.map(work => {
      // 统一状态格式为小写
      let status = (work.get('status') || '').toLowerCase()
      
      // 兼容旧的状态值
      if (status === 'in_progress') status = 'generating'
      if (status === 'success') status = 'completed'
      if (status === 'fail') status = 'failed'
      if (!status || status === '') status = 'generating'
      
      return {
        id: work.id,
        title: work.get('title') || t('profile.works.untitledWork'),
        description: work.get('description') || '',
        imageUrl: work.get('imageUrl') || '',
        audioUrl: work.get('audioUrl') || '',
        videoUrl: work.get('videoUrl') || '',
        modelName: work.get('modelName') || '',
        metadata: work.get('metadata') || null,
        lyrics: work.get('lyrics') || '',
        duration: work.get('duration') || 0,
        status: status,
        progress: work.get('progress') || 0,
        taskId: work.get('taskId') || '',
        error: work.get('error') || '',
        completedTime: work.get('completedTime'),
        finishTime: work.get('finishTime'),
        createdAt: work.createdAt
      }
    })
    
    // 检查是否有需要处理的作品
    const pendingWorks = works.value.filter(work => 
      ['generating', 'pending', 'IN_PROGRESS'].includes(work.status?.toLowerCase())
    )
    
    if (pendingWorks.length > 0) {
      console.log(`Found ${pendingWorks.length} pending works, starting polling...`)
      startPolling()
    }
  } catch (error) {
    console.error('Error fetching works:', error)
    ElMessage.error(t('profile.works.fetchError'))
  } finally {
    loading.value = false
  }
}

// 在组件挂载时获取作品并开始轮询
onMounted(async () => {
  try {
    loading.value = true
    await fetchWorks()
  } catch (error) {
    console.error('Error in onMounted:', error)
  } finally {
    loading.value = false
  }
  
  // 添加页面可见性变化监听
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

// 在组件卸载时清理
onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopPolling()
})

// 处理页面可见性变化
const handleVisibilityChange = async () => {
  if (document.hidden) {
    // 页面隐藏时停止轮询
    console.log('Page hidden, stopping polling')
    stopPolling()
  } else {
    // 页面可见时重新获取作品列表并恢复轮询
    console.log('Page visible, refreshing works and resuming polling')
    
    try {
      // 重新获取作品列表
      await fetchWorks()
      
      // 检查是否有需要处理的作品
      const pendingWorks = works.value.filter(work => 
        ['generating', 'pending', 'IN_PROGRESS'].includes(work.status?.toLowerCase())
      )
      
      console.log(`Found ${pendingWorks.length} pending works:`,
        pendingWorks.map(w => ({
          id: w.id,
          status: w.status,
          taskId: w.taskId
        }))
      )
      
      if (pendingWorks.length > 0) {
        // 如果有需要处理的作品，开始轮询
        startPolling()
      }
    } catch (error) {
      console.error('Error refreshing works on visibility change:', error)
    }
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.logout()
    ElMessage.success(t('profile.user.logout.success'))
    router.push('/')
  } catch (error) {
    ElMessage.error(t('profile.user.logout.failed'))
  }
}

// 触发头像上传
const triggerAvatarUpload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/png,image/jpg'
  input.onchange = handleAvatarUpload
  input.click()
}

// 处理头像上传
const handleAvatarUpload = async (event) => {
  try {
    loadingStates.value.avatar = true
    errors.value.avatar = null
    
    const file = event.target.files[0]
    if (!file) return
    
    // 图片审核
    const imageResult = await contentModeration.moderateImage(file)
    if (!imageResult.isValid) {
      throw new Error(imageResult.error)
    }
    
    // 获取当前用户
    const user = AV.User.current()
    if (!user) {
      throw new Error(t('profile.error.userNotFound'))
    }
    
    // 更新头像
    user.set('avatar', imageResult.file)
    await user.save()
    
    // 更新状态管理
    await userStore.fetchCurrentUser()
    
    ElMessage.success(t('profile.success.avatarUpdated'))
  } catch (error) {
    errors.value.avatar = error.message
    ElMessage.error(error.message)
  } finally {
    loadingStates.value.avatar = false
  }
}

// 性别选项
const genderOptions = computed(() => [
  { value: 'notSpecified', label: t('profile.user.gender.notSpecified') },
  { value: 'male', label: t('profile.user.gender.male') },
  { value: 'female', label: t('profile.user.gender.female') },
  { value: 'other', label: t('profile.user.gender.other') },
  { value: 'nonBinary', label: t('profile.user.gender.nonBinary') },
  { value: 'alien', label: t('profile.user.gender.alien') },
  { value: 'toaster', label: t('profile.user.gender.toaster') },
  { value: 'dinosaur', label: t('profile.user.gender.dinosaur') },
  { value: 'robot', label: t('profile.user.gender.robot') },
  { value: 'ghost', label: t('profile.user.gender.ghost') },
  { value: 'unicorn', label: t('profile.user.gender.unicorn') },
  { value: 'livingMeme', label: t('profile.user.gender.livingMeme') },
  { value: 'catPerson', label: t('profile.user.gender.catPerson') },
  { value: 'dogPerson', label: t('profile.user.gender.dogPerson') },
  { value: 'attackHelicopter', label: t('profile.user.gender.attackHelicopter') },
  { value: 'stillLoading', label: t('profile.user.gender.stillLoading') },
  { value: 'quantumSuperposition', label: t('profile.user.gender.quantumSuperposition') },
  { value: 'coffeeMachine', label: t('profile.user.gender.coffeeMachine') },
  { value: 'walmartBag', label: t('profile.user.gender.walmartBag') }
])

// 验证用户名
const validateUsername = (value) => {
  if (!value || value.length < 2) {
    return { valid: false, message: t('profile.validation.usernameTooShort') }
  }
  if (value.length > 20) {
    return { valid: false, message: t('profile.validation.usernameTooLong') }
  }
  if (!/^[\w\u4e00-\u9fa5]+$/.test(value)) {
    return { valid: false, message: t('profile.validation.usernameInvalid') }
  }
  return { valid: true }
}

// 验证个人简介
const validateBio = (value) => {
  if (value && value.length > 200) {
    return { valid: false, message: t('profile.validation.bioTooLong') }
  }
  if (value && /[<>]/.test(value)) {
    return { valid: false, message: t('profile.validation.bioInvalidChars') }
  }
  return { valid: true }
}

// 更新用户资料
const handleUpdateProfile = async () => {
  try {
    loadingStates.value.profile = true
    errors.value.profile = null
    
    // 内容审核
    const usernameResult = await contentModeration.moderateText(form.value.username, 'username')
    if (!usernameResult.isValid) {
      throw new Error(usernameResult.error)
    }
    
    const bioResult = await contentModeration.moderateText(form.value.bio, 'bio')
    if (!bioResult.isValid) {
      throw new Error(bioResult.error)
    }
    
    // 获取当前用户
    const user = AV.User.current()
    if (!user) {
      throw new Error(t('profile.error.userNotFound'))
    }
    
    // 更新用户资料
    user.set('username', usernameResult.text)
    user.set('bio', bioResult.text)
    user.set('gender', form.value.gender)
    
    await user.save()
    
    // 更新状态管理
    await userStore.fetchCurrentUser()
    
    ElMessage.success(t('profile.success.profileUpdated'))
  } catch (error) {
    errors.value.profile = error.message
    ElMessage.error(error.message)
  } finally {
    loadingStates.value.profile = false
  }
}

// 更新性别
const handleGenderChange = async (value) => {
  try {
    loadingStates.value.gender = true
    errors.value.gender = null
    
    const user = AV.User.current()
    if (!user) {
      throw new Error(t('profile.error.userNotFound'))
    }
    
    user.set('gender', value)
    await user.save()
    
    await userStore.fetchCurrentUser()
  } catch (error) {
    errors.value.gender = error.message
    ElMessage.error(error.message)
  } finally {
    loadingStates.value.gender = false
  }
}

// 取消编辑
const cancelEdit = () => {
  form.value.username = userStore.currentUser?.username || ''
  form.value.oldPassword = ''
  form.value.newPassword = ''
  form.value.confirmPassword = ''
  isEditing.value = false
}

// 在组件卸载时清理所有定时器
onUnmounted(() => {
  Object.values(checkIntervals.value).forEach(interval => {
    clearInterval(interval)
  })
  checkIntervals.value = {}
  
  stopPolling()
  
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// 添加刷新作品状态的功能
const handleWorkClick = (work) => {
  router.push({
    name: `${locale.value}-WorkDetail`,
    params: { id: work.id }
  })
}

// 添加获取用户积分的函数
const fetchUserPoints = async () => {
  try {
    const currentUser = AV.User.current()
    if (currentUser) {
      await currentUser.fetch()
      userPoints.value = currentUser.get('points') || 0
    }
  } catch (error) {
  }
}

const paymentSuccessMessage = computed(() => {
  if (!paymentResult.value) return ''
  
  const { planType, points, plan } = paymentResult.value
  return planType === 'points' 
    ? t('payment.success.points', { points })
    : t('payment.success.subscription', { plan })
})

const hidePaymentSuccess = () => {
  showPaymentSuccess.value = false
}

// 添加用户名编辑相关方法
const startEditUsername = () => {
  tempUsername.value = form.value.username
  isEditingUsername.value = true
}

const saveUsername = async () => {
  try {
    if (!validateUsername(tempUsername.value)) {
      ElMessage.error(t('profile.user.error.invalidUsername'))
      return
    }

    const user = AV.User.current()
    user.set('username', tempUsername.value.trim())
    await user.save()
    
    // 更新表单数据
    form.value.username = tempUsername.value.trim()
    
    // 更新 store 中的用户信息
    await userStore.fetchCurrentUser()
    
    ElMessage.success(t('profile.user.update.success'))
    isEditingUsername.value = false
  } catch (error) {
    ElMessage.error(t('profile.user.update.failed'))
  }
}

const cancelEditUsername = () => {
  isEditingUsername.value = false
  tempUsername.value = form.value.username
}

// 添加监听器以更新表单数据
watch(() => userStore.currentUser, (newUser) => {
  if (newUser) {
    form.value = {
      username: newUser.username,
      email: newUser.email,
      bio: newUser.bio || '',
      gender: newUser.gender || 'notSpecified',
      createdAt: newUser.createdAt,
      points: newUser.points || 0,
      membershipEndDate: newUser.membershipEndDate
    }
  }
}, { immediate: true })

// 在组件挂载时执行
onMounted(async () => {
  try {
    loading.value = true
    await Promise.all([
      fetchWorks(),
      fetchUserPoints()
    ])
    
    // 处理支付成功的情况
    const paymentStatus = route.query.payment_status
    const paymentType = route.query.type
    const amount = route.query.amount
    
    if (paymentStatus === 'success') {
      showPaymentSuccess.value = true
      paymentResult.value = await handlePaymentSuccess(paymentType, amount)
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  } finally {
    loading.value = false
  }
})

// 在 script setup 部分添加新的计算属性
const pageTitle = computed(() => {
  if (!userStore.currentUser) return 'PhotoSong Profile'
  return t('profile.meta.title', { username: userStore.currentUser.username })
})

const pageDescription = computed(() => {
  if (!userStore.currentUser) return ''
  return t('profile.meta.description', { username: userStore.currentUser.username })
})

// 修改 meta 计算属性
const meta = computed(() => {
  if (!userStore.currentUser) return {}
  
  const title = t('profile.meta.title', { username: userStore.currentUser.username })
  const description = t('profile.meta.description', { username: userStore.currentUser.username })
  const imageUrl = userStore.currentUser.avatarUrl || '/src/assets/default-avatar.jpg'
  
  return {
    title,
    meta: [
      {
        name: 'description',
        content: description
      },
      {
        property: 'og:title',
        content: title
      },
      {
        property: 'og:description',
        content: description
      },
      {
        property: 'og:image',
        content: imageUrl
      },
      {
        property: 'og:type',
        content: 'profile'
      },
      {
        property: 'og:site_name',
        content: 'PhotoSong'
      },
      {
        name: 'twitter:card',
        content: 'summary'
      },
      {
        name: 'twitter:title',
        content: title
      },
      {
        name: 'twitter:description',
        content: description
      },
      {
        name: 'twitter:image',
        content: imageUrl
      },
      {
        name: 'keywords',
        content: `${userStore.currentUser.username}, PhotoSong artist, AI music creator, photo to music`
      }
    ],
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Person',
          'name': userStore.currentUser.username,
          'image': imageUrl,
          'url': `https://photosong.com/profile/${userStore.currentUser.id}`,
          'sameAs': userStore.currentUser.socialLinks || [],
          'mainEntityOfPage': {
            '@type': 'ProfilePage',
            '@id': `https://photosong.com/profile/${userStore.currentUser.id}`
          },
          'description': description
        })
      }
    ]
  }
})

// 使用 useHead 设置动态 meta 信息
useHead(meta)

// 添加删除作品的函数
const handleDeleteWork = async (work, event) => {
  // 阻止事件冒泡，避免触发作品点击事件
  event.stopPropagation()
  
  // 只允许删除失败的作品
  if (work.status !== 'failed') {
    ElMessage.warning(t('profile.works.deleteOnlyFailed'))
    return
  }

  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      t('common.confirm.delete'),
      t('common.delete'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    loading.value = true
    
    // 删除作品
    const workObj = AV.Object.createWithoutData('Work', work.id)
    await workObj.destroy()
    
    // 从列表中移除
    works.value = works.value.filter(w => w.id !== work.id)
    
    ElMessage.success(t('common.success.delete'))
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('common.error.delete'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="profile">
    <TheNavbar />
    
    <!-- 支付成功提示 -->
    <div v-if="showPaymentSuccess" class="payment-success-notification">
      <div class="notification-content">
        <div class="success-icon-wrapper">
          <el-icon class="success-icon"><Check /></el-icon>
        </div>
        <div class="notification-text">
          <h3 class="notification-title">{{ t('payment.success.title') }}</h3>
          <p class="notification-message">{{ paymentSuccessMessage }}</p>
        </div>
        <el-button class="close-btn" @click="hidePaymentSuccess">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </div>
    
    <div class="profile-container">
      <!-- 左侧个人信息卡片 -->
      <div class="profile-sidebar glass-card">
        <div class="profile-header">
          <div class="avatar-wrapper">
            <el-avatar
              :size="80"
              :src="avatarPreview || avatarUrl"
              @click="triggerAvatarUpload"
              class="avatar-upload"
              :class="{ 'uploading': loading }"
            >
              <div class="upload-overlay">
                <el-icon><Upload /></el-icon>
                <span>{{ loading ? t('common.uploading') : t('profile.user.avatar.upload') }}</span>
              </div>
            </el-avatar>
            <div v-if="loading" class="upload-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
            </div>
          </div>
          
          <div class="user-info">
            <div class="username-container">
              <template v-if="!isEditingUsername">
                <h3 class="username gradient-text" :title="form.username">{{ truncatedUsername }}</h3>
                <el-button
                  type="primary"
                  link
                  class="edit-username-btn"
                  @click="startEditUsername"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
              </template>
              <div v-else class="username-edit">
                <el-input
                  v-model="tempUsername"
                  size="small"
                  :maxlength="20"
                  class="username-input"
                  @keyup.enter="saveUsername"
                  :placeholder="t('profile.user.username.placeholder')"
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                  <template #suffix>
                    <el-icon class="save-icon hover-effect" @click="saveUsername"><Check /></el-icon>
                    <el-icon class="cancel-icon hover-effect" @click="cancelEditUsername"><Close /></el-icon>
                  </template>
                </el-input>
                <div class="input-hint">{{ t('profile.user.username.hint') }}</div>
              </div>
            </div>
            
            <div class="user-meta">
              <p class="user-id">ID: {{ userStore.currentUser?.id }}</p>
              <p class="user-gender">
                <el-icon><User /></el-icon>
                {{ form.gender === 'notSpecified' ? t('profile.user.gender.notSpecified') : t('profile.user.gender.' + form.gender) }}
              </p>
              <p class="join-date">
                <el-icon><Calendar /></el-icon>
                {{ t('profile.userProfile.about.joinedAt', { date: new Date(form.createdAt).toLocaleDateString() }) }}
              </p>
            </div>
          </div>
        </div>

        <div class="user-stats">
          <div class="stat-item">
            <el-icon><VideoPlay /></el-icon>
            <div class="stat-content">
              <span class="stat-value gradient-text">{{ works.length }}</span>
              <span class="stat-label">{{ t('profile.user.works') }}</span>
            </div>
          </div>
          
          <div class="stat-item">
            <el-icon><Star /></el-icon>
            <div class="stat-content">
              <span class="stat-value gradient-text">{{ userPoints }}</span>
              <span class="stat-label">{{ t('profile.user.points') }}</span>
            </div>
          </div>
        </div>

        <div class="bio-section">
          <div class="section-header">
            <h4 class="bio-label">{{ t('profile.user.bio.label') }}</h4>
            <el-button 
              v-if="!isEditing" 
              type="primary" 
              link 
              class="edit-btn hover-effect"
              @click="isEditing = true"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
          </div>
          
          <template v-if="!isEditing">
            <p class="bio-text">{{ form.bio || t('profile.userProfile.about.noBio') }}</p>
          </template>
          <template v-else>
            <el-input
              v-model="form.bio"
              type="textarea"
              :rows="4"
              :maxlength="200"
              show-word-limit
              :placeholder="t('profile.user.bio.placeholder')"
              class="bio-input custom-textarea"
              resize="none"
            />
            <div class="edit-actions">
              <el-button @click="cancelEdit" class="cancel-button">
                {{ t('create.buttons.cancel') }}
              </el-button>
              <el-button 
                type="primary"
                @click="handleUpdateProfile"
                :loading="loadingStates.profile"
                class="save-button"
              >
                {{ t('profile.userProfile.about.saveBio') }}
              </el-button>
            </div>
          </template>
        </div>

        <div class="gender-section">
          <h4 class="section-label">{{ t('profile.user.gender.label') }}</h4>
          <el-select
            v-model="form.gender"
            class="gender-select custom-select"
            :placeholder="t('profile.user.gender.placeholder')"
            @change="handleGenderChange"
            :loading="loadingStates.gender"
          >
            <el-option
              v-for="option in genderOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
              <span class="gender-option">
                <el-icon v-if="option.value === form.gender"><Check /></el-icon>
                {{ option.label }}
              </span>
            </el-option>
          </el-select>
          <p class="current-gender" v-if="form.gender">
            {{ form.gender === 'notSpecified' ? t('profile.user.gender.notSpecified') : t('profile.user.gender.' + form.gender) }}
          </p>
        </div>

        <el-button 
          type="danger" 
          class="logout-btn"
          @click="handleLogout"
        >
          <el-icon><Close /></el-icon>
          {{ t('profile.user.logout.button') }}
        </el-button>
      </div>

      <!-- 右侧内容区域 -->
      <div class="content-area">
        <!-- 作品展示区域 -->
        <div class="works-section glass-card">
          <div class="section-header">
            <div class="header-content">
              <div class="title-group">
                <h2 class="section-title">{{ t('profile.works.title') }}</h2>
                <div class="stats-badges">
                  <div class="stat-badge">
                    <span class="badge-value gradient-text">{{ works.length }}</span>
                    <span class="badge-label">{{ t('profile.works.total') }}</span>
                  </div>
                  <div class="stat-badge">
                    <span class="badge-value gradient-text">{{ completedWorksCount }}</span>
                    <span class="badge-label">{{ t('profile.works.completed') }}</span>
                  </div>
                </div>
              </div>
              
              <div class="filter-actions">
                <div class="filter-tabs">
                  <button 
                    v-for="option in statusOptions" 
                    :key="option.value"
                    class="tab-button"
                    :class="{ active: filterStatus === option.value }"
                    @click="filterStatus = option.value"
                  >
                    <span class="tab-text">{{ option.label }}</span>
                    <span class="tab-count">
                      {{ option.value === 'all' 
                         ? works.length 
                         : works.filter(w => w.status.toUpperCase() === option.value).length }}
                    </span>
                  </button>
                </div>
                <el-button 
                  type="primary"
                  size="default"
                  @click="handleRefresh"
                  :loading="loadingStates.works"
                  class="refresh-btn"
                >
                  <el-icon><Refresh /></el-icon>
                  {{ t('profile.works.refresh') }}
                </el-button>
              </div>
            </div>
          </div>

          <div v-if="filteredWorks.length > 0" class="works-grid">
            <div 
              v-for="work in filteredWorks" 
              :key="work.id"
              class="work-card"
              @click="handleWorkClick(work)"
            >
              <div class="work-image-wrapper">
                <img 
                  :src="work.imageUrl" 
                  :alt="work.title || t('profile.works.untitledWork')"
                  class="work-image"
                />
                <div class="work-overlay">
                  <div class="work-status" :class="work.status.toLowerCase()">
                    <el-icon v-if="work.status.toUpperCase() === 'COMPLETED'"><Check /></el-icon>
                    <el-icon v-else-if="work.status.toUpperCase() === 'GENERATING'"><Loading /></el-icon>
                    <el-icon v-else><Warning /></el-icon>
                    {{ t(`profile.works.status.${work.status.toUpperCase()}`) }}
                  </div>
                  <!-- 添加删除按钮，只在失败状态显示 -->
                  <el-button
                    v-if="work.status === 'failed'"
                    type="danger"
                    size="small"
                    class="delete-btn"
                    @click="(e) => handleDeleteWork(work, e)"
                  >
                    <el-icon><Delete /></el-icon>
                    {{ t('common.delete') }}
                  </el-button>
                </div>
              </div>
              <div class="work-info">
                <h3 class="work-title">{{ work.title || t('profile.works.untitledWork') }}</h3>
                <div class="work-meta">
                  <span class="work-date">{{ new Date(work.createdAt).toLocaleDateString() }}</span>
                  <span class="work-style">{{ t(`create.style.descriptions.${work.style}`) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-works">
            <el-empty :description="filterStatus === 'all' ? t('profile.works.empty.description') : t('profile.works.empty.filtered')">
              <el-button type="primary" class="create-btn" @click="router.push('/create')">
                {{ t('profile.works.empty.create') }}
              </el-button>
            </el-empty>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile {
  min-height: 100vh;
  background: linear-gradient(135deg, 
    rgba(var(--primary-color-rgb), 0.05),
    rgba(var(--accent-color-rgb), 0.05)
  );
  padding-top: 64px;
  width: 100%;
  overflow-x: hidden;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

.glass-card {
  background: var(--glass-background);
  backdrop-filter: var(--glass-backdrop-filter);
  border: var(--glass-border);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
}

.profile-sidebar {
  padding: 1.5rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 1.5rem;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.avatar-upload {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.avatar-upload:hover {
  transform: scale(1.05);
  border-color: var(--el-color-primary);
}

.avatar-upload.uploading {
  opacity: 0.7;
  pointer-events: none;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-upload:hover .upload-overlay {
  opacity: 1;
}

.upload-overlay .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.upload-overlay span {
  font-size: 12px;
  text-align: center;
}

.upload-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--el-color-primary);
  font-size: 24px;
}

.is-loading {
  animation: spin 1s linear infinite;
}

.user-info {
  width: 100%;
}

.username-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  width: 100%;
  padding: 0 1rem;
}

.username {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.edit-username-btn {
  flex-shrink: 0;
}

.username-edit {
  width: 100%;
  max-width: 250px;
}

.username-input {
  margin: 0;
}

.username-input :deep(.el-input__wrapper) {
  background: var(--el-fill-color-blank);
  border-radius: 12px;
  padding: 4px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.username-input :deep(.el-input__wrapper):hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.username-input :deep(.el-input__wrapper):focus-within {
  box-shadow: 0 0 0 2px var(--el-color-primary-light-3);
}

.save-icon,
.cancel-icon {
  cursor: pointer;
  margin-left: 8px;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
}

.save-icon {
  color: var(--el-color-success);
}

.save-icon:hover {
  background: var(--el-color-success-light-9);
}

.cancel-icon {
  color: var(--el-color-danger);
}

.cancel-icon:hover {
  background: var(--el-color-danger-light-9);
}

.input-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  padding-left: 4px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  
  p {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-color-light);
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    
    .el-icon {
      font-size: 1rem;
      opacity: 0.7;
    }
  }
  
  .user-gender {
    color: var(--primary-color);
  }
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
}

.bio-section {
  margin: 1.5rem 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.edit-btn {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.edit-btn:hover {
  opacity: 1;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.gender-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--glass-background);
  border-radius: 0.75rem;
  border: var(--glass-border);

  .section-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .gender-select {
    width: 100%;
    margin-bottom: 0.5rem;

    :deep(.el-input__wrapper) {
      background: var(--glass-background);
      border: var(--glass-border);
      box-shadow: none;

      &:hover {
        border-color: var(--primary-color);
      }

      &.is-focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 1px var(--primary-color);
      }
    }

    :deep(.el-select-dropdown__item) {
      &.selected {
        background-color: var(--primary-color-light);
        color: var(--primary-color);
      }

      &:hover {
        background-color: var(--primary-color-lighter);
      }
    }
  }

  .gender-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .el-icon {
      color: var(--primary-color);
      font-size: 1rem;
    }
  }

  .current-gender {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: var(--glass-background-darker);
    border-radius: 0.5rem;
    text-align: center;
    transition: all 0.3s ease;

    &:hover {
      background: var(--glass-background-darkest);
      transform: translateY(-1px);
    }
  }
}

// 添加一些动画效果
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.gender-section {
  animation: fadeIn 0.3s ease-out;
}

.current-gender {
  animation: fadeIn 0.3s ease-out;
}

.logout-btn {
  width: 100%;
  margin-top: 1rem;
}

.works-section {
  padding: 1.5rem;
  background: var(--glass-background);
  border-radius: 1rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.stats-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  
  .badge-value {
    font-weight: 600;
    color: var(--primary-color);
  }
  
  .badge-label {
    font-size: 0.875rem;
    color: var(--text-color-light);
  }
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-color-light);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  &:hover {
    background: rgba(var(--primary-color-rgb), 0.1);
  }
  
  &.active {
    background: var(--primary-color);
    color: white;
    
    .tab-count {
      background: rgba(255, 255, 255, 0.2);
    }
  }
  
  .tab-count {
    padding: 0.25rem 0.5rem;
    background: rgba(var(--primary-color-rgb), 0.1);
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
}

.refresh-btn {
  white-space: nowrap;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.work-card {
  background: var(--card-background);
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    
    .work-image {
      transform: scale(1.05);
    }
    
    .work-overlay {
      opacity: 1;
    }
  }
}

.work-image-wrapper {
  position: relative;
  padding-top: 75%;
  overflow: hidden;
}

.work-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.work-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.work-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  font-size: 0.875rem;
  color: white;
  
  &.completed {
    background: rgba(var(--success-color-rgb), 0.9);
  }
  
  &.generating {
    background: rgba(var(--primary-color-rgb), 0.9);
  }
  
  &.failed {
    background: rgba(var(--danger-color-rgb), 0.9);
  }
  
  .rotating {
    animation: rotate 1s linear infinite;
  }
}

.work-info {
  padding: 1rem;
}

.work-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-color-light);
}

.empty-works {
  padding: 3rem 1rem;
  text-align: center;
  
  .create-btn {
    margin-top: 1rem;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

:deep(.el-empty__description) {
  margin-top: 1rem;
  color: var(--text-color-light);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .profile {
    padding-top: var(--navbar-height-mobile, 60px);
  }

  .profile-container {
    padding: 1rem;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin: 0;
    width: 100%;
    max-width: 100%;
  }

  .glass-card {
    border-radius: 12px;
    padding: 1rem;
    width: 100%;
    margin: 0 auto;
  }

  /* 侧边栏样式 */
  .profile-sidebar {
    padding: 1rem;
    margin: 0 auto 1rem;
    width: 100%;
    max-width: 100%;
    border-radius: 12px;

    .avatar-wrapper {
      width: 100px;
      height: 100px;
      margin: 0 auto 1rem;
      display: flex;
      justify-content: center;
      align-items: center;

      .avatar-upload {
        width: 100px;
        height: 100px;
      }

      .upload-overlay {
        font-size: 12px;
      }
    }

    .user-info {
      width: 100%;
      text-align: center;

      .username-container {
        padding: 0;
        justify-content: center;
        
        .username {
          font-size: 1.25rem;
          max-width: 150px;
          text-align: center;
        }
      }

      .username-edit {
        max-width: 100%;
        margin: 0 auto;
        
        .username-input {
          height: 36px;
          font-size: 14px;
        }
      }

      .user-meta {
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.5rem;
        font-size: 12px;
        text-align: center;
      }
    }

    .user-stats {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin: 1rem auto;
      width: 100%;
      max-width: 300px;

      .stat-item {
        padding: 0.75rem;
        text-align: center;
        
        .stat-value {
          font-size: 1.25rem;
        }
        
        .stat-label {
          font-size: 12px;
        }
      }
    }

    .bio-section {
      margin: 1rem auto;
      width: 100%;
      
      .bio-label {
        font-size: 14px;
        text-align: center;
      }
      
      .bio-text {
        font-size: 14px;
        line-height: 1.4;
        text-align: center;
      }
      
      .bio-input {
        min-height: 80px;
        width: 100%;
      }
      
      .edit-actions {
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
        
        .el-button {
          width: 100%;
          height: 36px;
        }
      }
    }

    .gender-section {
      margin: 1rem auto;
      width: 100%;
      
      .section-label {
        font-size: 14px;
        text-align: center;
      }
      
      .gender-select {
        width: 100%;
      }
    }

    .logout-btn {
      width: 100%;
      height: 36px;
      margin: 1rem auto 0;
    }
  }

  /* 内容区域样式 */
  .content-area {
    width: 100%;
    margin: 0 auto;

    .works-section {
      width: 100%;
      margin: 0 auto;

      .section-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
        
        .title-group {
          flex-direction: column;
          align-items: center;
          
          .section-title {
            font-size: 1.25rem;
            text-align: center;
          }
          
          .stats-badges {
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: center;
            
            .stat-badge {
              font-size: 12px;
              padding: 0.25rem 0.5rem;
            }
          }
        }
        
        .filter-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          
          .filter-tabs {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            display: flex;
            justify-content: center;
            
            .tab-button {
              font-size: 12px;
              padding: 0.25rem 0.5rem;
              
              .tab-count {
                font-size: 10px;
              }
            }
          }
          
          .refresh-btn {
            width: 100%;
            height: 36px;
            font-size: 14px;
          }
        }
      }

      .works-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
        width: 100%;
        margin: 0 auto;
        
        .work-card {
          width: 100%;
          margin: 0 auto;

          .work-image-wrapper {
            height: 200px;
          }
          
          .work-info {
            padding: 0.75rem;
            text-align: center;
            
            .work-title {
              font-size: 14px;
            }
            
            .work-meta {
              font-size: 12px;
              justify-content: center;
            }
          }
        }
      }

      .empty-works {
        padding: 2rem 1rem;
        text-align: center;
        
        .create-btn {
          width: 100%;
          max-width: 300px;
          height: 36px;
          margin: 0 auto;
        }
      }
    }
  }
}

.delete-btn {
  margin-top: auto;
  backdrop-filter: blur(4px);
}
</style> 