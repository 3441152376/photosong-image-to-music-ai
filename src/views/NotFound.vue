<script setup>
import { useRouter } from 'vue-router'
import TheNavbar from '../components/TheNavbar.vue'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <TheNavbar />
    
    <div class="container not-found-container">
      <div class="not-found-content">
        <h1 class="error-code">404</h1>
        <h2 class="error-title">页面未找到</h2>
        <p class="error-description">
          抱歉，您访问的页面不存在或已被移除。
        </p>
        <div class="error-actions">
          <el-button type="primary" @click="router.push('/')">
            返回首页
          </el-button>
          <el-button @click="router.back()">
            返回上一页
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e5e9ff 100%);
}

.not-found-container {
  padding: 120px 1rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 640px) {
    padding: 80px 1rem 1rem;
  }
}

.not-found-content {
  text-align: center;
  max-width: 480px;
  width: 100%;
}

.error-code {
  font-size: 8rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 1rem;
  background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 640px) {
    font-size: 6rem;
  }
}

.error-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-color);

  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
}

.error-description {
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 2rem;

  @media (max-width: 640px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0 2rem;
  }
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style> 