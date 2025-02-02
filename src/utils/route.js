/**
 * 生成本地化的路由名称
 * @param {string} baseName - 基础路由名称
 * @param {string} locale - 当前语言
 * @returns {string} 本地化的路由名称
 */
export const getLocalizedRouteName = (baseName, locale) => {
  return `${locale}-${baseName}`
}

/**
 * 获取当前语言的路由名称
 * @param {string} baseName - 基础路由名称
 * @param {import('vue-router').Router} router - Vue Router 实例
 * @returns {string} 当前语言的路由名称
 */
export const getCurrentLocalizedRouteName = (baseName, router) => {
  const currentLocale = router.currentRoute.value.path.split('/')[1]
  return getLocalizedRouteName(baseName, currentLocale)
}

/**
 * 生成本地化的路由路径
 * @param {string} path - 基础路径
 * @param {string} locale - 当前语言
 * @returns {string} 本地化的路由路径
 */
export const getLocalizedPath = (path, locale) => {
  return path === '/' ? `/${locale}` : `/${locale}${path}`
} 