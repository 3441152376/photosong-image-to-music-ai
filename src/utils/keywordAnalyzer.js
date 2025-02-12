// 简单的分词函数
function simpleTokenize(text, language) {
  switch (language) {
    case 'zh':
      // 中文分词：按照单字分词，同时保留连续的英文和数字
      return text.match(/[\u4e00-\u9fa5]|[a-zA-Z]+|[0-9]+/g) || []
    case 'ru':
      // 俄语分词：按照空格和标点符号分词
      return text.split(/[\s,.!?;:()[\]{}'"]+/).filter(Boolean)
    case 'en':
    default:
      // 英语分词：按照空格和标点符号分词
      return text.toLowerCase().split(/[\s,.!?;:()[\]{}'"]+/).filter(Boolean)
  }
}

// 添加地理位置关键词支持
const geoKeywords = {
  zh: {
    countries: ['中国', '美国', '俄罗斯', '日本', '韩国'],
    cities: {
      '中国': ['北京', '上海', '广州', '深圳', '杭州', '成都'],
      '美国': ['纽约', '洛杉矶', '旧金山', '西雅图', '波士顿'],
      '俄罗斯': ['莫斯科', '圣彼得堡', '新西伯利亚']
    }
  },
  en: {
    countries: ['China', 'USA', 'Russia', 'Japan', 'Korea'],
    cities: {
      'USA': ['New York', 'Los Angeles', 'San Francisco', 'Seattle', 'Boston'],
      'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou'],
      'Russia': ['Moscow', 'St. Petersburg', 'Novosibirsk']
    }
  },
  ru: {
    countries: ['Россия', 'Китай', 'США', 'Япония', 'Корея'],
    cities: {
      'Россия': ['Москва', 'Санкт-Петербург', 'Новосибирск'],
      'Китай': ['Пекин', 'Шанхай', 'Гуанчжоу', 'Шэньчжэнь'],
      'США': ['Нью-Йорк', 'Лос-Анджелес', 'Сан-Франциско']
    }
  }
}

// 关键词权重计算类
export class KeywordAnalyzer {
  constructor() {
    this.stopWords = {
      zh: new Set(['的', '了', '和', '是', '在', '我', '有', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']),
      en: new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at']),
      ru: new Set(['и', 'в', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а', 'по', 'это', 'она', 'этот', 'к', 'но', 'они', 'мы', 'как', 'из'])
    }
    
    // 添加自然语言处理规则
    this.nlpRules = {
      maxKeywordDensity: 0.03, // 最大关键词密度
      minKeywordDistance: 100, // 关键词最小间距
      naturalLanguagePatterns: [
        /^[A-Z][a-z\s]/, // 句子开头大写
        /[.!?]$/, // 合适的句子结尾
        /\b\w+(?:\s+\w+){2,}\b/ // 至少包含3个词的短语
      ]
    }
  }

  // 分析文本并提取关键词
  async analyzeText(text, options = {}) {
    const {
      language = 'en',
      maxKeywords = 10,
      includeScores = false,
      minScore = 0.1,
      location = null,
      checkNaturalLanguage = true
    } = options

    try {
      // 使用简单分词
      const tokens = simpleTokenize(text, language)
      const filteredTokens = this.filterStopWords(tokens, language)
      let scores = this.calculateWordFrequency(filteredTokens)
      
      // 添加地理位置关键词
      if (location) {
        const locationKeywords = this.addLocationKeywords(text, language, location)
        locationKeywords.forEach((weight, keyword) => {
          const existingWeight = scores.get(keyword) || 0
          scores.set(keyword, existingWeight + weight)
        })
      }
      
      // 自然语言检查
      if (checkNaturalLanguage) {
        scores = new Map(
          Array.from(scores.entries()).filter(([keyword, score]) => {
            // 检查关键词密度
            const density = this.checkKeywordDensity(text, keyword)
            if (density > this.nlpRules.maxKeywordDensity) {
              return false
            }
            
            // 检查关键词分布
            if (!this.checkKeywordDistribution(text, keyword)) {
              return false
            }
            
            return true
          })
        )
      }
      
      // 排序并限制数量
      const sortedKeywords = Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .filter(([_, score]) => score >= minScore)
        .slice(0, maxKeywords)

      return includeScores ? sortedKeywords : sortedKeywords.map(([word]) => word)
    } catch (error) {
      console.error('Keyword analysis failed:', error)
      return []
    }
  }

  // 过滤停用词
  filterStopWords(tokens, language) {
    const stopWords = this.stopWords[language] || new Set()
    return tokens.filter(token => !stopWords.has(token.toLowerCase()))
  }

  // 计算词频
  calculateWordFrequency(tokens) {
    const scores = new Map()
    const totalWords = tokens.length

    tokens.forEach(token => {
      scores.set(token, (scores.get(token) || 0) + 1)
    })

    // 归一化分数
    scores.forEach((score, word) => {
      scores.set(word, score / totalWords)
    })

    return scores
  }

  // 计算关键词位置权重
  calculatePositionalWeight(text, keyword, options = {}) {
    const {
      titleWeight = 2.0,
      firstParagraphWeight = 1.5,
      headingWeight = 1.8
    } = options

    try {
      let weight = 1.0

      // 标题中出现
      if (text.title && text.title.toLowerCase().includes(keyword.toLowerCase())) {
        weight *= titleWeight
      }

      // 第一段落中出现
      const firstParagraph = text.content?.split('\n')[0] || ''
      if (firstParagraph.toLowerCase().includes(keyword.toLowerCase())) {
        weight *= firstParagraphWeight
      }

      // 标题标签中出现
      const headings = text.content?.match(/<h[1-6]>.*?<\/h[1-6]>/gi) || []
      if (headings.some(h => h.toLowerCase().includes(keyword.toLowerCase()))) {
        weight *= headingWeight
      }

      return weight
    } catch (error) {
      console.error('Positional weight calculation failed:', error)
      return 1.0
    }
  }

  // 合并多语言关键词
  async mergeMultilingualKeywords(texts) {
    try {
      const allKeywords = new Map()

      for (const [lang, text] of Object.entries(texts)) {
        const keywords = await this.analyzeText(text, { language: lang, includeScores: true })
        
        keywords.forEach(([keyword, score]) => {
          const existingScore = allKeywords.get(keyword) || 0
          allKeywords.set(keyword, Math.max(existingScore, score))
        })
      }

      return Array.from(allKeywords.entries())
        .sort((a, b) => b[1] - a[1])
    } catch (error) {
      console.error('Multilingual keyword merge failed:', error)
      return []
    }
  }

  // 检查关键词密度
  checkKeywordDensity(text, keyword) {
    const words = text.toLowerCase().split(/\s+/)
    const keywordCount = words.filter(word => word === keyword.toLowerCase()).length
    return keywordCount / words.length
  }

  // 检查关键词分布
  checkKeywordDistribution(text, keyword) {
    const positions = []
    let pos = text.toLowerCase().indexOf(keyword.toLowerCase())
    while (pos !== -1) {
      positions.push(pos)
      pos = text.toLowerCase().indexOf(keyword.toLowerCase(), pos + 1)
    }
    
    // 检查关键词间距
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] - positions[i-1] < this.nlpRules.minKeywordDistance) {
        return false
      }
    }
    return true
  }

  // 添加地理位置相关关键词
  addLocationKeywords(text, language, location) {
    try {
      const locationKeywords = new Map()
      const geo = geoKeywords[language]
      
      if (!geo) return new Map()
      
      // 添加国家关键词
      if (location.country) {
        const countryWeight = 5
        locationKeywords.set(location.country, countryWeight)
        
        // 添加城市关键词
        const cities = geo.cities[location.country] || []
        cities.forEach(city => {
          if (city === location.city) {
            locationKeywords.set(city, countryWeight + 2)
          } else {
            locationKeywords.set(city, countryWeight - 2)
          }
        })
      }
      
      return locationKeywords
    } catch (error) {
      console.error('Add location keywords failed:', error)
      return new Map()
    }
  }
} 