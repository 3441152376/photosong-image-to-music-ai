# PhotoSongAI

PhotoSongAI 是一个创新的 AI 驱动的图片转音乐平台，能够将图片转换为独特的音乐作品。

## 功能特点

- 🎵 AI 智能音乐生成
- 🖼️ 图片转音乐功能
- 🎨 多种音乐风格选择
- 🌐 多语言支持 (中文、英文、俄文)
- 🎼 专业音乐编辑工具
- 💾 云端存储与分享
- 🔄 实时预览功能

## 技术栈

- Vue 3 + Vite
- Element Plus
- LeanCloud
- GPT-4 Vision API
- Suno AI API
- PWA 支持

## 开始使用

1. 克隆项目
```bash
git clone https://github.com/3441152376/photosong-image-to-music.git
cd photosong-image-to-music
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
复制 `.env.example` 到 `.env`，并填写必要的配置信息：
```bash
cp .env.example .env
```

4. 启动开发服务器
```bash
npm run dev
```

5. 构建生产版本
```bash
npm run build
```

## 环境要求

- Node.js 16+
- npm 7+
- 现代浏览器支持

## 项目结构

```
src/
├── assets/        # 静态资源
├── components/    # 组件
├── views/         # 页面
├── router/        # 路由配置
├── stores/        # 状态管理
├── services/      # 服务
├── utils/         # 工具函数
└── i18n/          # 国际化
```

## 特性

### AI 音乐生成
- 支持多种音乐风格
- 智能识别图片元素
- 实时音乐预览

### 用户系统
- 账号管理
- 作品收藏
- 社区分享

### 专业工具
- 音乐编辑器
- 风格定制
- 批量处理

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系我们

- 邮箱：admin@egg404.cn

## 致谢

感谢所有为本项目做出贡献的开发者！



# System Requirement Specification (SRS) for PhotoSongAI Platform

## 1. Introduction

### 1.1 Purpose
This document outlines the detailed requirements for the PhotoSongAI platform, an application that converts images to music using artificial intelligence. It serves as a comprehensive guide for developers, testers, and stakeholders to ensure a common understanding of the system's functionality, constraints, and objectives.

### 1.2 Scope
#### 1.2.1 Product Description
PhotoSongAI is an AI-powered web application that analyzes visual content from user-uploaded images and generates corresponding musical compositions. The platform combines computer vision technology with advanced music generation algorithms to create unique audio interpretations of visual media.

#### 1.2.2 Product Functions
- Image upload and processing
- AI-driven music generation based on image content
- Music customization options (style, duration, instrumentation)
- User account management and content storage
- Content moderation for uploaded images and text
- Article generation and enhancement related to music and AI
- SEO optimization for better discoverability
- Multi-language support for global users

## 2. Overall Description

### 2.1 Product Perspective
#### 2.1.2 System Interfaces
- **Frontend-Backend Interface**: RESTful API communication between Vue 3 frontend and LeanCloud backend services
- **AI Service Interfaces**:
  - Integration with GPT-4 Vision API for image analysis
  - Integration with Suno AI API for music composition
  - OpenAI API for article generation and enhancement
- **Storage Interfaces**:
  - LeanCloud for user data and metadata storage
  - Cloud storage for images and generated music files
- **Authentication Interface**: LeanCloud user authentication system

#### 2.1.8 User Characteristics
- **Technical Proficiency**: Ranges from novice to advanced users
- **Primary Users**:
  - Casual users seeking creative music from personal images
  - Content creators looking for inspiration
  - Music enthusiasts exploring AI-generated compositions
- **Access Patterns**: Web-based access from both desktop and mobile devices
- **Language Requirements**: Support for English, Chinese, and Russian

### 2.2 Product Functions
#### 2.2.1 Core Functions
1. **Image Processing**
   - Upload images in JPG, PNG, and GIF formats
   - Image validation (type, size, content)
   - Image optimization and compression
   - Image caching for performance improvement

2. **Music Generation**
   - Convert processed images to music using AI
   - Support multiple music styles (pop, classical, jazz, etc.)
   - Allow customization of music parameters
   - Generate music metadata and structured data

3. **Content Management**
   - Save and retrieve generated music作品
   - Organize content by user, date, and category
   - Provide preview functionality for generated content
   - Manage content status (pending, generated, published)

#### 2.2.2 Supporting Functions
1. **User Management**
   - User registration and authentication
   - Profile management (username, bio, avatar)
   - Content moderation for user-generated text

2. **Article Generation**
   - Create articles related to music and AI
   - Enhance existing articles based on user preferences
   - Support Markdown formatting for articles
   - Generate SEO-optimized content

3. **System Administration**
   - Sitemap generation for search engines
   - Prerendering pages for performance
   - Checking and updating outdated content
   - Managing structured data for SEO

### 2.3 Operating Environment
#### 2.3.1 Hardware Requirements
- **Client Devices**:
  - Desktop: Minimum 2GB RAM, modern browser
  - Mobile: iOS 14+, Android 10+, 2GB RAM+
- **Server Requirements**:
  - Cloud hosting with minimum 4GB RAM
  - Adequate storage for user uploads and generated content
  - sufficient processing power for API operations

#### 2.3.2 Software Requirements
- **Client-side**:
  - Browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
  - JavaScript and HTML5 support
- **Server-side**:
  - Node.js 16.0.0+
  - Vue.js 3.x, Vite 4.x
  - LeanCloud SDK
- **Third-party Services**:
  - OpenAI API (GPT-4, GPT-4 Vision)
  - Suno AI API
  - Cloud storage service

### 2.4 Design and Implementation Constraints
1. **Technical Constraints**
   - Maximum image upload size: 5MB (enforced by security validation)
   - Image dimensions: Maximum 1920x1080 after optimization
   - Text content limits: 
     - Username: 2-20 characters
     - Bio: Maximum 200 characters
     - General text: Maximum 1000 characters
   - API rate limits as defined by third-party services

2. **Regulatory Constraints**
   - Compliance with data protection regulations
   - Content moderation to prevent inappropriate material
   - Copyright considerations for generated content

3. **Performance Constraints**
   - Image processing time: Maximum 10 seconds
   - Music generation time: Target under 60 seconds
   - Page load time: Maximum 3 seconds on standard connections
   - Responsive design for mobile and desktop

4. **Implementation Constraints**
   - Must use specified technology stack (Vue 3, Vite, LeanCloud)
   - Support for specified browsers only
   - Integration with designated third-party APIs
