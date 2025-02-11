/**
 * 客户端路径处理工具
 */
export function joinPaths(...parts) {
  return parts
    .map((part, i) => {
      if (i === 0) {
        return part.trim().replace(/\/*$/, '')
      } else {
        return part.trim().replace(/(^\/*|\/*$)/g, '')
      }
    })
    .filter(x => x.length)
    .join('/')
}

export function getBasePath() {
  return window.location.pathname.split('/').slice(0, -1).join('/') || '/'
}

export function normalizePath(path) {
  return '/' + path.replace(/^\/+|\/+$/g, '')
} 