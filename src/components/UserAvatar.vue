const avatarClickCount = ref(0)
let avatarClickTimeout = null

const handleAvatarClick = () => {
  avatarClickCount.value++
  
  // 清除之前的超时
  if (avatarClickTimeout) {
    clearTimeout(avatarClickTimeout)
  }
  
  // 设置新的超时 - 2秒后重置计数
  avatarClickTimeout = setTimeout(() => {
    avatarClickCount.value = 0
  }, 2000)
  
  // 检查是否达到7次点击
  if (avatarClickCount.value === 7) {
    triggerAvatarEasterEgg()
    avatarClickCount.value = 0
  }
}

const triggerAvatarEasterEgg = () => {
  const avatar = document.querySelector('.user-avatar')
  if (!avatar) return
  
  // 播放音效
  const audio = new Audio('/easter-egg-sound.mp3')
  audio.play()
  
  // 添加动画类
  avatar.classList.add('avatar-spin')
  
  // 3秒后移除动画类
  setTimeout(() => {
    avatar.classList.remove('avatar-spin')
  }, 3000)
}

<style scoped>
.avatar-spin {
  animation: spinAvatar 3s ease-in-out;
  transform-origin: center;
}

@keyframes spinAvatar {
  0% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.2) rotate(360deg);
  }
  50% {
    transform: scale(0.8) rotate(720deg);
  }
  75% {
    transform: scale(1.1) rotate(1080deg);
  }
  100% {
    transform: scale(1) rotate(1440deg);
  }
}
</style> 