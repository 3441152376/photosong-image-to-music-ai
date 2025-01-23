export const config = {
  // 文件访问域名
  FILE_DOMAIN: 'fil.egg404.com',
  
  // 默认头像
  DEFAULT_AVATAR: 'https://fil.egg404.com/2tRCaMz1uYEKWJnEVcUIeEz39VA3R7ou/573b89e7f01b02487519bc32aad330c9.jpeg',
  
  // 其他配置项可以在这里添加...
}

// 生成完整的文件URL
export const getFileUrl = (path) => {
  if (!path) return config.DEFAULT_AVATAR
  if (path.startsWith('http')) return path
  return `https://${config.FILE_DOMAIN}${path.startsWith('/') ? path : `/${path}`}`
}

export default config 