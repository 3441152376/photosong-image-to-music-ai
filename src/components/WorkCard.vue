import { ref } from 'vue'
import { View, Star, Picture } from '@element-plus/icons-vue'
import LazyImage from './LazyImage.vue'
import imageCache from '../utils/imageCache'

const props = defineProps({
  work: {
    type: Object,
    required: true
  }
})

const loading = ref(true)

// 格式化数字
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num
}

// 处理图片加载完成
const handleImageLoad = () => {
  loading.value = false
}

// 处理图片加载错误
const handleImageError = () => {
  loading.value = false
}

// 预加载作者头像
if (props.work.author?.avatar) {
  imageCache.preload([props.work.author.avatar])
}

// ... existing code ... 