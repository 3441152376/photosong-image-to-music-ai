<template>
  <div class="pricing-page">
    <TheNavbar />
    
    <div class="container">
      <div class="pricing-header">
        <br>
        <br>
        <br>
        <br>
        
        <h1 class="gradient-text">{{ t('pricing.title') }}</h1>
        <p class="subtitle">{{ t('pricing.subtitle') }}</p>
      </div>
      
      <!-- 积分
      <div class="points-info glass-card">
        <div class="points-header">
          <el-icon><Star /></el-icon>
          <h2>创作积分说明</h2>
        </div>
        <div class="points-content">
          <p>创作积分是您在平台上进行音乐创作的能量值</p>
          <ul>
            <li>创建一首歌曲消耗 100 积分</li>
            <li>每日登录奖励 10 积分</li>
            <li>分享作品奖励 20 积分</li>
            <li>作品获赞奖励 5 积分</li>
          </ul>
        </div>
      </div>
说明 -->
      <!-- 会员方案 -->
      <div class="pricing-plans">
        <!-- 体验会员 -->
        <div class="plan-card glass-card">
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
          <el-button type="primary" class="subscribe-btn" @click="handleSubscribe('trial')">
            {{ t('pricing.plans.button') }}
          </el-button>
        </div>

        <!-- 进阶会员 -->
        <div class="plan-card glass-card featured">
          <div class="plan-badge">{{ t('pricing.membership.mostPopular') }}</div>
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
          <el-button type="primary" class="subscribe-btn glow" @click="handleSubscribe('pro')">
            {{ t('pricing.plans.button') }}
          </el-button>
        </div>

        <!-- 专业会员 -->
        <div class="plan-card glass-card">
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
          <el-button type="primary" class="subscribe-btn" @click="handleSubscribe('premium')">
            {{ t('pricing.plans.button') }}
          </el-button>
        </div>

        <!-- 永久会员 -->
        <div class="plan-card glass-card special">
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
          <el-button type="primary" class="subscribe-btn special-btn" @click="handleSubscribe('lifetime')">
            {{ t('pricing.plans.button') }}
          </el-button>
        </div>
      </div>

      <!-- 积分购买 -->
      <div class="points-purchase glass-card">
        <h2>{{ t('pricing.points.title') }}</h2>
        <div class="points-rate">{{ t('pricing.points.rate') }}</div>
        <div class="points-packages">
          <div v-for="(pkg, index) in pricingConfig.points.packages" 
               :key="index" 
               class="package"
               :class="{ 'featured': index === 1 }"
          >
            <div class="package-badge" v-if="index === 1">{{ t('pricing.points.packages.recommended') }}</div>
            <h3>{{ t(`pricing.points.packages.${index}.name`) }}</h3>
            <div class="points-amount">
              <span class="points-value">{{ pkg.points }}</span>
              <span class="points-label">{{ t('pricing.points.unit') }}</span>
            </div>
            <div class="points-price">
              <span class="currency">$</span>
              <span class="amount">{{ pkg.price }}</span>
            </div>
            <p class="package-desc">{{ t(`pricing.points.packages.${index}.description`) }}</p>
            <el-button 
              type="primary" 
              class="purchase-btn"
              :class="{ 'glow': index === 1 }"
              @click="handlePurchase(pkg)"
            >
              {{ t('pricing.points.packages.buyNow') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 会员特权说明 -->
      <div class="membership-benefits">
        <h2 class="gradient-text">{{ t('pricing.membership.benefits.title') }}</h2>
        <div class="benefits-grid">
          <div class="benefit-card glass-card">
            <el-icon><MagicStick /></el-icon>
            <h3>{{ t('pricing.membership.benefits.features.advanced.title') }}</h3>
            <p>{{ t('pricing.membership.benefits.features.advanced.description') }}</p>
            <ul class="benefit-details">
              <li v-for="detail in getBenefitDetails('advanced')" :key="detail">
                {{ detail }}
              </li>
            </ul>
          </div>
          <div class="benefit-card glass-card">
            <el-icon><Collection /></el-icon>
            <h3>{{ t('pricing.membership.benefits.features.templates.title') }}</h3>
            <p>{{ t('pricing.membership.benefits.features.templates.description') }}</p>
            <ul class="benefit-details">
              <li v-for="detail in getBenefitDetails('templates')" :key="detail">
                {{ detail }}
              </li>
            </ul>
          </div>
          <div class="benefit-card glass-card">
            <el-icon><CopyDocument /></el-icon>
            <h3>{{ t('pricing.membership.benefits.features.copyright.title') }}</h3>
            <p>{{ t('pricing.membership.benefits.features.copyright.description') }}</p>
            <ul class="benefit-details">
              <li v-for="detail in getBenefitDetails('copyright')" :key="detail">
                {{ detail }}
              </li>
            </ul>
          </div>
          <div class="benefit-card glass-card">
            <el-icon><Star /></el-icon>
            <h3>{{ t('pricing.membership.benefits.features.priority.title') }}</h3>
            <p>{{ t('pricing.membership.benefits.features.priority.description') }}</p>
            <ul class="benefit-details">
              <li v-for="detail in getBenefitDetails('priority')" :key="detail">
                {{ detail }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  Star, 
  Check, 
  MagicStick,
  Collection, 
  CopyDocument 
} from '@element-plus/icons-vue'
import TheNavbar from '../components/TheNavbar.vue'
import { useRouter } from 'vue-router'
import pricingConfig from '../config/pricing.json'

const router = useRouter()
const { t } = useI18n()

// 处理 AudioContext
const initAudioContext = () => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    if (audioContext.state === 'suspended') {
      const resumeAudio = () => {
        audioContext.resume()
        document.removeEventListener('click', resumeAudio)
        document.removeEventListener('touchstart', resumeAudio)
      }
      document.addEventListener('click', resumeAudio)
      document.addEventListener('touchstart', resumeAudio)
    }
  }
}

// 在用户交互时初始化 AudioContext
const handleUserInteraction = () => {
  initAudioContext()
  document.removeEventListener('click', handleUserInteraction)
  document.removeEventListener('touchstart', handleUserInteraction)
}

onMounted(() => {
  document.addEventListener('click', handleUserInteraction)
  document.addEventListener('touchstart', handleUserInteraction)
})

const handleSubscribe = async (plan) => {
  try {
    router.push({
      path: '/auth',
      query: { plan }
    })
  } catch (error) {
    console.error('Subscribe failed:', error)
  }
}

const selectPackage = async (index) => {
  try {
    const packages = pricingConfig.points.packages
    const selected = packages[index]
    // TODO: 实现购买逻辑
  } catch (error) {
    console.error('Purchase failed:', error)
  }
}

// 获取特权图标
const getBenefitIcon = (key) => {
  const icons = {
    advanced: MagicStick,
    templates: Collection,
    copyright: CopyDocument,
    priority: Star
  }
  return icons[key]
}

// 获取特权详情列表
const getBenefitDetails = (key) => {
  const path = `pricing.membership.benefits.features.${key}.details`
  const details = t(path)
  return Array.isArray(details) ? details : []
}
</script>

<style scoped>
.pricing-page {
  min-height: 100vh;
  padding: 2rem 0;
  background: var(--page-background);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.pricing-header {
  text-align: center;
  margin-bottom: 3rem;
}

.gradient-text {
  font-size: 2.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.25rem;
  color: var(--text-color-light);
}

.points-info {
  margin-bottom: 3rem;
  padding: 2rem;
}

.points-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  .el-icon {
    font-size: 2rem;
    color: var(--primary-color);
  }
  
  h2 {
    font-size: 1.5rem;
    color: var(--text-color);
  }
}

.points-content {
  color: var(--text-color-light);
  
  ul {
    margin-top: 1rem;
    padding-left: 1.5rem;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
}

.pricing-plans {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
}

.plan-card {
  position: relative;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  &.featured {
    transform: scale(1.05);
    border-color: var(--primary-color);
  }
}

.plan-badge {
  position: absolute;
  top: -12px;
  right: 2rem;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  padding: 0.25rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
}

.plan-header {
  text-align: center;
  
  h3 {
    font-size: 1.5rem;
    color: var(--text-color);
    margin-bottom: 1rem;
  }
  
  .price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
    
    .amount {
      font-size: 3rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    
    .currency {
      font-size: 1.5rem;
      color: var(--text-color);
    }
    
    .period {
      color: var(--text-color-light);
    }
  }
}

.plan-features {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  .feature {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    .el-icon {
      color: var(--primary-color);
    }
    
    span {
      color: var(--text-color);
    }
  }
}

.subscribe-btn {
  width: 100%;
  height: 48px;
  
  &.glow {
    box-shadow: 0 0 20px rgba(var(--primary-color-rgb), 0.3);
  }
}

.points-purchase {
  padding: 2rem;
  margin-bottom: 3rem;
  
  h2 {
    text-align: center;
    font-size: 1.5rem;
    margin-bottom: 2rem;
    color: var(--text-color);
  }
}

.points-rate {
  text-align: center;
  font-size: 1.25rem;
  color: var(--text-color-light);
  margin: 1rem 0 2rem;
  padding: 0.5rem;
  background: rgba(var(--primary-color-rgb), 0.1);
  border-radius: 0.5rem;
}

.points-packages {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.package {
  position: relative;
  padding: 2rem;
  border-radius: 1rem;
  background: var(--glass-background);
  border: 1px solid var(--border-color);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    border-color: var(--primary-color);
  }
  
  &.featured {
    border-color: var(--primary-color);
    box-shadow: 0 4px 20px rgba(var(--primary-color-rgb), 0.15);
  }
}

.package-badge {
  position: absolute;
  top: -12px;
  right: 2rem;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  padding: 0.25rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
}

.points-amount {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

.points-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
}

.points-label {
  font-size: 1rem;
  color: var(--text-color-light);
}

.points-price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.points-price .currency {
  font-size: 1.25rem;
  color: var(--text-color);
}

.points-price .amount {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.package-desc {
  font-size: 0.875rem;
  color: var(--text-color-light);
  margin-bottom: 1.5rem;
  min-height: 2.5em;
}

.purchase-btn {
  width: 100%;
  height: 40px;
  
  &.glow {
    box-shadow: 0 0 20px rgba(var(--primary-color-rgb), 0.3);
  }
}

.membership-benefits {
  h2 {
    text-align: center;
    font-size: 1.5rem;
    margin-bottom: 2rem;
    color: var(--text-color);
  }
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-top: 2rem;
}

.benefit-card {
  padding: 2rem;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
  }
  
  .el-icon {
    font-size: 2rem;
    color: var(--primary-color);
    margin-bottom: 1rem;
  }
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: var(--text-color);
  }
  
  p {
    color: var(--text-color-light);
    margin-bottom: 1rem;
  }
}

.benefit-details {
  list-style-type: none;
  padding-left: 0;
  margin-top: 1rem;
  
  li {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    color: var(--text-color-light);
    
    &:before {
      content: "•";
      color: var(--primary-color);
      margin-right: 0.5rem;
    }
  }
}

@media (max-width: 1024px) {
  .pricing-plans,
  .benefits-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .plan-card.special {
    grid-column: span 2;
    transform: none;
  }
}

@media (max-width: 768px) {
  .pricing-plans,
  .points-packages,
  .benefits-grid {
    grid-template-columns: 1fr;
  }
  
  .plan-card.featured,
  .plan-card.special {
    transform: none;
  }
  
  .plan-card.special {
    grid-column: span 1;
  }
}

.glass-card {
  background: var(--glass-background);
  backdrop-filter: var(--glass-backdrop-filter);
  border: var(--glass-border);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
}

.plan-card.special {
  background: linear-gradient(135deg,
    rgba(var(--primary-color-rgb), 0.1),
    rgba(var(--accent-color-rgb), 0.1)
  );
  border: 2px solid var(--primary-color);
  transform: scale(1.05);
}

.special-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border: none;
  box-shadow: 0 4px 20px rgba(var(--primary-color-rgb), 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(var(--primary-color-rgb), 0.4);
  }
}
</style> 