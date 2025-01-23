export default {
  nav: {
    home: '首页',
    create: '创作',
    community: '社区',
    profile: '个人中心',
    pricing: '会员服务',
    login: '登录',
    register: '注册',
    logout: '退出登录'
  },
  home: {
    hero: {
      title: 'AI 驱动的照片音乐创作平台',
      description: '使用先进的 AI 技术，将您的照片转化为独特的音乐作品。让每一张照片都能唱出属于自己的歌。',
      stats: {
        users: '活跃用户',
        works: '作品创作',
        rating: '用户评分'
      },
      buttons: {
        start: '开始创作',
        explore: '探索作品'
      },
      features: {
        imageProcessing: '图片处理',
        musicCreation: '音乐创作',
        sharing: '实时分享'
      }
    },
    stats: {
      activeUsers: '活跃用户',
      creations: '作品创作',
      rating: '用户评分'
    },
    features: {
      title: '特色功能',
      aiPowered: {
        title: 'AI 驱动',
        desc: '先进的 AI 算法创作独特音乐'
      },
      easyToUse: {
        title: '简单易用',
        desc: '简洁直观的操作界面'
      },
      unique: {
        title: '独特创作',
        desc: '每张照片都创造独一无二的音乐'
      }
    },
    howItWorks: {
      title: '创作流程',
      description: '简单四步，让照片拥有音乐的灵魂'
    },
    useCases: {
      ariaLabel: '应用场景：{title}',
      title: '应用场景',
      description: '探索 Photo Song 在不同场景的创意应用',
      travel: {
        title: '旅行回忆',
        description: '将您的旅行照片转化为音乐之旅'
      },
      wedding: {
        title: '婚礼时刻',
        description: '为您的特殊时刻创作独特的音乐作品'
      },
      business: {
        title: '商业营销',
        description: '用AI生成的定制音乐提升您的品牌'
      },
      social: {
        title: '社交媒体',
        description: '为您的社交帖子创作独特的音乐内容'
      }
    },
    testimonials: {
      ariaLabel: '来自 {author}（{title}）的评价',
      title: '用户评价',
      description: '听听他们怎么说',
      1: {
        content: 'Photo Song 让我的旅行照片有了灵魂，每张照片都能讲述一个独特的故事。',
        author: '李明',
        title: '旅行摄影师'
      },
      2: {
        content: '作为一名视频创作者，这个平台帮我解决了配乐的难题，AI 生成的音乐非常专业。',
        author: '张雨',
        title: '视频博主'
      },
      3: {
        content: '超乎想象的创新体验！AI 不仅能准确理解照片的情感，还能创作出令人惊叹的音乐。',
        author: '王芳',
        title: '音乐教师'
      }
    },
    featuredWorks: {
      title: '最新作品',
      description: '发现来自社区的精彩音乐创作'
    },
    works: {
      status: {
        generating: '生成中',
        failed: '生成失败'
      },
      untitledWork: '未命名作品',
      anonymousUser: '匿名用户',
      playWork: '播放 {title} 的音乐'
    },
    cta: {
      title: '准备好开始创作了吗？',
      description: '立即注册，免费体验 AI 驱动的音乐创作。让您的照片拥有独特的声音。',
      button: '免费开始创作'
    },
    techBadges: {
      imageProcessing: '图片处理',
      musicCreation: '歌词音乐创作',
      realTimeSharing: '实时分享'
    },
    steps: {
      ariaLabel: '步骤 {number}：{title}',
      1: {
        title: '上传照片',
        description: '选择您想要转换的照片'
      },
      2: {
        title: 'AI 分析',
        description: '先进的 AI 技术分析内容、场景和情感'
      },
      3: {
        title: '生成音乐',
        description: '基于分析结果创作独特的音乐作品'
      },
      4: {
        title: '分享作品',
        description: '下载或在社区分享您的创作成果'
      }
    }
  },
  common: {
    plays: '播放',
    dateFormat: {
      full: 'YYYY年MM月DD日 HH:mm',
      date: 'YYYY年MM月DD日',
      time: 'HH:mm',
      year: 'YYYY年',
      month: 'MM月',
      day: 'DD日'
    }
  },
  footer: {
    links: {
      about: '关于我们',
      terms: '服务条款',
      privacy: '隐私政策',
      contact: '联系我们',
      disclaimer: '免责声明'
    },
    quickLinks: {
      title: '快速链接',
      home: '首页',
      create: '开始创作',
      community: '社区',
      pricing: '会员'
    },
    help: {
      title: '帮助支持',
      tutorial: '使用教程',
      faq: '常见问题',
      contact: '联系我们',
      feedback: '意见反馈'
    },
    newsletter: {
      title: '订阅更新',
      description: '订阅我们的新闻，获取最新功能和优惠信息。',
      placeholder: '输入您的邮箱',
      subscribe: '订阅'
    },
    copyright: '© {year} Photo Song. 保留所有权利。',
    description: '基于人工智能的照片音乐创作平台'
  },
  logout: {
    success: '退出登录成功',
    error: '退出登录失败'
  },
  errors: {
    fetchWorks: '获取最新作品失败',
    audioInit: '音频初始化失败'
  },
  create: {
    title: 'AI 音乐创作',
    subtitle: '上传图片，让 AI 为你创作专属音乐',
    points: {
      label: '积分',
      buy: '购买积分'
    },
    notice: {
      title: '创作提示',
      tips: [
        '不要刷新或关闭页面',
        '上传完成后自动进入下一步',
        '禁止上传违规内容'
      ]
    },
    steps: {
      upload: '上传图片',
      style: '选择风格和标题',
      lyrics: '生成/编辑歌词',
      music: '生成音乐'
    },
    upload: {
      title: '点击或拖拽上传图片',
      description: '请上传 jpg、png 格式，大小不超过 5MB（上传图片后自动扣除积分并进入下一步）',
      reupload: '重新上传',
      progress: '上传进度',
      placeholder: '为你的作品起个名字（最多10个字符）',
      maxSize: '图片大小不能超过 5MB',
      invalidFormat: '请上传 jpg 或 png 格式的图片',
      uploadFailed: '图片上传失败，请重试'
    },
    style: {
      title: '音乐风格',
      pop: '流行',
      rock: '摇滚',
      electronic: '电子',
      classical: '古典',
      jazz: '爵士',
      folk: '民谣',
      hiphop: '嘻哈',
      rnb: 'R&B',
      country: '乡村',
      blues: '蓝调',
      ambient: '氛围',
      edm: '电子舞曲',
      metal: '金属',
      indie: '独立',
      soul: '灵魂'
    },
    language: {
      title: '歌词语言',
      single: '单语言',
      mixed: '混合语言',
      singleDesc: '仅使用选定的语言',
      mixedDesc: '在歌词中混合使用多种语言',
      options: {
        zh: '中文',
        en: '英文',
        mixed: '中英混合'
      }
    },
    length: {
      title: '歌曲长度',
      short: {
        label: '简短',
        description: '1-2节，适合简单表达'
      },
      medium: {
        label: '中等',
        description: '2-3节，标准流行歌曲长度'
      },
      long: {
        label: '较长',
        description: '3-4节，适合复杂故事'
      }
    },
    lyrics: {
      title: '歌词预览',
      optimize: '优化歌词',
      edit: '手动编辑',
      finish: '完成编辑',
      placeholder: '编辑歌词',
      relevance: {
        title: '关联程度',
        high: {
          label: '高度相关',
          description: '歌词将紧密围绕图片内容，直接描述或诠释图片中的场景、情感和故事'
        },
        medium: {
          label: '中度相关',
          description: '歌词将部分基于图片内容，同时加入更多创意和想象'
        },
        low: {
          label: '自由发挥',
          description: '歌词将以图片为灵感，但更注重创意表达和艺术发挥'
        }
      }
    },
    buttons: {
      generate: {
        lyrics: '生成歌词',
        music: '开始生成音乐'
      },
      next: '下一步',
      back: '返回',
      retry: '重试',
      cancel: '取消',
      confirm: '确认',
      save: '保存',
      edit: '编辑',
      delete: '删除'
    },
    generating: {
      title: '正在生成音乐',
      description: '这可能需要几分钟时间，请耐心等待...',
      progress: '已完成 {progress}%',
      queue: '排队中...',
      preparing: '准备中...',
      processing: '处理中...',
      finalizing: '最后处理中...',
      tip: '生成过程中请勿关闭页面'
    },
    preview: {
      title: '预览',
      description: '预览您的作品',
      loading: '加载中...',
      error: '加载失败',
      retry: '重试'
    },
    share: {
      title: '分享',
      description: '分享您的作品',
      copy: '复制链接',
      download: '下载',
      success: '链接已复制'
    },
    errors: {
      incomplete: '请填写完整信息',
      generation: '音乐生成失败',
      network: '网络请求失败，请检查网络连接',
      points: '积分不足，请购买积分',
      imageAnalysis: '图片分析失败',
      lyricsGeneration: '歌词生成失败',
      musicGeneration: '音乐生成失败',
      taskCheck: '检查任务状态失败'
    },
    success: {
      upload: '图片上传成功',
      lyrics: '歌词生成成功',
      music: '音乐生成成功',
      pointsRefund: '已退还积分',
      login: '登录成功',
      register: '注册成功',
      avatarUpload: '头像上传成功',
      save: '保存成功',
      delete: '删除成功',
      share: '分享成功',
      copy: '复制成功'
    }
  },
  profile: {
    title: '个人中心',
    works: {
      title: '我的作品',
      untitledWork: '未命名作品',
      filter: {
        all: '全部作品',
        generating: '生成中',
        completed: '已完成',
        failed: '生成失败'
      },
      status: {
        generating: '生成中...',
        completed: '已完成',
        failed: '生成失败'
      },
      error: {
        loadFailed: '加载作品列表失败',
        checkStatusFailed: '检查任务状态失败',
        tooManyRetries: '检查任务状态重试次数过多'
      },
      total: '作品总数',
      completed: '已完成作品',
      refresh: '刷新'
    },
    user: {
      works: '作品',
      points: '积分',
      membership: {
        daysLeft: '剩余 {days} 天',
        expired: '已过期'
      },
      avatar: {
        upload: '上传头像',
        error: {
          format: '请上传 JPG 或 PNG 格式图片',
          size: '图片大小不能超过 2MB',
          uploadFailed: '头像上传失败'
        }
      },
      logout: {
        button: '退出登录',
        success: '退出登录成功',
        failed: '退出登录失败'
      },
      creator: '创作者'
    }
  },
  workDetail: {
    error: {
      notFound: '作品不存在',
      loadFailed: '加载作品详情失败',
      playFailed: '播放失败',
      downloadFailed: '下载失败',
      audioNotFound: '音频文件不存在'
    },
    audio: {
      play: '播放',
      pause: '暂停',
      clickToPlay: '点击播放',
      tryAgain: '请重试',
      volume: '音量',
      mute: '静音',
      unmute: '取消静音'
    },
    actions: {
      download: {
        button: '下载',
        success: '下载成功',
        failed: '下载失败'
      },
      share: {
        button: '分享',
        title: '分享作品',
        success: '链接已复制到剪贴板',
        failed: '复制链接失败'
      }
    },
    lyrics: {
      show: '显示歌词',
      hide: '隐藏歌词',
      notAvailable: '暂无歌词'
    },
    status: {
      generating: '生成中...',
      completed: '已完成',
      failed: '生成失败',
      progress: '已完成 {progress}%'
    },
    user: {
      creator: '创作者'
    },
    stats: {
      plays: '次播放'
    },
    style: {
      title: '音乐风格'
    },
    description: {
      title: '作品描述'
    }
  },
  pricing: {
    title: '会员权益',
    subtitle: '解锁AI音乐创作的无限可能',
    plans: {
      period: {
        month: '月',
        year: '年',
        lifetime: '永久'
      },
      button: '立即订阅',
      starter: {
        name: '体验会员',
        features: {
          monthlyPoints: '每月2000积分',
          unlimitedCreation: '无限次数创作',
          commercialLicense: '作品商用授权',
          priorityQueue: '优先生成队列'
        }
      },
      advanced: {
        name: '进阶会员',
        features: {
          monthlyPoints: '每月6000积分',
          unlimitedCreation: '无限次数创作',
          commercialLicense: '作品商用授权',
          priorityQueue: '优先生成队列',
          support: '专属客服支持'
        }
      },
      pro: {
        name: '专业会员',
        features: {
          yearlyPoints: '每年40000积分',
          unlimitedCreation: '无限次数创作',
          commercialLicense: '作品商用授权',
          highestPriority: '最高生成优先级',
          support: '专属客服支持',
          customService: '定制化服务'
        }
      },
      lifetime: {
        name: '永久会员',
        features: {
          lifetimePoints: '赠送160000积分',
          unlimitedCreation: '无限次数创作',
          commercialLicense: '作品商用授权',
          highestPriority: '最高生成优先级',
          support: '专属客服支持',
          customService: '定制化服务',
          lifetime: '永久有效'
        }
      }
    },
    points: {
      title: '购买积分',
      unit: '积分',
      rate: '1美元 = 400积分',
      packages: {
        recommended: '推荐',
        buyNow: '立即购买',
        0: {
          name: '小额储值',
          description: '体验创作乐趣'
        },
        1: {
          name: '超值套餐',
          description: '灵感无限释放'
        },
        2: {
          name: '豪华套餐',
          description: '创作无限可能'
        }
      }
    },
    membership: {
      mostPopular: '最受欢迎',
      benefits: {
        title: '会员特权',
        features: {
          advanced: {
            title: '高级功能',
            description: '解锁更多专业音乐创作功能',
            details: [
              '多种专业音乐风格选择',
              '自定义音乐长度和结构',
              '高级音频处理效果',
              '批量创作功能'
            ]
          },
          templates: {
            title: '专属模板',
            description: '获取高级音乐风格模板',
            details: [
              '独家音乐风格模板库',
              '定制化编曲方案',
              '专业音乐人设计模板',
              '持续更新新风格'
            ]
          },
          copyright: {
            title: '版权授权',
            description: '获得作品商业使用权',
            details: [
              '作品完整商业授权',
              '可用于商业项目',
              '版权证书下载',
              '法律咨询支持'
            ]
          },
          priority: {
            title: '优先特权',
            description: '尊享会员专属特权',
            details: [
              '优先生成队列',
              '专属客服支持',
              '提前体验新功能',
              '会员专属活动'
            ]
          }
        }
      }
    }
  },
  auth: {
    title: {
      login: '登录',
      register: '注册',
      welcome: '欢迎回来',
      join: '加入 Photo Song'
    },
    form: {
      email: {
        label: '邮箱',
        placeholder: '请输入邮箱'
      },
      username: {
        label: '用户名',
        placeholder: '请输入用户名'
      },
      password: {
        label: '密码',
        placeholder: '请输入密码'
      },
      confirmPassword: {
        label: '确认密码',
        placeholder: '请再次输入密码'
      },
      avatar: {
        upload: '上传头像',
        change: '更换头像'
      }
    },
    buttons: {
      login: '登录',
      register: '注册',
      forgotPassword: '忘记密码？',
      hasAccount: '已有账号？去登录',
      noAccount: '没有账号？去注册',
      verifyEmail: '重新发送验证邮件',
      resendCode: '重新发送验证码'
    },
    validation: {
      email: {
        required: '请输入邮箱地址',
        invalid: '请输入有效的邮箱地址',
        unverified: '邮箱未验证，请先验证邮箱'
      },
      username: {
        required: '请输入用户名',
        minLength: '用户名至少需要2个字符'
      },
      password: {
        required: '请输入密码',
        minLength: '密码至少需要6个字符',
        notMatch: '两次输入的密码不一致'
      }
    },
    errors: {
      loginFailed: '登录失败，请检查邮箱和密码',
      registerFailed: '注册失败，请稍后重试',
      userExists: '该邮箱已被注册',
      verificationFailed: '验证失败，请稍后重试',
      verificationRequired: '请先验证邮箱',
      verificationSent: '验证邮件已发送，请查收',
      tooManyAttempts: '操作过于频繁，请稍后再试',
      requestEmailVerification: '请先验证您的邮箱'
    },
    success: {
      verificationSent: '验证邮件已发送',
      verified: '邮箱验证成功',
      registered: '注册成功',
      loggedIn: '登录成功'
    },
    resetPassword: {
      title: '重置密码',
      subtitle: '输入您的邮箱以重置密码',
      success: {
        title: '重置邮件已发送',
        message: '重置密码邮件已发送到您的邮箱，请按照邮件中的指引完成密码重置。',
        tip: '如果没有收到邮件，请检查垃圾邮件文件夹。'
      },
      form: {
        email: {
          label: '邮箱',
          placeholder: '请输入您的邮箱地址'
        }
      },
      buttons: {
        submit: '发送重置邮件',
        backToLogin: '返回登录'
      },
      errors: {
        emailRequired: '请输入邮箱地址',
        emailInvalid: '请输入有效的邮箱地址',
        resetFailed: '重置密码失败，请稍后重试',
        userNotFound: '该邮箱未注册'
      }
    }
  },
  points: {
    current: '当前积分',
    deducted: '已扣除 {points} 积分',
    refunded: '已退还 {points} 积分',
    insufficient: '积分不足',
    buy: '购买积分',
    label: '积分',
    perUSD: '1美元 = {points}积分',
    description: '创作一首歌曲需要100积分'
  },
  notice: {
    title: '创作提示',
    tips: [
      '不要刷新或关闭页面',
      '上传完成后自动进入下一步',
      '禁止上传违规内容'
    ]
  },
  messages: {
    confirmDelete: '确认删除？',
    confirmLogout: '确认退出登录？',
    taskQueued: '任务已加入队列',
    taskStarted: '开始处理任务',
    taskCompleted: '任务已完成',
    taskFailed: '任务处理失败',
    pleaseWait: '请稍候...',
    processingImage: '正在处理图片...',
    generatingLyrics: '正在生成歌词...',
    generatingMusic: '正在生成音乐...',
    savingWork: '正在保存作品...',
    loadingMore: '加载更多...',
    noMoreData: '没有更多数据了',
    refreshing: '正在刷新...',
    uploading: '正在上传...',
    downloading: '正在下载...',
    processing: '处理中...'
  },
  community: {
    title: '探索创作',
    description: '发现来自社区的精彩音乐作品',
    works: {
      untitledWork: '未命名作品',
      anonymousUser: '匿名用户',
      loadingError: '加载作品列表失败',
      playCount: '次播放'
    }
  }
} 