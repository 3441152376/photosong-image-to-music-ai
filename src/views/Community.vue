<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TheNavbar from '../components/TheNavbar.vue'
import AV from 'leancloud-storage'
import { ElMessage } from 'element-plus'

const router = useRouter()
const { t } = useI18n()
const loading = ref(false)
const works = ref([])
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 获取作品列表
const fetchWorks = async () => {
  try {
    loading.value = true
    const query = new AV.Query('Work')
    query.include('user')
    query.equalTo('status', 'completed')
    query.descending('createdAt')
    
    // 设置分页
    query.limit(pageSize.value)
    query.skip((currentPage.value - 1) * pageSize.value)
    
    try {
      // 获取总数
      total.value = await query.count()
      
      // 获取作品列表
      const results = await query.find()
      works.value = results.map(work => ({
        id: work.id,
        title: work.get('title') || t('community.works.untitledWork'),
        description: work.get('description') || '',
        imageUrl: work.get('imageUrl') || '',
        audioUrl: work.get('audioUrl') || '',
        style: work.get('style') || '',
        plays: work.get('plays') || 0,
        createdAt: work.createdAt,
        user: {
          id: work.get('user')?.id,
          username: work.get('user')?.get('username') || t('community.works.anonymousUser'),
          avatar: (() => {
            const avatar = work.get('user')?.get('avatar')
            if (avatar instanceof AV.File) {
              return avatar.url()
            }
            return avatar || '/default-avatar.png'
          })()
        }
      }))
    } catch (error) {
      if (error.code === 403) {
        console.error('Access denied:', error)
        ElMessage.error(t('errors.accessDenied'))
      } else {
        console.error('Fetch works failed:', error)
        ElMessage.error(t('community.works.loadingError'))
      }
      works.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('Query setup failed:', error)
    ElMessage.error(t('errors.querySetupFailed'))
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchWorks()
}

// 播放音乐
const handlePlay = async (work) => {
  try {
    // 创建播放记录
    const PlayRecord = AV.Object.extend('PlayRecord')
    const playRecord = new PlayRecord()
    playRecord.set('work', AV.Object.createWithoutData('Work', work.id))
    playRecord.set('user', AV.User.current())
    playRecord.set('ip', '')  // 可选：记录IP
    
    // 设置 ACL
    const acl = new AV.ACL()
    acl.setPublicReadAccess(true)
    playRecord.setACL(acl)
    
    await playRecord.save()
    
    // 更新本地状态
    work.plays += 1
    
    // 跳转到作品详情页
    router.push(`/work/${work.id}`)
  } catch (error) {
    console.error('Create play record failed:', error)
    // 即使记录失败也允许跳转
    router.push(`/work/${work.id}`)
  }
}

onMounted(() => {
  fetchWorks()
})
</script>

<template>
  <div class="community">
    <TheNavbar />
    
    <div class="container">
      <div class="header">
        <h1 class="gradient-text">{{ t('community.title') }}</h1>
        <p>{{ t('community.description') }}</p>
        <div class="header-decoration">
          <div class="circle"></div>
          <div class="line"></div>
          <div class="circle"></div>
        </div>
      </div>
      
      <!-- 加载动画 -->
      <div v-if="loading" class="loading-skeleton">
        <div v-for="i in 12" :key="i" class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-meta">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 作品列表 -->
      <div v-else class="works-grid">
        <div 
          v-for="work in works" 
          :key="work.id"
          class="work-card glass-card"
          @click="handlePlay(work)"
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
              <router-link 
                :to="`/profile/${work.user.id}`"
                class="user-info"
                @click.stop
              >
                <el-avatar 
                  :size="40" 
                  :src="work.user.avatar"
                  class="user-avatar"
                />
                <span class="username">{{ work.user.username }}</span>
              </router-link>
              
              <div class="work-stats">
                <span class="stat">
                  <el-icon><VideoPlay /></el-icon>
                  {{ work.plays }} {{ t('community.works.playCount') }}
                </span>
                <span class="date">{{ new Date(work.createdAt).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination" v-if="!loading && total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
          background
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.community {
  min-height: 100vh;
  padding-top: 64px;
  background: radial-gradient(
    circle at top right,
    rgba(var(--primary-color-rgb), 0.1),
    rgba(var(--accent-color-rgb), 0.05),
    transparent 70%
  );
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      linear-gradient(45deg, rgba(var(--primary-color-rgb), 0.03) 25%, transparent 25%) -50px 0,
      linear-gradient(-45deg, rgba(var(--primary-color-rgb), 0.03) 25%, transparent 25%) -50px 0,
      linear-gradient(45deg, transparent 75%, rgba(var(--primary-color-rgb), 0.03) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(var(--primary-color-rgb), 0.03) 75%);
    background-size: 100px 100px;
    z-index: -1;
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 20%;
    right: -20%;
    width: 500px;
    height: 500px;
    background: radial-gradient(
      circle,
      rgba(var(--accent-color-rgb), 0.1),
      transparent 70%
    );
    filter: blur(50px);
    z-index: -1;
  }
}

.header {
  text-align: center;
  margin-bottom: 6rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -150px;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 800px;
    background: radial-gradient(
      circle,
      rgba(var(--primary-color-rgb), 0.1),
      transparent 70%
    );
    filter: blur(80px);
    z-index: -1;
  }
  
  h1 {
    font-size: 5rem;
    font-weight: 800;
    margin-bottom: 2rem;
    background: linear-gradient(135deg, 
      var(--primary-color), 
      var(--accent-color)
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: -0.02em;
    position: relative;
    display: inline-block;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1rem;
      left: 25%;
      width: 50%;
      height: 6px;
      background: linear-gradient(90deg,
        transparent,
        var(--primary-color),
        var(--accent-color),
        transparent
      );
      border-radius: 3px;
      filter: blur(1px);
    }
  }
  
  p {
    font-size: 1.5rem;
    color: var(--text-color-light);
    max-width: 700px;
    margin: 0 auto 3rem;
    line-height: 1.6;
    opacity: 0.8;
  }
  
  .header-decoration {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
    
    .circle {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      opacity: 0.6;
    }
    
    .line {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg,
        transparent,
        var(--primary-color),
        var(--accent-color),
        transparent
      );
      opacity: 0.3;
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
  position: relative;
  isolation: isolate;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
      rgba(var(--primary-color-rgb), 0.1),
      rgba(var(--accent-color-rgb), 0.05)
    );
    border-radius: 1.5rem;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
  
  .work-image {
    height: 320px;
    border-radius: 1.5rem 1.5rem 0 0;
    overflow: hidden;
    position: relative;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
      filter: brightness(1.05) contrast(1.05);
    }
    
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        transparent 30%,
        rgba(0, 0, 0, 0.7)
      );
      opacity: 0;
      transition: opacity 0.3s ease;
    }
  }
  
  .play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s ease;
    
    .play-button {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transform: scale(0.8) translateY(30px) rotate(-10deg);
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      
      &::before {
        content: '';
        position: absolute;
        inset: -4px;
        background: linear-gradient(135deg,
          var(--primary-color),
          var(--accent-color)
        );
        border-radius: inherit;
        z-index: -1;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .play-icon {
        font-size: 44px;
        color: white;
        transform: translateX(3px);
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }
    }
  }
  
  .work-info {
    padding: 2rem;
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(10px);
    border-radius: 0 0 1.5rem 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
    
    .work-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color 0.3s ease;
    }
    
    .work-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        text-decoration: none;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 1rem;
        transition: all 0.3s ease;
        
        .user-avatar {
          border: 3px solid var(--primary-color);
          box-shadow: 0 0 20px rgba(var(--primary-color-rgb), 0.3);
          transition: all 0.3s ease;
        }
        
        .username {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-color);
          transition: color 0.3s ease;
        }
        
        &:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
          
          .user-avatar {
            transform: scale(1.1) rotate(10deg);
            box-shadow: 0 0 30px rgba(var(--primary-color-rgb), 0.4);
          }
          
          .username {
            color: var(--primary-color);
          }
        }
      }
      
      .work-stats {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        
        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          color: var(--text-color-light);
          
          .el-icon {
            color: var(--primary-color);
            font-size: 1.25rem;
          }
        }
        
        .date {
          font-size: 0.875rem;
          color: var(--text-color-light);
          opacity: 0.8;
        }
      }
    }
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    
    &::before {
      opacity: 1;
    }
    
    .work-image {
      img {
        transform: scale(1.08);
      }
      
      &::after {
        opacity: 1;
      }
    }
    
    .play-overlay {
      opacity: 1;
      
      .play-button {
        transform: scale(1) translateY(0) rotate(0);
        
        &::before {
          opacity: 1;
        }
      }
    }
    
    .work-info {
      background: rgba(255, 255, 255, 0.04);
      
      .work-title {
        background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
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
    
    .skeleton-image {
      height: 280px;
      position: relative;
      overflow: hidden;
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.1),
          transparent
        );
        animation: skeleton-shine 1.5s infinite;
      }
    }
    
    .skeleton-content {
      padding: 2rem;
      
      .skeleton-title {
        height: 32px;
        margin-bottom: 1.5rem;
      }
      
      .skeleton-meta {
        .skeleton-avatar {
          width: 40px;
          height: 40px;
        }
      }
    }
  }
}

@keyframes skeleton-shine {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

.pagination {
  margin-top: 4rem;
  
  :deep(.el-pagination) {
    .el-pager li {
      width: 40px;
      height: 40px;
      line-height: 40px;
      font-size: 1rem;
      border-radius: 0.75rem;
      margin: 0 0.25rem;
      
      &.is-active {
        font-weight: 600;
        transform: scale(1.1);
      }
    }
    
    .btn-prev,
    .btn-next {
      width: 40px;
      height: 40px;
      border-radius: 0.75rem;
      
      .el-icon {
        font-size: 1.25rem;
      }
    }
  }
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .header {
    margin-bottom: 2rem;
    
    h1 {
      font-size: 2.5rem;
    }
    
    p {
      font-size: 1rem;
    }
  }
  
  .work-card {
    .work-image {
      height: 200px;
    }
    
    .play-overlay {
      .play-button {
        width: 56px;
        height: 56px;
        
        .play-icon {
          font-size: 28px;
        }
      }
    }
  }
}
</style> 