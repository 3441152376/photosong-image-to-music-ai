import AV from 'leancloud-storage'

// 定义新闻状态枚举
export const NewsStatus = {
  DRAFT: 'draft',      // 草稿
  PUBLISHED: 'published', // 已发布
  ARCHIVED: 'archived'  // 已归档
}

// 定义新闻分类枚举
export const NewsCategory = {
  ANNOUNCEMENT: 'announcement', // 公告
  UPDATE: 'update',         // 更新
  FEATURE: 'feature',       // 功能介绍
  TUTORIAL: 'tutorial',     // 教程
  NEWS: 'news',            // 新闻
  INDUSTRY: 'industry'     // 行业动态
}

// 创建 News 类
export default class News extends AV.Object {
  static className = 'News'

  constructor() {
    super(News.className)
  }

  // 获取标题
  get title() {
    return this.get('title')
  }

  // 设置标题
  set title(value) {
    this.set('title', value)
  }

  // 获取内容
  get content() {
    return this.get('content')
  }

  // 设置内容
  set content(value) {
    this.set('content', value)
  }

  // 获取摘要
  get summary() {
    return this.get('summary')
  }

  // 设置摘要
  set summary(value) {
    this.set('summary', value)
  }

  // 获取封面图片
  get coverImage() {
    return this.get('coverImage')
  }

  // 设置封面图片
  set coverImage(value) {
    this.set('coverImage', value)
  }

  // 获取状态
  get status() {
    return this.get('status')
  }

  // 设置状态
  set status(value) {
    if (!Object.values(NewsStatus).includes(value)) {
      throw new Error('Invalid news status')
    }
    this.set('status', value)
  }

  // 获取分类
  get category() {
    return this.get('category')
  }

  // 设置分类
  set category(value) {
    if (!Object.values(NewsCategory).includes(value)) {
      throw new Error('Invalid news category')
    }
    this.set('category', value)
  }

  // 获取作者
  get author() {
    return this.get('author')
  }

  // 设置作者
  set author(value) {
    this.set('author', value)
  }

  // 获取标签
  get tags() {
    return this.get('tags') || []
  }

  // 设置标签
  set tags(value) {
    this.set('tags', value)
  }

  // 获取发布时间
  get publishedAt() {
    return this.get('publishedAt')
  }

  // 设置发布时间
  set publishedAt(value) {
    this.set('publishedAt', value)
  }

  // 获取阅读量
  get viewCount() {
    return this.get('viewCount') || 0
  }

  // 设置阅读量
  set viewCount(value) {
    this.set('viewCount', value)
  }

  // 获取点赞数
  get likeCount() {
    return this.get('likeCount') || 0
  }

  // 设置点赞数
  set likeCount(value) {
    this.set('likeCount', value)
  }

  // 获取多语言标题
  getTitleByLocale(locale) {
    return this.get(`title_${locale}`) || this.title
  }

  // 设置多语言标题
  setTitleByLocale(locale, value) {
    this.set(`title_${locale}`, value)
  }

  // 获取多语言内容
  getContentByLocale(locale) {
    return this.get(`content_${locale}`) || this.content
  }

  // 设置多语言内容
  setContentByLocale(locale, value) {
    this.set(`content_${locale}`, value)
  }

  // 获取多语言摘要
  getSummaryByLocale(locale) {
    return this.get(`summary_${locale}`) || this.summary
  }

  // 设置多语言摘要
  setSummaryByLocale(locale, value) {
    this.set(`summary_${locale}`, value)
  }

  // 增加阅读量
  async incrementViewCount() {
    this.increment('viewCount')
    await this.save()
  }

  // 增加点赞数
  async incrementLikeCount() {
    this.increment('likeCount')
    await this.save()
  }

  // 发布新闻
  async publish() {
    if (!this.title || !this.content) {
      throw new Error('News must have title and content')
    }
    this.status = NewsStatus.PUBLISHED
    this.publishedAt = new Date()
    await this.save()
  }

  // 归档新闻
  async archive() {
    this.status = NewsStatus.ARCHIVED
    await this.save()
  }

  // 查询已发布的新闻
  static queryPublished() {
    const query = new AV.Query(News)
    query.equalTo('status', NewsStatus.PUBLISHED)
    query.descending('publishedAt')
    return query
  }

  // 查询某个分类的新闻
  static queryByCategory(category) {
    const query = new AV.Query(News)
    query.equalTo('category', category)
    query.equalTo('status', NewsStatus.PUBLISHED)
    query.descending('publishedAt')
    return query
  }

  // 查询热门新闻
  static queryHot() {
    const query = new AV.Query(News)
    query.equalTo('status', NewsStatus.PUBLISHED)
    query.descending('viewCount')
    return query
  }

  // 搜索新闻
  static search(keyword) {
    const titleQuery = new AV.Query(News)
    titleQuery.contains('title', keyword)

    const contentQuery = new AV.Query(News)
    contentQuery.contains('content', keyword)

    const query = AV.Query.or(titleQuery, contentQuery)
    query.equalTo('status', NewsStatus.PUBLISHED)
    query.descending('publishedAt')
    return query
  }
}

// 注册 News 类
AV.Object.register(News) 