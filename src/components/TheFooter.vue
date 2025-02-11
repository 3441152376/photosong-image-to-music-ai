<template>
  <footer class="footer">
    <!-- 背景装饰 -->
    <div class="footer-bg">
      <div class="gradient-orb"></div>
      <div class="gradient-orb secondary"></div>
      <div class="gradient-blur"></div>
    </div>

    <div class="footer-content">
      <!-- 主要内容区域 -->
      <div class="footer-main">
        <!-- 品牌区域 -->
        <div class="footer-brand glass-card">
          <router-link to="/" class="brand">
            <img src="@/assets/logo.svg" alt="PhotoSong" class="brand-logo" />
            <span class="brand-name">PhotoSong</span>
          </router-link>
          <p class="brand-description">{{ t('footer.description') }}</p>
          <div class="social-links">
            <a href="https://x.com/photosongai?s=21" target="_blank" rel="noopener" aria-label="Twitter"
               class="social-link hover-effect">
              <el-icon><Platform /></el-icon>
            </a>
            <a href="https://www.linkedin.com/in/lee-pax-b8a436328?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" target="_blank" rel="noopener" aria-label="LinkedIn"
               class="social-link hover-effect">
              <el-icon><Platform /></el-icon>
            </a>
            <a href="https://www.instagram.com/paxleemen?igsh=MmsyNzlzOXcyejN4&utm_source=qr" target="_blank" rel="noopener" aria-label="Instagram"
               class="social-link hover-effect">
              <el-icon><Platform /></el-icon>
            </a>
          </div>
        </div>

        <!-- 链接区域 -->
        <div class="footer-links-grid">
          <div class="footer-links glass-card">
            <h3 class="section-title">{{ t('footer.quickLinks') }}</h3>
            <ul>
              <li>
                <router-link to="/create" class="hover-effect">{{ t('nav.create') }}</router-link>
              </li>
              <li>
                <router-link to="/community" class="hover-effect">{{ t('nav.community') }}</router-link>
              </li>
              <li>
                <router-link to="/articles" class="hover-effect">{{ t('nav.articles') }}</router-link>
              </li>
              <li>
                <router-link to="/pricing" class="hover-effect">{{ t('nav.pricing') }}</router-link>
              </li>
            </ul>
          </div>

          <div class="footer-links glass-card">
            <h3 class="section-title">{{ t('footer.support') }}</h3>
            <ul>
              <li>
                <router-link to="/faq" class="hover-effect">{{ t('nav.faq') }}</router-link>
              </li>
              <li>
                <router-link to="/contact" class="hover-effect">{{ t('nav.contact') }}</router-link>
              </li>
              <li>
                <router-link to="/tutorial" class="hover-effect">{{ t('nav.tutorial') }}</router-link>
              </li>
              <li>
                <router-link to="/feedback" class="hover-effect">{{ t('nav.feedback') }}</router-link>
              </li>
            </ul>
          </div>

          <div class="footer-links glass-card">
            <h3 class="section-title">{{ t('footer.legal') }}</h3>
            <ul>
              <li>
                <router-link to="/terms" class="hover-effect">{{ t('nav.terms') }}</router-link>
              </li>
              <li>
                <router-link to="/privacy" class="hover-effect">{{ t('nav.privacy') }}</router-link>
              </li>
              <li>
                <router-link to="/copyright" class="hover-effect">{{ t('nav.copyright') }}</router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="footer-bottom glass-card">
        <div class="copyright">
          {{ t('footer.copyright') }} {{ currentYear }} PhotoSong.
        </div>
        <div class="footer-meta">
          <span class="footer-stat">{{ t('footer.users', { count: userCount }) }}</span>
          <span class="footer-stat">{{ t('footer.works', { count: workCount }) }}</span>
          <span class="footer-stat">{{ t('footer.articles', { count: articleCount }) }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Platform } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import AV from 'leancloud-storage'

const { t } = useI18n()

// 统计数据
const userCount = ref<string>('--')
const workCount = ref<string>('--')
const articleCount = ref<string>('--')

// 年份
const currentYear = computed(() => new Date().getFullYear())

// 加载统计数据
const loadStats = async () => {
  try {
    // 获取已发布的作品数量
    const workQuery = new AV.Query('Work')
    workQuery.equalTo('status', 'published')
    const workTotal = await workQuery.count()
    workCount.value = workTotal.toString()

    // 获取已发布的文章数量
    const articleQuery = new AV.Query('Article')
    articleQuery.equalTo('status', 'published')
    const articleTotal = await articleQuery.count()
    articleCount.value = articleTotal.toString()

    // 用户数量暂时显示为 "--"，或者从其他公开 API 获取
    userCount.value = '--'
  } catch (error) {
    console.error('Failed to load stats:', error)
    // 设置默认值
    userCount.value = '--'
    workCount.value = '--'
    articleCount.value = '--'
  }
}

// 初始化
loadStats()
</script>

<style scoped lang="scss">
.footer {
  position: relative;
  padding: 6rem 2rem;
  margin-top: 4rem;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  
  // 背景装饰
  .footer-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    overflow: hidden;
    
    .gradient-orb {
      position: absolute;
      width: 30rem;
      height: 30rem;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      animation: float 8s ease-in-out infinite;
      
      &.secondary {
        right: -10rem;
        bottom: -10rem;
        background: linear-gradient(45deg, #a8e6cf, #3498db);
        animation-delay: -4s;
      }
    }
    
    .gradient-blur {
      position: absolute;
      inset: 0;
      backdrop-filter: blur(100px);
      background: rgba(255, 255, 255, 0.01);
    }
  }

  // 主要内容
  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    gap: 4rem;
  }

  // 品牌区域
  .footer-brand {
    padding: 2.5rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    margin-bottom: 2rem;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      text-decoration: none;
      color: inherit;

      .brand-logo {
        width: 40px;
        height: 40px;
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
      }

      .brand-name {
        font-size: 1.5rem;
        font-weight: 600;
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .brand-description {
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .social-links {
      display: flex;
      gap: 1rem;

      .social-link {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.8);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-3px);
          color: #fff;
        }
      }
    }
  }

  // 链接区域
  .footer-links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 3rem;
    margin-top: 2rem;
  }

  .footer-links {
    padding: 2.5rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: rgba(255, 255, 255, 0.9);
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        margin-bottom: 0.8rem;

        a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-block;
          position: relative;

          &::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0;
            height: 2px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            transition: width 0.3s ease;
          }

          &:hover {
            color: #fff;
            
            &::after {
              width: 100%;
            }
          }
        }
      }
    }
  }

  // 版权信息
  .footer-bottom {
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    padding-bottom: 2rem;
  }
}

// 动画
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .footer {
    padding: 4rem 1rem;
    margin-top: 3rem;
  }
}
</style>