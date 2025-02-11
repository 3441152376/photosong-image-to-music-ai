<template>
  <div class="editor-wrapper">
    <editor-content :editor="editor" class="editor-content" />
    <div v-if="showToolbar" class="editor-toolbar">
      <button
        v-for="item in toolbarItems"
        :key="item.action"
        class="toolbar-button"
        :class="{ 'is-active': item.isActive?.() }"
        @click="item.action"
        :title="item.title"
      >
        <span class="icon" v-html="item.icon"></span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, computed } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '开始写作...'
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  editable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit,
    Image,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer nofollow'
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    Underline
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
    emit('change', editor.getHTML())
  }
})

const toolbarItems = computed(() => [
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13.23 15h-2.46L9.52 18h-2.2l2.96-8h2.44l2.96 8h-2.2l-1.25-3zm-2.14-1.6h1.82l-.89-2.64h-.04l-.89 2.64z"/></svg>',
    title: '标题',
    action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: () => editor.value?.isActive('heading', { level: 2 })
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8 11h13v2H8v-2zm0-6h13v2H8V5zm0 12h13v2H8v-2zm-5-4h3v3H3v-3zm0-6h3v3H3V7zm0-6h3v3H3V1z"/></svg>',
    title: '项目符号列表',
    action: () => editor.value?.chain().focus().toggleBulletList().run(),
    isActive: () => editor.value?.isActive('bulletList')
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M7 13h13v-2H7m0 8h13v-2H7m0-8h13V7H7M3 17h2v.5H4v1h1v.5H3v1h3v-4H3m1-9h1V3H3v1h1m-1 3h2v.5H4v1h1v.5H3v1h3V7H3z"/></svg>',
    title: '编号列表',
    action: () => editor.value?.chain().focus().toggleOrderedList().run(),
    isActive: () => editor.value?.isActive('orderedList')
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zm0 14h5v-3h4v3h5v-3H5v3z"/></svg>',
    title: '代码块',
    action: () => editor.value?.chain().focus().toggleCodeBlock().run(),
    isActive: () => editor.value?.isActive('codeBlock')
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
    title: '添加链接',
    action: () => {
      const url = window.prompt('输入链接URL')
      if (url) {
        editor.value?.chain().focus().setLink({ href: url }).run()
      }
    },
    isActive: () => editor.value?.isActive('link')
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/></svg>',
    title: '插入图片',
    action: () => {
      const url = window.prompt('输入图片URL')
      if (url) {
        editor.value?.chain().focus().setImage({ src: url }).run()
      }
    }
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>',
    title: '左对齐',
    action: () => editor.value?.chain().focus().setTextAlign('left').run(),
    isActive: () => editor.value?.isActive({ textAlign: 'left' })
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>',
    title: '居中对齐',
    action: () => editor.value?.chain().focus().setTextAlign('center').run(),
    isActive: () => editor.value?.isActive({ textAlign: 'center' })
  }
])

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped lang="scss">
.editor-wrapper {
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
}

.editor-content {
  padding: 1rem;
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;
  
  :deep(.ProseMirror) {
    outline: none;
    
    > * + * {
      margin-top: 0.75em;
    }
    
    ul,
    ol {
      padding: 0 1rem;
    }
    
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      line-height: 1.1;
      font-weight: 600;
    }
    
    code {
      background-color: rgba(#616161, 0.1);
      color: #616161;
      padding: 0.25rem;
      border-radius: 0.25rem;
    }
    
    pre {
      background: #0D0D0D;
      color: #FFF;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      
      code {
        color: inherit;
        padding: 0;
        background: none;
        font-size: 0.8rem;
      }
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    blockquote {
      padding-left: 1rem;
      border-left: 2px solid rgba(#0D0D0D, 0.1);
    }
    
    hr {
      border: none;
      border-top: 2px solid rgba(#0D0D0D, 0.1);
      margin: 2rem 0;
    }
  }
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--surface-secondary);
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0.25rem;
  border: none;
  background: transparent;
  border-radius: 0.25rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--hover-color);
    color: var(--text-primary);
  }
  
  &.is-active {
    background: var(--primary-color);
    color: white;
  }
  
  .icon {
    width: 1.25rem;
    height: 1.25rem;
    
    svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  }
}
</style> 