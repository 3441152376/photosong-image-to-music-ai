import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Select, Input, notification } from 'antd';
import { rewriteArticle } from '../api/article';

const { TextArea } = Input;

const ArticleRewrite = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [referenceContent, setReferenceContent] = useState('');
  const [options, setOptions] = useState({
    similarity: 'medium',
    style: 'original',
    focus: ['structure'],
    improvements: ['clarity']
  });

  const handleRewrite = async () => {
    if (!referenceContent.trim()) {
      notification.warning({
        message: t('articles.rewrite.reference.label'),
        description: '请输入参考文章内容'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await rewriteArticle(referenceContent, options);
      notification.success({
        message: t('articles.rewrite.success')
      });
      onSuccess?.(response.article);
    } catch (error) {
      notification.error({
        message: t('articles.rewrite.error'),
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
          {t('articles.rewrite.reference.label')}
        </label>
        <TextArea
          rows={6}
          value={referenceContent}
          onChange={e => setReferenceContent(e.target.value)}
          placeholder={t('articles.rewrite.reference.placeholder')}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('articles.rewrite.options.similarity.label')}
        </label>
        <Select
          className="w-full"
          value={options.similarity}
          onChange={value => setOptions(prev => ({ ...prev, similarity: value }))}
          options={[
            { label: t('articles.rewrite.options.similarity.high'), value: 'high' },
            { label: t('articles.rewrite.options.similarity.medium'), value: 'medium' },
            { label: t('articles.rewrite.options.similarity.low'), value: 'low' }
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('articles.rewrite.options.style.label')}
        </label>
        <Select
          className="w-full"
          value={options.style}
          onChange={value => setOptions(prev => ({ ...prev, style: value }))}
          options={[
            { label: t('articles.rewrite.options.style.original'), value: 'original' },
            { label: t('articles.rewrite.options.style.creative'), value: 'creative' },
            { label: t('articles.rewrite.options.style.academic'), value: 'academic' }
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('articles.rewrite.options.focus.label')}
        </label>
        <Select
          mode="multiple"
          className="w-full"
          value={options.focus}
          onChange={value => setOptions(prev => ({ ...prev, focus: value }))}
          options={[
            { label: t('articles.rewrite.options.focus.structure'), value: 'structure' },
            { label: t('articles.rewrite.options.focus.tone'), value: 'tone' },
            { label: t('articles.rewrite.options.focus.examples'), value: 'examples' },
            { label: t('articles.rewrite.options.focus.insights'), value: 'insights' }
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('articles.rewrite.options.improvements.label')}
        </label>
        <Select
          mode="multiple"
          className="w-full"
          value={options.improvements}
          onChange={value => setOptions(prev => ({ ...prev, improvements: value }))}
          options={[
            { label: t('articles.rewrite.options.improvements.depth'), value: 'depth' },
            { label: t('articles.rewrite.options.improvements.clarity'), value: 'clarity' },
            { label: t('articles.rewrite.options.improvements.evidence'), value: 'evidence' },
            { label: t('articles.rewrite.options.improvements.uniqueness'), value: 'uniqueness' }
          ]}
        />
      </div>

      <Button
        type="primary"
        className="w-full"
        loading={loading}
        onClick={handleRewrite}
      >
        {t('articles.rewrite.button')}
      </Button>
    </div>
  );
};

export default ArticleRewrite; 