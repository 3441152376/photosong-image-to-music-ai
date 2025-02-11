<template>
  <div class="article-rewrite">
    <el-form :model="form" label-width="120px">
      <!-- 参考文章 -->
      <el-form-item :label="t('articles.rewrite.reference.label')">
        <el-input
          type="textarea"
          v-model="form.referenceContent"
          :rows="6"
          :placeholder="t('articles.rewrite.reference.placeholder')"
        />
      </el-form-item>

      <!-- 相似度 -->
      <el-form-item :label="t('articles.rewrite.options.similarity.label')">
        <el-select
          v-model="form.similarity"
          class="w-full"
          placeholder="请选择相似度"
        >
          <el-option
            v-for="option in similarityOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 写作风格 -->
      <el-form-item :label="t('articles.rewrite.options.style.label')">
        <el-select
          v-model="form.style"
          class="w-full"
          placeholder="请选择写作风格"
        >
          <el-option
            v-for="option in styleOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 重点关注 -->
      <el-form-item :label="t('articles.rewrite.options.focus.label')">
        <el-select
          v-model="form.focus"
          multiple
          class="w-full"
          placeholder="请选择重点关注"
        >
          <el-option
            v-for="option in focusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 改进方面 -->
      <el-form-item :label="t('articles.rewrite.options.improvements.label')">
        <el-select
          v-model="form.improvements"
          multiple
          class="w-full"
          placeholder="请选择改进方面"
        >
          <el-option
            v-for="option in improvementOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <div class="flex justify-end mt-6 space-x-4">
      <el-button @click="$emit('cancel')">{{ t('common.cancel') }}</el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="handleRewrite"
        :disabled="!form.referenceContent"
      >
        {{ t('articles.rewrite.button') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['success', 'cancel'])
const { t } = useI18n()
const loading = ref(false)

const form = ref({
  referenceContent: '',
  similarity: 'medium',
  style: 'original',
  focus: [],
  improvements: []
})

// Define similarity options
const similarityOptions = [
  { value: 'high', label: t('articles.rewrite.reference.similarity.high') },
  { value: 'medium', label: t('articles.rewrite.reference.similarity.medium') },
  { value: 'low', label: t('articles.rewrite.reference.similarity.low') }
]

// Define style options
const styleOptions = [
  { value: 'original', label: t('articles.rewrite.options.style.original') },
  { value: 'creative', label: t('articles.rewrite.options.style.creative') },
  { value: 'academic', label: t('articles.rewrite.options.style.academic') }
]

// Define focus options
const focusOptions = [
  { value: 'structure', label: t('articles.rewrite.options.focus.structure') },
  { value: 'tone', label: t('articles.rewrite.options.focus.tone') },
  { value: 'examples', label: t('articles.rewrite.options.focus.examples') },
  { value: 'insights', label: t('articles.rewrite.options.focus.insights') }
]

// Define improvement options
const improvementOptions = [
  { value: 'depth', label: t('articles.rewrite.options.improvements.depth') },
  { value: 'clarity', label: t('articles.rewrite.options.improvements.clarity') },
  { value: 'evidence', label: t('articles.rewrite.options.improvements.evidence') },
  { value: 'uniqueness', label: t('articles.rewrite.options.improvements.uniqueness') }
]

const handleRewrite = async () => {
  if (!form.value.referenceContent) {
    ElMessage.warning(t('articles.rewrite.reference.required'))
    return
  }

  try {
    loading.value = true
    // TODO: 调用API进行文章仿写
    const newArticle = await rewriteArticle(form.value)
    ElMessage.success(t('articles.rewrite.success'))
    emit('success', newArticle)
  } catch (error) {
    console.error('文章仿写失败:', error)
    ElMessage.error(t('articles.rewrite.error'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.article-rewrite {
  padding: 20px;
}
</style>