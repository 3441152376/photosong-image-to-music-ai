<template>
  <!-- 空模板，所有元数据通过 useHead 注入 -->
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'

const props = defineProps({
  work: {
    type: Object,
    required: true
  }
})

const { t, locale } = useI18n()

const title = computed(() => {
  return `${t('workDetail.meta.title', {
    title: props.work.title || t('works.untitledWork'),
    author: props.work.user?.username || t('works.anonymousUser')
  })} - PhotoSong`
})
const description = computed(() => {
  return t('workDetail.meta.description', {
    title: title.value,
    style: props.work.style || t('works.defaultStyle'),
    author: props.work.user?.username || t('works.anonymousUser')
  })
})
const keywords = computed(() => {
  const langKeywords = {
    en: [
      'AI music generator',
      'photo to music',
      'image to song',
      'AI music composition',
      'music from pictures',
      props.work.style,
      'PhotoSong'
    ],
    zh: [
      'AI音乐生成器',
      '图片生成音乐',
      '照片转音乐',
      'AI作曲',
      '智能音乐创作',
      props.work.style,
      'PhotoSong'
    ],
    ru: [
      'ИИ генератор музыки',
      'фото в музыку',
      'изображение в песню',
      'ИИ композитор',
      'музыка из фотографий',
      props.work.style,
      'PhotoSong'
    ]
  }

  return langKeywords[locale.value]?.filter(Boolean).join(', ') || langKeywords.en.join(', ')
})
const author = computed(() => props.work.user?.username || t('works.anonymousUser'))
const imageUrl = computed(() => props.work.imageUrl || '/default-work-image.jpg')
const url = computed(() => {
  const baseUrl = 'https://photosong.com'
  const langPrefix = locale.value === 'en' ? '' : `/${locale.value}`
  return `${baseUrl}${langPrefix}/works/${props.work.id}`
})
const createdAt = computed(() => props.work.createdAt?.toISOString())
const style = computed(() => props.work.style || t('works.defaultStyle'))
const language = computed(() => locale.value)

// 构建 Schema.org JSON-LD 数据
const schemaOrgData = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'MusicComposition',
  name: title.value,
  description: description.value,
  creator: {
    '@type': 'Person',
    name: author.value
  },
  dateCreated: createdAt.value,
  image: imageUrl.value,
  url: url.value,
  genre: style.value,
  inLanguage: language.value
}))

// 使用 useHead 注入所有元数据
useHead({
  title,
  meta: [
    {
      name: 'description',
      content: description
    },
    {
      name: 'keywords',
      content: keywords
    },
    {
      property: 'og:title',
      content: title
    },
    {
      property: 'og:description',
      content: description
    },
    {
      property: 'og:image',
      content: imageUrl
    },
    {
      property: 'og:url',
      content: url
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
      content: title
    },
    {
      name: 'twitter:description',
      content: description
    },
    {
      name: 'twitter:image',
      content: imageUrl
    }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: computed(() => JSON.stringify(schemaOrgData.value))
    }
  ],
  link: [
    {
      rel: 'canonical',
      href: url
    }
  ]
})
</script>