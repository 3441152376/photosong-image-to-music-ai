<template>
  <div class="pricing-page">
    <TheNavbar />
    
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="container">
        <h1 class="hero-title">{{ t('pricing.title') }}</h1>
        <p class="hero-subtitle">{{ t('pricing.subtitle') }}</p>
        <p class="hero-description">{{ t('pricing.description') }}</p>
        
        <!-- 添加登录提示 -->
        <div v-if="!userStore.isAuthenticated" class="login-prompt glass-card">
          <el-alert
            :title="t('pricing.loginPrompt.title')"
            :description="t('pricing.loginPrompt.description')"
            type="info"
            show-icon
            :closable="false"
            class="mb-4"
          />
          <el-button 
            type="primary" 
            class="login-btn"
            @click="handleLoginClick"
          >
            {{ t('pricing.loginPrompt.button') }}
          </el-button>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- 会员方案 -->
      <div class="pricing-plans-section">
        <div class="pricing-grid">
        <!-- 体验会员 -->
          <div class="plan-card">
          <div class="plan-header">
            <h3>{{ t('pricing.plans.starter.name') }}</h3>
            <div class="price">
              <span class="amount">5</span>
              <span class="currency">$</span>
              <span class="period">/{{ t('pricing.plans.period.month') }}</span>
            </div>
          </div>
          <div class="plan-features">
            <div v-for="feature in pricingConfig.memberships[0].features" 
                 :key="feature" 
                 class="feature">
              <el-icon><Check /></el-icon>
              <span>{{ t(`pricing.plans.starter.features.${feature}`) }}</span>
            </div>
          </div>
            <el-button type="primary" class="subscribe-btn" :loading="isLoading" @click="handleSubscribe('trial')">
              {{ t('pricing.plans.starter.name') }}
            </el-button>
        </div>

        <!-- 进阶会员 -->
          <div class="plan-card popular">
            <div class="popular-badge">{{ t('pricing.membership.mostPopular') }}</div>
          <div class="plan-header">
            <h3>{{ t('pricing.plans.advanced.name') }}</h3>
            <div class="price">
              <span class="amount">15</span>
              <span class="currency">$</span>
              <span class="period">/{{ t('pricing.plans.period.month') }}</span>
            </div>
          </div>
          <div class="plan-features">
            <div v-for="feature in pricingConfig.memberships[1].features" 
                 :key="feature" 
                 class="feature">
              <el-icon><Check /></el-icon>
              <span>{{ t(`pricing.plans.advanced.features.${feature}`) }}</span>
            </div>
          </div>
            <el-button type="primary" class="subscribe-btn glow" :loading="isLoading" @click="handleSubscribe('pro')">
              {{ t('pricing.plans.advanced.name') }}
            </el-button>
        </div>

        <!-- 专业会员 -->
          <div class="plan-card">
          <div class="plan-header">
            <h3>{{ t('pricing.plans.pro.name') }}</h3>
            <div class="price">
              <span class="amount">99</span>
              <span class="currency">$</span>
              <span class="period">/{{ t('pricing.plans.period.year') }}</span>
            </div>
          </div>
          <div class="plan-features">
            <div v-for="feature in pricingConfig.memberships[2].features" 
                 :key="feature" 
                 class="feature">
              <el-icon><Check /></el-icon>
              <span>{{ t(`pricing.plans.pro.features.${feature}`) }}</span>
            </div>
          </div>
            <el-button type="primary" class="subscribe-btn" :loading="isLoading" @click="handleSubscribe('premium')">
              {{ t('pricing.plans.pro.name') }}
            </el-button>
        </div>

        <!-- 永久会员 -->
          <div class="plan-card lifetime">
            <div class="lifetime-badge">∞</div>
          <div class="plan-header">
            <h3>{{ t('pricing.plans.lifetime.name') }}</h3>
            <div class="price">
                <span class="amount">400</span>
              <span class="currency">$</span>
              <span class="period">/{{ t('pricing.plans.period.lifetime') }}</span>
            </div>
          </div>
          <div class="plan-features">
            <div v-for="feature in pricingConfig.memberships[3].features" 
                 :key="feature" 
                 class="feature">
              <el-icon><Check /></el-icon>
              <span>{{ t(`pricing.plans.lifetime.features.${feature}`) }}</span>
            </div>
          </div>
            <el-button type="primary" class="subscribe-btn lifetime-btn" :loading="isLoading" @click="handleSubscribe('lifetime')">
              {{ t('pricing.plans.lifetime.name') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 
      <div class="points-section">
        <h2 class="section-title">{{ t('pricing.points.title') }}</h2>
        <div class="points-rate">{{ t('pricing.points.rate') }}</div>
        <div class="points-grid">
          <div v-for="(pkg, index) in pricingConfig.points.packages" 
               :key="index" 
               class="points-card"
               :class="{ 'recommended': index === 1 }"
          >
            <div v-if="index === 1" class="recommended-badge">
              {{ t('pricing.points.packages.recommended') }}
            </div>
            <h3>{{ t(`pricing.points.packages.${index}.name`) }}</h3>
            <div class="points-amount">
              <span class="points-value">{{ pkg.points }}</span>
              <span class="points-unit">{{ t('pricing.points.unit') }}</span>
            </div>
            <div class="points-price">
              <span class="currency">$</span>
              <span class="amount">{{ pkg.price }}</span>
            </div>
            <p class="points-desc">{{ t(`pricing.points.packages.${index}.description`) }}</p>
            <el-button 
              type="primary" 
              class="purchase-btn"
              :class="{ 'glow': index === 1 }"
              :loading="isLoading"
              @click="handlePurchase(pkg, index)"
            >
              {{ t('pricing.points.packages.buyNow') }}
            </el-button>
          </div>
        </div>
      </div>
积分购买 -->
      <!-- 会员特权说明 -->
      <div class="benefits-section">
        <h2 class="section-title">{{ t('pricing.membership.benefits.title') }}</h2>
        <div class="benefits-grid">
          <div v-for="(benefit, key) in ['advanced', 'templates', 'copyright', 'priority']"
               :key="key"
               class="benefit-card">
            <div class="benefit-icon">
              <el-icon v-if="key === 'advanced'"><MagicStick /></el-icon>
              <el-icon v-else-if="key === 'templates'"><Collection /></el-icon>
              <el-icon v-else-if="key === 'copyright'"><CopyDocument /></el-icon>
              <el-icon v-else><Star /></el-icon>
          </div>
            <h3>{{ t(`pricing.membership.benefits.features.${benefit}.title`) }}</h3>
            <p>{{ t(`pricing.membership.benefits.features.${benefit}.description`) }}</p>
            <ul class="benefit-list">
              <li v-for="detail in t(`pricing.membership.benefits.features.${benefit}.details`).split('\n')"
                  :key="detail">
                {{ detail }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pricing-page {
  min-height: 100vh;
  background: linear-gradient(
    to bottom,
    var(--background-start),
    var(--background-end)
  );
}

.hero-section {
  padding: 120px 0 60px;
  text-align: center;
  background: linear-gradient(
    135deg,
    rgba(var(--primary-color-rgb), 0.1),
    rgba(var(--accent-color-rgb), 0.1)
  );
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.hero-description {
  font-size: 1.1rem;
  color: var(--text-color-light);
  max-width: 800px;
  margin: 0 auto;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section-title {
    font-size: 2rem;
  text-align: center;
  margin: 3rem 0;
    color: var(--text-color);
  }

/* 会员方案卡片 */
.pricing-plans-section {
  padding: 4rem 0;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 4rem;
}

.plan-card {
  position: relative;
  background: var(--card-background);
  border-radius: 1.5rem;
  padding: 2rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid var(--border-color);
}

.plan-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.plan-card.popular {
  background: linear-gradient(
    135deg,
    rgba(var(--primary-color-rgb), 0.1),
    rgba(var(--accent-color-rgb), 0.1)
  );
  border: 2px solid var(--primary-color);
    transform: scale(1.05);
}

.popular-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.lifetime-badge {
  position: absolute;
  top: -15px;
  right: 20px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.plan-header {
  text-align: center;
  margin-bottom: 2rem;
}
  
.plan-header h3 {
    font-size: 1.5rem;
    color: var(--text-color);
    margin-bottom: 1rem;
  }
  
  .price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
}
    
.price .amount {
  font-size: 3.5rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    
.price .currency {
      font-size: 1.5rem;
      color: var(--text-color);
    }
    
.price .period {
      color: var(--text-color-light);
}

.plan-features {
  margin-bottom: 2rem;
}
  
  .feature {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}
    
.feature .el-icon {
      color: var(--primary-color);
}

.subscribe-btn {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.subscribe-btn.glow {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  box-shadow: 0 4px 15px rgba(var(--primary-color-rgb), 0.3);
}

.subscribe-btn.lifetime-btn {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border: none;
}

/* 积分购买部分 */
.points-section {
  padding: 4rem 0;
  background: linear-gradient(
    to bottom,
    rgba(var(--primary-color-rgb), 0.05),
    rgba(var(--accent-color-rgb), 0.05)
  );
  border-radius: 2rem;
  margin: 4rem 0;
}

.points-rate {
  text-align: center;
  font-size: 1.25rem;
  color: var(--text-color);
  margin-bottom: 3rem;
  padding: 1rem;
  background: rgba(var(--primary-color-rgb), 0.1);
  border-radius: 1rem;
  max-width: 400px;
  margin: 0 auto 3rem;
}

.points-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  padding: 0 2rem;
}

.points-card {
  position: relative;
  background: var(--card-background);
  border-radius: 1.5rem;
  padding: 2rem;
  text-align: center;
  transition: transform 0.3s ease;
  border: 1px solid var(--border-color);
}

.points-card:hover {
  transform: translateY(-8px);
}

.points-card.recommended {
  background: linear-gradient(
    135deg,
    rgba(var(--primary-color-rgb), 0.1),
    rgba(var(--accent-color-rgb), 0.1)
  );
  border: 2px solid var(--primary-color);
}

.recommended-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
}

.points-amount {
  margin: 1.5rem 0;
}

.points-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.points-unit {
  font-size: 1rem;
  color: var(--text-color-light);
  margin-left: 0.5rem;
}

.points-price {
  font-size: 1.5rem;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.points-desc {
  color: var(--text-color-light);
  margin-bottom: 1.5rem;
  min-height: 2.5em;
}

.purchase-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
}

.purchase-btn.glow {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  box-shadow: 0 4px 15px rgba(var(--primary-color-rgb), 0.3);
}

/* 会员特权说明 */
.benefits-section {
  padding: 4rem 0;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.benefit-card {
  background: var(--card-background);
  border-radius: 1.5rem;
  padding: 2rem;
  transition: transform 0.3s ease;
  border: 1px solid var(--border-color);
}
  
.benefit-card:hover {
  transform: translateY(-8px);
  }
  
.benefit-icon {
  font-size: 2.5rem;
    color: var(--primary-color);
  margin-bottom: 1.5rem;
}

.benefit-card h3 {
  font-size: 1.5rem;
  color: var(--text-color);
    margin-bottom: 1rem;
  }
  
.benefit-card p {
  color: var(--text-color-light);
  margin-bottom: 1.5rem;
}

.benefit-list {
  list-style: none;
  padding: 0;
}

.benefit-list li {
    display: flex;
    align-items: center;
  margin-bottom: 0.75rem;
  color: var(--text-color);
}
    
.benefit-list li::before {
      content: "•";
      color: var(--primary-color);
  margin-right: 0.75rem;
  font-size: 1.2rem;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .pricing-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .points-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .pricing-grid,
  .points-grid,
  .benefits-grid {
    grid-template-columns: 1fr;
  }
  
  .plan-card.popular {
    transform: none;
  }
  
  .points-section {
    margin: 2rem 0;
    padding: 2rem 0;
  }
}

/* 暗色主题适配 */
:root[data-theme="dark"] {
  --card-background: rgba(255, 255, 255, 0.05);
  --border-color: rgba(255, 255, 255, 0.1);
}

.login-prompt {
  margin-top: 2rem;
  padding: 2rem;
  text-align: center;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
}

.login-prompt :deep(.el-alert) {
  background: transparent;
  border: none;
  padding: 0;
  margin-bottom: 1.5rem;
}

.login-prompt :deep(.el-alert__title) {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.login-prompt :deep(.el-alert__description) {
  font-size: 1rem;
  color: var(--text-color-light);
  margin-top: 0.5rem;
}

.login-btn {
  min-width: 200px;
  height: 48px;
  font-size: 1.125rem;
}
</style>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Check, MagicStick, Collection, CopyDocument, Star } from '@element-plus/icons-vue'
import TheNavbar from '../components/TheNavbar.vue'
import pricingConfig from '../config/pricing.json'
import { createCheckoutSession, PRICE_IDS } from '../services/payment'
import { useUserStore } from '../stores/user'

const router = useRouter()
const { t, i18n } = useI18n()
const isLoading = ref(false)
const userStore = useUserStore()

// 处理会员订阅
const handleSubscribe = async (plan) => {
  try {
    if (!userStore.isAuthenticated) {
      ElMessage.warning(t('payment.errors.unauthorized'))
      router.push({ 
        name: `${locale.value}-Auth`,
        query: { redirect: router.currentRoute.value.fullPath }
      })
      return
    }

    isLoading.value = true
    const priceId = PRICE_IDS.memberships[plan]
    const { url } = await createCheckoutSession(priceId, {
      planType: 'subscription',
      plan
    })
    window.location.href = url
  } catch (error) {
    handlePaymentError(error)
  } finally {
    isLoading.value = false
  }
}

// 处理积分购买
const handlePurchase = async (pkg, index) => {
  try {
    if (!userStore.isAuthenticated) {
      ElMessage.warning(t('payment.errors.unauthorized'))
      router.push({ 
        name: `${locale.value}-Auth`,
        query: { redirect: router.currentRoute.value.fullPath }
      })
      return
    }

    isLoading.value = true
    const pointsType = ['small', 'medium', 'large'][index]
    const priceId = PRICE_IDS.points[pointsType]
    const { url } = await createCheckoutSession(priceId, {
      planType: 'points',
      points: pkg.points
    })
    window.location.href = url
  } catch (error) {
    handlePaymentError(error)
  } finally {
    isLoading.value = false
  }
}

// 处理支付错误
const handlePaymentError = (error) => {
  console.error('Payment error:', error)
  if (error.response) {
    switch (error.response.status) {
      case 400:
        ElMessage.error(t('payment.errors.invalidPrice'))
        break
      case 401:
        ElMessage.error(t('payment.errors.unauthorized'))
        break
      case 500:
        ElMessage.error(t('payment.errors.server'))
        break
      default:
        ElMessage.error(t('payment.errors.default'))
    }
  } else {
    ElMessage.error(t('payment.errors.network'))
  }
}

// 处理登录点击
const handleLoginClick = async () => {
  try {
    const currentLocale = i18n.global.locale.value // 获取当前语言
    const result = await userStore.login()
    if (result.success) {
      ElMessage.success(t('login.success'))
      router.push(`/${currentLocale}/create`)
    } else {
      ElMessage.error(result.message || t('login.failed'))
    }
  } catch (error) {
    console.error('Login failed:', error)
    ElMessage.error(t('login.failed'))
  }
}
</script>    