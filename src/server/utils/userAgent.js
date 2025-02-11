const BOTS = [
  'googlebot',
  'bingbot',
  'baiduspider',
  'duckduckbot',
  'yandexbot',
  'sogou',
  'slurp',
  'applebot',
  'facebookexternalhit',
  'twitterbot'
]

export function isBot(userAgent = '') {
  const ua = userAgent.toLowerCase()
  return BOTS.some(bot => ua.includes(bot))
} 