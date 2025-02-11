import { messages, getTranslation } from '../i18n/index.js'
import { joinPaths, normalizePath } from './pathUtils.js'

/**
 * 生成静态 HTML
 */
export function generateHTML({ title, description, locale, content = '', path = '/', url = 'https://photosong.com' }) {
  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    
    <!-- Primary Meta Tags -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="${path === '/' ? 'website' : 'article'}">
    <meta property="og:url" content="${url}">
    <meta property="og:locale" content="${locale === 'zh' ? 'zh_CN' : locale === 'en' ? 'en_US' : 'ru_RU'}">
    
    <!-- Language Alternates -->
    <link rel="alternate" hreflang="zh" href="https://photosong.com/zh${path}">
    <link rel="alternate" hreflang="en" href="https://photosong.com/en${path}">
    <link rel="alternate" hreflang="ru" href="https://photosong.com/ru${path}">
    <link rel="canonical" href="${url}">
    
    <!-- Content Security Policy -->
    <meta http-equiv="Content-Security-Policy" content="
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https:;
      connect-src 'self' https://api.whatai.cc https://apieu.egg404.com;
    ">
    
    <!-- Preload Resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- 使用本地字体文件 -->
    <link rel="stylesheet" href="/assets/fonts/inter.css">
    
    <!-- Styles -->
    <link rel="stylesheet" href="/assets/index.css">

    <!-- Source Code View Notice -->
    <!--
    Welcome to PhotoSong's source code!
    This is a server-rendered version of our app for better SEO and initial load performance.
    The actual app is a Vue.js SPA that will take over once loaded.
    
    GitHub: https://github.com/your-repo/photo-song
    -->
</head>
<body>
    <div id="app">
        <!-- Server Generated Content -->
        <div class="seo-content">
            ${content}
        </div>
        
        <!-- Vue App Mount Point -->
        <div id="app-mount"></div>
    </div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>`.trim()
}

/**
 * 生成静态页面内容
 */
export function generateStaticContent(path, locale) {
  const t = messages[locale]
  
  switch (path) {
    case '/':
      return `
        <div class="home-content">
          <h2>${t?.home?.features?.title || '功能特色'}</h2>
          <ul>
            ${t?.home?.features?.list?.map(item => `<li>${item}</li>`).join('') || `
              <li>将照片转化为音乐</li>
              <li>个性化音乐创作</li>
              <li>支持多种语言</li>
            `}
          </ul>
          
          <section class="features">
            <h2>${t?.home?.features?.title || '功能特色'}</h2>
            <div class="feature-grid">
              <div class="feature">
                <h3>${t?.home?.features?.aiPowered?.title || 'AI 驱动'}</h3>
                <p>${t?.home?.features?.aiPowered?.desc || '使用先进的 AI 算法创作独特音乐'}</p>
              </div>
              <div class="feature">
                <h3>${t?.home?.features?.easyToUse?.title || '简单易用'}</h3>
                <p>${t?.home?.features?.easyToUse?.desc || '简洁直观的操作界面'}</p>
              </div>
              <div class="feature">
                <h3>${t?.home?.features?.unique?.title || '独特创作'}</h3>
                <p>${t?.home?.features?.unique?.desc || '每张照片都创造独一无二的音乐'}</p>
              </div>
            </div>
          </section>
        </div>`
    
    case '/about':
      return `
        <div class="about-content">
          <h2>${t?.about?.title || '关于我们'}</h2>
          <p>${t?.about?.description || '我们致力于将照片转化为音乐的创新技术。'}</p>
        </div>`
    
    default:
      return ''
  }
}

/**
 * 生成动态页面内容
 */
export function generateDynamicContent(data, locale) {
  const t = messages[locale]
  
  switch (data.type) {
    case 'profile':
      return `
        <div class="profile-content">
          <h2>${data.username || 'User'}</h2>
          <p>${data.bio || t?.profile?.defaultBio || '这位用户还没有填写个人简介。'}</p>
          ${data.works ? `
            <div class="works-list">
              <h3>${t?.profile?.works || '作品列表'}</h3>
              <ul>
                ${data.works.map(work => `
                  <li>
                    <h4>${work.title || 'Untitled'}</h4>
                    <p>${work.description || ''}</p>
                    <div class="work-meta">
                      <span>创建时间：${new Date(work.createdAt).toLocaleDateString(locale)}</span>
                      <span>风格：${work.style || 'Default'}</span>
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>`
    
    case 'work':
      return `
        <div class="work-content">
          <h2>${data.title || 'Untitled'}</h2>
          <p>${data.description || ''}</p>
          <div class="work-details">
            <p>${t?.work?.author || '作者'}: ${data.author || 'Anonymous'}</p>
            <p>${t?.work?.style || '风格'}: ${data.style || 'Default'}</p>
            <p>${t?.work?.createdAt || '创建时间'}: ${new Date(data.createdAt).toLocaleDateString(locale)}</p>
          </div>
        </div>`
    
    default:
      return ''
  }
}

export const getStaticHTMLPath = () => null;
export const generateHomeHTML = async () => null;
export const generateUserProfileHTML = async () => null;
export const generateWorkDetailHTML = async () => null;

// 使用客户端路径工具替代 Node.js path 模块
const getAssetPath = (file) => {
  return joinPaths('/assets', file)
} 