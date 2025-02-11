import { createHead } from '@unhead/vue'

export const head = createHead({
  // 启用 SSR 支持
  ssr: true,
  
  // 配置默认选项
  defaults: {
    // 默认 title 模板
    titleTemplate: '%s | PhotoSong',
    
    // 默认 meta 标签
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    
    // 默认 link 标签
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  }
}) 