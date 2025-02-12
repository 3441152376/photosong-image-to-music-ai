// 优化图片URL
export const optimizeImageUrl = (url, options = {}) => {
  if (!url) return ''
  
  // 如果是外部URL或者数据URL,直接返回
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }

  // 默认参数
  const defaults = {
    width: 800,
    quality: 80,
    format: 'webp'
  }

  const config = { ...defaults, ...options }
  
  try {
    // 如果是S3 URL,添加优化参数
    if (url.includes('lc-gluttony.s3.amazonaws.com')) {
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}x-oss-process=image/resize,w_${config.width}/quality,q_${config.quality}/format,${config.format}`
    }
    
    // 如果是本地资源,添加优化参数
    if (url.startsWith('/')) {
      return `${url}?w=${config.width}&q=${config.quality}&fmt=${config.format}`
    }
    
    return url
  } catch (error) {
    console.error('Image URL optimization failed:', error)
    return url
  }
}

// 生成响应式图片源集
export const generateSrcSet = (url, sizes = [320, 640, 960, 1280]) => {
  if (!url) return ''
  
  try {
    return sizes
      .map(size => `${optimizeImageUrl(url, { width: size })} ${size}w`)
      .join(', ')
  } catch (error) {
    console.error('Generate srcset failed:', error)
    return url
  }
}

// 生成响应式尺寸
export const generateSizes = (breakpoints = [
  { width: 640, size: '100vw' },
  { width: 1024, size: '50vw' },
  { width: 1280, size: '33vw' }
]) => {
  try {
    return breakpoints
      .map(({ width, size }) => `(max-width: ${width}px) ${size}`)
      .join(', ')
      .concat(`, ${breakpoints[breakpoints.length - 1].size}`)
  } catch (error) {
    console.error('Generate sizes failed:', error)
    return '100vw'
  }
}

// 预加载图片
export const preloadImage = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = optimizeImageUrl(url, options)
  })
}

// 批量预加载图片
export const preloadImages = async (urls = [], options = {}) => {
  try {
    const promises = urls.map(url => preloadImage(url, options))
    return await Promise.all(promises)
  } catch (error) {
    console.error('Batch preload images failed:', error)
    return []
  }
}

// 检查图片是否已加载
export const isImageLoaded = (imgElement) => {
  return imgElement.complete && imgElement.naturalHeight !== 0
}

// 获取图片的主要颜色
export const getImageDominantColor = async (url) => {
  try {
    const img = await preloadImage(url)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = 1
    canvas.height = 1
    
    ctx.drawImage(img, 0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    
    return `rgb(${r}, ${g}, ${b})`
  } catch (error) {
    console.error('Get image dominant color failed:', error)
    return 'rgb(128, 128, 128)' // 返回默认灰色
  }
}

// 检查图片尺寸是否符合要求
export const validateImageDimensions = async (file, { minWidth = 0, minHeight = 0, maxWidth = Infinity, maxHeight = Infinity } = {}) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const valid = (
          img.width >= minWidth &&
          img.height >= minHeight &&
          img.width <= maxWidth &&
          img.height <= maxHeight
        )
        resolve({
          valid,
          width: img.width,
          height: img.height
        })
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// 压缩图片
export const compressImage = async (file, { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = {}) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        
        // 计算缩放比例
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob failed'))
              return
            }
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }))
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// 图片 SEO 优化相关函数
export const generateImageAltText = async (imageUrl, context = {}) => {
  try {
    const altText = {
      zh: '',
      en: '',
      ru: ''
    }
    
    // 根据上下文生成 alt 文本
    Object.keys(altText).forEach(lang => {
      const prefix = context.type ? `${context.type} - ` : ''
      const title = context.title?.[lang] || context.title || ''
      const description = context.description?.[lang] || context.description || ''
      
      altText[lang] = `${prefix}${title} ${description}`.trim()
    })
    
    return altText
  } catch (error) {
    console.error('Generate alt text failed:', error)
    return {}
  }
}

// 生成图片的结构化数据
export const generateImageStructuredData = (imageUrl, options = {}) => {
  try {
    return {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      contentUrl: imageUrl,
      license: 'https://photosong.com/license',
      acquireLicensePage: 'https://photosong.com/license',
      creditText: options.creditText || 'PhotoSong',
      creator: {
        '@type': 'Organization',
        name: 'PhotoSong',
        url: 'https://photosong.com'
      },
      copyrightNotice: `© ${new Date().getFullYear()} PhotoSong`,
      ...options
    }
  } catch (error) {
    console.error('Generate image structured data failed:', error)
    return {}
  }
}

// 计算图片关键词权重
export const calculateImageKeywords = async (imageUrl, options = {}) => {
  try {
    const keywords = new Map()
    
    // 添加基础关键词
    const baseKeywords = {
      'photo': 10,
      'image': 9,
      'picture': 8,
      'photography': 7,
      '图片': 10,
      '照片': 9,
      '摄影': 8,
      'фото': 10,
      'изображение': 9,
      'картина': 8
    }
    
    Object.entries(baseKeywords).forEach(([keyword, weight]) => {
      keywords.set(keyword, weight)
    })
    
    // 添加上下文关键词
    if (options.context) {
      const contextKeywords = extractContextKeywords(options.context)
      contextKeywords.forEach((weight, keyword) => {
        const existingWeight = keywords.get(keyword) || 0
        keywords.set(keyword, existingWeight + weight)
      })
    }
    
    return keywords
  } catch (error) {
    console.error('Calculate image keywords failed:', error)
    return new Map()
  }
}

// 从上下文提取关键词
function extractContextKeywords(context) {
  const keywords = new Map()
  
  try {
    // 使用不同语言的分词器处理文本
    const segmenters = {
      zh: new Intl.Segmenter('zh', { granularity: 'word' }),
      en: new Intl.Segmenter('en', { granularity: 'word' }),
      ru: new Intl.Segmenter('ru', { granularity: 'word' })
    }
    
    Object.entries(context).forEach(([lang, text]) => {
      if (!text) return
      
      const segmenter = segmenters[lang]
      if (!segmenter) return
      
      const segments = Array.from(segmenter.segment(text))
      segments.forEach(segment => {
        const word = segment.segment.toLowerCase().trim()
        if (word.length > 1) {
          const existingWeight = keywords.get(word) || 0
          keywords.set(word, existingWeight + 1)
        }
      })
    })
  } catch (error) {
    console.error('Extract context keywords failed:', error)
  }
  
  return keywords
}

// 优化图片文件名
export const optimizeImageFilename = (originalFilename, options = {}) => {
  try {
    const { title, lang = 'en' } = options
    
    // 移除扩展名
    const extension = originalFilename.split('.').pop()
    let basename = originalFilename.replace(`.${extension}`, '')
    
    // 如果有标题，使用标题
    if (title) {
      basename = title
    }
    
    // 清理文件名
    basename = basename
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .replace(/-+/g, '-') // 多个连字符替换为单个
      .trim()
    
    // 添加语言代码（如果不是英语）
    const langSuffix = lang !== 'en' ? `-${lang}` : ''
    
    // 添加随机字符串避免重名
    const uniqueSuffix = `-${nanoid(6)}`
    
    return `${basename}${langSuffix}${uniqueSuffix}.${extension}`
  } catch (error) {
    console.error('Optimize image filename failed:', error)
    return originalFilename
  }
} 