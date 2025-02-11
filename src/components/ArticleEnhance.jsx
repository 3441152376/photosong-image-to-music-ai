import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Select, Switch, notification } from 'antd';
import { enhanceArticle } from '../api/article';

const ArticleEnhance = ({ article, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    focusAreas: ['readability'],
    tone: 'professional',
    targetLength: 'maintain',
    keepStructure: true
  });

  const handleEnhance = async () => {
    try {
      setLoading(true);
      const response = await enhanceArticle(article._id, options);
      notification.success({
        message: t('articles.enhance.success')
      });
      onSuccess?.(response.article);
    } catch (error) {
      notification.error({
        message: t('articles.enhance.error'),
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('articles.enhance.options.focusAreas.label')}
        </label>
        <Select
          mode="multiple"
          className="w-full"
          value={options.focusAreas}
          onChange={value => setOptions(prev => ({ ...prev, focusAreas: value }))}
          options={[
            { label: t('articles.enhance.options.focusAreas.seo'), value: 'seo' },
            { label: t('articles.enhance.options.focusAreas.readability'), value: 'readability' },
            { label: t('articles.enhance.options.focusAreas.professionalism'), value: 'professionalism' },
            { label: t('articles.enhance.options.focusAreas.engagement'), value: 'engagement' }
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('articles.enhance.options.tone.label')}
        </label>
        <Select
          className="w-full"
          value={options.tone}
          onChange={value => setOptions(prev => ({ ...prev, tone: value }))}
          options={[
            { label: t('articles.enhance.options.tone.professional'), value: 'professional' },
            { label: t('articles.enhance.options.tone.casual'), value: 'casual' },
            { label: t('articles.enhance.options.tone.storytelling'), value: 'storytelling' },
            { label: t('articles.enhance.options.tone.persuasive'), value: 'persuasive' }
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('articles.enhance.options.targetLength.label')}
        </label>
        <Select
          className="w-full"
          value={options.targetLength}
          onChange={value => setOptions(prev => ({ ...prev, targetLength: value }))}
          options={[
            { label: t('articles.enhance.options.targetLength.maintain'), value: 'maintain' },
            { label: t('articles.enhance.options.targetLength.expand'), value: 'expand' },
            { label: t('articles.enhance.options.targetLength.shorten'), value: 'shorten' }
          ]}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {t('articles.enhance.options.keepStructure.label')}
        </span>
        <Switch
          checked={options.keepStructure}
          onChange={checked => setOptions(prev => ({ ...prev, keepStructure: checked }))}
        />
      </div>

      <Button
        type="primary"
        className="w-full"
        loading={loading}
        onClick={handleEnhance}
      >
        {t('articles.enhance.button')}
      </Button>
    </div>
  );
};

export default ArticleEnhance; 