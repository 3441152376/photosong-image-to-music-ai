<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import AV from 'leancloud-storage'
import { Location, Link, VideoPlay, User } from '@element-plus/icons-vue'
import TheNavbar from '../components/TheNavbar.vue'
import SeoMeta from '../components/SeoMeta.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

// 响应式状态
const loading = ref(false)
const user = ref(null)
const works = ref([])
const activeTab = ref('works')
const sortBy = ref('latest')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const stats = ref({
  works: 0
})

// Avatar 彩蛋
const avatarClickCount = ref(0)
const avatarClickTimeout = ref(null)

// 计算属性
const pageTitle = computed(() => {
  if (!user.value) return ''
  return t('profile.meta.title', { username: user.value.username })
})

const pageDescription = computed(() => {
  if (!user.value) return ''
  return t('profile.meta.description', { username: user.value.username })
})

const pageUrl = computed(() => {
  const baseUrl = 'https://photosong.com'
  const langPrefix = locale.value === 'en' ? '' : '/' + locale.value
  return baseUrl + langPrefix + '/profile/' + route.params.id
})

// 添加性别显示的计算属性
const genderText = computed(() => {
  if (!user.value) return ''
  return t(`profile.user.gender.${user.value.gender}`)
})

// 添加性别图标映射
const genderIcon = computed(() => {
  if (!user.value?.gender) return 'User'
  const iconMap = {
    male: 'Male',
    female: 'Female',
    nonBinary: 'Star',
    alien: 'Moon',
    toaster: 'Cpu',
    dinosaur: 'Football',
    robot: 'Monitor',
    ghost: 'Magic',
    unicorn: 'Sugar',
    livingMeme: 'Sunny',
    catPerson: 'Pet',
    dogPerson: 'Pet',
    attackHelicopter: 'Airplane',
    stillLoading: 'Loading',
    quantumSuperposition: 'Connection',
    coffeeMachine: 'Coffee',
    walmartBag: 'ShoppingBag',
    other: 'More',
    notSpecified: 'User'
  }
  return iconMap[user.value.gender] || 'User'
})

// 添加性别样式类计算属性
const genderClass = computed(() => {
  if (!user.value?.gender) return ''
  return `gender-${user.value.gender}`
})

// 获取用户信息和作品
const fetchUserData = async () => {
  try {
    loading.value = true
    const query = new AV.Query('_User')
    const result = await query.get(route.params.id)
    
    if (!result) {
      throw new Error('User not found')
    }
    
    user.value = {
      id: result.id,
      username: result.get('username'),
      avatar: result.get('avatar')?.url() || '/default-avatar.png',
      bio: result.get('bio') || '',
      location: result.get('location'),
      website: result.get('website'),
      gender: result.get('gender') || 'notSpecified',
      createdAt: result.createdAt
    }
    
    // 获取统计数据
    const worksCount = await new AV.Query('Work').equalTo('user', result).count()
    stats.value = {
      works: worksCount
    }

    // 获取作品列表
    const worksQuery = new AV.Query('Work')
    worksQuery.equalTo('user', result)
    worksQuery.equalTo('status', 'completed')
    worksQuery.descending('createdAt') // 默认按最新排序
    worksQuery.limit(pageSize.value)
    
    const [worksResults, totalCount] = await Promise.all([
      worksQuery.find(),
      worksQuery.count()
    ])
    
    works.value = worksResults.map(work => ({
      id: work.id,
      title: work.get('title') || t('community.works.untitledWork'),
      imageUrl: work.get('imageUrl') || '',
      audioUrl: work.get('audioUrl') || '',
      createdAt: work.createdAt
    }))
    total.value = totalCount
    
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    ElMessage.error(t('community.error.loadFailed'))
    router.push('/')
  } finally {
    loading.value = false
  }
}

// 获取用户作品
const fetchUserWorks = async () => {
  if (!user.value) return
  
  try {
    loading.value = true
    const query = new AV.Query('Work')
    query.equalTo('user', AV.Object.createWithoutData('_User', user.value.id))
    query.equalTo('status', 'completed')
    
    // 排序
    switch (sortBy.value) {
      case 'latest':
        query.descending('createdAt')
        break
      case 'oldest':
        query.ascending('createdAt')
        break
      default:
        query.descending('createdAt') // 默认按最新排序
        break
    }
    
    // 分页
    query.limit(pageSize.value)
    query.skip((currentPage.value - 1) * pageSize.value)
    
    const [results, count] = await Promise.all([
      query.find(),
      query.count()
    ])
    
    total.value = count
    works.value = results.map(work => ({
      id: work.id,
      title: work.get('title') || t('community.works.untitledWork'),
      imageUrl: work.get('imageUrl') || '',
      audioUrl: work.get('audioUrl') || '',
      createdAt: work.createdAt
    }))
  } catch (error) {
    console.error('Failed to fetch user works:', error)
    ElMessage.error(t('community.error.loadFailed'))
  } finally {
    loading.value = false
  }
}

// 处理分享
const handleShare = async () => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: pageTitle.value,
        text: pageDescription.value,
        url: pageUrl.value
      })
    } else {
      await navigator.clipboard.writeText(pageUrl.value)
      ElMessage.success(t('userProfile.share.success'))
    }
  } catch (error) {
    console.error('Share failed:', error)
    ElMessage.error(t('userProfile.share.failed'))
  }
}

// 处理页面变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchUserWorks()
}

// 处理排序变化
const handleSortChange = (sort) => {
  sortBy.value = sort
  currentPage.value = 1
  fetchUserWorks()
}

// 监听路由参数变化
watch(() => route.params.id, () => {
  fetchUserData()
}, { immediate: true })

// 监听排序变化
watch(sortBy, () => {
  if (user.value) {
    currentPage.value = 1
    fetchUserWorks()
  }
})

// 组件挂载时获取数据
onMounted(() => {
  fetchUserData()
})

const handleAvatarClick = () => {
  avatarClickCount.value++
  
  // 清除之前的超时
  if (avatarClickTimeout.value) {
    clearTimeout(avatarClickTimeout.value)
  }
  
  // 设置新的超时 - 2秒内需要点击
  avatarClickTimeout.value = setTimeout(() => {
    avatarClickCount.value = 0
  }, 2000)
  
  // 如果点击7次，触发彩蛋
  if (avatarClickCount.value === 7) {
    triggerAvatarEasterEgg()
    avatarClickCount.value = 0
  }
}

const triggerAvatarEasterEgg = () => {
  const avatar = document.querySelector('.user-avatar')
  if (avatar) {
    avatar.classList.add('avatar-spin')
    // 播放一个有趣的音效
    const audio = new Audio('/easter-egg-sound.mp3')
    audio.play()
    // 3秒后移除动画类
    setTimeout(() => {
      avatar.classList.remove('avatar-spin')
    }, 3000)
  }
}
</script>

<template>
  <div class="user-profile">
    <SeoMeta
      :title="pageTitle"
      :description="pageDescription"
      :url="pageUrl"
      :image="user?.avatar"
    />
    <TheNavbar />
    
    <div class="profile-container">
      <div class="profile-header">
        <div class="header-content">
          <!-- 用户基本信息 -->
          <div class="user-info">
            <div class="avatar-wrapper">
              <el-avatar 
                :size="120" 
                :src="user?.avatar"
                class="user-avatar"
                @click="handleAvatarClick"
              />
              <div class="avatar-border"></div>
            </div>
            
            <div class="user-details">
              <div class="name-section">
                <h1 class="username">{{ user?.username }}</h1>
                <span class="creator-badge">
                  <el-icon><VideoPlay /></el-icon>
                  {{ t('workDetail.creatorBadge') }}
                </span>
              </div>
              
              <p class="bio">{{ user?.bio || t('profile.about.noBio') }}</p>
              
              <!-- 用户元信息 -->
              <div class="meta-info">
                <!-- 性别显示 -->
                <div v-if="user?.gender && user.gender !== 'notSpecified'" 
                     :class="['meta-item', 'gender-tag', genderClass]">
                  <el-icon><component :is="genderIcon" /></el-icon>
                  <span class="gender-text">{{ t('profile.user.gender.label') }}: {{ genderText }}</span>
                </div>
                
                <!-- 位置信息 -->
                <div v-if="user?.location" class="meta-item location-tag">
                  <el-icon><Location /></el-icon>
                  <span>{{ user.location }}</span>
                </div>
                
                <!-- 网站链接 -->
                <a v-if="user?.website" 
                   :href="user.website"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="meta-item website-tag">
                  <el-icon><Link /></el-icon>
                  <span>{{ t('profile.website') }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 作品展示区域 -->
      <div class="works-section">
        <div class="works-header">
          <div class="tabs">
            <el-radio-group v-model="activeTab" class="tab-group">
              <el-radio-button value="works">
                {{ t('profile.tabs.works') }}
              </el-radio-button>
              <el-radio-button value="about">
                {{ t('profile.tabs.about') }}
              </el-radio-button>
            </el-radio-group>
          </div>
          
          <div class="sort-options" v-if="activeTab === 'works'">
            <el-radio-group v-model="sortBy" class="sort-group">
              <el-radio-button value="latest">
                {{ t('profile.sort.latest') }}
              </el-radio-button>
              <el-radio-button value="oldest">
                {{ t('profile.sort.oldest') }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 作品列表 -->
        <div v-if="activeTab === 'works'" class="works-content">
          <div v-if="loading" class="loading-skeleton">
            <div v-for="i in 6" :key="i" class="skeleton-card">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-meta"></div>
              </div>
            </div>
          </div>
          
          <div v-else-if="works.length > 0" class="works-grid">
            <div 
              v-for="work in works" 
              :key="work.id"
              class="work-card glass-card"
              @click="router.push(`/work/${work.id}`)"
              role="button"
              tabindex="0"
            >
              <div class="work-image">
                <img :src="work.imageUrl" :alt="work.title">
                <div class="play-overlay">
                  <div class="play-button">
                    <el-icon class="play-icon"><VideoPlay /></el-icon>
                  </div>
                </div>
              </div>
              
              <div class="work-info">
                <h3 class="work-title">{{ work.title }}</h3>
                <div class="work-meta">
                  <span class="date">{{ new Date(work.createdAt).toLocaleDateString() }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <p>{{ t('profile.empty.works') }}</p>
          </div>

          <el-pagination
            v-if="works.length > 0"
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            class="pagination"
            @current-change="handlePageChange"
          />
        </div>

        <!-- 关于页面 -->
        <div v-else class="about-content glass-card">
          <div class="about-section">
            <h3>{{ t('profile.about.bio') }}</h3>
            <p>{{ user?.bio || t('profile.about.noBio') }}</p>
          </div>
          
          <div v-if="user?.location" class="about-section">
            <h3>{{ t('profile.about.location') }}</h3>
            <p>{{ user.location }}</p>
          </div>
          
          <div class="about-section">
            <h3>{{ t('profile.user.gender.label') }}</h3>
            <p>{{ genderText }}</p>
          </div>
          
          <div v-if="user?.website" class="about-section">
            <h3>{{ t('profile.about.website') }}</h3>
            <a :href="user.website" target="_blank" rel="noopener noreferrer">
              {{ user.website }}
            </a>
          </div>
          
          <div class="about-section">
            <h3>{{ t('profile.about.joinedAt', { date: '' }) }}</h3>
            <p>{{ new Date(user?.createdAt).toLocaleDateString() }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-profile {
  min-height: 100vh;
  padding: 64px 0;
  background: radial-gradient(
    circle at top right,
    rgba(var(--primary-color-rgb), 0.1),
    rgba(var(--accent-color-rgb), 0.05),
    transparent 70%
  );
}

.profile-container {
  max-width: 1200px;
  margin: 80px auto 0;
  padding: 0 20px;
}

.profile-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-info {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  border: 4px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.avatar-border {
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
  pointer-events: none;
}

.user-details {
  flex: 1;
}

.name-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.username {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.creator-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 20px;
  font-size: 0.875rem;
  color: white;
}

.bio {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 12px 0;
  line-height: 1.6;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.meta-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 性别标签样式 */
.gender-tag {
  position: relative;
  overflow: hidden;
}

/* 为不同性别设置不同的样式 */
.gender-alien {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.gender-robot {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
}

.gender-ghost {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}

.gender-unicorn {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
}

.gender-toaster {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
}

.gender-dinosaur {
  background: linear-gradient(135deg, #84cc16, #65a30d);
  color: white;
}

.gender-catPerson {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.gender-dogPerson {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.gender-attackHelicopter {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.gender-stillLoading {
  background: linear-gradient(135deg, #64748b, #475569);
  color: white;
  animation: pulse 2s infinite;
}

.gender-quantumSuperposition {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  animation: quantum 3s infinite;
}

.gender-coffeeMachine {
  background: linear-gradient(135deg, #78350f, #92400e);
  color: white;
}

.gender-walmartBag {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
}

.gender-nonBinary {
  background: linear-gradient(135deg, #f472b6, #db2777);
  color: white;
}

/* 动画效果 */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

@keyframes quantum {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    margin-top: 60px;
    padding: 0 12px;
  }

  .profile-header {
    padding: 20px;
  }

  .user-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .meta-info {
    justify-content: center;
  }

  .username {
    font-size: 1.5rem;
  }

  .name-section {
    flex-direction: column;
    align-items: center;
  }
}

.works-section {
  .works-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    
    .tab-group,
    .sort-group {
      :deep(.el-radio-button__inner) {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-color);
        
        &:hover {
          color: var(--primary-color);
        }
      }
      
      :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
        background: linear-gradient(135deg,
          var(--primary-color),
          var(--accent-color)
        );
        border-color: transparent;
        color: white;
        box-shadow: none;
      }
    }
  }
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 3rem;
  margin-bottom: 4rem;
}

.work-card {
  cursor: pointer;
  border-radius: 1.5rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-8px);
    border-color: rgba(var(--primary-color-rgb), 0.2);
    
    .work-image {
      img {
        transform: scale(1.1);
      }
      
      .play-overlay {
        opacity: 1;
      }
    }
  }
  
  .work-image {
    height: 320px;
    position: relative;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
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
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
        
        .play-icon {
          font-size: 36px;
          color: white;
          margin-left: 4px;
        }
        
        &:hover {
          transform: scale(1.1);
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }
  }
  
  .work-info {
    padding: 1.5rem;
    
    .work-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    
    .work-meta {
      color: var(--text-color-light);
      font-size: 0.875rem;
    }
  }
}

.about-content {
  padding: 2rem;
  border-radius: 1.5rem;
  
  .about-section {
    margin-bottom: 2rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--primary-color);
    }
    
    p, a {
      font-size: 1.1rem;
      line-height: 1.6;
      color: var(--text-color-light);
    }
    
    a {
      color: var(--primary-color);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  
  .skeleton-card {
    border-radius: 1.5rem;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.02);
    
    .skeleton-image {
      height: 320px;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 25%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.05) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    
    .skeleton-content {
      padding: 1.5rem;
      
      .skeleton-title {
        height: 24px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        margin-bottom: 1rem;
      }
      
      .skeleton-meta {
        height: 16px;
        width: 100px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
    }
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: var(--text-color-light);
  font-size: 1.1rem;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  
  :deep(.el-pagination) {
    --el-pagination-button-bg-color: rgba(255, 255, 255, 0.05);
    --el-pagination-hover-color: var(--primary-color);
    
    .btn-prev,
    .btn-next,
    .el-pager li {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-color);
      
      &:hover {
        color: var(--primary-color);
      }
      
      &.active {
        background: linear-gradient(135deg,
          var(--primary-color),
          var(--accent-color)
        );
        border-color: transparent;
        color: white;
      }
    }
  }
}

@keyframes spin360 {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.2);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.avatar-spin {
  animation: spin360 1s ease-in-out 3;
}
</style> 