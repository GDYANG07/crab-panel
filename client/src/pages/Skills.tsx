import { useTranslation } from 'react-i18next';
import { Puzzle } from 'lucide-react';

export function Skills() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
          <Puzzle className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {t('page.skills.title')}
            </h1>
          <p className="text-[var(--color-text-secondary)]">
            {t('page.skills.description')}
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <Puzzle className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
          技能商店开发中
        </h3>
        <p className="text-[var(--color-text-secondary)] max-w-md">
          这里将展示可用的技能插件，你可以浏览、搜索和安装技能来扩展 Agent 的能力。
        </p>
      </div>
    </div>
  );
}
