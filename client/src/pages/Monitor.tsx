import { useTranslation } from 'react-i18next';
import { Activity, Cpu, MemoryStick, Network } from 'lucide-react';

export function Monitor() {
  const { t } = useTranslation();

  const metrics = [
    { icon: Cpu, label: 'CPU 使用率', value: '12%', trend: '+2%' },
    { icon: MemoryStick, label: '内存使用', value: '256MB', trend: '-5MB' },
    { icon: Network, label: '网络延迟', value: '12ms', trend: '-3ms' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
          <Activity className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {t('page.monitor.title')}
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            {t('page.monitor.description')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <metric.icon className="w-5 h-5 text-[var(--color-primary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">{metric.label}</span>
              </div>
              <span className={`text-xs ${metric.trend.startsWith('+') ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                {metric.trend}
              </span>
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 min-h-[300px]">
          <h3 className="font-medium text-[var(--color-text-primary)] mb-4">请求 QPS</h3>
          <div className="flex items-center justify-center h-[200px] text-[var(--color-text-secondary)]">
            图表区域（开发中）
          </div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 min-h-[300px]">
          <h3 className="font-medium text-[var(--color-text-primary)] mb-4">响应时间</h3>
          <div className="flex items-center justify-center h-[200px] text-[var(--color-text-secondary)]">
            图表区域（开发中）
          </div>
        </div>
      </div>
    </div>
  );
}
