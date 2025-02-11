// 文章优化
export const enhanceArticle = async (content, options) => {
  if (!content) {
    throw new Error('Content is required for enhancement');
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_AI_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_AI_TOKEN}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的文章优化专家。请根据用户的具体要求优化文章内容。'
          },
          {
            role: 'user',
            content: `请根据以下要求优化文章：

优化重点：${options.focusAreas?.join(', ') || '全面优化'}
语气风格：${options.tone || '专业'}
目标长度：${options.targetLength || 'maintain'}
保持结构：${options.keepStructure === 'keep' ? '是' : '否'}

优化要求：
1. ${options.focusAreas?.includes('seo') ? 'SEO优化：优化关键词分布，改进标题和小标题' : '保持原有SEO元素'}
2. ${options.focusAreas?.includes('readability') ? '提升可读性：优化段落结构，增加过渡语句' : '维持原有可读性'}
3. ${options.focusAreas?.includes('professionalism') ? '增强专业性：加入专业术语和行业见解' : '保持原有专业度'}
4. ${options.focusAreas?.includes('engagement') ? '提升吸引力：优化开场和结尾，增加互动元素' : '保持原有吸引力'}
5. 根据指定语气风格调整表达方式
6. ${options.targetLength === 'maintain' ? '保持原文长度' : options.targetLength === 'expand' ? '适当扩展内容' : '精简内容'}
7. ${options.keepStructure === 'keep' ? '保持原有文章结构' : '优化文章结构'}

请优化以下文章内容：
${content}`
          }
        ],
        max_tokens: 3000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '文章优化失败');
    }

    const data = await response.json();
    const enhancedContent = data.choices?.[0]?.message?.content?.trim();
    
    if (!enhancedContent) {
      throw new Error('No enhanced content received');
    }

    return {
      success: true,
      article: {
        content: enhancedContent,
        updatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Article enhancement failed:', error);
    throw new Error(error.message || '文章优化失败');
  }
};

// 文章仿写
export const rewriteArticle = async (referenceContent, options) => {
  const response = await fetch(`${import.meta.env.VITE_AI_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_AI_TOKEN}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文章创作专家。请根据参考文章和用户要求创作新的文章。'
        },
        {
          role: 'user',
          content: `请根据以下要求进行文章仿写：

相似度要求：${options.similarity === 'high' ? '保持高度相似' : options.similarity === 'medium' ? '保持中度相似' : '保持低度相似'}
写作风格：${options.style === 'original' ? '保持原创风格' : options.style === 'creative' ? '创新风格' : '学术风格'}
重点关注：${options.focus.join(', ') || '全面关注'}
改进方面：${options.improvements.join(', ') || '全面改进'}

参考文章内容：
${referenceContent}

请基于以上要求，创作一篇新的文章。`
        }
      ],
      max_tokens: 3000,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '文章仿写失败');
  }
  
  const data = await response.json();
  return {
    success: true,
    article: {
      content: data.choices[0].message.content.trim()
    }
  };
}; 