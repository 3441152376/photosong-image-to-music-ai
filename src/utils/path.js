import path from 'path'

export function getStaticPath(routePath, locale) {
  const fileName = routePath === '/' ? 'index.html' : `${routePath.slice(1)}.html`
  return path.join(process.cwd(), 'server/static', locale, fileName)
}

export function getDynamicPath(routePath, locale) {
  const { type, id } = parseDynamicPath(routePath)
  if (!type || !id) return null
  return path.join(process.cwd(), 'server/dynamic', locale, type, `${id}.html`)
}

export function parseDynamicPath(routePath) {
  if (routePath.startsWith('/profile/')) {
    return { type: 'profile', id: routePath.split('/')[2] }
  }
  if (routePath.startsWith('/work/')) {
    return { type: 'work', id: routePath.split('/')[2] }
  }
  return { type: null, id: null }
} 