import AV from 'leancloud-storage'
import OpenAI from '@/utils/openai'

// 文章分类枚举
export const ArticleCategory = {
  KNOWLEDGE: 'knowledge',         // 音乐知识
  NEWS: 'news',                   // 行业资讯
  AI_MUSIC: 'ai_music'           // AI音乐创作
}

// 文章状态枚举
export const ArticleStatus = {
  DRAFT: 'draft',           // 草稿
  PUBLISHED: 'published',   // 已发布
  ARCHIVED: 'archived'      // 已归档
}

// 添加重试机制
const MAX_RETRIES = 3
const BASE_DELAY = 5000

async function retryOperation(operation) {
  let lastError
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      // 如果是最后一次重试，直接抛出错误
      if (i === MAX_RETRIES - 1) throw error
      // 计算延迟时间，使用指数退避
      const delay = BASE_DELAY * Math.pow(2, i)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

// 文章模型
export default class Article extends AV.Object {
  static get className() {
    return 'Article'
  }
  
  // 基础字段
  get title() { return this.get('title') }
  set title(value) { this.set('title', value) }
  
  get slug() { return this.get('slug') }
  set slug(value) { this.set('slug', value) }
  
  get content() { return this.get('content') }
  set content(value) { this.set('content', value) }
  
  get category() { return this.get('category') }
  set category(value) { this.set('category', value) }
  
  get status() { return this.get('status') }
  set status(value) { this.set('status', value) }
  
  get author() { return this.get('author') }
  set author(value) { this.set('author', value) }
  
  // SEO相关字段
  get metaTitle() { return this.get('metaTitle') }
  set metaTitle(value) { this.set('metaTitle', value) }
  
  get metaDescription() { return this.get('metaDescription') }
  set metaDescription(value) { this.set('metaDescription', value) }
  
  get keywords() { return this.get('keywords') }
  set keywords(value) { this.set('keywords', value) }
  
  get canonicalUrl() { return this.get('canonicalUrl') }
  set canonicalUrl(value) { this.set('canonicalUrl', value) }
  
  // 其他字段
  get coverImage() { return this.get('coverImage') }
  set coverImage(value) { this.set('coverImage', value) }
  
  get summary() { return this.get('summary') }
  set summary(value) { this.set('summary', value) }
  
  get tags() { return this.get('tags') || [] }
  set tags(value) { this.set('tags', value) }
  
  get readTime() { return this.get('readTime') }
  set readTime(value) { this.set('readTime', value) }
  
  get views() { return this.get('views') || 0 }
  set views(value) { this.set('views', value) }
  
  get likes() { return this.get('likes') || 0 }
  set likes(value) { this.set('likes', value) }
  
  get publishedAt() { return this.get('publishedAt') }
  set publishedAt(value) { this.set('publishedAt', value) }
  
  get language() { return this.get('language') }
  set language(value) { this.set('language', value) }
  
  // 关联字段
  get relatedArticles() { return this.get('relatedArticles') }
  set relatedArticles(value) { this.set('relatedArticles', value) }
  
  get relatedWorks() { return this.get('relatedWorks') }
  set relatedWorks(value) { this.set('relatedWorks', value) }
  
  // 辅助方法
  static async getBySlug(slug) {
    const query = new AV.Query('Article')
    query.equalTo('slug', slug)
    return query.first()
  }
  
  static async getPublished({
    category = null,
    language = 'zh',
    page = 1,
    limit = 10,
    tag = null
  } = {}) {
    const query = new AV.Query('Article')
    query.equalTo('status', ArticleStatus.PUBLISHED)
    query.equalTo('language', language)
    
    if (category) {
      query.equalTo('category', category)
    }
    
    if (tag) {
      query.containsAll('tags', [tag])
    }
    
    query.descending('publishedAt')
    query.limit(limit)
    query.skip((page - 1) * limit)
    
    return query.find()
  }
  
  // 增加浏览量
  async incrementViews() {
    this.increment('views')
    return this.save()
  }
  
  // 增加点赞数
  async incrementLikes() {
    this.increment('likes')
    return this.save()
  }
  
  // 生成关键词建议
  async generateKeywords() {
    try {
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        // 如果没有配置 OpenAI API Key，返回基本关键词
        return this.generateBasicKeywords()
      }

      const openai = new OpenAI()
      const response = await openai.complete({
        prompt: `为以下文章标题和摘要生成SEO关键词建议：\n标题：${this.title}\n摘要：${this.summary}`,
        maxTokens: 100
      })
      
      return response.split(',').map(k => k.trim())
    } catch (error) {
      console.error('Failed to generate keywords:', error)
      return this.generateBasicKeywords()
    }
  }

  // 生成基本关键词
  generateBasicKeywords() {
    const keywords = new Set()
    
    // 从标题中提取关键词
    if (this.title) {
      const titleWords = this.title.split(/[\s,，。.、]+/)
      titleWords.forEach(word => {
        if (word.length >= 2) {
          keywords.add(word)
        }
      })
    }
    
    // 从分类中添加关键词
    if (this.category) {
      keywords.add(this.category)
    }
    
    // 从标签中添加关键词
    if (this.tags && this.tags.length > 0) {
      this.tags.forEach(tag => keywords.add(tag))
    }
    
    // 添加一些通用关键词
    keywords.add('Photo Song')
    keywords.add('AI音乐')
    
    return Array.from(keywords)
  }

  // 生成文章内容
  async generateContent(imageUrl = null) {
    try {
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        throw new Error('OpenAI API Key not configured')
      }

      return await retryOperation(async () => {
        const messages = [
          {
            role: 'system',
            content: '你是一个专业的文章写作助手。请根据提供的标题和主题，生成一篇结构完整、内容专业的文章。'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `请根据以下信息生成一篇文章：
标题：${this.title}
分类：${this.category}
主题：${this.summary || ''}
要求：
1. 文章结构要完整，包含引言、主体和结论
2. 内容要专业、准确，并符合文章分类的特点
3. 语言要流畅自然，适合阅读
4. 添加适当的小标题，使文章层次分明
5. 确保文章与主题高度相关
6. 使用 Markdown 格式`
              }
            ]
          }
        ]

        // 如果有图片，添加图片分析
        if (imageUrl) {
          messages[1].content.push({
            type: 'image_url',
            image_url: { url: imageUrl }
          })
          messages[1].content[0].text += '\n7. 结合图片内容进行写作，使文章更加生动'
        }

        const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: imageUrl ? 'gpt-4-vision-preview' : 'gpt-4',
            messages,
            max_tokens: 3000,
            temperature: 0.7
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to generate content')
        }

        const data = await response.json()
        const content = data.choices[0].message.content.trim()
        
        // 设置文章内容
        this.set('content', content)
        
        // 更新生成时间
        this.set('generatedAt', new Date())
        
        // 保存文章
        await this.save()
        
        return content
      })
    } catch (error) {
      console.error('Failed to generate content:', error)
      throw error
    }
  }

  // 优化文章内容
  async optimizeContent(options = {}) {
    try {
      if (!this.content) {
        throw new Error('No content to optimize')
      }

      return await retryOperation(async () => {
        const {
          focusAreas = [], // 优化重点领域：['seo', 'readability', 'professionalism', 'engagement']
          tone = 'professional', // 语气：professional, casual, storytelling, persuasive
          targetLength = 'maintain', // 目标长度：maintain, expand, shorten
          keepStructure = true // 是否保持原文结构
        } = options

        const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: '你是一个专业的文章优化专家。请根据用户的具体要求优化文章内容。'
              },
              {
                role: 'user',
                content: `请根据以下要求优化文章：

优化重点：${focusAreas.join(', ') || '全面优化'}
语气风格：${tone}
目标长度：${targetLength}
保持结构：${keepStructure ? '是' : '否'}

优化要求：
1. ${focusAreas.includes('seo') ? 'SEO优化：优化关键词分布，改进标题和小标题' : '保持原有SEO元素'}
2. ${focusAreas.includes('readability') ? '提升可读性：优化段落结构，增加过渡语句' : '维持原有可读性'}
3. ${focusAreas.includes('professionalism') ? '增强专业性：加入专业术语和行业见解' : '保持原有专业度'}
4. ${focusAreas.includes('engagement') ? '提升吸引力：优化开场和结尾，增加互动元素' : '保持原有吸引力'}
5. 根据指定语气风格调整表达方式
6. ${targetLength === 'maintain' ? '保持原文长度' : targetLength === 'expand' ? '适当扩展内容' : '精简内容'}
7. ${keepStructure ? '保持原有文章结构' : '优化文章结构'}
8. 使用 Markdown 格式

原文内容：
${this.content}`
              }
            ],
            max_tokens: 3000,
            temperature: 0.7
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to optimize content')
        }

        const data = await response.json()
        const optimizedContent = data.choices[0].message.content.trim()
        
        // 设置优化后的内容
        this.set('content', optimizedContent)
        
        // 更新优化时间
        this.set('optimizedAt', new Date())
        
        // 保存文章
        await this.save()
        
        return optimizedContent
      })
    } catch (error) {
      console.error('Failed to optimize content:', error)
      throw error
    }
  }

  // 生成文章标签
  async generateTags() {
    try {
      if (!this.content) {
        throw new Error('No content to generate tags')
      }

      const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文章标签生成专家。请为提供的文章生成相关的标签。'
            },
            {
              role: 'user',
              content: `请为以下文章生成5-8个相关标签，要求：
1. 标签要简洁且具有代表性
2. 包含文章的主要主题和关键概念
3. 适合用于文章分类和搜索
4. 返回格式为数组，每个标签用逗号分隔

文章标题：${this.title}
文章分类：${this.category}
文章内容：
${this.content}`
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate tags')
      }

      const data = await response.json()
      const tagsString = data.choices[0].message.content.trim()
      // 处理返回的标签字符串，转换为数组
      const tags = tagsString.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag)
      
      // 设置文章标签
      this.set('tags', tags)
      return tags
    } catch (error) {
      console.error('Failed to generate tags:', error)
      return []
    }
  }

  // 生成文章摘要
  async generateSummary() {
    try {
      if (!this.content) {
        throw new Error('No content to generate summary')
      }

      // 首先尝试获取前100个字符作为摘要
      const firstHundredChars = this.content.replace(/<[^>]+>/g, '').slice(0, 100).trim()
      
      if (firstHundredChars) {
        this.set('summary', firstHundredChars)
        return firstHundredChars
      }

      // 如果无法获取有效的前100字符，则使用AI生成摘要
      const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文章编辑。请为提供的文章生成一个简洁的摘要。'
            },
            {
              role: 'user',
              content: `请为以下文章生成一个简短的摘要，要求：
1. 长度不超过100字
2. 概括文章的核心内容
3. 使用吸引人的语言
4. 突出文章的价值

文章内容：
${this.content}`
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      const summary = data.choices[0].message.content.trim()
      
      // 设置文章摘要
      this.set('summary', summary)
      return summary
    } catch (error) {
      console.error('Failed to generate summary:', error)
      return ''
    }
  }

  // 高级优化文章内容
  async enhanceContent(options = {}) {
    try {
      if (!this.content) {
        throw new Error('No content to enhance')
      }

      const {
        focusAreas = [], // 优化重点领域：['seo', 'readability', 'professionalism', 'engagement']
        tone = 'professional', // 语气：professional, casual, storytelling, persuasive
        targetLength = 'maintain', // 目标长度：maintain, expand, shorten
        keepStructure = true // 是否保持原文结构
      } = options

      const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文章优化专家。请根据用户的具体要求优化文章内容。'
            },
            {
              role: 'user',
              content: `请根据以下要求优化文章：

优化重点：${focusAreas.join(', ') || '全面优化'}
语气风格：${tone}
目标长度：${targetLength}
保持结构：${keepStructure ? '是' : '否'}

优化要求：
1. ${focusAreas.includes('seo') ? 'SEO优化：优化关键词分布，改进标题和小标题' : '保持原有SEO元素'}
2. ${focusAreas.includes('readability') ? '提升可读性：优化段落结构，增加过渡语句' : '维持原有可读性'}
3. ${focusAreas.includes('professionalism') ? '增强专业性：加入专业术语和行业见解' : '保持原有专业度'}
4. ${focusAreas.includes('engagement') ? '提升吸引力：优化开场和结尾，增加互动元素' : '保持原有吸引力'}
5. 根据指定语气风格调整表达方式
6. ${targetLength === 'maintain' ? '保持原文长度' : targetLength === 'expand' ? '适当扩展内容' : '精简内容'}
7. ${keepStructure ? '保持原有文章结构' : '优化文章结构'}

原文内容：
${this.content}`
            }
          ],
          max_tokens: 3000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error('Failed to enhance content')
      }

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error('Failed to enhance content:', error)
      throw error
    }
  }

  // 文章仿写
  async rewriteFromReference(referenceContent, options = {}) {
    try {
      const {
        similarity = 'medium', // 相似度：high, medium, low
        style = 'original', // 风格：original, creative, academic
        focus = [], // 重点关注：['structure', 'tone', 'examples', 'insights']
        improvements = [] // 需要改进的方面：['depth', 'clarity', 'evidence', 'uniqueness']
      } = options

      const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文章创作专家。请根据参考文章和用户要求创作新的文章。'
            },
            {
              role: 'user',
              content: `请根据以下参考文章和要求进行仿写：

当前文章标题：${this.title}
当前文章分类：${this.category}

仿写要求：
1. 相似度要求：${similarity === 'high' ? '保持高度相似' : similarity === 'medium' ? '保持中度相似' : '保持低度相似'}
2. 写作风格：${style === 'original' ? '保持原创风格' : style === 'creative' ? '创新风格' : '学术风格'}
3. 重点关注：${focus.join(', ') || '全面关注'}
4. 改进方面：${improvements.join(', ') || '全面改进'}
5. 确保文章原创性，避免直接复制
6. 保持行业专业性和准确性
7. 适应当前文章的主题和目标受众

参考文章内容：
${referenceContent}

请基于以上要求，创作一篇新的文章。`
            }
          ],
          max_tokens: 3000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error('Failed to rewrite content')
      }

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error('Failed to rewrite content:', error)
      throw error
    }
  }

  // 获取文章封面图片
  getCoverImage() {
    // 1. 检查是否有用户设置的封面
    const customCover = this.get('coverImage');
    if (customCover) {
      return customCover;
    }

    // 2. 从文章内容中提取第一张图片
    const content = this.get('content') || '';
    const imgRegex = /<img[^>]+src="([^">]+)"/;
    const match = content.match(imgRegex);
    if (match && match[1]) {
      return match[1];
    }

    // 3. 返回默认封面
    return '/images/default-article-cover.jpg';
  }

  // 生成文章配图
  async generateCoverImage() {
    try {
      // 生成SVG封面
      const svgContent = await this.generateSVGCover();
      
      // 将SVG内容转换为Data URL
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
      
      // 设置文章封面
      this.set('coverImage', svgDataUrl);
      await this.save();
      
      return svgDataUrl;
    } catch (error) {
      console.error('Failed to generate cover image:', error);
      // 如果生成失败，使用默认封面
      const defaultCover = '/images/default-article-cover.svg';
      this.set('coverImage', defaultCover);
      await this.save();
      return defaultCover;
    }
  }

  // 生成SVG封面
  async generateSVGCover() {
    // 从文章标题和分类生成颜色
    const colors = this.generateColorScheme();
    
    // 生成随机装饰图案
    const patterns = this.generatePatterns();
    
    // 根据文章类别选择合适的图标
    const icon = this.generateCategoryIcon();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 定义渐变和图案 -->
  <defs>
    <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
    </linearGradient>
    
    <!-- 装饰图案 -->
    ${patterns}
  </defs>
  
  <!-- 背景 -->
  <rect width="1200" height="630" fill="url(#backgroundGradient)"/>
  
  <!-- 装饰元素 -->
  <g class="decorative-elements" opacity="0.1">
    ${this.generateDecorativeElements()}
  </g>
  
  <!-- 分类图标 -->
  <g transform="translate(550, 200)">
    ${icon}
  </g>
  
  <!-- 文章标题 -->
  <text x="600" y="400" 
    font-family="Arial, sans-serif" 
    font-size="40" 
    fill="white" 
    text-anchor="middle" 
    font-weight="bold">
    ${this.escapeXML(this.title)}
  </text>
  
  <!-- 分类标签 -->
  <text x="600" y="450" 
    font-family="Arial, sans-serif" 
    font-size="24" 
    fill="white" 
    text-anchor="middle" 
    opacity="0.8">
    ${this.escapeXML(this.get('category'))}
  </text>
  
  <!-- 底部装饰 -->
  <path d="M0 500 Q 300 450, 600 500 T 1200 500 V 630 H 0 Z" 
    fill="white" 
    opacity="0.1"/>
</svg>`;
  }

  // 生成颜色方案
  generateColorScheme() {
    const categoryColors = {
      knowledge: { primary: '#4F46E5', secondary: '#7C3AED' },
      news: { primary: '#059669', secondary: '#047857' },
      ai_music: { primary: '#DB2777', secondary: '#9D174D' }
    };
    
    return categoryColors[this.category] || { primary: '#4F46E5', secondary: '#7C3AED' };
  }

  // 生成装饰图案
  generatePatterns() {
    return `
    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1" fill="white" fill-opacity="0.2"/>
    </pattern>
    <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" stroke="white" stroke-width="0.5" fill="none" opacity="0.1"/>
    </pattern>`;
  }

  // 生成分类图标
  generateCategoryIcon() {
    const icons = {
      knowledge: `<path d="M12 14l9-5-9-5-9 5 9 5z" fill="white"/>
                  <path d="M12 16l9-5v10l-9 5-9-5V11l9 5z" fill="white" opacity="0.8"/>`,
      news: `<path d="M19 20H5V4h14v16z M7 8h10M7 12h10M7 16h7" stroke="white" stroke-width="2" fill="none"/>`,
      ai_music: `<path d="M9 18V5l12-2v13" stroke="white" stroke-width="2" fill="none"/>
                 <circle cx="6" cy="18" r="3" stroke="white" stroke-width="2" fill="none"/>
                 <circle cx="18" cy="16" r="3" stroke="white" stroke-width="2" fill="none"/>`
    };
    
    return icons[this.category] || icons.knowledge;
  }

  // 生成装饰元素
  generateDecorativeElements() {
    return `
    <circle cx="200" cy="150" r="80" fill="white" opacity="0.1"/>
    <circle cx="1000" cy="480" r="100" fill="white" opacity="0.1"/>
    <rect x="100" y="300" width="40" height="40" transform="rotate(45)" fill="white" opacity="0.1"/>
    <rect x="900" y="200" width="60" height="60" transform="rotate(30)" fill="white" opacity="0.1"/>`;
  }

  // XML转义
  escapeXML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

AV.Object.register(Article) 