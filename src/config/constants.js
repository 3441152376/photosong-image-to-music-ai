// API 基础URL配置
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pay.photosong.com/api'

// 支付相关常量
export const PAYMENT_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PROCESSING: 'processing',
  EXPIRED: 'expired',
  FAILED: 'failed',
  CANCELED: 'canceled',
  NO_PAYMENT_REQUIRED: 'no_payment_required'
}

// 积分兑换比率
export const POINTS_PER_USD = 400

// 创作消耗积分
export const CREATION_POINTS_COST = 100

// 支付状态轮询间隔（毫秒）
export const PAYMENT_STATUS_POLL_INTERVAL = 2000

// 最大轮询次数
export const MAX_POLL_ATTEMPTS = 30 