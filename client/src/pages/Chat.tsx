import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';

export function Chat() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
          <MessageSquare className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {t('page.chat.title')}
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            {t('page.chat.description')}
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <MessageSquare className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
          对话功能开发中
        </h3>
        <p className="text-[var(--color-text-secondary)] max-w-md">
          这里将提供与 OpenClaw Agent 的实时对话界面，支持多轮对话、上下文记忆等功能。
        </p>
      </div>
    </div>
  );
}
