import { useTranslation } from 'react-i18next';
import { Bot, Plus } from 'lucide-react';
import { Button } from '../components/ui';

export function Agents() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
            <Bot className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {t('page.agents.title')}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {t('page.agents.description')}
            </p>
          </div>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-1" />
          创建 Agent
        </Button>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
        <Bot className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
          暂无 Agent
        </h3>
        <p className="text-[var(--color-text-secondary)] max-w-md mb-4">
          点击右上角「创建 Agent」按钮创建你的第一个 OpenClaw Agent。
        </p>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          创建 Agent
        </Button>
      </div>
    </div>
  );
}
