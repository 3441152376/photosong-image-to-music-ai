import { ref } from 'vue'
import AV from 'leancloud-storage'
import { retryWithDelay } from '../utils/retry'

export const useUser = () => {
  const currentUser = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchCurrentUser = async () => {
    loading.value = true
    error.value = null
    
    try {
      const user = await retryWithDelay(() => AV.User.current())
      currentUser.value = user
    } catch (err) {
      error.value = err
      console.error('Failed to fetch current user:', err)
    } finally {
      loading.value = false
    }
  }

  const updateUserProfile = async (updates) => {
    if (!currentUser.value) throw new Error('No user logged in')
    
    try {
      const user = currentUser.value
      Object.entries(updates).forEach(([key, value]) => {
        user.set(key, value)
      })
      
      await retryWithDelay(() => user.save())
      currentUser.value = user
    } catch (err) {
      console.error('Failed to update user profile:', err)
      throw err
    }
  }

  return {
    currentUser,
    loading,
    error,
    fetchCurrentUser,
    updateUserProfile
  }
} 