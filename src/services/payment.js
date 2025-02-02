import { API_BASE_URL } from '../config/constants'
import AV from 'leancloud-storage'
import { ElMessage } from 'element-plus'
import i18n from '../i18n'

// 创建支付会话
export const createCheckoutSession = async (priceId, metadata = {}) => {
  const currentUser = AV.User.current()
  if (!currentUser) {
    throw new Error('Unauthorized')
  }

  // 获取当前语言
  const currentLocale = i18n.global.locale.value

  // 构建成功和取消URL（包含语言前缀）
  const successUrl = `${window.location.origin}/${currentLocale}/payment/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${window.location.origin}/${currentLocale}/pricing`

  const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-LC-Session': currentUser.getSessionToken()
    },
    body: JSON.stringify({ 
      priceId,
      successUrl,
      cancelUrl,
      ...metadata
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to create checkout session')
  }

  return response.json()
}

// 检查支付状态并处理结果
export const checkAndProcessPayment = async (sessionId) => {
  try {
    const maxRetries = 3;
    let retryCount = 0;
    let session;
    
    while (retryCount < maxRetries) {
      const response = await fetch(`${API_BASE_URL}/payment/check/${sessionId}`, {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }
      
      session = await response.json();
      
      if (session.status === 'complete') {
        // 支付成功，记录并更新用户状态
        await verifyAndRecordPayment(session);
        return { status: 'success', session };
      } else if (session.status === 'expired' || session.status === 'failed') {
        return { status: 'failed', session };
      }
      
      // 如果支付仍在处理中，等待后重试
      retryCount++;
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒后重试
      }
    }
    
    // 超过最大重试次数
    return { status: 'timeout', session };
  } catch (error) {
    console.error('Payment status check failed:', error);
    throw error;
  }
}

// 处理支付成功回调
export const handlePaymentSuccess = async (sessionId) => {
  try {
    const result = await checkAndProcessPayment(sessionId);
    
    if (result.status === 'success') {
      // 发送支付成功通知
      ElMessage.success('支付成功！');
      return true;
    } else {
      // 处理支付失败情况
      ElMessage.error('支付处理失败，请联系客服');
      return false;
    }
  } catch (error) {
    console.error('Payment success handling failed:', error);
    ElMessage.error('支付状态验证失败，请联系客服');
    return false;
  }
}

// 验证并记录支付成功
export const verifyAndRecordPayment = async (session) => {
  try {
    const { metadata } = session;
    const { userId, planType, points, plan } = metadata;
    
    // 使用事务确保数据一致性
    const user = await AV.Object.createWithoutData('_User', userId);
    await AV.Object.fetchAll([user]);
    
    // 创建支付记录
    const PaymentRecord = AV.Object.extend('PaymentRecord');
    const paymentRecord = new PaymentRecord();
    
    const data = {
      user,
      sessionId: session.id,
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      status: session.status,
      planType,
      timestamp: new Date()
    };
    
    if (planType === 'subscription') {
      data.plan = plan;
      data.subscriptionId = session.subscription;
    } else if (planType === 'points') {
      data.points = points;
    }
    
    paymentRecord.set(data);
    
    // 根据支付类型更新用户状态
    if (planType === 'subscription') {
      await updateMembership(user, plan, getMembershipDuration(plan));
    } else if (planType === 'points') {
      await updateUserPoints(user, parseInt(points), 'purchase');
    }
    
    // 保存支付记录
    await paymentRecord.save(null, {
      fetchWhenSave: true,
      transaction: true
    });
    
    return { success: true };
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
}

// 获取会员时长
const getMembershipDuration = (plan) => {
  switch (plan) {
    case 'trial':
    case 'pro':
      return 30; // 30 days
    case 'premium':
      return 365; // 1 year
    case 'lifetime':
      return 36500; // 100 years
    default:
      return 30;
  }
}

// 价格ID映射
export const PRICE_IDS = {
  memberships: {
    trial: 'price_1QlYNRHVMy0i1BlJA1y0DxB2',     // Starter Plan
    pro: 'price_1QlYO1HVMy0i1BlJyDD3GlsN',       // Advanced Plan
    premium: 'price_1QlYOaHVMy0i1BlJ1ZpdOMAO',   // Professional Plan
    lifetime: 'price_1QlYOrHVMy0i1BlJDHxIswM7',  // Lifetime Plan
  },
  points: {
    small: 'price_1Qme87HVMy0i1BlJR1PRWOgz',     // Small Points Pack
    medium: 'price_1Qme9BHVMy0i1BlJwFyjwZwj',    // Medium Points Pack
    large: 'price_1QmeA6HVMy0i1BlJQD5dc34Z',     // Large Points Pack
  }
} 