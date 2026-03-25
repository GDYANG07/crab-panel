import { useTranslation } from 'react-i18next';
import { Workflow, Plus } from 'lucide-react';
import { Button } from '../components/ui';

export function Channels() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
            <Workflow className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {t('page.channels.title')}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {t('page.channels.description')}
            </p>
          </div>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-1" />
          添加通道
        </Button>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
        <Workflow className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
          暂无通道配置
        </h3>
        <p className="text-[var(--color-text-secondary)] max-w-md mb-4">
          添加 Slack、Discord、邮件等通讯通道，让 Agent 可以与外部世界交互。
        </p>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          添加通道
        </Button>
      </div>
    </div>
  );
}
