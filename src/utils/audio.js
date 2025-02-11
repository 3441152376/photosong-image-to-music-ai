import { ref } from 'vue'

// 全局音频状态
export const audioState = {
  initialized: ref(false),
  userInteracted: ref(false),
  isReady: ref(false),
  context: ref(null)
}

let audioContext = null;

// 创建一个延迟初始化的 AudioContext
const createAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// 在用户交互时初始化和恢复 AudioContext
const handleUserInteraction = async () => {
  if (!audioState.userInteracted.value) {
    audioState.userInteracted.value = true;
    const context = createAudioContext();
    if (context?.state === 'suspended') {
      try {
        await context.resume();
        audioState.isReady.value = true;
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    } else {
      audioState.isReady.value = true;
    }
  }
};

// 添加用户交互事件监听
const initAudioContextOnUserInteraction = () => {
  const events = ['click', 'touchstart', 'keydown'];
  const handler = async (event) => {
    await handleUserInteraction();
    // 一旦初始化完成，移除所有事件监听器
    if (audioState.isReady.value) {
      events.forEach(eventName => {
        document.removeEventListener(eventName, handler);
      });
    }
  };
  events.forEach(event => {
    document.addEventListener(event, handler);
  });
};

// 初始化事件监听
initAudioContextOnUserInteraction();

export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

export const getAudioContext = () => {
  return audioContext;
};

// 在用户交互时调用此函数
export const resumeAudioContext = async () => {
  if (audioContext && audioContext.state === 'suspended') {
    await audioContext.resume();
  }
};

// 音频上下文管理器
class AudioContextManager {
  constructor() {
    this.initialized = false;
    this.queue = [];
  }

  async initialize() {
    if (this.initialized) return audioContext;
    
    return new Promise((resolve) => {
      const checkAndInit = () => {
        if (audioState.userInteracted.value) {
          const context = createAudioContext();
          this.initialized = true;
          this.processQueue();
          resolve(context);
        } else {
          requestAnimationFrame(checkAndInit);
        }
      };
      checkAndInit();
    });
  }

  processQueue() {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      task(audioContext);
    }
  }

  async getContext() {
    return this.initialize();
  }

  async resume() {
    const context = await this.getContext();
    if (context?.state === 'suspended') {
      return context.resume();
    }
  }

  enqueue(task) {
    if (this.initialized && audioContext) {
      task(audioContext);
    } else {
      this.queue.push(task);
    }
  }

  // 检查音频格式支持
  checkAudioSupport(format) {
    const audio = document.createElement('audio');
    return audio.canPlayType(format) !== '';
  }

  // 获取支持的音频格式
  getSupportedFormats() {
    const formats = [
      { type: 'audio/mpeg', ext: '.mp3' },
      { type: 'audio/wav', ext: '.wav' },
      { type: 'audio/ogg', ext: '.ogg' },
      { type: 'audio/aac', ext: '.aac' },
      { type: 'audio/webm', ext: '.webm' }
    ];

    return formats.filter(format => this.checkAudioSupport(format.type));
  }

  // 创建音频源
  createSource(audioElement) {
    const context = audioContext;
    if (!context) return null;
    
    try {
      const source = context.createMediaElementSource(audioElement);
      source.connect(context.destination);
      return source;
    } catch (error) {
      console.error('Failed to create audio source:', error);
      return null;
    }
  }
}

// 导出单例实例
export default new AudioContextManager();

// 在用户交互时初始化
export const setupAudioContext = () => {
  const initOnInteraction = () => {
    initAudioContext()
    // 移除事件监听器
    document.removeEventListener('click', initOnInteraction)
    document.removeEventListener('touchstart', initOnInteraction)
    document.removeEventListener('keydown', initOnInteraction)
  }

  // 添加事件监听器
  document.addEventListener('click', initOnInteraction)
  document.addEventListener('touchstart', initOnInteraction)
  document.addEventListener('keydown', initOnInteraction)
} 