&lt;template>
  &lt;div class="dynamic-content">
    &lt;h1 v-if="title" class="page-title">{{ title }}&lt;/h1>
    &lt;div v-if="description" class="page-description" v-html="description">&lt;/div>
    &lt;div class="content-wrapper">
      &lt;slot>&lt;/slot>
    &lt;/div>
    &lt;div v-if="showRelated" class="related-content">
      &lt;h2>{{ t('content.related') }}&lt;/h2>
      &lt;slot name="related">&lt;/slot>
    &lt;/div>
    &lt;div class="meta-content">
      &lt;div v-if="author" class="author-info">
        &lt;img :src="author.avatar" :alt="author.username" class="author-avatar" />
        &lt;div class="author-details">
          &lt;h3>{{ author.username }}&lt;/h3>
          &lt;p>{{ author.bio }}&lt;/p>
        &lt;/div>
      &lt;/div>
      &lt;div v-if="tags.length" class="content-tags">
        &lt;span v-for="tag in tags" :key="tag" class="tag">#{{ tag }}&lt;/span>
      &lt;/div>
      &lt;div v-if="lastModified" class="last-modified">
        {{ t('content.lastModified') }}: {{ formatDate(lastModified) }}
      &lt;/div>
    &lt;/div>
  &lt;/div>
&lt;/template>

&lt;script setup>
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t } = useI18n()

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  author: {
    type: Object,
    default: null
  },
  tags: {
    type: Array,
    default: () => []
  },
  lastModified: {
    type: String,
    default: ''
  },
  showRelated: {
    type: Boolean,
    default: false
  }
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}
&lt;/script>

&lt;style scoped>
.dynamic-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2.5rem;
  color: var(--el-text-color-primary);
  margin-bottom: 1rem;
}

.page-description {
  font-size: 1.2rem;
  color: var(--el-text-color-regular);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.content-wrapper {
  margin: 2rem 0;
}

.meta-content {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--el-border-color-light);
}

.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.author-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin-right: 1rem;
}

.author-details h3 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.author-details p {
  margin: 0.5rem 0 0;
  color: var(--el-text-color-secondary);
}

.content-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}

.tag {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.9rem;
}

.last-modified {
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.related-content {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--el-border-color-light);
}
&lt;/style>
