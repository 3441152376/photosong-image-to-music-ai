const AV = require('leancloud-storage')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

AV.Cloud.define('createStripeCheckoutSession', async (request) => {
  const { priceId, userId, planType, plan, points } = request.params
  const user = request.currentUser

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized')
  }

  const session = await stripe.checkout.sessions.create({
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

AV.Cloud.define('stripeWebhook', async (request) => {
  const sig = request.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
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
  }

  return { received: true }
})
