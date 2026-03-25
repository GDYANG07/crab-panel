import { useTranslation } from 'react-i18next';
import { Settings, Save, Code } from 'lucide-react';
import { Button } from '../components/ui';
import { useState } from 'react';

export function Config() {
  const { t } = useTranslation();
  const [jsonMode, setJsonMode] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
            <Settings className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {t('page.config.title')}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {t('page.config.description')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={jsonMode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setJsonMode(!jsonMode)}
          >
            <Code className="w-4 h-4 mr-1" />
            {jsonMode ? '表单模式' : 'JSON 模式'}
          </Button>
          <Button variant="primary" size="sm">
            <Save className="w-4 h-4 mr-1" />
            {t('common.save')}
          </Button>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <Settings className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
          配置编辑开发中
        </h3>
        <p className="text-[var(--color-text-secondary)] max-w-md">
          {jsonMode
            ? 'JSON 原始模式将提供 Monaco Editor 进行直接编辑。'
            : '表单模式将提供可视化的配置表单，支持切换为 JSON 原始模式。'}
        </p>
      </div>
    </div>
  );
}
