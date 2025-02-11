<template>
  <div class="article-enhance">
    <el-form :model="form" label-width="120px">
      <!-- 优化重点 -->
      <el-form-item :label="t('articles.enhance.options.focusAreas.label')">
        <el-select
          v-model="form.focusAreas"
          multiple
          class="w-full"
          placeholder="请选择优化重点"
        >
          <el-option
            v-for="option in focusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 语气风格 -->
      <el-form-item :label="t('articles.enhance.options.tone.label')">
        <el-select
          v-model="form.tone"
          class="w-full"
          placeholder="请选择语气风格"
        >
          <el-option
            v-for="option in toneOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 目标长度 -->
      <el-form-item :label="t('articles.enhance.options.targetLength.label')">
        <el-select
          v-model="form.targetLength"
          class="w-full"
          placeholder="请选择目标长度"
        >
          <el-option
            v-for="option in targetLengthOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 文章结构 -->
      <el-form-item :label="t('articles.enhance.options.keepStructure.label')">
        <el-radio-group v-model="form.keepStructure" class="w-full">
          <el-radio :value="'keep'">{{ t('articles.enhance.options.keepStructure.keep') }}</el-radio>
          <el-radio :value="'optimize'">{{ t('articles.enhance.options.keepStructure.optimize') }}</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <div class="flex justify-end mt-6 space-x-4">
      <el-button @click="$emit('cancel')">{{ t('common.cancel') }}</el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="handleEnhance"
      >
        {{ t('articles.enhance.button') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { enhanceArticle } from '@/api/article'
import AV from 'leancloud-storage'

const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['success', 'cancel'])
const { t } = useI18n()
const loading = ref(false)

const form = ref({
  focusAreas: [],
  tone: '',
  targetLength: 'maintain',
  keepStructure: 'keep'
})

// Define focus options
const focusOptions = [
  { value: 'seo', label: t('articles.enhance.options.focusAreas.seo') },
  { value: 'readability', label: t('articles.enhance.options.focusAreas.readability') },
  { value: 'professionalism', label: t('articles.enhance.options.focusAreas.professionalism') },
  { value: 'engagement', label: t('articles.enhance.options.focusAreas.engagement') }
]

// Define tone options
const toneOptions = [
  { value: 'professional', label: t('articles.enhance.options.tone.professional') },
  { value: 'casual', label: t('articles.enhance.options.tone.casual') },
  { value: 'storytelling', label: t('articles.enhance.options.tone.storytelling') },
  { value: 'persuasive', label: t('articles.enhance.options.tone.persuasive') }
]

// 定义目标长度选项
const targetLengthOptions = [
  { value: 'maintain', label: t('articles.enhance.options.targetLength.maintain') },
  { value: 'expand', label: t('articles.enhance.options.targetLength.expand') },
  { value: 'shorten', label: t('articles.enhance.options.targetLength.shorten') }
]

const handleEnhance = async () => {
  if (!props.article?.content) {
    ElMessage.warning(t('articles.enhance.error.noContent'))
    return
  }

  if (!props.article?.objectId) {
    ElMessage.error(t('articles.enhance.error.invalidArticle'))
    return
  }

  try {
    loading.value = true
    const enhancedArticle = await enhanceArticle(props.article.content, form.value)
    
    if (enhancedArticle?.success) {
      // 创建更新对象
      const article = AV.Object.createWithoutData('Article', props.article.objectId)
      
      // 设置更新的内容
      article.set('content', enhancedArticle.article.content)
      article.set('updatedAt', new Date())
      
      // 保存到数据库
      const savedArticle = await article.save(null, {
        fetchWhenSave: true // 获取保存后的完整对象
      })
      
      // 发送更新后的完整文章对象
      emit('success', {
        ...props.article,
        content: enhancedArticle.article.content,
        updatedAt: new Date()
      })
      
      ElMessage.success(t('articles.enhance.success'))
    } else {
      ElMessage.error(t('articles.enhance.error.enhancement'))
    }
  } catch (error) {
    console.error('Error enhancing article:', error)
    ElMessage.error(t('articles.enhance.error.save'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.article-enhance {
  padding: 20px;
}
</style> 