import { ElMessage } from 'element-plus'

export const useMessage = () => {
  const success = (message) => {
    ElMessage({
      message,
      type: 'success',
      duration: 3000
    })
  }

  const error = (message) => {
    ElMessage({
      message,
      type: 'error',
      duration: 5000
    })
  }

  const warning = (message) => {
    ElMessage({
      message,
      type: 'warning',
      duration: 4000
    })
  }

  const info = (message) => {
    ElMessage({
      message,
      type: 'info',
      duration: 3000
    })
  }

  return {
    success,
    error,
    warning,
    info
  }
}

export default useMessage