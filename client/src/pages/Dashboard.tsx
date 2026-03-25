import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Bot, MessageSquare, Workflow, Puzzle, Brain, Activity } from 'lucide-react';

export function Dashboard() {
  const { t } = useTranslation();

  const stats = [
    { icon: Bot, label: t('nav.agents'), value: '3' },
    { icon: Workflow, label: t('nav.channels'), value: '5' },
    { icon: Puzzle, label: t('nav.skills'), value: '12' },
    { icon: Brain, label: t('page.memory.title'), value: '1.2K' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
          <LayoutDashboard className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {t('page.dashboard.title')}
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            {t('page.dashboard.description')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--color-primary-light)]">
                <stat.icon className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[var(--color-text-primary)]">{stat.value}</div>
                <div className="text-sm text-[var(--color-text-secondary)]">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 min-h-[200px]">
          <h3 className="font-medium text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--color-info)]" />
            最近活动
          </h3>
          <div className="text-sm text-[var(--color-text-secondary)]">暂无活动记录</div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 min-h-[200px]">
          <h3 className="font-medium text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--color-success)]" />
            最近对话
          </h3>
          <div className="text-sm text-[var(--color-text-secondary)]">暂无对话记录</div>
        </div>
      </div>
    </div>
  );
}
