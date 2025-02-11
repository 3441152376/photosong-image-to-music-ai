import AV from 'leancloud-storage'
import Article, { ArticleCategory, ArticleStatus } from '@/models/Article'

// 初始化 LeanCloud
AV.init({
  appId: import.meta.env.VITE_LEANCLOUD_APP_ID,
  appKey: import.meta.env.VITE_LEANCLOUD_APP_KEY,
  serverURL: import.meta.env.VITE_LEANCLOUD_SERVER_URL
})

// 初始化 Work 类
const Work = AV.Object.extend('Work')

// 创建 Work 类并设置默认 ACL
async function initWorkClass() {
  try {
    // 创建一个测试对象来确保类存在
    const testWork = new Work()
    testWork.set('test', true)
    await testWork.save()
    
    // 设置默认 ACL
    const acl = new AV.ACL()
    acl.setPublicReadAccess(true)      // 所有人可读
    acl.setPublicWriteAccess(false)    // 仅创建者可写
    
    // 删除测试对象
    await testWork.destroy()
    
    // console.log('Work class initialized successfully')
  } catch (error) {
    if (error.code === 101) { // Class not found
      // console.log('Creating Work class...')
      const testWork = new Work()
      testWork.set('test', true)
      await testWork.save()
      await testWork.destroy()
      // console.log('Work class created successfully')
    } else {
      console.error('Failed to initialize Work class:', error)
    }
  }
}

// 导出 Work 类
export const WorkClass = Work

// 初始化预渲染页面类
const initPreRenderedPageClass = async () => {
  try {
    const PreRenderedPage = AV.Object.extend('PreRenderedPage')
    const testPage = new PreRenderedPage()
    testPage.set('test', true)
    await testPage.save()
    await testPage.destroy()
    
    // 设置 ACL
    const acl = new AV.ACL()
    acl.setPublicReadAccess(true)
    acl.setPublicWriteAccess(false)
    
    // console.log('PreRenderedPage class initialized successfully')
  } catch (error) {
    if (error.code === 101) { // Class not found
      // console.log('Creating PreRenderedPage class...')
      const PreRenderedPage = AV.Object.extend('PreRenderedPage')
      const testPage = new PreRenderedPage()
      testPage.set('test', true)
      await testPage.save()
      await testPage.destroy()
      // console.log('PreRenderedPage class created successfully')
    } else {
      console.error('Failed to initialize PreRenderedPage class:', error)
    }
  }
}

// 初始化
initWorkClass()
initPreRenderedPageClass()

// 创建示例文章数据
export const createSampleArticles = async () => {
  try {
    // 检查是否已经有文章数据
    const query = new AV.Query('Article')
    const count = await query.count()
    
    if (count > 0) {
      return // 静默返回，不显示警告
    }
    
    // 示例文章数据
    const articles = [
      {
        title: 'AI音乐生成技术的最新进展',
        slug: 'ai-music-generation-advances',
        summary: '探索AI音乐生成领域的最新技术突破和发展趋势，了解当前主流的AI音乐生成模型和未来发展方向。',
        content: `# AI音乐生成技术的最新进展

## 引言
人工智能在音乐创作领域的应用正在经历前所未有的发展。近年来，AI音乐生成技术取得了显著的进步，从简单的旋律生成到完整的音乐作品创作，AI展现出了令人惊叹的创造力。

## 主流技术模型
### 1. Transformer架构
- 基于注意力机制的音乐生成
- 长序列建模能力
- 多模态融合优势

### 2. GAN（生成对抗网络）
- 真实感音乐生成
- 风格迁移应用
- 音色合成创新

### 3. VAE（变分自编码器）
- 潜空间音乐表示
- 可控制的音乐生成
- 风格混合能力

## 最新突破
1. **多模态融合**
   - 图像到音乐的转换
   - 文本引导的音乐生成
   - 跨模态情感映射

2. **实时生成技术**
   - 低延迟音乐生成
   - 交互式音乐创作
   - 自适应背景音乐

3. **个性化定制**
   - 用户偏好学习
   - 风格自适应
   - 情感智能匹配

## 应用场景
- 创意音乐制作
- 游戏配乐生成
- 广告音乐制作
- 个性化音乐推荐

## 未来展望
AI音乐生成技术正在朝着更加智能、个性化和实用的方向发展。未来，我们可以期待：
- 更自然的音乐表达
- 更深入的情感理解
- 更强大的创作辅助功能
- 更广泛的应用场景

## 结论
AI音乐生成技术的发展正在重塑音乐创作的方式。通过不断的技术创新和应用探索，AI将为音乐创作带来更多可能性。`,
        category: ArticleCategory.PROFESSIONAL,
        status: ArticleStatus.PUBLISHED,
        tags: ['AI', '音乐生成', '技术趋势', '深度学习', 'Transformer'],
        coverImage: 'https://picsum.photos/800/400',
        publishedAt: new Date(),
        views: 100,
        likes: 50,
        language: 'zh'
      },
      {
        title: '如何使用 Photo Song 创作你的第一首 AI 音乐',
        slug: 'how-to-create-first-ai-music',
        summary: '详细教程：从零开始使用 Photo Song 创作 AI 音乐，包括图片选择、风格设置、音乐生成等全流程指南。',
        content: `# 如何使用 Photo Song 创作你的第一首 AI 音乐

## 准备工作
在开始创作之前，请确保：
- 已注册 Photo Song 账号
- 账户中有足够的积分
- 准备好想要转换的图片

## 创作步骤

### 1. 选择合适的图片
- 图片质量要求：清晰、主题明确
- 支持格式：JPG、PNG
- 大小限制：不超过25MB
- 建议：选择具有强烈情感或故事性的图片

### 2. 上传图片
1. 点击"创作"按钮
2. 将图片拖拽到上传区域或点击选择文件
3. 等待图片上传完成

### 3. 设置音乐风格
选择适合的音乐风格：
- Pop（流行）：现代感强，节奏明快
- Classical（古典）：优雅庄重
- Electronic（电子）：现代科技感
- Jazz（爵士）：浪漫随性
- 等更多风格选项...

### 4. 生成音乐
- 点击"生成音乐"按钮
- 等待AI分析图片并创作音乐
- 生成过程通常需要1-2分钟

### 5. 预览和调整
- 试听生成的音乐
- 可以调整音乐参数：
  - 速度
  - 音量
  - 乐器比重
  - 情感倾向

### 6. 保存作品
- 为作品添加标题
- 选择是否公开分享
- 添加标签和描述
- 点击保存

## 创作技巧

### 图片选择技巧
1. **主题明确**：选择主题突出的图片
2. **情感丰富**：包含明显的情感元素
3. **构图协调**：画面构图完整平衡

### 风格匹配建议
- 风景照片 → 古典或氛围音乐
- 城市场景 → 电子或爵士乐
- 人物肖像 → 流行或民谣
- 抽象艺术 → 实验电子或前卫音乐

## 常见问题解答

### Q1: 为什么我的音乐生成失败了？
可能原因：
- 网络连接不稳定
- 服务器繁忙
- 图片格式不支持
解决方案：请检查网络连接并重试，或更换图片。

### Q2: 如何获得更好的音乐效果？
建议：
- 选择高质量的原始图片
- 尝试不同的音乐风格
- 适当调整音乐参数
- 多次尝试找到最佳效果

## 结语
通过本教程，你已经了解了使用 Photo Song 创作AI音乐的基本流程。开始你的创作之旅吧！记住，创作是一个不断探索和尝试的过程，享受这个过程才是最重要的。`,
        category: ArticleCategory.TUTORIAL,
        status: ArticleStatus.PUBLISHED,
        tags: ['教程', '新手指南', 'Photo Song', 'AI音乐'],
        coverImage: 'https://picsum.photos/800/400',
        publishedAt: new Date(),
        views: 200,
        likes: 80,
        language: 'zh'
      },
      {
        title: '音乐科技行业2024年展望',
        slug: 'music-tech-industry-2024',
        summary: '深入分析音乐科技行业的发展趋势和机遇，探讨AI技术对音乐产业的影响和未来发展方向。',
        content: `# 音乐科技行业2024年展望

## 市场概况
2024年，音乐科技行业正经历着前所未有的变革。AI技术的快速发展正在重塑整个行业的格局，为创作者和消费者带来新的机遇和挑战。

## 主要趋势

### 1. AI音乐创作工具普及
- 专业音乐制作工具AI化
- 个人创作门槛降低
- 创作效率大幅提升

### 2. 个性化音乐体验
- AI推荐算法升级
- 情境感知音乐
- 实时互动音乐生成

### 3. 新商业模式涌现
- AI音乐版权新规则
- 创作者经济新机遇
- 跨界合作新模式

## 技术创新
1. **深度学习模型**
   - 多模态融合
   - 实时生成
   - 风格迁移

2. **音频处理技术**
   - 高质量音频合成
   - 智能混音母带
   - 声音分离技术

3. **交互技术**
   - 手势控制
   - 脑机接口
   - AR/VR音乐体验

## 市场机遇

### 创作者市场
- 专业音乐人工具升级
- 业余创作者准入门槛降低
- 新型音乐创作平台兴起

### 消费者市场
- 个性化音乐服务
- 沉浸式音乐体验
- 社交音乐应用

### 企业市场
- 商业配乐解决方案
- 品牌声音营销
- 智能音乐管理系统

## 挑战与风险

### 1. 技术挑战
- 音质提升需求
- 实时性要求
- 计算资源消耗

### 2. 行业规范
- 版权保护
- 伦理规范
- 质量标准

### 3. 市场竞争
- 同质化严重
- 盈利模式不清
- 用户习惯培养

## 投资机会

### 重点领域
1. AI音乐创作平台
2. 音乐教育科技
3. 音乐社交平台
4. 企业级解决方案

### 投资建议
- 关注技术创新
- 重视商业模式
- 注意风险控制

## 未来展望

### 短期（1-2年）
- AI创作工具普及
- 个性化服务成熟
- 商业模式明确

### 中期（3-5年）
- 技术深度整合
- 新业态形成
- 产业链完善

### 长期（5年以上）
- 行业格局重塑
- 创新生态形成
- 全球市场整合

## 结论
2024年，音乐科技行业将继续保持高速发展态势。AI技术的深度应用将带来更多创新和机遇，但也需要警惕风险，把握平衡。未来，技术与音乐的结合将创造出更多令人惊喜的可能性。`,
        category: ArticleCategory.INDUSTRY,
        status: ArticleStatus.PUBLISHED,
        tags: ['行业分析', '趋势', '2024', 'AI音乐', '音乐科技'],
        coverImage: 'https://picsum.photos/800/400',
        publishedAt: new Date(),
        views: 150,
        likes: 60,
        language: 'zh'
      }
    ]
    
    // 创建文章
    for (const articleData of articles) {
      const article = new Article()
      Object.entries(articleData).forEach(([key, value]) => {
        article.set(key, value)
      })
      await article.save()
    }
  } catch (error) {
    console.error('Failed to create sample articles:', error)
  }
}

// 在开发环境下自动创建示例数据
if (import.meta.env.DEV) {
  createSampleArticles()
}

// 预渲染页面类型
export const PreRenderedPageClass = {
  name: 'PreRenderedPage',
  fields: {
    objectId: 'String',
    type: 'String',
    url: 'String',
    status: 'String',
    htmlVersions: 'Object',
    error: 'String',
    lastUpdated: 'Date'
  },
  indexes: [
    { fields: ['objectId', 'type'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['lastUpdated'] }
  ]
}

export default AV 