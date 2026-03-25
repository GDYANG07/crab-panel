import { useTranslation } from 'react-i18next';
import { Brain } from 'lucide-react';

export function Memory() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
          <Brain className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {t('page.memory.title')}
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            {t('page.memory.description')}
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <Brain className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
          记忆管理开发中
        </h3>
        <p className="text-[var(--color-text-secondary)] max-w-md">
          这里将提供 Agent 记忆的可视化管理，支持查看、搜索、编辑和删除记忆条目。
        </p>
      </div>
    </div>
  );
}
