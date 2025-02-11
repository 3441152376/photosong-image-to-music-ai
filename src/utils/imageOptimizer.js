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