<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import TheNavbar from '../components/TheNavbar.vue'
import AV from 'leancloud-storage'
import { useRouter } from 'vue-router'
import { Edit, Upload, Refresh, Star, CaretRight, Loading, Warning, VideoPlay, Menu, Select } from '@element-plus/icons-vue'

const userStore = useUserStore()
const { t } = useI18n()
const loading = ref(false)
const uploadRef = ref(null)
const works = ref([])
const router = useRouter()
const isEditing = ref(false)
const filterStatus = ref('all')
const checkIntervals = ref({})
const newAvatarFile = ref(null)
const avatarPreview = ref(null)
const userPoints = ref(0)
const locale = ref(useI18n().locale)

const form = ref({
  username: userStore.currentUser?.username || '',
  email: userStore.currentUser?.email || '',
  avatar: '',  // We'll handle this with a computed property
  createdAt: userStore.currentUser?.createdAt || new Date(),
  points: userStore.currentUser?.points || 0,
  membershipEndDate: userStore.currentUser?.membershipEndDate || null,
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Add computed property for avatar URL
const avatarUrl = computed(() => {
  const avatar = userStore.currentUser?.avatar
  if (avatar instanceof AV.File) {
    return avatar.url()
  }
  return avatar || '/default-avatar.png'
})

// 作品状态选项
const statusOptions = [
  { value: 'all', label: t('profile.works.filter.all') },
  { value: 'generating', label: t('profile.works.filter.generating') },
  { value: 'completed', label: t('profile.works.filter.completed') },
  { value: 'failed', label: t('profile.works.filter.failed') }
]

// 计算会员剩余时间
const membershipDays = computed(() => {
  if (!form.value.membershipEndDate) return 0
  const endDate = new Date(form.value.membershipEndDate)
  const now = new Date()
  const diffTime = endDate - now
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
})

// 过滤后的作品列表
const filteredWorks = computed(() => {
  if (filterStatus.value === 'all') return works.value
  return works.value.filter(work => work.status === filterStatus.value)
})

// 检查任务状态
const checkTaskStatus = async (taskId, workId) => {
  try {
    const response = await fetch(`https://api.whatai.cc/suno/fetch/${taskId}`, {
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

    // 获取作品记录
    const work = AV.Object.createWithoutData('Work', workId)
    
    // 根据任务状态更新作品状态
    if (data.code === 'success' && data.data) {
      if (data.data.status === 'SUCCESS') {
        // 更新作品状态为已完成
        work.set('status', 'completed')
        if (data.data.data && data.data.data.length > 0) {
          const musicData = data.data.data[0]
          work.set('audioUrl', musicData.audio_url)
          work.set('videoUrl', musicData.video_url || '')
          work.set('modelName', musicData.model_name)
          work.set('metadata', musicData.metadata)
        }
        work.set('progress', 100)
        work.set('completedTime', new Date())
        work.set('finishTime', data.data.finish_time)
        
        // 清除定时器
        if (checkIntervals.value[workId]) {
          clearInterval(checkIntervals.value[workId])
          delete checkIntervals.value[workId]
        }
        
        // 刷新作品列表
        await fetchWorks()
      } else if (data.data.status === 'FAILED') {
        // 更新作品状态为失败
        work.set('status', 'failed')
        work.set('error', data.data.fail_reason || '音乐生成失败')
        work.set('progress', 0)
        
        // 清除定时器
        if (checkIntervals.value[workId]) {
          clearInterval(checkIntervals.value[workId])
          delete checkIntervals.value[workId]
        }
        
        // 刷新作品列表
        await fetchWorks()
      } else if (data.data.status === 'IN_PROGRESS') {
        // 更新进度
        const progress = parseInt(data.data.progress) || 0
        work.set('progress', progress)
        work.set('lastCheckTime', new Date())
        work.set('startTime', data.data.start_time)
      }
    } else {
      throw new Error(data.message || '检查任务状态失败')
    }
    
    // 保存更新
    await work.save()
    
  } catch (error) {
    console.error('Check task status failed:', error)
    // 增加重试次数
    const work = AV.Object.createWithoutData('Work', workId)
    const retryCount = work.get('retryCount') || 0
    work.set('retryCount', retryCount + 1)
    
    // 如果重试次数超过限制，标记为失败
    if (retryCount >= 5) {
      work.set('status', 'failed')
      work.set('error', '检查任务状态失败次数过多')
      
      // 清除定时器
      if (checkIntervals.value[workId]) {
        clearInterval(checkIntervals.value[workId])
        delete checkIntervals.value[workId]
      }
      
      // 刷新作品列表
      await fetchWorks()
    }
    
    await work.save()
  }
}

// 添加重试函数
const retryWithDelay = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0 && error.code === 429) {
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryWithDelay(fn, retries - 1, delay * 2)
    }
    throw error
  }
}

// 获取用户作品
const fetchWorks = async () => {
  try {
    loading.value = true
    const query = new AV.Query('Work')
    query.equalTo('user', AV.User.current())
    query.descending('createdAt')
    query.limit(1000)
    
    const results = await retryWithDelay(() => query.find())
    
    // 只在作品没有 ACL 时设置
    const worksToUpdate = results.filter(work => !work.getACL())
    
    // 分批处理 ACL 更新，每批 10 个
    for (let i = 0; i < worksToUpdate.length; i += 10) {
      const batch = worksToUpdate.slice(i, i + 10)
      const updatePromises = batch.map(async (work) => {
        const acl = new AV.ACL()
        acl.setPublicReadAccess(true)
        acl.setWriteAccess(work.get('user'), true)
        work.setACL(acl)
        return retryWithDelay(() => work.save(null, { fetchWhenSave: true }))
      })
      
      await Promise.all(updatePromises)
      
      // 如果还有更多批次，等待一秒再继续
      if (i + 10 < worksToUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    works.value = results.map(work => ({
      id: work.id,
      title: work.get('title') || t('profile.works.untitledWork'),
      imageUrl: work.get('imageUrl') || '',
      status: work.get('status') || 'draft',
      taskId: work.get('taskId'),
      submitTime: work.get('submitTime'),
      progress: work.get('progress') || 0,
      audioUrl: work.get('audioUrl') || '',
      style: work.get('style') || '',
      platform: work.get('platform') || 'suno',
      error: work.get('error'),
      createdAt: work.createdAt
    }))
    
    // 为正在生成的作品设置状态检查
    works.value.forEach(work => {
      if (work.status === 'generating' && work.taskId && !checkIntervals.value[work.id]) {
        checkIntervals.value[work.id] = setInterval(() => {
          checkTaskStatus(work.taskId, work.id)
        }, 10000)
      }
    })
  } catch (error) {
    console.error('Fetch works failed:', error)
    ElMessage.error(t('profile.works.error.loadFailed'))
  } finally {
    loading.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.logout()
    ElMessage.success(t('profile.user.logout.success'))
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
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
  const file = event.target.files[0]
  if (!file) return
  
  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
    ElMessage.error(t('profile.user.avatar.error.format'))
    return
  }
  
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error(t('profile.user.avatar.error.size'))
    return
  }
  
  try {
    loading.value = true
    newAvatarFile.value = file
    
    // 创建本地预览
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
    
    ElMessage.success('头像已选择，点击保存生效')
  } catch (error) {
    console.error('Avatar upload failed:', error)
    ElMessage.error('头像上传失败')
    newAvatarFile.value = null
  } finally {
    loading.value = false
  }
}

// 更新用户信息
const updateProfile = async () => {
  try {
    loading.value = true
    const currentUser = AV.User.current()
    
    if (!currentUser) {
      throw new Error('用户未登录')
    }

    // 如果有新的头像文件，先创建并保存 AV.File
    if (newAvatarFile.value) {
      const avFile = new AV.File(newAvatarFile.value.name, newAvatarFile.value)
      const savedFile = await avFile.save()
      currentUser.set('avatar', savedFile) // 直接设置 File 对象
    }
    
    // 更新其他信息
    if (form.value.username) {
      currentUser.set('username', form.value.username)
    }
    
    // 如果有新密码
    if (form.value.newPassword) {
      if (!form.value.oldPassword) {
        throw new Error('请输入原密码')
      }
      if (form.value.newPassword !== form.value.confirmPassword) {
        throw new Error('两次输入的新密码不一致')
      }
      await AV.User.updatePassword(form.value.oldPassword, form.value.newPassword)
    }
    
    await currentUser.save()
    ElMessage.success('个人信息更新成功｜Profile updated successfully')
    isEditing.value = false
    
    // 重置表单
    form.value.oldPassword = ''
    form.value.newPassword = ''
    form.value.confirmPassword = ''
    newAvatarFile.value = null
    avatarPreview.value = null
    
  } catch (error) {
    console.error('Profile update failed:', error)
    ElMessage.error(error.message || '更新失败')
  } finally {
    loading.value = false
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
})

// 添加刷新函数
const handleRefresh = async () => {
  try {
    await fetchWorks()
    ElMessage.success('刷新成功｜Refresh success')
  } catch (error) {
    console.error('Refresh failed:', error)
    ElMessage.error('刷新失败｜Refresh failed')
  }
}

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
    console.error('Fetch points failed:', error)
  }
}

onMounted(async () => {
  fetchWorks()
  fetchUserPoints()
})
</script>

<template>
  <div class="profile">
    <TheNavbar />
    
    <div class="profile-container">
      <!-- 左侧个人信息卡片 -->
      <div class="user-card glass-card">
        <div class="card-header">
          <h2 class="gradient-text">{{ t('profile.title') }}</h2>
          <div class="header-actions">
            <el-button 
              v-if="!isEditing"
              type="primary" 
              class="edit-btn glow-btn"
              @click="isEditing = true"
            >
              <el-icon><Edit /></el-icon>
              edit
            </el-button>
            <template v-else>
              <el-button @click="cancelEdit">cancel</el-button>
              <el-button 
                type="primary"
                @click="updateProfile"
                :loading="loading"
                class="glow-btn"
              >
                save
              </el-button>
            </template>
          </div>
        </div>
        
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <el-avatar 
              :size="120" 
              :src="avatarPreview || avatarUrl"
              @click="triggerAvatarUpload"
              class="avatar"
              :alt="t('profile.user.avatar.upload')"
            >
              <div class="upload-overlay">
                <el-icon><Upload /></el-icon>
                <span>{{ t('profile.user.avatar.upload') }}</span>
              </div>
            </el-avatar>
            <div class="user-status">
              <h3 class="username gradient-text">{{ form.username }}</h3>
              <p class="join-date">{{ new Date(form.createdAt).toLocaleDateString() }}</p>
            </div>
          </div>
        </div>

        <div class="user-stats glass-effect">
          <div class="stat-item">
            <span class="stat-value gradient-text">{{ works.length }}</span>
            <span class="stat-label">{{ t('profile.user.works') }}</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-value gradient-text">{{ membershipDays }}</span>
            <span class="stat-label">{{ t('profile.user.membership.daysLeft', { days: membershipDays }) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value gradient-text">{{ userPoints }}</span>
            <span class="stat-label">{{ t('profile.user.points') }}</span>
          </div>
        </div>

        <el-button 
          type="danger" 
          class="logout-btn glass-effect"
          @click="handleLogout"
        >
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
                <h2 class="gradient-text">{{ t('profile.works.title') }}</h2>
                <div class="stats-badges">
                  <div class="stat-badge">
                    <span class="badge-value">{{ works.length }}</span>
                    <span class="badge-label">{{ t('profile.works.total') }}</span>
                  </div>
                  <div class="stat-badge">
                    <span class="badge-value">{{ works.filter(w => w.status === 'completed').length }}</span>
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
                    <div class="tab-count">{{ works.filter(w => option.value === 'all' ? true : w.status === option.value).length }}</div>
                  </button>
                </div>
                <el-button 
                  type="primary"
                  size="default"
                  @click="handleRefresh"
                  :loading="loading"
                  class="refresh-btn"
                >
                  <el-icon><Refresh /></el-icon>
                  {{ t('profile.works.refresh') }}
                </el-button>
              </div>
            </div>
          </div>

          <div class="works-grid" v-if="filteredWorks.length > 0">
            <div 
              v-for="work in filteredWorks" 
              :key="work.id"
              class="work-card glass-effect"
              @click="handleWorkClick(work)"
            >
              <div class="work-image">
                <img :src="work.imageUrl" :alt="work.title">
                <div class="work-overlay">
                  <div class="status-icon">
                    <el-icon v-if="work.status === 'completed'" class="play-icon"><CaretRight /></el-icon>
                    <el-icon v-else-if="work.status === 'generating'" class="rotating"><Loading /></el-icon>
                    <el-icon v-else-if="work.status === 'failed'" class="error-icon"><Warning /></el-icon>
                  </div>
                  <div v-if="work.status === 'generating'" class="progress-bar">
                    <div class="progress-fill" :style="{ width: work.progress + '%' }"></div>
                  </div>
                </div>
              </div>
              
              <div class="work-info">
                <h3 class="work-title">{{ work.title }}</h3>
                <div class="work-meta">
                  <div class="status-info">
                    <el-tag 
                      :type="work.status === 'completed' ? 'success' : 
                             work.status === 'generating' ? 'warning' : 
                             work.status === 'failed' ? 'danger' : 'info'"
                      size="small"
                      class="status-tag"
                    >
                      {{ work.status === 'completed' ? 'Completed|已完成' :
                         work.status === 'generating' ? 'Generating|生成中' :
                         work.status === 'failed' ? 'Error' : 'Draft|草稿' }}
                    </el-tag>
                    <span v-if="work.status === 'generating'" class="progress-text">{{ work.progress }}%</span>
                  </div>
                  <div class="work-stats">
                    <span class="plays" v-if="work.status === 'completed'">
                      <el-icon><VideoPlay /></el-icon>
                      {{ work.plays || 0 }}
                    </span>
                    <span class="date">{{ new Date(work.createdAt).toLocaleDateString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-works">
            <el-empty :description="filterStatus === 'all' ? '暂无作品' : '没有符合条件的作品'">
              <el-button type="primary" class="create-btn glow-btn" @click="router.push('/create')">
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
  padding-top: 64px; // 添加顶部内边距，避免与导航栏重叠
}

.profile-container {
  padding-top: 2rem; // 修改顶部内边距
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

.user-card {
  position: sticky;
  top: 100px;
  height: fit-content;
  padding: 2rem;
}

.card-header {
  margin-bottom: 2rem;
  
  .gradient-text {
    font-size: 1.5rem;
    margin: 0;
  }
}

.avatar-section {
  text-align: center;
  margin-bottom: 2rem;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  
  .avatar {
    border: 4px solid rgba(var(--primary-color-rgb), 0.2);
    box-shadow: 0 0 20px rgba(var(--primary-color-rgb), 0.1);
    transition: transform 0.3s ease;
    cursor: pointer;
    
    &:hover {
      transform: scale(1.05);
      
      .upload-overlay {
        opacity: 1;
      }
    }
  }
}

.upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
  color: white;
  
  .el-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
}

.user-status {
  margin-top: 1rem;
  
  .username {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-color);
  }
  
  .join-date {
    font-size: 0.875rem;
    color: var(--text-color-light);
    margin: 0.5rem 0 0;
  }
}

.user-stats {
  grid-template-columns: repeat(3, 1fr); // 改回三列布局
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  display: grid; // 确保网格布局生效
  gap: 1rem;
  text-align: center; // 居中对齐
  
  .stat-item {
    .stat-value {
      font-size: 1.75rem; // 稍微调小字体以适应三列
      margin-bottom: 0.5rem;
      background-size: 200% auto;
      animation: shine 2s linear infinite;
      display: block; // 确保值独占一行
    }
    
    .stat-label {
      font-weight: 500;
      opacity: 0.8;
      font-size: 0.875rem; // 调整标签字体大小
    }
  }
}

.logout-btn {
  width: 100%;
  margin-top: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--error-color-rgb), 0.2);
  }
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.works-section {
  padding: 2rem;
  border-radius: 1rem;
  background: var(--glass-background);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  margin-bottom: 2rem;
  
  .header-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
}

.title-group {
  display: flex;
  align-items: center;
  gap: 2rem;
  
  .gradient-text {
    font-size: 2rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 50%;
      width: 4px;
      height: 24px;
      background: var(--primary-color);
      transform: translateY(-50%);
      border-radius: 2px;
      box-shadow: 0 0 20px rgba(var(--primary-color-rgb), 0.5);
    }
  }
}

.stats-badges {
  display: flex;
  gap: 1rem;
  
  .stat-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    .badge-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--primary-color);
    }
    
    .badge-label {
      font-size: 0.875rem;
      color: var(--text-color-light);
    }
  }
}

.filter-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.75rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  
  .tab-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    border: none;
    background: transparent;
    color: var(--text-color-light);
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg,
        rgba(var(--primary-color-rgb), 0.1),
        rgba(var(--accent-color-rgb), 0.1)
      );
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    &:hover {
      color: var(--text-color);
      
      &::before {
        opacity: 1;
      }
      
      .tab-count {
        background: rgba(var(--primary-color-rgb), 0.2);
      }
    }
    
    &.active {
      color: var(--primary-color);
      background: rgba(var(--primary-color-rgb), 0.1);
      
      &::before {
        opacity: 1;
      }
      
      .tab-count {
        background: rgba(var(--primary-color-rgb), 0.2);
        color: var(--primary-color);
      }
    }
    
    .tab-text {
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .tab-count {
      background: rgba(255, 255, 255, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      transition: all 0.3s ease;
    }
  }
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  background: linear-gradient(135deg,
    rgba(var(--primary-color-rgb), 0.2),
    rgba(var(--accent-color-rgb), 0.2)
  );
  color: var(--primary-color);
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg,
      rgba(var(--primary-color-rgb), 0.3),
      rgba(var(--accent-color-rgb), 0.3)
    );
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  .el-icon {
    font-size: 1.125rem;
    transition: transform 0.3s ease;
  }
  
  &:hover .el-icon {
    transform: rotate(180deg);
  }
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.work-card {
  background: var(--glass-background);
  border-radius: 1rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    transform: translateY(-5px);
    border-color: var(--primary-color);
    box-shadow: 0 8px 32px rgba(var(--primary-color-rgb), 0.2);
    
    .work-image img {
      transform: scale(1.1);
    }
    
    .work-overlay {
      opacity: 1;
    }
    
    .status-icon {
      transform: scale(1.1);
    }
    
    .work-title {
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }
}

.work-image {
  position: relative;
  height: 200px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
}

.work-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  .status-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    border: 2px solid rgba(255, 255, 255, 0.2);
    margin-bottom: 1rem;
    
    .el-icon {
      font-size: 24px;
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
    
    .rotating {
      animation: rotate 2s linear infinite;
    }
    
    .error-icon {
      color: var(--el-color-danger);
    }
  }
}

.progress-bar {
  width: 80%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  
  .progress-fill {
    height: 100%;
    background: var(--primary-color);
    transition: width 0.3s ease;
  }
}

.work-info {
  padding: 1.25rem;
}

.work-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  transition: color 0.3s ease;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.work-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  .status-tag {
    border: none;
    padding: 0.25rem 0.75rem;
  }
  
  .progress-text {
    font-size: 0.875rem;
    color: var(--el-color-warning);
  }
}

.work-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .plays {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--text-color-light);
    font-size: 0.875rem;
    
    .el-icon {
      color: var(--primary-color);
    }
  }
  
  .date {
    font-size: 0.75rem;
    color: var(--text-color-light);
    opacity: 0.8;
  }
}

.empty-works {
  padding: 4rem 0;
  text-align: center;
  
  .create-btn {
    margin-top: 1.5rem;
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

@media (max-width: 1024px) {
  .profile-container {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .profile-container {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
  
  .user-card {
    position: static;
    margin-bottom: 2rem;
  }
  
  .user-stats {
    grid-template-columns: repeat(3, 1fr); // 保持三列布局
    padding: 1rem;
    
    .stat-item {
      .stat-value {
        font-size: 1.5rem; // 在移动端进一步减小字体大小
      }
    }
  }
  
  .works-section {
    padding: 1rem;
  }
  
  .section-header {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .gradient-text {
      font-size: 1.75rem;
      
      &::before {
        height: 20px;
      }
    }
  }
  
  .filter-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .filter-tabs {
    flex-wrap: wrap;
    gap: 0.5rem;
    
    .tab-button {
      flex: 1;
      min-width: calc(50% - 0.25rem);
      padding: 0.625rem 1rem;
      justify-content: center;
    }
  }
  
  .refresh-btn {
    width: 100%;
    justify-content: center;
  }
  
  .title-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    
    .gradient-text {
      font-size: 1.75rem;
      
      &::before {
        height: 20px;
      }
    }
  }
  
  .stats-badges {
    width: 100%;
    justify-content: space-between;
  }
  
  .works-grid {
    grid-template-columns: 1fr;
  }
  
  .work-card {
    max-width: 100%;
  }
}
</style> 