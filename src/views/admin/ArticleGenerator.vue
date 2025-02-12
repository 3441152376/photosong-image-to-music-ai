<template>
  <div class="article-generator">
    <div class="header">
      <h1>{{ $t('articleGenerator.title') }}</h1>
      <p class="description">{{ $t('articleGenerator.description') }}</p>
    </div>

    <el-card class="generator-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('articleGenerator.settings') }}</span>
          <el-button
            type="primary"
            :loading="generating"
            @click="handleGenerate"
          >
            {{ $t('articleGenerator.generate') }}
          </el-button>
        </div>
      </template>

      <el-form :model="form" label-position="top">
        <!-- 文章类型选择 -->
        <el-form-item :label="$t('articleGenerator.form.types')">
          <el-checkbox-group v-model="form.selectedTypes">
            <el-checkbox
              v-for="(label, type) in articleTypes"
              :key="type"
              :label="type"
            >
              {{ $t(`articleGenerator.types.${type}`) }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 语言选择 -->
        <el-form-item :label="$t('articleGenerator.form.languages')">
          <el-checkbox-group v-model="form.selectedLanguages">
            <el-checkbox
              v-for="lang in supportedLanguages"
              :key="lang"
              :label="lang"
            >
              {{ $t(`languages.${lang}`) }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 生成设置 -->
        <el-form-item :label="$t('articleGenerator.form.schedule')">
          <el-switch
            v-model="form.autoSchedule"
            :active-text="$t('articleGenerator.form.autoScheduleEnabled')"
          />
        </el-form-item>

        <el-form-item v-if="form.autoSchedule">
          <el-time-picker
            v-model="form.scheduleTime"
            format="HH:mm"
            placeholder="选择发布时间"
          />
          <el-select
            v-model="form.frequency"
            class="schedule-select"
          >
            <el-option
              v-for="(label, value) in frequencies"
              :key="value"
              :label="$t(`articleGenerator.frequencies.${value}`)"
              :value="value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 生成结果 -->
    <el-card v-if="results.length > 0" class="results-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('articleGenerator.results') }}</span>
          <el-button
            type="primary"
            link
            @click="results = []"
          >
            {{ $t('articleGenerator.clearResults') }}
          </el-button>
        </div>
      </template>

      <el-table :data="results" style="width: 100%">
        <el-table-column
          prop="type"
          :label="$t('articleGenerator.table.type')"
        >
          <template #default="{ row }">
            {{ $t(`articleGenerator.types.${row.type}`) }}
          </template>
        </el-table-column>
        
        <el-table-column
          prop="language"
          :label="$t('articleGenerator.table.language')"
        >
          <template #default="{ row }">
            {{ $t(`languages.${row.language}`) }}
          </template>
        </el-table-column>
        
        <el-table-column
          prop="success"
          :label="$t('articleGenerator.table.status')"
        >
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'">
              {{ row.success ? $t('articleGenerator.status.success') : $t('articleGenerator.status.failed') }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column
          :label="$t('articleGenerator.table.actions')"
          width="200"
        >
          <template #default="{ row }">
            <el-button
              v-if="row.success"
              type="primary"
              link
              @click="viewArticle(row.article)"
            >
              {{ $t('articleGenerator.actions.view') }}
            </el-button>
            <el-button
              v-if="!row.success"
              type="danger"
              link
              @click="retryGeneration(row)"
            >
              {{ $t('articleGenerator.actions.retry') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ARTICLE_TYPES, batchGenerateArticles, getDefaultLanguage, autoGenerateAndPublishArticle } from '@/services/articleGenerator'
import { useRouter } from 'vue-router'
import { supportedLocales } from '@/i18n'

const { t } = useI18n()
const router = useRouter()

// 文章类型
const articleTypes = ARTICLE_TYPES

// 支持的语言
const supportedLanguages = ['zh', 'en', 'ru']

// 发布频率选项
const frequencies = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月'
}

// 表单数据
const form = ref({
  selectedTypes: [ARTICLE_TYPES.TUTORIAL],
  selectedLanguages: [getDefaultLanguage()],
  autoSchedule: false,
  scheduleTime: null,
  frequency: 'weekly'
})

const languageOptions = supportedLocales.map(locale => ({
  value: locale,
  label: new Intl.DisplayNames([locale], { type: 'language' }).of(locale)
}))

// 生成状态
const generating = ref(false)
const results = ref([])

// 处理生成
async function handleGenerate() {
  if (form.value.selectedTypes.length === 0) {
    ElMessage.warning(t('articleGenerator.validation.noTypes'))
    return
  }

  try {
    generating.value = true
    const generationResults = await batchGenerateArticles(
      form.value.selectedTypes,
      form.value.selectedLanguages
    )
    
    results.value = generationResults.map(result => ({
      id: result.success ? result.article.id : '',
      type: result.type,
      language: result.language,
      status: result.success ? 'success' : 'error',
      error: result.error || ''
    }))

    // 显示结果统计
    const successCount = generationResults.filter(r => r.success).length
    const totalCount = generationResults.length
    
    if (successCount === totalCount) {
      ElMessage.success(t('articleGenerator.success', {
        success: successCount,
        total: totalCount
      }))
    } else {
      ElMessage.warning(t('articleGenerator.partialSuccess', {
        success: successCount,
        total: totalCount
      }))
    }

    // 如果启用了自动调度，保存调度设置
    if (form.value.autoSchedule) {
      await saveScheduleSettings()
    }
  } catch (error) {
    console.error('Generate articles failed:', error)
    ElMessage.error(t('articleGenerator.error'))
  } finally {
    generating.value = false
  }
}

// 保存调度设置
async function saveScheduleSettings() {
  try {
    const Schedule = AV.Object.extend('ArticleSchedule')
    const schedule = new Schedule()
    
    schedule.set('time', form.value.scheduleTime)
    schedule.set('frequency', form.value.frequency)
    schedule.set('types', form.value.selectedTypes)
    schedule.set('languages', form.value.selectedLanguages)
    schedule.set('enabled', true)
    
    await schedule.save()
    
    ElMessage.success(t('articleGenerator.scheduleSuccess'))
  } catch (error) {
    console.error('Save schedule failed:', error)
    ElMessage.error(t('articleGenerator.scheduleError'))
  }
}

// 查看文章
function viewArticle(article) {
  router.push({
    name: 'ArticleDetail',
    params: { slug: article.get('slug') }
  })
}

// 重试生成
async function retryGeneration(failedResult) {
  try {
    generating.value = true
    
    const article = await autoGenerateAndPublishArticle(
      failedResult.type,
      failedResult.language
    )
    
    // 更新结果列表
    const index = results.value.findIndex(r => 
      r.type === failedResult.type && r.language === failedResult.language
    )
    
    if (index !== -1) {
      results.value[index] = {
        success: true,
        article,
        type: failedResult.type,
        language: failedResult.language
      }
    }
    
    ElMessage.success(t('articleGenerator.retrySuccess'))
  } catch (error) {
    console.error('Retry generation failed:', error)
    ElMessage.error(t('articleGenerator.retryError'))
  } finally {
    generating.value = false
  }
}
</script>

<style scoped>
.article-generator {
  padding: 24px;
}

.header {
  margin-bottom: 24px;
}

.description {
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}

.generator-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schedule-select {
  margin-left: 16px;
}

.results-card {
  margin-top: 24px;
}
</style> 