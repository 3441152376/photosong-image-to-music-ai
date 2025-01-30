import AV from 'leancloud-storage'
import stripe from 'stripe'

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY)

// Initialize Stripe Class
const StripePayment = AV.Object.extend('StripePayment')

// Initialize cloud functions
async function initStripePaymentClass() {
  try {
    const testPayment = new StripePayment()
    testPayment.set('test', true)
    await testPayment.save()
    await testPayment.destroy()
  } catch (error) {
    if (error.code === 101) {
      const testPayment = new StripePayment()
      testPayment.set('test', true)
      await testPayment.save()
      await testPayment.destroy()
    } else {
      console.error('Failed to initialize StripePayment class:', error)
    }
  }
}

// Initialize webhook handler
AV.Cloud.define('stripeWebhook', async (request) => {
  const sig = request.headers['stripe-signature']
  let event

  try {
    event = stripeClient.webhooks.constructEvent(
      request.params.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    throw new Error(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { userId, planType, plan, points } = session.metadata

    const user = await AV.Object.createWithoutData('_User', userId).fetch()
    
    if (planType === 'subscription') {
      user.set('membership', plan)
      user.set('membershipStatus', 'active')
      user.set('membershipUpdatedAt', new Date())
    } else if (planType === 'points') {
      const currentPoints = user.get('points') || 0
      user.set('points', currentPoints + parseInt(points, 10))
    }

    await user.save(null, { useMasterKey: true })

    // Record the payment
    const payment = new StripePayment()
    payment.set('userId', userId)
    payment.set('sessionId', session.id)
    payment.set('amount', session.amount_total)
    payment.set('currency', session.currency)
    payment.set('planType', planType)
    payment.set('plan', plan)
    payment.set('points', points)
    payment.set('status', 'completed')
    await payment.save()
  }

  return { received: true }
})

// Initialize checkout session creator
AV.Cloud.define('createStripeCheckoutSession', async (request) => {
  const { priceId, userId, planType, plan, points } = request.params
  const user = request.currentUser

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized')
  }

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: planType === 'subscription' ? 'subscription' : 'payment',
    success_url: `${process.env.SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SITE_URL}/pricing`,
    metadata: {
      userId,
      planType,
      ...(plan && { plan }),
      ...(points && { points: points.toString() })
    },
    customer_email: user.get('email')
  })

  return { sessionId: session.id }
})

// Initialize
initStripePaymentClass()

export { StripePayment }
