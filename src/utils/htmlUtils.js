/**
 * 获取静态HTML文件URL
 * @param {string} type - 页面类型 ('user'|'work'|'home')
 * @param {string} id - 资源ID（用户ID或作品ID）
 * @returns {string} - HTML文件URL
 */
export const getStaticHtmlUrl = (type, id = null) => {
  let fileName;
  switch (type) {
    case 'user':
      fileName = `user-${id}.html`;
      break;
    case 'work':
      fileName = `work-${id}.html`;
      break;
    case 'home':
      fileName = 'home.html';
      break;
    default:
      return '/';
  }
  
  return `/static/${fileName}`;
};

/**
 * 检查是否是搜索引擎爬虫
 * @returns {boolean}
 */
export const isCrawler = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const crawlers = [
    'googlebot',
    'bingbot',
    'baiduspider',
    'yandexbot',
    'sogou',
    '360spider',
    'bytespider'
  ];
  
  return crawlers.some(crawler => userAgent.includes(crawler));
};

/**
 * 获取页面元数据
 * @param {Object} data - 页面数据
 * @returns {Object} - 元数据对象
 */
export const getPageMetadata = (data = {}) => {
  const defaults = {
    title: 'Photo Song',
    description: 'Transform your photos into unique musical pieces',
    image: '/og-image.jpg',
    type: 'website'
  };

  return {
    ...defaults,
    ...data
  };
}; 