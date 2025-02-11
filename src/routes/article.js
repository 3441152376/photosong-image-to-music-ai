// 文章优化路由
router.post('/enhance', auth, async (req, res) => {
  try {
    const { articleId, options } = req.body;
    const article = await Article.findById(articleId);
    
    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }
    
    const enhancedContent = await article.enhanceContent(options);
    article.content = enhancedContent;
    await article.save();
    
    res.json({ message: '文章优化成功', article });
  } catch (error) {
    console.error('文章优化失败:', error);
    res.status(500).json({ message: '文章优化失败', error: error.message });
  }
});

// 文章仿写路由
router.post('/rewrite', auth, async (req, res) => {
  try {
    const { referenceContent, options } = req.body;
    const article = new Article();
    
    const rewrittenContent = await article.rewriteFromReference(referenceContent, options);
    article.content = rewrittenContent;
    article.author = req.user._id;
    article.status = 'draft';
    await article.save();
    
    res.json({ message: '文章仿写成功', article });
  } catch (error) {
    console.error('文章仿写失败:', error);
    res.status(500).json({ message: '文章仿写失败', error: error.message });
  }
}); 