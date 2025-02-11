export default {
  meta: {
    title: 'PhotoSong - AI Music Generator | Transform Photos into Music',
    description: 'PhotoSong is a leading AI music generation platform. Upload photos to create unique musical pieces. Supporting various music styles including pop, classical, and jazz.',
    keywords: 'AI music generation,photo to music,AI composition,intelligent music creation,AI composer,image music conversion,AI soundtrack,smart music,music generator,automatic composition,AI music tools,intelligent music app'
  },
  nav: {
    home: 'Home',
    create: 'Create',
    community: 'Community',
    articles: 'Articles',
    pricing: 'Pricing',
    faq: 'FAQ',
    contact: 'Contact',
    tutorial: 'Tutorial',
    feedback: 'Feedback',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    copyright: 'Copyright',
    profile: 'Profile',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    back: 'Back',
    works: 'Works'
  },
  
  auth: {
    title: {
      login: '🔐 Welcome Back',
      register: '✨ Join Photo Song',
      welcome: '👋 Welcome Back',
      join: '🎉 Join Photo Song'
    },
    loginPrompt: {
      title: '🔒 Login Required',
      description: 'Please login or create an account to access this feature',
      button: '🔑 Login Now'
    },
    login: 'Login',
    register: 'Register',
    contactSupport: 'Contact Support',
    error: {
      registerFailed: 'Registration failed, please try again later',
      deviceLimit: 'Device registration limit reached',
      deviceLimitTitle: 'Device Registration Limit',
      deviceLimitHelp: 'To ensure service quality, each device can register up to 3 accounts. Please contact support if you need assistance.',
      deviceLimitOption1: 'Login with existing account',
      deviceLimitOption2: 'Contact support for help',
      usernameExists: 'Username is already taken',
      emailExists: 'Email is already registered',
      mobilePhoneExists: 'Phone number is already registered',
      emailFormatInvalid: 'Invalid email format',
      passwordTooShort: 'Password must be at least 6 characters',
      accountNotExist: 'Account does not exist',
      wrongPassword: 'Incorrect password',
      emailNeedsVerification: 'Email verification required',
      tooManyLoginAttempts: 'Too many login attempts, please try again later',
      loginSystemError: 'Login system error, please try again later',
      emailVerificationRequired: 'Email verification required to login'
    },
    form: {
      email: {
        label: '📧 Email',
        placeholder: 'Enter your email'
      },
      username: {
        label: '👤 Username',
        placeholder: 'Enter username'
      },
      password: {
        label: '🔑 Password',
        placeholder: 'Enter password'
      },
      confirmPassword: {
        label: '🔄 Confirm Password',
        placeholder: 'Confirm your password'
      },
      avatar: {
        upload: '📸 Click here to upload avatar',
        change: '🔄 Click to change avatar',
        tip: '⚠️ Please upload your avatar (Required) - This helps others recognize you better',
        required: 'You have not uploaded an avatar yet, please upload one',
        dialog: {
          title: 'Avatar Required',
          content: 'To enhance community experience, we need you to upload an avatar. This will help other users recognize you better.',
          confirm: 'Upload Now',
          cancel: 'Later'
        }
      }
    },
    buttons: {
      login: '🔐 Login',
      register: '✨ Register',
      forgotPassword: '🤔 Forgot Password?',
      hasAccount: '👋 Already have an account? Login',
      noAccount: '✨ No account? Register',
      verifyEmail: '📧 Resend Verification Email',
      resendCode: '🔄 Resend Code'
    },
    validation: {
      email: {
        required: 'Email is required',
        invalid: 'Please enter a valid email address',
        unverified: 'Email is not verified, please verify first'
      },
      username: {
        required: 'Username is required',
        minLength: 'Username must be at least 2 characters'
      },
      password: {
        required: 'Password is required',
        minLength: 'Password must be at least 6 characters',
        notMatch: 'Passwords do not match'
      },
      avatar: {
        required: '⚠️ Please upload your avatar, it is required',
        format: '⚠️ Only JPG or PNG format allowed',
        size: '⚠️ Image size cannot exceed 10MB',
        success: '✅ Avatar uploaded successfully'
      }
    },
    errors: {
      loginFailed: 'Login failed, please check your email and password',
      userExists: 'This email is already registered',
      verificationFailed: 'Verification failed, please try again later',
      verificationRequired: 'Please verify your email first',
      verificationSent: 'Verification email has been sent',
      tooManyAttempts: 'Too many attempts, please try again later',
      requestEmailVerification: 'Please verify your email first',
      emailNotVerified: 'Please verify your email first',
      invalidEmail: 'Invalid email address',
      invalidPassword: 'Invalid password',
      userNotFound: 'User not found',
      emailAlreadyInUse: 'Email is already in use',
      weakPassword: 'Password is too weak',
      networkError: 'Network error, please try again later',
      unknownError: 'An unknown error occurred, please try again later',
      googleLogin: 'Failed to sign in with Google, please try again',
      loginRequired: 'Please login first',
      passwordReset: 'Password reset failed',
      updateProfile: 'Profile update failed',
      sessionExpired: 'Session expired, please login again',
      emailFormatInvalid: 'Invalid email format',
      passwordTooShort: 'Password must be at least 6 characters',
      accountNotExist: 'Account does not exist',
      wrongPassword: 'Incorrect password',
      emailNeedsVerification: 'Email verification required',
      tooManyLoginAttempts: 'Too many login attempts, please try again later',
      loginSystemError: 'Login system error, please try again later',
      emailVerificationRequired: 'Email verification is required to login'
    },
    newUserBenefits: {
      title: 'New User Benefits',
      points: 'Get 180 free points',
      membership: 'Get 1-day free membership',
      description: 'Register now to start your AI music creation journey'
    },
    success: {
      verificationSent: 'Verification email sent',
      verified: 'Email verified successfully',
      registered: 'Registration successful',
      loggedIn: 'Login successful',
      avatarUpload: 'Avatar uploaded successfully',
      register: 'Registration successful! Please check your email for verification. New users get 180 points and 1-day free membership!',
      login: 'Login successful',
      googleLogin: 'Successfully signed in with Google'
    },
    emailVerification: {
      required: 'Please verify your email first',
      sent: 'Verification email has been sent',
      resend: 'Resend verification email',
      success: 'Email verified successfully',
      failed: 'Email verification failed',
      checkInbox: 'A verification email has been sent to your inbox. Please check and click the verification link',
      alreadyVerified: 'Email already verified',
      expired: 'Verification link expired, please resend',
      instruction: 'We have sent a verification email to your inbox. Please follow the instructions to complete verification.',
      note: 'If you have not received the verification email, please check your spam folder or click the button below to resend.',
      waiting: 'Waiting for verification...',
      verified: 'Email verified, please login'
    },
    loginWithGoogle: 'Sign in with Google',
    or: 'or',
    resetPassword: {
      title: 'Reset Password',
      subtitle: 'Enter your email address to reset your password',
      form: {
        email: {
          label: 'Email Address',
          placeholder: 'Enter your email address'
        }
      },
      buttons: {
        submit: 'Reset Password',
        backToLogin: 'Back to Login'
      },
      success: 'Password reset email has been sent',
      error: 'Failed to send password reset email'
    },
    tips: {
      verificationEmailSent: 'Verification email has been sent to your inbox',
      verificationEmailResent: 'Verification email has been resent to your inbox'
    }
  },
  home: {
    meta: {
      title: "PhotoSong - Turn Photos into Music with AI",
      description: "Transform your photos into unique musical pieces with PhotoSong's AI technology."
    },
    hero: {
      title: 'Turn Your Photos into Music with AI',
      subtitle: 'Transform any image into unique melodies using advanced AI technology',
      cta: 'Start Creating for Free',
      tryNow: 'Try Now - No Sign Up Required',
      features: [
        'Instant Music Generation',
        'Professional Quality Output',
        'No Technical Skills Required',
        '100% Free to Use'
      ],
      startNow: 'Start Using Free Now',
      commercialUse: 'Free for Commercial Use',
      noSignup: 'No Registration Required',
      description: 'Using advanced AI technology to transform your photos into unique musical works. Let every photo sing its own song.',
      newUser: {
        title: 'New User Exclusive',
        benefits: 'Get 180 points and 1-day membership when you register',
        start: 'Start Creating Now'
      },
      stats: {
        users: 'Active Users',
        works: 'Creations',
        rating: 'User Rating'
      },
      buttons: {
        start: 'Start Creating',
        explore: 'Explore Works'
      },
      features: {
        imageProcessing: 'Image Processing',
        musicCreation: 'Music Creation',
        sharing: 'Real-time Sharing'
      }
    },
    stats: {
      activeUsers: 'Active Users',
      creations: 'Creations',
      rating: 'User Rating'
    },
    features: {
      title: 'Key Features',
      aiPowered: {
        title: 'AI-Powered',
        desc: 'Advanced AI algorithms to create unique music'
      },
      easyToUse: {
        title: 'Easy to Use',
        desc: 'Simple and intuitive interface'
      },
      unique: {
        title: 'Unique Creation',
        desc: 'Every photo creates a unique musical piece'
      },
      list: [
        'Transform Photos into Music',
        'Personalized Music Creation',
        'Multi-language Support'
      ]
    },
    howItWorks: {
      title: 'Creation Process',
      description: 'Four simple steps to give your photos a musical soul'
    },
    useCases: {
      ariaLabel: 'Use case: {title}',
      title: 'Use Cases',
      description: 'Explore creative applications of Photo Song in different scenarios',
      travel: {
        title: 'Travel Memories',
        description: 'Transform your travel photos into musical journeys'
      },
      wedding: {
        title: 'Wedding Moments',
        description: 'Create unique musical pieces from your special day'
      },
      business: {
        title: 'Business Marketing',
        description: 'Enhance your brand with custom AI-generated music'
      },
      social: {
        title: 'Social Media',
        description: 'Stand out with unique musical content for your social posts'
      }
    },
    testimonials: {
      ariaLabel: 'Testimonial from {author}, {title}',
      title: 'What Users Say',
      description: 'Hear what they say',
      1: {
        content: 'Photo Song gave soul to my travel photos. Each photo now tells a unique story.',
        author: 'John Smith',
        title: 'Travel Photographer'
      },
      2: {
        content: 'As a content creator, this platform solved my background music problems. The AI-generated music is truly professional.',
        author: 'Emily Chen',
        title: 'Video Creator'
      },
      3: {
        content: 'An innovative experience beyond imagination! AI not only understands the emotions in photos but creates stunning music.',
        author: 'Sarah Wilson',
        title: 'Music Teacher'
      }
    },
    featuredWorks: {
      title: 'Latest Works',
      description: 'Discover amazing musical creations from the community'
    },
    works: {
      title: 'Featured Works',
      description: 'Explore unique AI-generated musical creations',
      playWork: 'Play work {title}',
      viewMore: 'View More',
      status: {
        generating: 'Generating',
        failed: 'Generation Failed'
      },
      untitledWork: 'Untitled Work',
      anonymousUser: 'Anonymous User',
      meta: {
        title: '{title} | {author}',
        description: '{title} - A {style} music piece created by {author} using AI. On PhotoSong, images turn into melodies.',
        schemaName: 'AI Generated Music',
        schemaDescription: 'Music generated from photos using AI technology'
      },
      cta: {
        title: 'Ready to Start Creating?',
        description: 'Sign up now and experience AI-driven music creation for free. Give your photos a unique voice.',
        button: 'Start Creating for Free'
      },
      techBadges: {
        imageProcessing: 'Image Processing',
        musicCreation: 'Lyrics & Music Creation',
        realTimeSharing: 'Real-time Sharing'
      },
      steps: {
        ariaLabel: 'Step {number}: {title}',
        1: {
          title: 'Upload Photo',
          description: 'Choose the photo you want to transform'
        },
        2: {
          title: 'AI Analysis',
          description: 'Advanced AI analyzes content, scene and emotions'
        },
        3: {
          title: 'Generate Music',
          description: 'Create unique music based on analysis results'
        },
        4: {
          title: 'Share Work',
          description: 'Download or share your creation with the community'
        }
      },
      newsAndCommunity: {
        title: 'News & Community',
        description: 'Stay updated with the latest in music technology and connect with our vibrant community',
        musicTech: {
          title: 'Music Tech News',
          news1: {
            title: 'AI Music Generation: The Future of Composition',
            description: 'Exploring how artificial intelligence is revolutionizing music creation and composition'
          },
          news2: {
            title: 'Visual Music: A New Era of Music Production',
            description: 'How visual elements are becoming an integral part of modern music production'
          },
          news3: {
            title: 'The Evolution of Music AI Tools',
            description: 'A deep dive into the latest developments in AI-powered music tools'
          }
        },
        community: {
          title: 'Community Highlights',
          post1: {
            title: 'Creating Visual Music Experiences',
            description: 'Community member Sarah Chen shares her journey in combining visuals with music'
          },
          post2: {
            title: 'Innovative Music Visualization Techniques',
            description: 'Michael Rodriguez demonstrates unique approaches to visualizing music'
          },
          post3: {
            title: 'AI Artists: Breaking New Ground',
            description: 'Emma Watson explores how AI is empowering a new generation of artists'
          }
        }
      },
      articles: {
        title: 'Article Center',
        description: 'Explore the latest AI music generation technology, industry news, and creation tips',
        loading: 'Loading article...',
        views: 'Views',
        related: 'Related Articles',
        prevArticle: 'Previous Article',
        nextArticle: 'Next Article',
        minuteRead: 'min read',
        detail: {
          title: 'Article | PhotoSong',
          description: 'Read interesting articles about music, technology, and creativity on PhotoSong'
        },
        categories: {
          research: 'Research Reports',
          knowledge: 'Music Knowledge',
          news: 'Industry News',
          ai_music: 'AI Music',
          tutorial: 'Tutorials',
          professional: 'Professional Content',
          industry: 'Industry Updates',
          site_info: 'Site Information',
          KNOWLEDGE: 'Music Knowledge',
          NEWS: 'Industry News',
          AI_MUSIC: 'AI Music',
          PROFESSIONAL: 'Professional Content',
          TUTORIAL: 'Tutorials',
          INDUSTRY: 'Industry Updates',
          RESEARCH: 'Research Reports',
          all: 'All Categories',
          music_knowledge: 'Music Knowledge'
        },
        viewMore: 'View More Articles',
        untitledArticle: 'Untitled Article',
        anonymousAuthor: 'Anonymous Author',
        manager: 'Article Manager',
        create: 'Create Article',
        edit: 'Edit Article',
        searchPlaceholder: 'Search articles...',
        allCategories: 'All Categories',
        relatedArticles: 'Related Articles',
        empty: {
          title: 'No Articles Found',
          description: 'No articles available at the moment. Check back later for updates.'
        },
        status: {
          DRAFT: 'Draft',
          PUBLISHED: 'Published',
          ARCHIVED: 'Archived'
        },
        lastUpdated: 'Last Updated',
        publish: 'Publish',
        archive: 'Archive',
        saveSuccess: 'Saved successfully',
        publishSuccess: 'Published successfully',
        archiveSuccess: 'Archived successfully',
        deleteSuccess: 'Deleted successfully',
        confirmPublish: 'Are you sure you want to publish this article?',
        confirmArchive: 'Are you sure you want to archive this article?',
        confirmDelete: 'Are you sure you want to delete this article?',
        errors: {
          titleRequired: 'Title is required',
          loadFailed: 'Failed to load',
          saveFailed: 'Failed to save',
          publishFailed: 'Failed to publish',
          archiveFailed: 'Failed to archive',
          deleteFailed: 'Failed to delete',
          likeFailed: 'Failed to like article',
          articleNotFound: 'Article not found or has been deleted',
          statusChangeFailed: 'Failed to update status'
        },
        rewrite: {
          title: 'AI Article Rewrite',
          reference: {
            label: 'Reference Content',
            placeholder: 'Please enter reference content',
            required: 'Please enter reference content',
            similarity: {
              high: 'Highly Similar',
              medium: 'Moderately Similar',
              low: 'Low Similarity'
            }
          },
          options: {
            similarity: {
              label: 'Similarity'
            },
            style: {
              label: 'Writing Style',
              original: 'Original Style',
              creative: 'Creative Style',
              academic: 'Academic Style'
            },
            focus: {
              label: 'Focus Areas',
              structure: 'Article Structure',
              tone: 'Tone and Style',
              examples: 'Case Examples',
              insights: 'Depth of Insights'
            },
            improvements: {
              label: 'Areas for Improvement',
              depth: 'Content Depth',
              clarity: 'Expression Clarity',
              evidence: 'Supporting Evidence',
              uniqueness: 'Unique Perspectives'
            }
          },
          button: 'Start Rewrite',
          success: 'Article rewrite successful',
          error: 'Article rewrite failed'
        },
        enhance: {
          success: 'Article enhanced successfully',
          button: 'Enhance Article',
          error: {
            noContent: 'Article content cannot be empty',
            invalidArticle: 'Invalid article',
            enhancement: 'Enhancement failed',
            save: 'Failed to save enhanced article'
          },
          options: {
            focusAreas: {
              label: 'Focus Areas',
              seo: 'SEO Optimization',
              readability: 'Readability',
              professionalism: 'Professionalism',
              engagement: 'Engagement'
            },
            tone: {
              label: 'Tone',
              professional: 'Professional',
              casual: 'Casual',
              storytelling: 'Storytelling',
              persuasive: 'Persuasive'
            },
            targetLength: {
              label: 'Target Length',
              maintain: 'Maintain Length',
              expand: 'Expand Content',
              shorten: 'Shorten Content'
            },
            keepStructure: {
              label: 'Article Structure',
              keep: 'Keep Current Structure',
              optimize: 'Optimize Structure'
            }
          }
        },
        likeSuccess: 'Article liked successfully'
      }
    },
    cta: {
      title: 'Ready to Start Creating?',
      description: 'Sign up now and experience AI-driven music creation for free. Give your photos a unique voice.',
      button: 'Start Creating for Free'
    },
    techBadges: {
      imageProcessing: 'Image Processing',
      musicCreation: 'Lyrics & Music Creation',
      realTimeSharing: 'Real-time Sharing'
    },
    steps: {
      ariaLabel: 'Step {number}: {title}',
      1: {
        title: 'Upload Photo',
        description: 'Choose the photo you want to transform'
      },
      2: {
        title: 'AI Analysis',
        description: 'Advanced AI analyzes content, scene and emotions'
      },
      3: {
        title: 'Generate Music',
        description: 'Create unique music based on analysis results'
      },
      4: {
        title: 'Share Work',
        description: 'Download or share your creation with the community'
      }
    },
    newsAndCommunity: {
      title: 'News & Community',
      description: 'Stay updated with the latest in music technology and connect with our vibrant community',
      musicTech: {
        title: 'Music Tech News',
        news1: {
          title: 'AI Music Generation: The Future of Composition',
          description: 'Exploring how artificial intelligence is revolutionizing music creation and composition'
        },
        news2: {
          title: 'Visual Music: A New Era of Music Production',
          description: 'How visual elements are becoming an integral part of modern music production'
        },
        news3: {
          title: 'The Evolution of Music AI Tools',
          description: 'A deep dive into the latest developments in AI-powered music tools'
        }
      },
      community: {
        title: 'Community Highlights',
        post1: {
          title: 'Creating Visual Music Experiences',
          description: 'Community member Sarah Chen shares her journey in combining visuals with music'
        },
        post2: {
          title: 'Innovative Music Visualization Techniques',
          description: 'Michael Rodriguez demonstrates unique approaches to visualizing music'
        },
        post3: {
          title: 'AI Artists: Breaking New Ground',
          description: 'Emma Watson explores how AI is empowering a new generation of artists'
        }
      }
    },
    articles: {
      title: 'Article Center',
      description: 'Explore the latest AI music generation technology, industry news, and creation tips',
      loading: 'Loading article...',
      views: 'Views',
      related: 'Related Articles',
      prevArticle: 'Previous Article',
      nextArticle: 'Next Article',
      minuteRead: 'min read',
      detail: {
        title: 'Article | PhotoSong',
        description: 'Read interesting articles about music, technology, and creativity on PhotoSong'
      },
      categories: {
        all: 'All',
        news: 'News',
        knowledge: 'Knowledge',
        ai_music: 'AI Music',
        professional: 'Professional',
        tutorial: 'Tutorials',
        research: 'Research',
        industry: 'Industry',
        community: 'Community',
        music_knowledge: 'Music Knowledge'
      },
      viewMore: 'View More Articles',
      untitledArticle: 'Untitled Article',
      anonymousAuthor: 'Anonymous Author',
      manager: 'Article Manager',
      create: 'Create Article',
      edit: 'Edit Article',
      searchPlaceholder: 'Search articles...',
      allCategories: 'All Categories',
      relatedArticles: 'Related Articles',
      empty: {
        title: 'No Articles Found',
        description: 'No articles available at the moment. Check back later for updates.'
      },
      status: {
        label: 'Status',
        all: 'All',
        draft: 'Draft',
        published: 'Published',
        archived: 'Archived'
      },
      lastUpdated: 'Last Updated',
      publish: 'Publish',
      archive: 'Archive',
      saveSuccess: 'Saved successfully',
      publishSuccess: 'Published successfully',
      archiveSuccess: 'Archived successfully',
      deleteSuccess: 'Deleted successfully',
      confirmPublish: 'Are you sure you want to publish this article?',
      confirmArchive: 'Are you sure you want to archive this article?',
      confirmDelete: 'Are you sure you want to delete this article?',
      errors: {
        titleRequired: 'Title is required',
        loadFailed: 'Failed to load',
        saveFailed: 'Failed to save',
        publishFailed: 'Failed to publish',
        archiveFailed: 'Failed to archive',
        deleteFailed: 'Failed to delete',
        likeFailed: 'Failed to like article',
        articleNotFound: 'Article not found or has been deleted',
        statusChangeFailed: 'Failed to update status'
      },
      rewrite: {
        title: 'Rewrite Article',
        reference: {
          label: 'Reference',
          placeholder: 'Enter reference content',
          similarity: {
            label: 'Similarity',
            high: 'High',
            medium: 'Medium',
            low: 'Low'
          }
        },
        options: {
          style: {
            label: 'Writing Style',
            original: 'Original',
            creative: 'Creative',
            professional: 'Professional',
            casual: 'Casual'
          },
          focus: {
            label: 'Focus Areas'
          },
          improvements: {
            label: 'Areas to Improve'
          }
        },
        button: 'Rewrite'
      },
      enhance: {
        title: 'Enhance Article',
        options: {
          focusAreas: {
            label: 'Focus Areas'
          },
          tone: {
            label: 'Language Style'
          },
          targetLength: {
            label: 'Target Length',
            maintain: 'Maintain Current Length',
            expand: 'Expand Content',
            shorten: 'Shorten Content'
          },
          keepStructure: {
            label: 'Keep Structure'
          }
        }
      },
      likeSuccess: 'Article liked successfully',
      generateArticle: 'Generate Article',
      strategy: 'Generation Strategy',
      tone: 'Tone',
      length: 'Article Length',
      language: 'Article Language',
      keywords: 'Keywords',
      keywordCount: 'Keyword Count',
      enterKeywords: 'Enter Keywords',
      autoKeywords: 'Auto Generate Keywords',
      batchGenerate: 'Batch Generate',
      imageGeneration: 'Image Generation',
      draftSaving: 'Draft Saving',
      afterGeneration: 'After Generation',
      seoOptions: 'SEO Options',
      mediaGeneration: 'Media Generation',
      enhance: {
        title: 'Enhance Article',
        options: {
          focusAreas: {
            label: 'Focus Areas'
          },
          tone: {
            label: 'Language Style'
          },
          targetLength: {
            label: 'Target Length',
            maintain: 'Maintain Current Length',
            expand: 'Expand Content',
            shorten: 'Shorten Content'
          },
          keepStructure: {
            label: 'Keep Structure'
          }
        }
      },
      rewrite: {
        title: 'Rewrite Article',
        reference: {
          label: 'Reference',
          placeholder: 'Enter reference content',
          similarity: {
            label: 'Similarity',
            high: 'High',
            medium: 'Medium',
            low: 'Low'
          }
        },
        options: {
          style: {
            label: 'Writing Style',
            original: 'Original',
            creative: 'Creative',
            professional: 'Professional',
            casual: 'Casual'
          },
          focus: {
            label: 'Focus Areas'
          },
          improvements: {
            label: 'Areas to Improve'
          }
        },
        button: 'Rewrite'
      },
      cover: {
        label: 'Cover Image',
        tip: 'Recommended size: 1200x630px, max 2MB'
      },
      changeStatus: 'Change Status',
      status: {
        all: 'All',
        draft: 'Draft',
        published: 'Published',
        archived: 'Archived'
      },
      management: {
        title: 'Article Management',
        create: 'Create Article',
        edit: 'Edit Article',
        delete: 'Delete Article',
        confirmDelete: 'Are you sure you want to delete this article?',
        search: 'Search Articles',
        filter: 'Filter',
        sort: 'Sort',
        actions: 'Actions'
      },
      related: 'Related Articles',
      readMore: 'Read More',
      publishedAt: 'Published on',
      readingTime: '{time} min read',
      share: 'Share Article',
      backToList: 'Back to Articles'
    }
  },
  common: {
    plays: '',
    dateFormat: {
      full: 'MM/DD/YYYY HH:mm',
      date: 'MMMM DD, YYYY',
      time: 'HH:mm',
      year: 'YYYY',
      month: 'MM',
      day: 'DD'
    },
    uploading: 'Uploading...',
    loading: 'Loading...',
    saving: 'Saving...',
    success: 'Operation successful',
    failed: 'Operation failed',
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    search: 'Search',
    total: 'Total',
    actions: 'Actions',
    previewMode: 'Preview Mode',
    editMode: 'Edit Mode',
    exitFullscreen: 'Exit Fullscreen',
    fullscreen: 'Fullscreen',
    image: 'Image',
    link: 'Link',
    defaultDescription: 'Transform photos into music with AI technology',
    status: {
      GENERATING: 'Generating',
      COMPLETED: 'Completed',
      FAILED: 'Generation Failed',
      PENDING: 'Pending',
      progress: 'Progress {progress}%'
    }
  },
  footer: {
    links: {
      about: 'About Us',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      contact: 'Contact Us',
      disclaimer: 'Disclaimer'
    },
    quickLinks: {
      title: 'Quick Links',
      home: 'Home',
      create: 'Create',
      community: 'Community',
      pricing: 'Pricing'
    },
    help: {
      title: 'Help & Support',
      tutorial: 'Tutorial',
      faq: 'FAQ',
      contact: 'Contact Us',
      feedback: 'Feedback'
    },
    newsletter: {
      title: 'Newsletter',
      description: 'Subscribe to our newsletter for the latest features and offers.',
      placeholder: 'Enter your email',
      subscribe: 'Subscribe'
    },
    copyright: '  {year} Photo Song. All rights reserved.',
    description: 'AI-powered platform for transforming photos into unique musical pieces',
    friendlyLinks: {
      title: "Friendly Links"
    },
    description: 'Transform your photos into unique musical experiences with AI technology',
    quickLinks: 'Quick Links',
    support: 'Support',
    legal: 'Legal',
    newsletter: 'Newsletter',
    newsletterDesc: 'Subscribe to get updates about new features and special offers',
    emailPlaceholder: 'Enter your email',
    emailRequired: 'Please enter your email',
    subscribe: 'Subscribe',
    subscribeSuccess: 'Successfully subscribed!',
    copyright: ' {year} PhotoSong. All rights reserved.',
    users: '{count} Users',
    works: '{count} Works',
    articles: '{count} Articles'
  },
  logout: {
    success: 'Logged out successfully',
    error: 'Failed to log out'
  },
  errors: {
    fetchWorks: 'Failed to load recent works',
    audioInit: 'Failed to initialize audio',
    fetchArticles: 'Failed to load articles',
    notFound: {
      title: 'Page Not Found',
      description: 'Sorry, the page you are looking for does not exist or has been removed.',
      backHome: 'Back to Home',
      backPrev: 'Go Back',
      quickLinks: 'Quick Links',
      recommendations: 'Recommended Content',
      search: 'Search',
      searchPlaceholder: 'Search for what you need...'
    },
    loadFailed: 'Failed to load, please try again later',
    articleNotFound: 'Article not found or has been deleted'
  },
  create: {
    title: 'Create Music',
    steps: {
      upload: 'Upload Photo',
      style: 'Choose Style',
      lyrics: 'Generate Lyrics',
      music: 'Create Music'
    },
    upload: {
      title: 'Upload Photo',
      description: 'Upload a photo to create music'
    },
    subtitle: 'Upload a photo and let AI create unique music for you',
    description: 'Using AI technology to transform your photos into unique musical works. After uploading the image, our advanced AI will analyze its content, emotions, and style to create personalized music for you.',
    points: {
      label: 'Points',
      buy: 'Buy Points',
      insufficient: 'Creating music requires 100 points, current points insufficient'
    },
    notice: {
      title: 'Creation Tips',
      tips: [
        'Creating one work requires 100 points',
        'Do not refresh or close the page',
        'You will proceed to the next step automatically after upload',
        'Prohibited content: nudity, pornography, violence, gore, or other inappropriate content'
      ]
    },
    style: {
      title: 'Music Style',
      description: 'Choose your desired music style',
      pop: 'Pop',
      rock: 'Rock',
      electronic: 'Electronic',
      jazz: 'Jazz',
      classical: 'Classical',
      folk: 'Folk',
      rnb: 'R&B',
      hiphop: 'Hip-hop',
      ambient: 'Ambient',
      edm: 'EDM',
      metal: 'Metal',
      indie: 'Indie',
      soul: 'Soul',
      blues: 'Blues',
      funk: 'Funk',
      chinese: 'Chinese Style',
      chineseClassical: 'Chinese Classical',
      country: 'Country',
      postRock: 'Post-Rock',
      acidJazz: 'Acid Jazz',
      reggae: 'Reggae',
      latin: 'Latin',
      world: 'World',
      newage: 'New Age',
      orchestral: 'Orchestral',
      experimental: 'Experimental',
      acoustic: 'Acoustic',
      soundtrack: 'Soundtrack',
      lofi: 'Lo-fi',
      descriptions: {
        pop: 'Modern pop music with catchy melodies and rhythms',
        rock: 'Energetic rock style with powerful guitars and drums',
        electronic: 'Modern electronic music with synthesizers and beats',
        jazz: 'Elegant jazz style with improvisation and complex harmonies',
        classical: 'Beautiful classical music with elegant orchestration',
        folk: 'Warm folk style with sincere lyrics and acoustic instruments',
        rnb: 'Soulful rhythm and blues with emotional vocals',
        hiphop: 'Rhythmic hip-hop style with expressive rap',
        ambient: 'Atmospheric ambient music creating immersive experiences',
        edm: 'Energetic electronic dance music with strong rhythms',
        metal: 'Heavy metal with distorted guitars and intense energy',
        indie: 'Independent music with unique creative expression',
        soul: 'Soulful music with powerful emotional expression',
        blues: 'Traditional blues with deep emotional resonance',
        funk: 'Rhythmic funk music with emphasis on bass and groove',
        chinese: 'Modern music with Chinese elements and traditional instruments',
        chineseClassical: 'Traditional Chinese classical music with elegant arrangements',
        country: 'American country music with authentic storytelling',
        postRock: 'Progressive post-rock with layered soundscapes',
        acidJazz: 'Modern jazz fusion with electronic elements',
        reggae: 'Upbeat island rhythms with offbeat guitar and bass, creating a laid-back Caribbean vibe',
        latin: 'Passionate rhythms and melodies influenced by Latin American music traditions',
        world: 'Diverse musical elements from various cultural traditions worldwide',
        newage: 'Peaceful, atmospheric sounds with emphasis on harmony and tranquility',
        orchestral: 'Full orchestral arrangements with rich, classical instrumentation',
        experimental: 'Innovative and unconventional musical approaches pushing boundaries',
        acoustic: 'Natural, unplugged sound focusing on acoustic instruments',
        soundtrack: 'Cinematic compositions evoking emotional scenes and stories',
        lofi: 'Low-fidelity production with warm, nostalgic atmosphere'
      }
    },
    language: {
      title: 'Lyrics Language',
      single: 'Single Language',
      mixed: 'Mixed Languages',
      singleDesc: 'Use only selected language',
      mixedDesc: 'Mix multiple languages in lyrics',
      options: {
        chinese: 'Chinese',
        english: 'English',
        japanese: 'Japanese',
        korean: 'Korean',
        french: 'French',
        spanish: 'Spanish',
        german: 'German',
        italian: 'Italian',
        russian: 'Russian',
        portuguese: 'Portuguese',
        arabic: 'Arabic',
        hindi: 'Hindi',
        thai: 'Thai',
        vietnamese: 'Vietnamese',
        turkish: 'Turkish'
      }
    },
    length: {
      title: 'Song Length',
      short: {
        label: 'Short',
        description: '1-2 verses, for simple expression'
      },
      medium: {
        label: 'Medium',
        description: '2-3 verses, standard pop song length'
      },
      long: {
        label: 'Long',
        description: '3-4 verses, for complex stories'
      },
      options: {
        short: {
          label: 'Short',
          description: '1-2 verses, for simple expression'
        },
        medium: {
          label: 'Medium',
          description: '2-3 verses, standard pop song length'
        },
        long: {
          label: 'Long',
          description: '3-4 verses, for complex stories'
        }
      }
    },
    lyrics: {
      title: 'Lyrics Preview',
      optimize: 'Optimize Lyrics',
      edit: 'Manual Edit',
      finish: 'Finish Editing',
      placeholder: 'Edit lyrics',
      relevance: {
        title: 'Relevance Level',
        high: {
          label: 'Highly Relevant',
          description: 'Lyrics will closely follow the image content, directly describing or interpreting the scenes, emotions, and stories in the image'
        },
        medium: {
          label: 'Moderately Relevant',
          description: 'Lyrics will be partially based on image content while adding more creativity and imagination'
        },
        low: {
          label: 'Creative Freedom',
          description: 'Lyrics will be inspired by the image but focus more on creative expression and artistic interpretation'
        }
      }
    },
    buttons: {
      generate: {
        lyrics: 'Generate Lyrics',
        music: 'Start Generating Music'
      },
      next: 'Next',
      back: 'Back',
      retry: 'Retry',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete'
    },
    generating: {
      title: 'Generating Music',
      description: 'This may take a few minutes, please wait patiently...',
      progress: '{progress}% Completed',
      queue: 'In Queue...',
      preparing: 'Preparing...',
      processing: 'Processing...',
      finalizing: 'Finalizing...',
      tip: 'Please do not close the page during generation',
      lyrics: 'Generating lyrics, this may take a moment...'
    },
    preview: {
      title: 'Preview',
      description: 'Preview your work',
      loading: 'Loading...',
      error: 'Failed to load',
      retry: 'Retry'
    },
    errors: {
      incomplete: 'Please fill in all required information',
      generation: 'Music generation failed',
      network: 'Network request failed, please check your connection',
      points: 'Insufficient points, please purchase more',
      imageAnalysis: 'Image analysis failed',
      lyricsGeneration: 'Lyrics generation failed',
      musicGeneration: 'Music generation failed',
      taskCheck: 'Failed to check task status',
      styleRequired: 'Please select a music style',
      titleRequired: 'Please enter a title for your work',
      languageRequired: 'Please select at least one language',
      lengthRequired: 'Please select song length',
      relevanceRequired: 'Please select lyrics relevance level'
    },
    success: {
      upload: 'Image uploaded successfully',
      imageAnalysis: 'Image analysis completed',
      lyrics: 'Lyrics generated successfully',
      music: 'Music generated successfully',
      pointsRefund: 'Points refunded',
      save: 'Save successful',
      update: 'Update successful',
      delete: 'Delete successful',
      copy: 'Copy successful',
      submitted: 'Creation request submitted, redirecting to profile page to check progress...'
    }
  },
  community: {
    meta: {
      title: "Community | PhotoSong",
      description: "Explore creative works from the PhotoSong community. Share your musical creations, get inspired by others' works, and join our growing community of AI music creators."
    },
    title: "Community",
    description: "Discover amazing musical creations from our community",
    filter: {
      all: "All Works",
      latest: "Latest",
      popular: "Popular",
      trending: "Trending"
    },
    empty: {
      title: "No works yet",
      description: "Be the first to share your creation"
    },
    error: {
      loadFailed: "Failed to load works"
    },
    works: {
      playCount: "{count} plays",
      anonymousUser: 'Anonymous User'
    }
  },
  pricing: {
    title: 'Choose Your Plan',
    subtitle: 'Transform Your Photos into Music',
    description: 'Select the perfect plan that suits your creative needs',
    loginPrompt: {
      title: 'Sign in to Subscribe',
      description: 'Please sign in or create an account to purchase a subscription or points.',
      button: 'Sign In'
    },
    basic: {
      title: 'Basic',
      description: 'Perfect for individual creators getting started'
    },
    pro: {
      title: 'Professional',
      description: 'Comprehensive solution for professional creators'
    },
    plans: {
      period: {
        month: 'month',
        year: 'year',
        lifetime: 'lifetime'
      },
      button: 'Coming Soon',
      starter: {
        name: 'Starter',
        features: {
          monthlyPoints: '2000 points monthly',
          unlimitedCreation: 'Unlimited creation',
          commercialLicense: 'Commercial license',
          priorityQueue: 'Priority queue'
        }
      },
      advanced: {
        name: 'Advanced',
        features: {
          monthlyPoints: '6000 points monthly',
          unlimitedCreation: 'Unlimited creation',
          commercialLicense: 'Commercial license',
          priorityQueue: 'Priority queue',
          support: 'Dedicated support'
        }
      },
      pro: {
        name: 'Professional',
        features: {
          yearlyPoints: '40000 points yearly',
          unlimitedCreation: 'Unlimited creation',
          commercialLicense: 'Commercial license',
          highestPriority: 'Highest priority',
          support: 'Dedicated support',
          customService: 'Custom service'
        }
      },
      lifetime: {
        name: 'Lifetime',
        features: {
          lifetimePoints: '160000 points bonus',
          unlimitedCreation: 'Unlimited creation',
          commercialLicense: 'Commercial license',
          highestPriority: 'Highest priority',
          support: 'Dedicated support',
          customService: 'Custom service',
          lifetime: 'Lifetime access'
        }
      }
    },
    membership: {
      mostPopular: 'Most Popular',
      benefits: {
        title: 'Membership Benefits',
        features: {
          advanced: {
            title: 'Advanced AI Features',
            description: 'Unlock advanced AI music generation capabilities',
            details: 'Multiple music styles and genres\nAdvanced style control\nHigh-quality audio output\nExtended music duration\nCustom music parameters\nBatch generation'
          },
          templates: {
            title: 'Professional Templates',
            description: 'Access professional music templates',
            details: 'Preset music templates\nIndustry-standard arrangements\nQuick scene startup\nRegular template updates\nCustom template saving\nTemplate sharing'
          },
          copyright: {
            title: 'Copyright Protection',
            description: 'Complete ownership of generated music',
            details: 'Full commercial rights\nCopyright certificate\nLegal documentation\nUsage tracking tools\nCopyright registration\nInfringement monitoring'
          },
          priority: {
            title: 'Priority Service',
            description: 'Enjoy priority processing and support',
            details: 'Priority generation queue\n24/7 customer support\nFaster processing speed\nExclusive member events\nVIP support line\nCustomized service'
          }
        }
      }
    },
    points: {
      title: 'Purchase Points',
      unit: 'points',
      rate: '1 USD = 400 points',
      packages: {
        recommended: 'Recommended',
        buyNow: 'Buy Now',
        0: {
          name: 'Small Package',
          description: 'Experience creation fun'
        },
        1: {
          name: 'Value Package',
          description: 'Unlimited inspiration'
        },
        2: {
          name: 'Premium Package',
          description: 'Unlimited possibilities'
        }
      },
      insufficient: 'Creating music requires {points} points, current points insufficient',
      success: {
        deducted: '{points} points deducted',
        refunded: '{points} points refunded'
      },
      error: {
        deduct: 'Failed to deduct points',
        refund: 'Failed to refund points'
      }
    },
    errors: {
      checkoutFailed: 'Payment initialization failed, please try again later'
    },
    comingSoon: {
      payment: 'Payment feature coming soon',
      points: 'Points purchase coming soon'
    },
    payment: {
      error: {
        processing: 'Payment processing failed',
        invalidProduct: 'Invalid product',
        invalidAmount: 'Invalid payment amount',
        serverError: 'Server error occurred'
      },
      status: {
        successTitle: 'Payment Successful',
        successDescription: 'Your payment has been processed successfully',
        viewProfile: 'View Profile',
        backToHome: 'Back to Home',
        processing: 'Processing payment...',
        failed: 'Payment failed',
        pending: 'Payment pending'
      },
      points: {
        success: 'Points added successfully',
        failed: 'Failed to add points'
      },
      cancel: {
        title: 'Payment Cancelled',
        message: 'Your payment has been cancelled. We\'d love to know why you decided not to proceed.',
        reasonLabel: 'What made you change your mind?',
        selectReason: 'Please select a reason',
        reasons: {
          price: 'The price is too high',
          features: 'Missing features I need',
          technical: 'Technical issues during payment',
          temporary: 'Just temporary, will try again later',
          other: 'Other reasons'
        },
        retry: 'Try Again',
        backToHome: 'Back to Home',
        supportMessage: 'If you need any assistance, please don\'t hesitate to contact our support team.'
      }
    }
  },
  profile: {
    title: 'Profile',
    meta: {
      title: '{username}\'s Profile | PhotoSong',
      description: 'Explore {username}\'s musical creations on PhotoSong. Discover their unique musical style and creative journey.'
    },
    about: {
      bio: 'Bio',
      noBio: 'This user hasn\'t written any introduction yet'
    },
    works: {
      title: 'My Works',
      untitledWork: 'Untitled Work',
      filter: {
        all: 'All Works'
      },
      empty: {
        description: 'No works yet',
        filtered: 'No works match the selected criteria',
        create: 'Create your first work'
      },
      refresh: 'Refresh Status',
      total: 'All Works',
      completed: 'Completed',
      noWorkToRefresh: 'No works to refresh',
      refreshSuccess: 'Work status refreshed successfully',
      refreshError: 'Failed to refresh status',
      deleteOnlyFailed: 'Can only delete failed works',
      error: {
        loadFailed: 'Failed to load works list',
        checkStatusFailed: 'Failed to check task status',
        tooManyRetries: 'Too many status check retries'
      },
      status: {
        GENERATING: 'Generating',
        COMPLETED: 'Completed',
        FAILED: 'Generation Failed',
        PENDING: 'Pending'
      }
    },
    user: {
      works: 'Works',
      points: 'Points',
      error: {
        notLoggedIn: 'Please login first',
        invalidUsername: 'Username must be 2-20 characters and can only contain letters, numbers, and underscores',
        invalidBio: 'Bio cannot contain special characters and must be less than 200 characters',
        updateFailed: 'Update failed'
      },
      update: {
        success: 'Profile updated successfully',
        failed: 'Failed to update profile'
      },
      username: {
        placeholder: 'Enter username (2-20 characters)',
        hint: 'Username can only contain letters, numbers, and underscores'
      },
      gender: {
        label: 'Gender',
        placeholder: 'Select gender',
        notSpecified: 'Not Specified',
        male: 'Male',
        female: 'Female',
        other: 'Other',
        nonBinary: 'Non-Binary',
        alien: 'Alien',
        toaster: 'Toaster',
        dinosaur: 'Dinosaur',
        robot: 'Robot',
        ghost: 'Ghost',
        unicorn: 'Unicorn',
        livingMeme: 'Living Meme',
        catPerson: 'Cat Person',
        dogPerson: 'Dog Person',
        attackHelicopter: 'Attack Helicopter',
        stillLoading: 'Still Loading...',
        quantumSuperposition: 'Quantum Superposition',
        coffeeMachine: 'Coffee Machine',
        walmartBag: 'Walmart Bag'
      },
      bio: {
        label: 'Bio',
        placeholder: 'Write something about yourself...',
        maxLength: 'Maximum 200 characters'
      },
      avatar: {
        upload: 'Upload Avatar',
        error: {
          format: 'Please upload JPG or PNG format image',
          size: 'Image size cannot exceed 10MB',
          uploadFailed: 'Failed to upload avatar'
        },
        success: 'Avatar uploaded successfully'
      },
      logout: {
        button: 'Logout',
        success: 'Logged out successfully',
        failed: 'Failed to logout'
      },
      creator: 'Creator'
    },
    userProfile: {
      meta: {
        title: "{username}'s Profile | PhotoSong",
        description: "Explore {username}'s music creations on PhotoSong. Discover their unique musical style and creative journey."
      },
      about: {
        bio: 'About',
        noBio: 'This user has not added a bio yet',
        location: 'Location',
        website: 'Website',
        joinedAt: 'Joined: {date}',
        saveBio: 'Save Bio'
      }
    },
    tabs: {
      works: 'Works',
      about: 'About'
    },
    sort: {
      latest: 'Latest',
      oldest: 'Oldest'
    }
  },
  work: {
    meta: {
      title: '{title} | {author}\'s AI Music - PhotoSong',
      description: '{title} - A {style} music piece created by {author} using AI. At PhotoSong, images transform into melodies.'
    },
    author: 'Author',
    style: 'Style',
    createdAt: 'Created At',
    defaultTitle: 'Untitled Work',
    defaultAuthor: 'Anonymous',
    defaultStyle: 'Default'
  },
  workDetail: {
    meta: {
      title: '{title} | {author} - AI Generated Music - PhotoSong',
      description: '{title} - A {style} music piece created by {author} using AI. At PhotoSong, photos transform into melodies.',
      schemaName: '{title} - AI Generated Music',
      schemaDescription: 'This is a music piece created by {author} using PhotoSong AI music generator.',
      defaultTitle: 'AI Generated Music',
      defaultDescription: 'Explore AI-generated music on PhotoSong - Where photos become melodies.'
    },
    defaultTitle: 'AI Generated Music',
    defaultDescription: 'Discover AI-generated music on PhotoSong - where images transform into beautiful melodies.',
    style: {
      title: "Music Style"
    },
    lyrics: {
      title: "Lyrics",
      show: "Show Lyrics",
      hide: "Hide Lyrics"
    },
    recommendations: {
      title: "More from Community",
      description: "Explore more amazing works from our community",
      autoplayDescription: "Next recommended work will play automatically after this one",
      empty: "No recommendations",
      nextUp: "Up Next"
    },
    autoplay: {
      enabled: "Autoplay On",
      disabled: "Autoplay Off",
      enable: "Enable Autoplay",
      disable: "Disable Autoplay"
    },
    creatorBadge: "Creator",
    anonymousUser: 'Anonymous User'
  },
  points: {
    current: 'Current Points',
    deducted: '{points} points deducted',
    refunded: '{points} points refunded',
    insufficient: 'Creating music requires {points} points, current points insufficient',
    buy: 'Buy Points',
    label: 'Points',
    perUSD: '1 USD = {points} points',
    description: 'Creating a song requires 100 points',
    success: {
      deducted: '{points} points deducted',
      refunded: '{points} points refunded'
    },
    error: {
      deduct: 'Failed to deduct points',
      refund: 'Failed to refund points'
    },
    purchased: 'Points Purchased',
    unit: 'points'
  },
  notice: {
    title: 'Creation Tips',
    tips: [
      'Creating one work requires 100 points',
      'Do not refresh or close the page',
      'You will proceed to the next step automatically after upload',
      'Prohibited content: nudity, pornography, violence, gore, or other inappropriate content'
    ]
  },
  messages: {
    confirmDelete: 'Confirm deletion?',
    confirmLogout: 'Confirm logout?',
    taskQueued: 'Task queued',
    taskStarted: 'Task started',
    taskCompleted: 'Task completed',
    taskFailed: 'Task failed',
    pleaseWait: 'Please wait...',
    processingImage: 'Processing image...',
    generatingLyrics: 'Generating lyrics...',
    generatingMusic: 'Generating music...',
    savingWork: 'Saving work...',
    loadingMore: 'Loading more...',
    noMoreData: 'No more data',
    refreshing: 'Refreshing...',
    uploading: 'Uploading...',
    downloading: 'Downloading...',
    processing: 'Processing...',
    auth: {
      success: {
        login: 'Login successful',
        register: 'Registration successful',
        logout: 'Logout successful',
        resetPassword: 'Password reset successful',
        updateProfile: 'Profile updated successfully',
        verifyEmail: 'Email verification successful'
      },
      error: {
        login: 'Login failed',
        register: 'Registration failed',
        logout: 'Logout failed',
        resetPassword: 'Password reset failed',
        updateProfile: 'Profile update failed',
        verifyEmail: 'Email verification failed',
        invalidCredentials: 'Invalid username or password',
        emailExists: 'Email already registered',
        weakPassword: 'Password is too weak',
        sessionExpired: 'Session expired, please login again'
      }
    },
    work: {
      success: {
        create: 'Work created successfully',
        update: 'Work updated successfully',
        delete: 'Work deleted successfully',
        share: 'Work shared successfully',
        download: 'Work downloaded successfully',
        generateLyrics: 'Lyrics generated successfully',
        generateMusic: 'Music generated successfully'
      },
      error: {
        create: 'Failed to create work',
        update: 'Failed to update work',
        delete: 'Failed to delete work',
        share: 'Failed to share work',
        download: 'Failed to download work',
        generateLyrics: 'Failed to generate lyrics',
        generateMusic: 'Failed to generate music',
        notFound: 'Work not found',
        noPermission: 'No permission to operate this work',
        invalidImage: 'Unsupported image format',
        imageTooLarge: 'Image size exceeds limit',
        insufficientPoints: 'Insufficient points'
      }
    },
    payment: {
      success: {
        purchase: 'Purchase successful',
        refund: 'Refund successful',
        recharge: 'Recharge successful'
      },
      error: {
        purchase: 'Purchase failed',
        refund: 'Refund failed',
        recharge: 'Recharge failed',
        insufficientBalance: 'Insufficient balance',
        paymentFailed: 'Payment failed',
        invalidAmount: 'Invalid amount'
      }
    },
    common: {
      success: {
        save: 'Saved successfully',
        update: 'Updated successfully',
        delete: 'Deleted successfully',
        upload: 'Uploaded successfully',
        copy: 'Copied successfully'
      },
      error: {
        save: 'Failed to save',
        update: 'Failed to update',
        delete: 'Failed to delete',
        upload: 'Failed to upload',
        copy: 'Failed to copy',
        network: 'Network error',
        server: 'Server error',
        unknown: 'Unknown error'
      },
      confirm: {
        delete: 'Are you sure you want to delete?',
        logout: 'Are you sure you want to logout?',
        cancel: 'Are you sure you want to cancel?'
      }
    },
    player: {
      error: {
        audioInit: 'Failed to initialize audio',
        playFailed: 'Failed to play',
        loadFailed: 'Failed to load',
        notSupported: 'Audio format not supported by browser'
      }
    },
    validation: {
      required: '{field} is required',
      email: 'Please enter a valid email address',
      minLength: '{field} must be at least {length} characters',
      maxLength: '{field} cannot exceed {length} characters',
      passwordMatch: 'Passwords do not match',
      invalidFormat: 'Invalid format',
      numberOnly: 'Numbers only',
      invalidUrl: 'Please enter a valid URL'
    }
  },
  cookies: {
    title: 'Cookie Usage Notice',
    description: 'We use cookies to improve your browsing experience, provide personalized services, and analyze website usage. By continuing to use our website, you agree to our use of cookies.',
    accept: 'Accept Cookies',
    decline: 'Only Essential Cookies'
  },
  tutorial: {
    title: 'Tutorial',
    basics: {
      title: 'Basic Tutorial',
      description: 'Learn how to create your first music piece with Photo Song',
      step1: {
        title: 'Upload Photo',
        content: 'Choose and upload a photo you want to convert into music. We support common formats like JPG and PNG.'
      },
      step2: {
        title: 'Generate Music',
        content: 'AI will analyze your photo and generate unique music based on its content, colors, and mood.'
      },
      step3: {
        title: 'Share Work',
        content: 'Share your creation with the community or download it locally.'
      }
    },
    advanced: {
      title: 'Advanced Tips',
      description: 'Explore advanced features to create more professional music',
      step1: {
        title: 'Style Adjustment',
        content: 'Choose different music styles and emotional tendencies to generate music that better matches your expectations.'
      },
      step2: {
        title: 'Custom Parameters',
        content: 'Adjust parameters like tempo, timbre, and chord progression to create your unique music style.'
      }
    },
    help: {
      title: 'Need Help?',
      description: 'If you encounter any issues while using our service, you can get help through:',
      faq: 'FAQ',
      contact: 'Contact Us',
      feedback: 'Feedback'
    }
  },
  faq: {
    title: 'FAQ',
    search: 'Search questions',
    general: {
      title: 'General',
      what: {
        question: 'What is Photo Song?',
        answer: 'Photo Song is an innovative AI-powered platform that converts photos into unique musical pieces. Our AI system analyzes the content, colors, and mood of photos to generate matching music.'
      },
      how: {
        question: 'How to use Photo Song?',
        answer: 'It\'s simple: upload a photo, choose a music style, and wait for AI to generate music. You can adjust parameters anytime until you\'re satisfied with the result.'
      }
    },
    account: {
      title: 'Account',
      signup: {
        question: 'How to register?',
        answer: 'Click the "Register" button in the top right corner, fill in your email, username, and password to complete registration. Basic features are available immediately after registration.'
      },
      points: {
        question: 'What are points? How to get them?',
        answer: 'Points are our virtual currency used for generating music. You can earn points through daily check-ins, sharing works, or direct purchase.'
      }
    },
    technical: {
      title: 'Technical',
      formats: {
        question: 'What image formats are supported?',
        answer: 'We support common formats like JPG, PNG, and WebP. We recommend uploading high-resolution images for better results.'
      },
      quality: {
        question: 'How\'s the music quality?',
        answer: 'We use cutting-edge AI technology to generate professional-grade music. The output is high-quality MP3 format, suitable for both personal and commercial use.'
      }
    },
    pricing: {
      title: 'Pricing',
      cost: {
        question: 'Is it free to use?',
        answer: 'We use a points system. New users get free points upon registration. You can purchase point packages or subscribe to membership for more benefits.'
      },
      refund: {
        question: 'Can I get a refund?',
        answer: 'Unused point packages can be refunded within 7 days of purchase. Membership subscriptions are non-refundable once activated.'
      }
    },
    contact: {
      title: 'Contact Us',
      description: 'If you haven\'t found your answer, feel free to contact our support team.',
      support: 'Contact Support',
      feedback: 'Give Feedback'
    }
  },
  contact: {
    title: 'Contact Us',
    email: {
      title: 'Email',
      description: 'Send us an email, we\'ll reply within 24 hours',
      value: 'support@photosong.com'
    },
    support: {
      title: 'Online Support',
      description: 'Get real-time support during business hours',
      hours: 'Monday to Friday, 9:00 AM - 6:00 PM'
    },
    address: {
      title: 'Office Address',
      description: 'Welcome to visit our office',
      hk: {
        title: 'Hong Kong Headquarters',
        value: 'Unit A, 30/F, Billion Plaza, 1 Wang Kwong Road, Kowloon Bay, Hong Kong'
      },
      us: {
        title: 'US Office',
        value: '201 Spear Street, Suite 1100, San Francisco, CA 94105, USA'
      }
    },
    form: {
      title: 'Contact Form',
      description: 'Fill out the form below and we\'ll get back to you soon',
      name: 'Your Name',
      email: 'Email Address',
      subject: 'Subject',
      message: 'Message',
      submit: 'Send Message'
    },
    success: 'Message sent successfully!',
    error: 'Failed to send message, please try again later',
    faq: {
      title: 'FAQ',
      description: 'Before contacting us, you might want to check our FAQ',
      link: 'View FAQ'
    }
  },
  feedback: {
    title: 'Feedback',
    intro: {
      title: 'Help Us Improve',
      description: 'Your feedback is important to us and helps improve our products and services.'
    },
    types: {
      bug: 'Bug Report',
      feature: 'Feature Request',
      improvement: 'Improvement Suggestion',
      other: 'Other'
    },
    form: {
      title: 'Feedback Content',
      description: 'Please describe your feedback in detail to help us better understand and address the issue.',
      upload: 'Click or drag to upload screenshot',
      email: 'Your email (optional)',
      submit: 'Submit Feedback'
    },
    success: 'Feedback submitted successfully!',
    error: 'Failed to submit feedback, please try again later',
    channels: {
      title: 'Other Feedback Channels',
      description: 'Besides the feedback form, you can also reach us through:',
      email: 'Send Email',
      community: 'Community Discussion',
      support: 'Contact Support'
    }
  },
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'Last updated: {date}',
    contents: 'Contents',
    acceptance: {
      title: 'Acceptance',
      content: 'By using Photo Song services, you agree to all terms in this agreement.'
    },
    services: {
      title: 'Services',
      content: 'Photo Song provides AI-powered photo-to-music creation services.'
    },
    account: {
      title: 'Account',
      content: 'Users need to register an account to access full services. Please keep your account information secure.'
    },
    content: {
      title: 'Content',
      content: 'User-uploaded content must comply with laws and regulations and not infringe on others\' rights.'
    },
    intellectual: {
      title: 'Intellectual Property',
      content: 'Users retain rights to their uploaded content but grant necessary licenses to the platform.'
    },
    payment: {
      title: 'Payment',
      content: 'Service fees, payment methods, and refund policies.'
    },
    termination: {
      title: 'Termination',
      content: 'Terms regarding account and service termination.'
    },
    liability: {
      title: 'Liability',
      content: 'Platform liability scope and disclaimers.'
    },
    changes: {
      title: 'Changes',
      content: 'We reserve the right to modify these terms, with updates posted on the website.'
    },
    contact: {
      title: 'Contact',
      content: 'Contact us through the following methods for any questions.'
    },
    footer: {
      questions: 'Have questions?',
      contact: 'Contact Us',
      privacy: 'Privacy Policy'
    }
  },
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: {date}',
    contents: 'Contents',
    collection: {
      title: 'Information Collection',
      content: 'Types of information we collect and their purposes.',
      personal: {
        title: 'Personal Information',
        content: 'Including but not limited to: username, email, login information.'
      },
      usage: {
        title: 'Usage Information',
        content: 'Including: access records, operation logs, device information.'
      },
      technical: {
        title: 'Technical Information',
        content: 'Including: IP address, browser type, device identifiers.'
      }
    },
    use: {
      title: 'Information Use',
      content: 'How we use collected information.',
      service: {
        title: 'Service Provision',
        content: 'Used to provide, maintain, and improve our services.'
      },
      improvement: {
        title: 'Service Improvement',
        content: 'Used to analyze user behavior and improve user experience.'
      },
      communication: {
        title: 'User Communication',
        content: 'Used to respond to user requests and provide support.'
      }
    },
    sharing: {
      title: 'Information Sharing',
      content: 'How and with whom we share user information.'
    },
    security: {
      title: 'Information Security',
      content: 'How we protect user information.'
    },
    cookies: {
      title: 'Cookies Usage',
      content: 'How we use cookies and similar technologies.'
    },
    rights: {
      title: 'User Rights',
      content: 'User control over their personal information.'
    },
    children: {
      title: 'Children\'s Privacy',
      content: 'Policies regarding minors using our services.'
    },
    changes: {
      title: 'Policy Changes',
      content: 'How privacy policy updates are handled and notified.'
    },
    contact: {
      title: 'Contact Us',
      content: 'Contact information for privacy concerns.'
    },
    footer: {
      questions: 'Privacy concerns?',
      contact: 'Contact Us',
      terms: 'Terms of Service'
    }
  },
  success: {
    upload: 'Upload successful',
    save: 'Save successful',
    update: 'Update successful',
    delete: 'Delete successful',
    share: 'Share successful',
    copy: 'Copy successful',
    download: 'Download successful',
    generate: 'Generation successful',
    publish: 'Publish successful',
    membership: {
      plan: 'Membership Plan',
      plans: {
        trial: 'Trial Plan',
        pro: 'Pro Plan',
        premium: 'Premium Plan',
        lifetime: 'Lifetime Plan'
      }
    }
  },
  works: {
    untitledWork: 'Untitled Work',
    defaultStyle: 'General',
    anonymousUser: 'Anonymous User',
    playWork: 'Play music for {title}',
    status: {
      generating: 'Generating',
      failed: 'Generation Failed'
    },
    meta: {
      description: '{title} - An AI-generated music piece in {style} style by {author}. Created on PhotoSong, where images transform into melodies.',
      title: '{title} | AI Music by {author}'
    },
    defaultDescription: 'Discover AI-generated music on PhotoSong - where images transform into beautiful melodies.'
  },
  creator: 'Creator',
  sitemap: {
    title: 'Sitemap Update',
    description: 'Here you can view and update the sitemap',
    update: 'Update Sitemap',
    updating: 'Updating...',
    download: 'Download Sitemap',
    lastUpdate: 'Last Update',
    status: {
      idle: 'Sitemap is ready',
      updating: 'Updating sitemap...',
      success: 'Sitemap updated successfully',
      error: 'Failed to update sitemap'
    },
    info: {
      title: 'Sitemap Information',
      totalUrls: 'Total URLs',
      languages: 'Supported Languages',
      languageList: 'English, Chinese, Russian',
      cacheTime: 'Cache Time',
      hour: 'hour'
    },
    seoTools: {
      title: "SEO Tools",
      tabs: {
        performance: "Performance",
        mobile: "Mobile",
        competitor: "Competitor"
      },
      performance: {
        placeholder: "Enter URL to analyze",
        analyze: "Analyze",
        metrics: {
          speed: "Page Load Speed",
          speedDescription: "Time taken to load the entire page",
          fcp: "First Contentful Paint",
          fcpDescription: "Time when the first content is painted",
          lcp: "Largest Contentful Paint",
          lcpDescription: "Time when the largest content element is painted"
        },
        suggestions: "Optimization Suggestions",
        suggestions1: "Use lazy loading for images to improve page load speed",
        suggestions2: "Enable browser caching to reduce repeated requests",
        urlRequired: "Please enter a URL to analyze",
        error: "Performance analysis failed, please try again later"
      },
      mobile: {
        placeholder: "Enter URL to check",
        check: "Check",
        checks: {
          responsive: "Responsive Design",
          responsiveDescription: "Check if the page adapts to different screen sizes",
          viewport: "Viewport Settings",
          viewportDescription: "Check if mobile viewport is properly configured"
        },
        suggestions: "Improvement Suggestions",
        viewportSuggestion: "Add appropriate viewport meta tag",
        urlRequired: "Please enter a URL to check",
        error: "Mobile check failed, please try again later"
      },
      competitor: {
        placeholder: "Enter competitor's URL",
        analyze: "Analyze",
        overview: "Comparison Overview",
        yours: "Your Site",
        theirs: "Competitor",
        metrics: {
          performance: "Performance Score",
          seo: "SEO Score",
          accessibility: "Accessibility"
        },
        insights: "Competitive Analysis",
        insights1: {
          title: "Your Advantages",
          description: "Your site performs better in these areas",
          point1: "Faster page load speed than competitor",
          point2: "Better mobile optimization"
        },
        insights2: {
          title: "Areas for Improvement",
          description: "Consider improving these aspects",
          point1: "Add more original content",
          point2: "Optimize internal link structure"
        },
        urlRequired: "Please enter competitor's URL",
        error: "Competitor analysis failed, please try again later"
      }
    }
  },
  share: {
    title: 'Share',
    copySuccess: 'Link copied',
    copyFailed: 'Copy failed',
    shareFailed: 'Share failed',
    shareSuccess: 'Share success'
  },
  userWorkDetail: {
    meta: {
      title: "{title} | {author}'s AI Music Creation - PhotoSong",
      description: "Listen to '{title}', an AI-generated musical piece in {style} style by {author}. Discover unique compositions created from images on PhotoSong."
    }
  },
  actions: {
    share: 'Share'
  },
  articles: {
    title: 'Articles',
    description: 'Explore the latest news and guides about AI music creation',
    allCategories: 'All Categories',
    loading: 'Loading article...',
    views: 'Views',
    prevArticle: 'Previous Article',
    nextArticle: 'Next Article',
    likeSuccess: 'Article liked successfully',
    errors: {
      loadFailed: 'Failed to load articles'
    },
    detail: {
      title: 'Article | PhotoSong',
      description: 'Read interesting articles about music, technology, and creativity on PhotoSong'
    },
    empty: {
      description: 'No articles available at the moment. Check back later for updates.'
    },
    categories: {
      all: 'All',
      news: 'News',
      knowledge: 'Knowledge',
      ai_music: 'AI Music',
      professional: 'Professional',
      tutorial: 'Tutorials',
      research: 'Research',
      industry: 'Industry',
      community: 'Community',
      music_knowledge: 'Music Knowledge'
    },
    generateArticle: 'Generate Article',
    strategy: 'Generation Strategy',
    tone: 'Tone',
    length: 'Article Length',
    language: 'Article Language',
    keywords: 'Keywords',
    keywordCount: 'Keyword Count',
    enterKeywords: 'Enter Keywords',
    autoKeywords: 'Auto Generate Keywords',
    batchGenerate: 'Batch Generate',
    imageGeneration: 'Image Generation',
    draftSaving: 'Draft Saving',
    afterGeneration: 'After Generation',
    seoOptions: 'SEO Options',
    mediaGeneration: 'Media Generation',
    enhance: {
      title: 'Enhance Article',
      options: {
        focusAreas: {
          label: 'Focus Areas'
        },
        tone: {
          label: 'Language Style'
        },
        targetLength: {
          label: 'Target Length',
          maintain: 'Maintain Current Length',
          expand: 'Expand Content',
          shorten: 'Shorten Content'
        },
        keepStructure: {
          label: 'Keep Structure'
        }
      }
    },
    rewrite: {
      title: 'Rewrite Article',
      reference: {
        label: 'Reference',
        placeholder: 'Enter reference content',
        similarity: {
          label: 'Similarity',
          high: 'High',
          medium: 'Medium',
          low: 'Low'
        }
      },
      options: {
        style: {
          label: 'Writing Style',
          original: 'Original',
          creative: 'Creative',
          professional: 'Professional',
          casual: 'Casual'
        },
        focus: {
          label: 'Focus Areas'
        },
        improvements: {
          label: 'Areas to Improve'
        }
      },
      button: 'Rewrite'
    },
    cover: {
      label: 'Cover Image',
      tip: 'Recommended size: 1200x630px, max 2MB'
    },
    changeStatus: 'Change Status',
    status: {
      draft: 'Draft',
      published: 'Published',
      archived: 'Archived'
    },
    related: 'Related Articles',
    readMore: 'Read More',
    publishedAt: 'Published on',
    readingTime: '{time} min read',
    share: 'Share Article',
    backToList: 'Back to Articles'
  },
  about: {
    title: 'About Us',
    description: 'We are dedicated to innovative technology that transforms photos into music.'
  },
  community: {
    title: 'Community',
    description: 'Explore music works created by users',
    loadingMore: 'Loading more...',
    noMore: 'No more works',
    empty: 'No works yet',
    filter: {
      all: 'All',
      latest: 'Latest',
      popular: 'Popular',
      following: 'Following'
    }
  }
}