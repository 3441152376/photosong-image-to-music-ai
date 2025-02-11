import { ref } from 'vue'

// Exponential backoff retry utility
export const retryWithDelay = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let retries = 0
  
  while (retries < maxRetries) {
    try {
      return await fn()
    } catch (error) {
      retries++
      
      // If it's not a rate limit error or we've exhausted retries, throw
      if (error?.status !== 429 || retries === maxRetries) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, retries - 1)
      
      // Add some randomness to prevent thundering herd
      const jitter = Math.random() * 1000
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay + jitter))
    }
  }
} 