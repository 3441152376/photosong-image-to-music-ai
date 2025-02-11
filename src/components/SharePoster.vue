<template>
  <div class="share-poster">
    <!-- 分享按钮 -->
    <el-button 
      class="share-btn primary-gradient"
      type="primary"
      @click="handleShare"
    >
      <el-icon><Share /></el-icon>
      {{ t('workDetail.share.button') }}
    </el-button>

    <!-- 海报弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="t('workDetail.share.title')"
      width="90%"
      max-width="480px"
      class="poster-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="poster-container">
        <!-- 海报预览区域 -->
        <div 
          ref="posterRef"
          class="poster-content"
        >
          <div class="poster-header">
            <img :src="work.imageUrl" :alt="work.title" class="work-image">
            <div class="work-info">
              <h2 class="work-title">{{ work.title }}</h2>
              <div class="work-meta">
                <div class="creator">
                  <img :src="work.user?.avatar" :alt="work.user?.username" class="creator-avatar">
                  <span class="creator-name">{{ work.user?.username }}</span>
                </div>
                <div class="style-tag">
                  {{ t(`create.style.${work.style}`) }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="poster-footer">
            <img src="../assets/icon-512x512.png" alt="PhotoSong" class="app-logo">
            <div class="app-info">
              <p class="app-name">PhotoSong</p>
              <p class="app-desc">{{ t('workDetail.share.scanToPlay') }}</p>
            </div>
            <div 
              ref="qrcodeRef"
              class="qrcode"
            ></div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button 
            class="action-button primary-gradient"
            type="primary"
            @click="handleDownload"
            :loading="downloading"
          >
            <el-icon><Download /></el-icon>
            {{ t('workDetail.share.downloadPoster') }}
          </el-button>
          
          <el-button 
            class="action-button secondary-button"
            @click="handleCopyLink"
            :loading="copying"
          >
            <el-icon><Link /></el-icon>
            {{ t('workDetail.share.copyLink') }}
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Share, Download, Link } from '@element-plus/icons-vue'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'

const props = defineProps({
  work: {
    type: Object,
    required: true
  }
})

const { t } = useI18n()
const dialogVisible = ref(false)
const posterRef = ref(null)
const qrcodeRef = ref(null)
const downloading = ref(false)
const copying = ref(false)

// 生成二维码
const generateQRCode = async () => {
  if (!qrcodeRef.value) return
  
  const shareUrl = `${window.location.origin}/work/${props.work.id}`
  try {
    await QRCode.toCanvas(qrcodeRef.value, shareUrl, {
      width: 100,
      margin: 0,
      color: {
        dark: '#000',
        light: '#fff'
      }
    })
  } catch (error) {
    console.error('Generate QR code failed:', error)
  }
}

// 处理分享
const handleShare = () => {
  dialogVisible.value = true
  // 等待 DOM 更新后生成二维码
  setTimeout(generateQRCode, 100)
}

// 下载海报
const handleDownload = async () => {
  if (!posterRef.value) return
  
  try {
    downloading.value = true
    
    const canvas = await html2canvas(posterRef.value, {
      useCORS: true,
      scale: 2,
      backgroundColor: null
    })
    
    // 转换为图片并下载
    const link = document.createElement('a')
    link.download = `${props.work.title || 'photosong'}_poster.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    
    ElMessage.success(t('workDetail.share.success.download'))
  } catch (error) {
    console.error('Download poster failed:', error)
    ElMessage.error(t('workDetail.share.error.download'))
  } finally {
    downloading.value = false
  }
}

// 复制链接
const handleCopyLink = async () => {
  const shareUrl = `${window.location.origin}/work/${props.work.id}`
  
  try {
    copying.value = true
    await navigator.clipboard.writeText(shareUrl)
    ElMessage.success(t('workDetail.share.success.copy'))
  } catch (error) {
    console.error('Copy link failed:', error)
    ElMessage.error(t('workDetail.share.error.copy'))
  } finally {
    copying.value = false
  }
}
</script>

<style scoped lang="scss">
.share-poster {
  display: inline-block;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color, #4f46e5) 100%);
  border-radius: 1rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: inherit;
    filter: blur(8px);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-2px);
    
    &::before {
      opacity: 0.6;
    }
  }
  
  &:active {
    transform: translateY(-1px);
  }
  
  .el-icon {
    font-size: 1.25em;
    transition: transform 0.3s ease;
  }
  
  &:hover .el-icon {
    transform: scale(1.1) rotate(12deg);
  }
}

.primary-gradient {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color, #4f46e5) 100%);
  border: none;
  color: white;
  
  &:hover {
    opacity: 0.95;
  }
  
  &:active {
    opacity: 0.9;
  }
}

:deep(.poster-dialog) {
  .el-dialog__body {
    padding: 0;
  }
  
  .el-dialog__header {
    padding: 1rem 1.5rem;
    margin: 0;
    border-bottom: 1px solid var(--border-color);
    
    .el-dialog__title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-color);
    }
  }
}

.poster-container {
  padding: 1.5rem;
}

.poster-content {
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border-radius: 1rem;
  overflow: hidden;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.poster-header {
  .work-image {
    width: 100%;
    height: 320px;
    object-fit: cover;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .work-info {
    padding: 1rem 0;
    
    .work-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 1rem;
      color: white;
    }
    
    .work-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .creator {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        
        .creator-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .creator-name {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
        }
      }
      
      .style-tag {
        padding: 0.25rem 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }
}

.poster-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  .app-logo {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }
  
  .app-info {
    flex: 1;
    
    .app-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: white;
      margin: 0 0 0.25rem;
    }
    
    .app-desc {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }
  }
  
  .qrcode {
    width: 100px;
    height: 100px;
    background: white;
    padding: 0.5rem;
    border-radius: 0.5rem;
    
    canvas {
      width: 100%;
      height: 100%;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  
  .action-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-weight: 500;
    height: 48px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 1rem;
    position: relative;
    overflow: hidden;
    
    .el-icon {
      font-size: 1.25em;
      transition: all 0.3s ease;
    }
    
    &.primary-gradient {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color, #4f46e5));
      border: none;
      color: white;
      
      &::before {
        content: '';
        position: absolute;
        inset: -2px;
        background: inherit;
        filter: blur(8px);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover {
        transform: translateY(-2px);
        
        &::before {
          opacity: 0.6;
        }
        
        .el-icon {
          transform: scale(1.1) translateY(-2px);
        }
      }
      
      &:active {
        transform: translateY(-1px);
      }
    }
    
    &.secondary-button {
      background: transparent;
      border: 2px solid var(--primary-color);
      color: var(--primary-color);
      
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color, #4f46e5));
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover {
        color: white;
        border-color: transparent;
        transform: translateY(-2px);
        
        &::before {
          opacity: 1;
        }
        
        .el-icon {
          transform: scale(1.1) rotate(-12deg);
          color: white;
        }
      }
      
      &:active {
        transform: translateY(-1px);
      }
      
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }
    }
  }
}

// Add loading animation styles
.action-button {
  &.is-loading {
    position: relative;
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: button-loading 0.8s linear infinite;
    }
  }
}

@keyframes button-loading {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}

// Add responsive styles
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    
    .action-button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .poster-container {
    padding: 1rem;
  }
  
  .poster-header {
    .work-image {
      height: 240px;
    }
    
    .work-info {
      .work-title {
        font-size: 1.25rem;
      }
    }
  }
}
</style> 