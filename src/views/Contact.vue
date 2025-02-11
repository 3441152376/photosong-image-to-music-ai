<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import TheNavbar from '../components/TheNavbar.vue'
import TheFooter from '../components/TheFooter.vue'

const { t } = useI18n()

const contactForm = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const loading = ref(false)

const handleSubmit = async () => {
  try {
    loading.value = true
    // TODO: 实现发送联系表单的逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success(t('contact.success'))
    contactForm.value = {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  } catch (error) {
    ElMessage.error(t('contact.error'))
  } finally {
    loading.value = false
  }
}

const contactMethods = [
  {
    icon: 'Message',
    title: t('contact.email.title'),
    description: t('contact.email.description'),
    value: 'wuyanzu@photosong.com'
  },
  {
    icon: 'Service',
    title: t('contact.support.title'),
    description: t('contact.support.description'),
    value: t('contact.support.hours')
  },
  {
    icon: 'Location',
    title: t('contact.address.title'),
    description: t('contact.address.description'),
    value: t('contact.address.value')
  }
]
</script>

<template>
  <div class="contact-page">
    <TheNavbar />
    
    <div class="container">
      <h1 class="page-title">{{ t('contact.title') }}</h1>
      
      <div class="contact-grid">
        <!-- Contact Methods -->
        <div class="contact-methods">
          <div v-for="method in contactMethods" 
               :key="method.title"
               class="contact-method-card"
          >
            <el-icon class="method-icon">
              <component :is="method.icon" />
            </el-icon>
            <div class="method-content">
              <h3>{{ method.title }}</h3>
              <p>{{ method.description }}</p>
              <template v-if="method.icon === 'Location'">
                <div class="address-section">
                  <div class="address-item">
                    <h4>{{ t('contact.address.hk.title') }}</h4>
                    <div class="method-value">{{ t('contact.address.hk.value') }}</div>
                  </div>
                  <div class="address-item">
                    <h4>{{ t('contact.address.us.title') }}</h4>
                    <div class="method-value">{{ t('contact.address.us.value') }}</div>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="method-value">{{ method.value }}</div>
              </template>
            </div>
          </div>
        </div>
        
        <!-- Contact Form -->
        <div class="contact-form-section">
          <h2>{{ t('contact.form.title') }}</h2>
          <p class="form-description">{{ t('contact.form.description') }}</p>
          
          <form @submit.prevent="handleSubmit" class="contact-form">
            <div class="form-grid">
              <el-input
                v-model="contactForm.name"
                :placeholder="t('contact.form.name')"
                required
              />
              
              <el-input
                v-model="contactForm.email"
                type="email"
                :placeholder="t('contact.form.email')"
                required
              />
            </div>
            
            <el-input
              v-model="contactForm.subject"
              :placeholder="t('contact.form.subject')"
              required
            />
            
            <el-input
              v-model="contactForm.message"
              type="textarea"
              :rows="6"
              :placeholder="t('contact.form.message')"
              required
            />
            
            <el-button 
              type="primary" 
              native-type="submit"
              :loading="loading"
              class="submit-btn"
            >
              {{ t('contact.form.submit') }}
            </el-button>
          </form>
        </div>
      </div>
      
      <!-- FAQ Section -->
      <div class="faq-section">
        <h2>{{ t('contact.faq.title') }}</h2>
        <p>{{ t('contact.faq.description') }}</p>
        <router-link to="/faq" class="faq-link">
          {{ t('contact.faq.link') }}
        </router-link>
      </div>
    </div>
    
    <TheFooter />
  </div>
</template>

<style scoped lang="scss">
.contact-page {
  min-height: 100vh;
  padding-top: 80px;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 3rem;
  margin: 3rem 0;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.contact-methods {
  display: grid;
  gap: 1.5rem;
}

.contact-method-card {
  background: var(--surface-color);
  border-radius: 1rem;
  padding: 1.5rem;
  border: var(--glass-border);
  display: flex;
  gap: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.method-icon {
  font-size: 2rem;
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.1);
  padding: 1rem;
  border-radius: 0.75rem;
}

.method-content {
  flex: 1;
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: var(--text-color);
  }
  
  p {
    color: var(--text-color-secondary);
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
  }
}

.method-value {
  font-weight: 500;
  color: var(--primary-color);
}

.contact-form-section {
  background: var(--surface-color);
  border-radius: 1rem;
  padding: 2rem;
  border: var(--glass-border);
  
  h2 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}

.form-description {
  color: var(--text-color-secondary);
  margin-bottom: 2rem;
}

.contact-form {
  display: grid;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.submit-btn {
  justify-self: start;
  min-width: 200px;
}

.faq-section {
  text-align: center;
  margin: 4rem 0;
  padding: 3rem;
  background: var(--surface-color);
  border-radius: 1rem;
  border: var(--glass-border);
  
  h2 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
    color: var(--text-color);
  }
  
  p {
    color: var(--text-color-secondary);
    margin-bottom: 1.5rem;
  }
}

.faq-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
}

.address-section {
  display: grid;
  gap: 1rem;
  margin-top: 0.5rem;
}

.address-item {
  h4 {
    font-size: 0.875rem;
    color: var(--text-color);
    margin-bottom: 0.25rem;
    font-weight: 500;
  }
  
  .method-value {
    font-size: 0.875rem;
  }
}
</style> 