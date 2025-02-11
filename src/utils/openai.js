class OpenAI {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions'
  }

  async complete({ prompt, maxTokens = 100 }) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的SEO关键词生成助手。请根据提供的文章标题和摘要，生成相关的SEO关键词，关键词之间用逗号分隔。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('OpenAI API error:', error)
      // 如果 API 调用失败，返回一些基本的关键词
      return ['AI', '音乐生成', '技术'].join(',')
    }
  }
}

export default OpenAI 