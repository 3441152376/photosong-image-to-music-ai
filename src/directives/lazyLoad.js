const loadImage = (el) => {
  const imageElement = Array.from(el.children).find(
    (el) => el.nodeName === "IMG"
  )
  if (imageElement) {
    // 添加默认图片
    const defaultImage = '/placeholder.jpg'
    
    // 使用 Intersection Observer 的优化选项
    const options = {
      root: null,
      rootMargin: '50px 0px', // 预加载范围
      threshold: 0.01 // 只需要很小的可见比例就开始加载
    }
    
    // 添加错误处理
    imageElement.addEventListener("error", () => {
      console.warn("Image load failed:", imageElement.dataset.src)
      imageElement.src = defaultImage
      el.classList.add("error")
    }, { once: true }) // 使用 once 选项优化内存
    
    // 添加加载处理
    imageElement.addEventListener("load", () => {
      requestAnimationFrame(() => { // 使用 requestAnimationFrame 优化渲染
        el.classList.add("loaded")
        el.classList.remove("loading")
      })
    }, { once: true })
    
    // 设置加载状态
    el.classList.add("loading")
    
    // 如果图片路径无效，使用默认图片
    const src = imageElement.dataset.src || defaultImage
    
    // 使用 loading="lazy" 属性作为原生懒加载的后备方案
    imageElement.loading = "lazy"
    
    // 预加载图片并使用缓存策略
    if ('caches' in window) {
      caches.open('image-cache').then(cache => {
        cache.match(src).then(response => {
          if (response) {
            imageElement.src = src
          } else {
            const tempImage = new Image()
            tempImage.onload = () => {
              imageElement.src = src
              cache.put(src, new Response(tempImage))
            }
            tempImage.src = src
          }
        })
      })
    } else {
      // 降级处理
      imageElement.src = src
    }
  }
}

export default {
  mounted(el) {
    const options = {
      root: null,
      rootMargin: "50px",
      threshold: 0.1
    }

    function loadCallback(entries, observer) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage(el)
          observer.unobserve(el)
        }
      })
    }

    function createObserver() {
      const observer = new IntersectionObserver(loadCallback, options)
      observer.observe(el)
    }
    
    if (window["IntersectionObserver"]) {
      createObserver()
    } else {
      loadImage(el)
    }
  },
  
  // 添加更新钩子
  updated(el) {
    const imageElement = Array.from(el.children).find(
      (el) => el.nodeName === "IMG"
    )
    if (imageElement && imageElement.dataset.src !== imageElement.src) {
      el.classList.remove("loaded", "error")
      loadImage(el)
    }
  }
} 