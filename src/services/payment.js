import { API_BASE_URL } from '../config/constants'
import AV from 'leancloud-storage'
import { ElMessage } from 'element-plus'
import i18n from '../i18n'

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

// 价格映射表（金额单位：美分）
const PRICE_AMOUNTS = {
  [PRICE_IDS.memberships.trial]: 500,      // $5
  [PRICE_IDS.memberships.pro]: 1500,       // $15
  [PRICE_IDS.memberships.premium]: 9900,   // $99
  [PRICE_IDS.memberships.lifetime]: 40000, // $400
  [PRICE_IDS.points.small]: 200,          // $2
  [PRICE_IDS.points.medium]: 500,         // $5
  [PRICE_IDS.points.large]: 1200,         // $12
}

// 支付状态定义
const PAYMENT_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PROCESSING: 'processing',
  EXPIRED: 'expired',
  FAILED: 'failed',
  CANCELED: 'canceled'
}

// 支付状态处理配置
const PAYMENT_STATUS_CONFIG = {
  checkInterval: 2000, // 2秒检查一次
  maxAttempts: 30,    // 最多检查30次
  timeout: 60000      // 60秒超时
}

// 获取支付状态描述
const getPaymentStatusDescription = (status, locale = 'en') => {
  const statusMessages = {
    [PAYMENT_STATUS.PAID]: {
      en: 'Payment completed successfully',
      zh: '支付已完成'
    },
    [PAYMENT_STATUS.UNPAID]: {
      en: 'Payment not yet completed',
      zh: '支付未完成'
    },
    [PAYMENT_STATUS.PROCESSING]: {
      en: 'Payment is being processed',
      zh: '支付处理中'
    },
    [PAYMENT_STATUS.EXPIRED]: {
      en: 'Payment session has expired',
      zh: '支付会话已过期'
    },
    [PAYMENT_STATUS.FAILED]: {
      en: 'Payment failed',
      zh: '支付失败'
    },
    [PAYMENT_STATUS.CANCELED]: {
      en: 'Payment was canceled',
      zh: '支付已取消'
    }
  }
  return statusMessages[status]?.[locale] || statusMessages[status]?.['en'] || status
}

// 创建支付会话
export const createCheckoutSession = async (priceId, metadata = {}) => {
  const currentUser = AV.User.current()
  if (!currentUser) {
    throw new Error('Unauthorized')
  }

  // 获取当前语言
  const currentLocale = i18n.global.locale.value || 'en'

  // 确定计划类型和具体计划
  let planType, plan, points
  if (priceId.startsWith('price_1Qme')) {
    planType = 'points'
    // 根据价格ID确定积分数量
    if (priceId === PRICE_IDS.points.small) points = 100
    else if (priceId === PRICE_IDS.points.medium) points = 300
    else if (priceId === PRICE_IDS.points.large) points = 1000
  } else {
    planType = 'subscription'
    // 根据价格ID确定具体计划
    if (priceId === PRICE_IDS.memberships.trial) plan = 'trial'
    else if (priceId === PRICE_IDS.memberships.pro) plan = 'pro'
    else if (priceId === PRICE_IDS.memberships.premium) plan = 'premium'
    else if (priceId === PRICE_IDS.memberships.lifetime) plan = 'lifetime'
  }

  // 构建成功和取消URL（使用查询参数）
  const successUrl = `${window.location.origin}${currentLocale === 'en' ? '' : '/' + currentLocale}/payment/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${window.location.origin}${currentLocale === 'en' ? '' : '/' + currentLocale}/payment/cancel`

  // 添加用户信息到元数据
  const enrichedMetadata = {
    userId: currentUser.id,
    userEmail: currentUser.get('email'),
    username: currentUser.get('username'),
    locale: currentLocale,
    planType,
    ...(plan && { plan }), // 仅在订阅类型时添加
    ...(points && { points: points.toString() }), // 仅在积分类型时添加
    timestamp: new Date().toISOString(),
    priceId, // 添加价格ID用于验证
    ...metadata // 保留其他可能的元数据
  }

  try {
    console.log('Creating checkout session with:', {
      priceId,
      successUrl,
      cancelUrl,
      metadata: enrichedMetadata
    })

  const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...getHeaders()
    },
    body: JSON.stringify({ 
      priceId,
        metadata: enrichedMetadata,
        paymentMethodTypes: ['card'],
      successUrl,
      cancelUrl,
        customerEmail: currentUser.get('email'),
        allowPromotionCodes: false,
        locale: currentLocale
      })
  })

  if (!response.ok) {
      let errorMessage = 'Failed to create checkout session'
      try {
        const responseText = await response.text()
        console.error('Raw error response:', responseText)
        
        try {
          const errorData = JSON.parse(responseText)
          console.error('Checkout session creation failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (parseError) {
          console.error('Response is not JSON:', parseError)
        }
      } catch (error) {
        console.error('Failed to read error response:', error)
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    
    // 保存元数据到本地存储
    if (result.id) {
      localStorage.setItem(`payment_metadata_${result.id}`, JSON.stringify(enrichedMetadata))
      console.log('Saved payment metadata:', {
        sessionId: result.id,
        metadata: enrichedMetadata
      })
    }
    
    return {
      url: result.url,
      sessionId: result.id,
      status: result.status
    }
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    throw error
  }
}

// 获取请求头
export const getHeaders = () => {
  const currentUser = AV.User.current()
  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': i18n.global.locale.value || 'en'
  }
  
  if (currentUser) {
    headers['X-LC-Session'] = currentUser.getSessionToken()
  }
  
  return headers
}

// 支付状态追踪记录
const PaymentTrackingStatus = {
  INITIATED: 'initiated',
  PROCESSING: 'processing',
  VERIFYING: 'verifying',
  POINTS_CREDITING: 'points_crediting',
  MEMBERSHIP_UPDATING: 'membership_updating',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// 创建支付追踪记录
const createPaymentTrackingRecord = async (sessionId, status, details = {}) => {
  const PaymentTracking = AV.Object.extend('PaymentTracking');
  const tracking = new PaymentTracking();
  
  tracking.set('sessionId', sessionId);
  tracking.set('status', status);
  tracking.set('details', details);
  tracking.set('timestamp', new Date());
  
  await tracking.save();
  return tracking;
};

// 更新支付追踪状态
const updatePaymentTrackingStatus = async (sessionId, status, details = {}) => {
  const query = new AV.Query('PaymentTracking');
  query.equalTo('sessionId', sessionId);
  query.descending('createdAt');
  
  const tracking = await query.first();
  if (tracking) {
    tracking.set('status', status);
    tracking.set('details', { ...tracking.get('details'), ...details });
    tracking.set('updatedAt', new Date());
    await tracking.save();
  }
};

// 发送支付成功通知
const sendPaymentNotification = async (user, paymentDetails) => {
  try {
    const { planType, points, plan, amount } = paymentDetails
    
    // 创建通知记录
    const Notification = AV.Object.extend('Notification')
    const notification = new Notification()
    
    // 设置通知内容
    const notificationData = {
      userId: user.id,
      type: 'payment_success',
      title: i18n.global.t('payment.notification.title'),
      message: planType === 'points' 
        ? i18n.global.t('payment.notification.pointsAdded', { points, amount })
        : i18n.global.t('payment.notification.membershipUpdated', { plan }),
      status: 'unread',
      metadata: {
        planType,
        points,
        plan,
        amount,
        timestamp: {
          __type: 'Date',
          iso: new Date().toISOString()
        }
      }
    }
    
    Object.entries(notificationData).forEach(([key, value]) => {
      notification.set(key, value)
    })
    
    // 设置ACL
    const notificationACL = new AV.ACL()
    notificationACL.setReadAccess(user.id, true)
    notificationACL.setWriteAccess(user.id, false)
    notification.setACL(notificationACL)
    
    await notification.save()
    
    // 触发实时通知（如果有WebSocket连接）
    if (window._paymentSocket) {
      window._paymentSocket.emit('payment_notification', {
        userId: user.id,
        notification: notificationData
      })
    }
    
    return notification
  } catch (error) {
    console.error('Failed to send payment notification:', error)
    // 通知发送失败不影响主流程
  }
}

// 支付状态检查重试配置
const PAYMENT_CHECK_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  retryDelayMultiplier: 1.5,
  maxRetryDelay: 10000,
  timeout: 30000 // 30 seconds timeout
};

// 支付状态检查
const checkPaymentStatus = async (sessionId) => {
  try {
    console.log('Checking payment status for session:', sessionId)
    
    const response = await fetch(`${API_BASE_URL}/check-payment-status/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...getHeaders()
      }
    })
      
    if (!response.ok) {
      let errorMessage = 'Failed to check payment status'
      try {
        const responseText = await response.text()
        console.error('Raw error response:', responseText)
        
        try {
          const errorData = JSON.parse(responseText)
          console.error('Payment status check failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (parseError) {
          console.error('Response is not JSON:', parseError)
        }
      } catch (error) {
        console.error('Failed to read error response:', error)
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log('Payment status check result:', result)
    
    // 验证响应数据格式
    if (!result.status || !Object.values(PAYMENT_STATUS).includes(result.status)) {
      throw new Error('Invalid payment status response')
    }

    // 如果支付成功但缺少元数据，尝试从本地存储获取
    if (result.status === PAYMENT_STATUS.PAID && (!result.metadata || !result.metadata.planType)) {
      const storedMetadata = localStorage.getItem(`payment_metadata_${sessionId}`)
      if (storedMetadata) {
        try {
          result.metadata = JSON.parse(storedMetadata)
          console.log('Retrieved metadata from storage:', result.metadata)
        } catch (error) {
          console.error('Failed to parse stored metadata:', error)
        }
      }
    }

    // 添加状态描述
    result.statusDescription = getPaymentStatusDescription(result.status, result.metadata?.locale || 'en')
    
    return result
  } catch (error) {
    console.error('Payment status check failed:', error)
    throw error
  }
}

// 轮询检查支付状态
export const pollPaymentStatus = async (sessionId, onStatusUpdate) => {
  let attempts = 0
  const startTime = Date.now()

  const checkStatus = async () => {
    if (attempts >= PAYMENT_STATUS_CONFIG.maxAttempts || 
        Date.now() - startTime >= PAYMENT_STATUS_CONFIG.timeout) {
      throw new Error('Payment status check timeout')
    }

    attempts++
    const result = await checkPaymentStatus(sessionId)
    
    // 调用状态更新回调
    if (onStatusUpdate) {
      onStatusUpdate(result)
    }

    // 如果状态是最终状态，返回结果
    if ([
      PAYMENT_STATUS.PAID,
      PAYMENT_STATUS.EXPIRED,
      PAYMENT_STATUS.FAILED,
      PAYMENT_STATUS.CANCELED
    ].includes(result.status)) {
      return result
    }

    // 继续轮询
    await new Promise(resolve => setTimeout(resolve, PAYMENT_STATUS_CONFIG.checkInterval))
    return checkStatus()
  }

  return checkStatus()
}

// 支付验证重试配置
const PAYMENT_VERIFY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryDelayMultiplier: 1.5
};

// 添加支付会话状态跟踪
const processedSessions = new Set()

// 添加支付验证函数
const verifyPaymentAmount = (paymentStatus, metadata) => {
  console.log('验证支付金额:', {
    支付状态: paymentStatus,
    元数据: metadata
  })

  // 验证支付金额是否与商品匹配
  const expectedAmount = {
    // 积分商品
    'price_points_800': 200,    // $2
    'price_points_2400': 500,   // $5
    // 会员商品
    'price_membership_trial': 500,    // $5/月
    'price_membership_pro': 1500,     // $15/月
    'price_membership_premium': 9900,  // $99/年
    'price_membership_lifetime': 40000 // $400
  }

  const priceId = metadata.priceId || metadata.price_id // 兼容两种字段名
  if (!priceId) {
    console.error('未找到商品ID:', metadata)
    throw new Error('支付元数据中未找到商品ID')
  }

  if (!expectedAmount[priceId]) {
    console.error('无效的商品ID:', {
      商品ID: priceId,
      支付金额: paymentStatus.amount_total,
      支付货币: paymentStatus.currency,
      元数据: metadata
    })
    // 如果是会员商品但ID格式不对，尝试修正
    if (metadata.planType === 'subscription' && metadata.plan) {
      const correctedPriceId = `price_membership_${metadata.plan}`
      if (expectedAmount[correctedPriceId]) {
        console.log('尝试使用修正后的商品ID:', correctedPriceId)
        if (paymentStatus.amount_total === expectedAmount[correctedPriceId]) {
          return true
        }
      }
    }
    throw new Error(`无效的商品ID: ${priceId}`)
  }

  if (paymentStatus.amount_total !== expectedAmount[priceId]) {
    console.error('支付金额验证失败:', {
      实际金额: paymentStatus.amount_total,
      预期金额: expectedAmount[priceId],
      商品ID: priceId,
      货币: paymentStatus.currency
    })
    throw new Error('支付金额验证失败')
  }

  return true
}

// 添加积分验证函数
const verifyPointsOperation = async (user, points, operation = 'add') => {
  const currentPoints = user.get('points') || 0
  
  if (operation === 'subtract' && currentPoints < points) {
    throw new Error('积分不足')
  }

  // 记录积分操作日志
  const PointsLog = AV.Object.extend('PointsLog')
  const log = new PointsLog()
  
  const logData = {
    user,
    points,
    operation,
    beforePoints: currentPoints,
    afterPoints: operation === 'add' ? currentPoints + points : currentPoints - points,
    timestamp: new Date(),
    ip: await getCurrentIP(),
    userAgent: navigator.userAgent
  }
  
  log.set(logData)
  await log.save(null, { useMasterKey: true })
  
  return true
}

// 获取当前IP
const getCurrentIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.warn('获取IP失败:', error)
    return 'unknown'
  }
}

// 修改处理支付成功的函数
export const handlePaymentSuccess = async (sessionId) => {
  let transaction = null
  let pointsVerified = false
  
  try {
    console.log('========== 开始处理支付成功 ==========')
    console.log(`会话ID: ${sessionId}`)
    
    // 1. 验证会话ID格式
    if (!sessionId.startsWith('cs_')) {
      throw new Error('无效的会话ID格式')
    }

    // 2. 查询支付记录
    const PaymentRecord = AV.Object.extend('PaymentRecord')
    const query = new AV.Query(PaymentRecord)
    query.equalTo('sessionId', sessionId)
    const existingPayment = await query.first({ useMasterKey: true })

    if (existingPayment) {
      if (existingPayment.get('status') === 'completed') {
        console.log('支付记录已存在且已完成:', sessionId)
        throw new Error('该支付已处理完成，请勿重复刷新')
      }
      if (existingPayment.get('status') === 'processing') {
        console.log('支付正在处理中:', sessionId)
        throw new Error('支付正在处理中，请稍后刷新')
      }
    }

    // 3. 检查支付状态
    const paymentStatus = await checkPaymentStatus(sessionId)
    console.log('支付状态检查结果:', {
      status: paymentStatus.status,
      amount: `¥${paymentStatus.amount_total / 100}`,
      currency: paymentStatus.currency,
      metadata: paymentStatus.metadata,
      payment_intent: paymentStatus.payment_intent
    })
    
    if (paymentStatus.status !== PAYMENT_STATUS.PAID) {
      throw new Error(`支付未完成: ${paymentStatus.statusDescription}`)
    }

    // 4. 验证支付金额
    verifyPaymentAmount(paymentStatus, paymentStatus.metadata)

    // 5. 获取用户数据
    const currentUser = AV.User.current()
    if (!currentUser) {
      throw new Error('未找到用户数据')
    }

    // 6. 开始处理支付
    try {
      transaction = await AV.Cloud.run('beginTransaction')
      console.log('事务开启成功')
    } catch (transactionError) {
      console.warn('事务开启失败，将使用普通保存:', transactionError)
    }

    // 7. 创建支付记录
    const paymentRecord = existingPayment || new PaymentRecord()
    paymentRecord.set('sessionId', sessionId)
    paymentRecord.set('status', 'processing')
    paymentRecord.set('user', currentUser)
    paymentRecord.set('amount', paymentStatus.amount_total)
    paymentRecord.set('currency', paymentStatus.currency)
    await paymentRecord.save(null, transaction ? { transaction } : { useMasterKey: true })

    // 8. 更新用户数据
    const userQuery = new AV.Query('_User')
    const userToUpdate = await userQuery.get(currentUser.id, transaction ? { transaction } : { useMasterKey: true })
    
    const metadata = paymentStatus.metadata
    if (!metadata) {
      throw new Error('未找到支付元数据')
    }

    if (metadata.planType === 'points') {
      const points = getPointsAmount(metadata.priceId)
      // 验证积分操作
      await verifyPointsOperation(userToUpdate, points, 'add')
      pointsVerified = true
      
      const currentPoints = userToUpdate.get('points') || 0
      userToUpdate.set('points', currentPoints + points)
      
      // 创建积分记录
      const PointsRecord = AV.Object.extend('PointsRecord')
      const pointsRecord = new PointsRecord()
      
      // 设置 ACL
      const recordACL = new AV.ACL()
      recordACL.setPublicReadAccess(false)
      recordACL.setReadAccess(currentUser.id, true)
      recordACL.setWriteAccess(currentUser.id, false)
      recordACL.setRoleReadAccess('Administrator', true)
      recordACL.setRoleWriteAccess('Administrator', true)
      pointsRecord.setACL(recordACL)
      
      pointsRecord.set({
        user: userToUpdate,
        points,
        type: 'purchase',
        beforeBalance: currentPoints,
        afterBalance: currentPoints + points,
        paymentRecord,
        sessionId,
        metadata: {
          priceId: metadata.priceId,
          amount: paymentStatus.amount_total,
          currency: paymentStatus.currency,
          timestamp: new Date(),
          ip: await getCurrentIP(),
          userAgent: navigator.userAgent
        }
      })
      await pointsRecord.save(null, transaction ? { transaction } : { useMasterKey: true })
      
    } else if (metadata.planType === 'subscription') {
      console.log('========== 开始处理会员购买 ==========')
      const { plan } = metadata
      const duration = getMembershipDuration(plan)
      
      console.log('会员更新详情:', {
        购买套餐: plan,
        会员时长: `${duration}天`,
        支付金额: `¥${paymentStatus.amount_total / 100}`
      })

      const now = new Date()
      const currentEndDate = currentUser.get('membershipEnd')
      let currentEndTime = now.getTime()
      
      if (currentEndDate) {
        if (currentEndDate.iso) {
          currentEndTime = new Date(currentEndDate.iso).getTime()
        } else if (currentEndDate instanceof Date) {
          currentEndTime = currentEndDate.getTime()
        } else if (typeof currentEndDate === 'string') {
          currentEndTime = new Date(currentEndDate).getTime()
        }
      }

      const newEndTime = currentEndTime > now.getTime()
        ? currentEndTime + duration * 24 * 60 * 60 * 1000
        : now.getTime() + duration * 24 * 60 * 60 * 1000

      console.log('会员时间更新:', {
        当前到期时间: new Date(currentEndTime).toLocaleString(),
        新到期时间: new Date(newEndTime).toLocaleString(),
        是否延期: currentEndTime > now.getTime() ? '是' : '否'
      })

      // 更新会员信息
      userToUpdate.set('membershipPlan', plan)
      userToUpdate.set('membershipStart', {
        __type: 'Date',
        iso: now.toISOString()
      })
      userToUpdate.set('membershipEnd', {
        __type: 'Date',
        iso: new Date(newEndTime).toISOString()
      })
      userToUpdate.set('membershipStatus', 'active')
      
      // 处理赠送积分
      const bonusPoints = getBonusPoints(plan)
      if (bonusPoints > 0) {
        const currentPoints = currentUser.get('points') || 0
        userToUpdate.set('points', currentPoints + bonusPoints)
        console.log('赠送积分详情:', {
          当前积分: currentPoints,
          赠送积分: bonusPoints,
          更新后积分: currentPoints + bonusPoints
        })
      }

      // 创建会员记录
      const MembershipRecord = AV.Object.extend('MembershipRecord')
      const membershipRecord = new MembershipRecord()

      // 设置 ACL
      const recordACL = new AV.ACL()
      recordACL.setPublicReadAccess(false)
      recordACL.setReadAccess(currentUser.id, true)
      recordACL.setWriteAccess(currentUser.id, false)
      recordACL.setRoleReadAccess('Administrator', true)
      recordACL.setRoleWriteAccess('Administrator', true)
      membershipRecord.setACL(recordACL)

      membershipRecord.set({
        user: userToUpdate,
        plan,
        duration,
        startDate: now,
        endDate: {
          __type: 'Date',
          iso: new Date(newEndTime).toISOString()
        },
        paymentId: sessionId,
        paymentIntent: paymentStatus.payment_intent,
        customer: paymentStatus.customer,
        metadata: {
          priceId: metadata.priceId,
          amount: paymentStatus.amount_total,
          currency: paymentStatus.currency,
          timestamp: now,
          locale: metadata.locale
        }
      })

      // 如果有赠送积分，创建积分记录
      if (bonusPoints > 0) {
        const PointsRecord = AV.Object.extend('PointsRecord')
        const pointsRecord = new PointsRecord()
        const currentPoints = currentUser.get('points') || 0
        
        // 根据会员计划设置不同的描述
        const planDescMap = {
          trial: '体验会员赠送积分',
          pro: '进阶会员赠送积分',
          premium: '专业会员赠送积分',
          lifetime: '永久会员赠送积分'
        }
        
        pointsRecord.set({
          user: userToUpdate,
          points: bonusPoints,
          type: 'bonus',
          description: `${planDescMap[plan] || '会员赠送积分'} +${bonusPoints}`,
          beforeBalance: currentPoints - bonusPoints,
          afterBalance: currentPoints,
          timestamp: {
            __type: 'Date',
            iso: now.toISOString()
          },
          metadata: {
            source: 'membership_bonus',
            plan,
            planName: planDescMap[plan],
            timestamp: {
              __type: 'Date',
              iso: now.toISOString()
            }
          }
        })
        
        // 设置 ACL
        const pointsRecordACL = new AV.ACL()
        pointsRecordACL.setPublicReadAccess(false)
        pointsRecordACL.setReadAccess(currentUser.id, true)
        pointsRecordACL.setWriteAccess(currentUser.id, false)
        pointsRecordACL.setRoleReadAccess('Administrator', true)
        pointsRecordACL.setRoleWriteAccess('Administrator', true)
        pointsRecord.setACL(pointsRecordACL)
        
        // 保存积分记录
        await pointsRecord.save(null, { useMasterKey: true })
      }
    }

    // 9. 完成处理
    paymentRecord.set('status', 'completed')
    paymentRecord.set('metadata', metadata)
    paymentRecord.set('processedAt', new Date())
    
    if (transaction) {
      await AV.Object.saveAll([paymentRecord, userToUpdate], { transaction })
      await AV.Cloud.run('commitTransaction', { transaction })
    } else {
      await AV.Object.saveAll([paymentRecord, userToUpdate], { useMasterKey: true })
    }
    
    // 10. 重新获取最新用户数据
    await currentUser.fetch({
      include: ['points', 'membershipEnd', 'membershipPlan', 'membershipStart', 'membershipStatus']
    })

    return {
      success: true,
      user: currentUser.toJSON()
    }

  } catch (error) {
    if (transaction) {
      try {
        await AV.Cloud.run('rollbackTransaction', { transaction })
      } catch (rollbackError) {
        console.error('事务回滚失败:', rollbackError)
      }
    }
    
    // 如果积分已验证但事务失败，记录异常
    if (pointsVerified) {
      const ErrorLog = AV.Object.extend('ErrorLog')
      const errorLog = new ErrorLog()
      errorLog.set({
        type: 'payment_points_verification_failed',
        sessionId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date()
      })
      await errorLog.save(null, { useMasterKey: true })
    }
    
    console.error('支付处理失败:', error)
    throw error
  }
}

// 创建支付会话
export const createPaymentSession = async (type, options) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        ...options
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to create payment session')
    }
    
    return await response.json()
    
  } catch (error) {
    console.error('Create payment session failed:', error)
    throw error
  }
}

// 验证支付金额
const validatePaymentAmount = (session) => {
  const { amount_total, metadata } = session;
  const expectedAmount = PRICE_AMOUNTS[metadata.priceId];
  
  if (!expectedAmount) {
    throw new Error('Invalid price ID');
  }
  
  if (amount_total !== expectedAmount) {
    console.error('Payment amount mismatch:', {
      expected: expectedAmount,
      received: amount_total,
      priceId: metadata.priceId
    });
    throw new Error('Payment amount verification failed');
  }
  
  return true;
}

// 支付处理锁定机制
const paymentLocks = new Map();

// 获取支付锁
const acquirePaymentLock = async (userId) => {
  if (paymentLocks.has(userId)) {
    throw new Error('Another payment is being processed');
  }
  paymentLocks.set(userId, Date.now());
}

// 释放支付锁
const releasePaymentLock = (userId) => {
  paymentLocks.delete(userId);
}

// 清理过期的支付锁（5分钟后自动释放）
setInterval(() => {
  const now = Date.now();
  paymentLocks.forEach((timestamp, userId) => {
    if (now - timestamp > 5 * 60 * 1000) {
      paymentLocks.delete(userId);
    }
  });
}, 60 * 1000);

// 验证并记录支付成功
export const verifyAndRecordPayment = async (session) => {
  const { planType, plan, points } = session.metadata
  const currentUser = AV.User.current()
  
  if (!currentUser) {
    throw new Error('User not found')
  }

  try {
    // 获取当前会员状态
    const currentMembershipEnd = currentUser.get('membershipEnd')
    const now = new Date()
    
    // 创建 LeanCloud Date 对象
    const startDate = {
      __type: 'Date',
      iso: now.toISOString()
    }
    
    let newMembershipEnd
    let currentEndTime = now.getTime()

    if (currentMembershipEnd) {
      // 如果是 LeanCloud Date 对象
      if (currentMembershipEnd.iso) {
        currentEndTime = new Date(currentMembershipEnd.iso).getTime()
      } 
      // 如果是普通 Date 对象
      else if (currentMembershipEnd instanceof Date) {
        currentEndTime = currentMembershipEnd.getTime()
      }
      // 如果是 ISO 字符串
      else if (typeof currentMembershipEnd === 'string') {
        currentEndTime = new Date(currentMembershipEnd).getTime()
      }
    }

    // 根据计划类型处理更新
    if (planType === 'subscription') {
      if (!plan) {
        throw new Error('Missing plan information for subscription')
      }
      
      // 更新会员状态
      const duration = getMembershipDuration(plan)
      
      if (currentEndTime > now.getTime()) {
        // 如果当前会员未过期，则在现有时间基础上延长
        newMembershipEnd = {
          __type: 'Date',
          iso: new Date(currentEndTime + duration * 24 * 60 * 60 * 1000).toISOString()
        }
      } else {
        // 如果已过期或没有会员，则从现在开始计算
        newMembershipEnd = {
          __type: 'Date',
          iso: new Date(now.getTime() + duration * 24 * 60 * 60 * 1000).toISOString()
        }
      }
      
      // 更新用户会员信息
      currentUser.set('membershipPlan', plan)
      currentUser.set('membershipStart', startDate)
      currentUser.set('membershipEnd', newMembershipEnd)
      currentUser.set('membershipStatus', 'active')
      
      // 处理赠送积分
      const bonusPoints = getBonusPoints(plan)
      if (bonusPoints > 0) {
        const currentPoints = currentUser.get('points') || 0
        currentUser.set('points', currentPoints + bonusPoints)
        console.log('赠送积分详情:', {
          当前积分: currentPoints,
          赠送积分: bonusPoints,
          更新后积分: currentPoints + bonusPoints
        })
      }
      
      // 创建会员记录
      const MembershipRecord = AV.Object.extend('MembershipRecord')
      const membershipRecord = new MembershipRecord()
      
      membershipRecord.set({
        user: currentUser,
        plan,
        startDate,
        endDate: newMembershipEnd,
        duration,
        paymentId: session.id,
        paymentIntent: session.payment_intent,
        customer: session.customer,
        metadata: {
          priceId: session.metadata.priceId,
          amount: session.amount_total,
          currency: session.currency,
          timestamp: startDate,
          locale: session.metadata.locale
        }
      })
      
      // 设置 ACL
      const recordACL = new AV.ACL()
      recordACL.setPublicReadAccess(false)
      recordACL.setReadAccess(currentUser.id, true)
      recordACL.setWriteAccess(currentUser.id, false)
      recordACL.setRoleReadAccess('Administrator', true)
      recordACL.setRoleWriteAccess('Administrator', true)
      membershipRecord.setACL(recordACL)
      
      // 保存会员记录
      await membershipRecord.save(null, { useMasterKey: true })
      
      // 如果有赠送积分，创建积分记录
      if (bonusPoints > 0) {
        const PointsRecord = AV.Object.extend('PointsRecord')
        const pointsRecord = new PointsRecord()
        
        // 根据会员计划设置不同的描述
        const planDescMap = {
          trial: '体验会员赠送积分',
          pro: '进阶会员赠送积分',
          premium: '专业会员赠送积分',
          lifetime: '永久会员赠送积分'
        }
        
        pointsRecord.set({
          user: currentUser,
          points: bonusPoints,
          type: 'bonus',
          description: `${planDescMap[plan] || '会员赠送积分'} +${bonusPoints}`,
          beforeBalance: currentPoints,
          afterBalance: currentPoints + bonusPoints,
          timestamp: startDate,
          metadata: {
            source: 'membership_bonus',
            plan,
            planName: planDescMap[plan],
            timestamp: startDate
          }
        })
        
        // 设置 ACL
        const pointsRecordACL = new AV.ACL()
        pointsRecordACL.setPublicReadAccess(false)
        pointsRecordACL.setReadAccess(currentUser.id, true)
        pointsRecordACL.setWriteAccess(currentUser.id, false)
        pointsRecordACL.setRoleReadAccess('Administrator', true)
        pointsRecordACL.setRoleWriteAccess('Administrator', true)
        pointsRecord.setACL(pointsRecordACL)
        
        // 保存积分记录
        await pointsRecord.save(null, { useMasterKey: true })
      }
    }
    
    // 保存用户数据
    await currentUser.save(null, { useMasterKey: true })
    
    // 重新获取用户数据以确保更新成功
    await currentUser.fetch({
      include: ['points', 'membershipEnd', 'membershipPlan', 'membershipStart', 'membershipStatus']
    }, { useMasterKey: true })
    
    console.log('========== 数据更新结果 ==========')
    console.log('更新后的用户数据:', {
      用户名: currentUser.get('username'),
      当前积分: currentUser.get('points'),
      会员计划: currentUser.get('membershipPlan'),
      会员开始时间: currentUser.get('membershipStart')?.iso,
      会员结束时间: currentUser.get('membershipEnd')?.iso,
      会员状态: currentUser.get('membershipStatus'),
      更新时间: new Date().toLocaleString()
    })
    
    return {
      success: true,
      user: currentUser.toJSON()
    }
    
  } catch (error) {
    console.error('支付处理失败:', error)
    throw error
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

// 支付取消记录
const recordCancellation = async (sessionId, reason, feedback) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      },
      body: JSON.stringify({
        sessionId,
        reason,
        feedback,
        timestamp: {
          __type: 'Date',
          iso: new Date().toISOString()
        }
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to record cancellation')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to record cancellation:', error)
    throw error
  }
}

// 获取会员赠送积分
const getBonusPoints = (plan) => {
  switch (plan) {
    case 'trial':
      return 2000  // 体验会员 $5/月 每月2000积分
    case 'pro':
      return 6000  // 进阶会员 $15/月 每月6000积分
    case 'premium':
      return 40000 // 专业会员 $99/年 每年40000积分
    case 'lifetime':
      return 160000 // 永久会员 $400 赠送160000积分
    default:
      return 0
  }
}

// 获取积分购买数量
const getPointsAmount = (priceId) => {
  const pointsMap = {
    'price_points_800': 800,    // $2
    'price_points_2400': 2400,  // $5
    // ... 可以添加其他积分套餐
  }
  return pointsMap[priceId] || 0
}

// 修改积分扣除函数
export const deductPoints = async (points, reason) => {
  const currentUser = AV.User.current()
  if (!currentUser) {
    throw new Error('用户未登录')
  }

  let transaction = null
  try {
    // 开始事务
    try {
      transaction = await AV.Cloud.run('beginTransaction')
      console.log('事务开启成功')
    } catch (transactionError) {
      console.warn('事务开启失败，将使用普通保存:', transactionError)
    }

    // 验证积分操作
    await verifyPointsOperation(currentUser, points, 'subtract')
    
    const currentPoints = currentUser.get('points') || 0
    if (currentPoints < points) {
      throw new Error('积分不足')
    }

    // 更新用户积分
    currentUser.set('points', currentPoints - points)
    
    // 创建积分记录
    const PointsRecord = AV.Object.extend('PointsRecord')
    const pointsRecord = new PointsRecord()
    
    // 设置 ACL
    const recordACL = new AV.ACL()
    recordACL.setPublicReadAccess(false)
    recordACL.setReadAccess(currentUser.id, true)
    recordACL.setWriteAccess(currentUser.id, false)
    recordACL.setRoleReadAccess('Administrator', true)
    recordACL.setRoleWriteAccess('Administrator', true)
    pointsRecord.setACL(recordACL)
    
    pointsRecord.set({
      user: currentUser,
      points: -points,
      type: 'deduct',
      reason,
      beforeBalance: currentPoints,
      afterBalance: currentPoints - points,
      metadata: {
        timestamp: new Date(),
        ip: await getCurrentIP(),
        userAgent: navigator.userAgent
      }
    })

    if (transaction) {
      await AV.Object.saveAll([currentUser, pointsRecord], { transaction })
      await AV.Cloud.run('commitTransaction', { transaction })
    } else {
      await AV.Object.saveAll([currentUser, pointsRecord], { useMasterKey: true })
    }

    return {
      success: true,
      remainingPoints: currentPoints - points
    }
  } catch (error) {
    if (transaction) {
      try {
        await AV.Cloud.run('rollbackTransaction', { transaction })
      } catch (rollbackError) {
        console.error('事务回滚失败:', rollbackError)
      }
    }
    console.error('积分扣除失败:', error)
    throw error
  }
} 