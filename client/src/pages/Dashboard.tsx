import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Bot,
  MessageSquare,
  Wifi,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  MessageCircle,
  FileText,
  Download,
  Cpu,
  HardDrive,
  MemoryStick,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import {
  useDashboardOverview,
  useSystemMetrics,
  useRecentSessions,
  useMessageTrend,
} from '../hooks/useDashboard';

// 圆环图组件
function RingChart({
  percentage,
  label,
  subLabel,
  icon: Icon,
}: {
  percentage: number;
  label: string;
  subLabel: string;
  icon: React.ElementType;
}) {
  // 颜色规则：<60% 绿色，60-85% 橙色，>85% 红色
  const getColor = (p: number) => {
    if (p < 60) return '#1D9E75';
    if (p < 85) return '#BA7517';
    return '#E24B4A';
  };

  const color = getColor(percentage);
  const data = [
    { value: percentage },
    { value: 100 - percentage },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="var(--color-border)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-5 h-5 text-[var(--color-text-secondary)] mb-1" />
          <span className="text-2xl font-bold text-[var(--color-text-primary)]">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <p className="mt-2 font-medium text-[var(--color-text-primary)]">{label}</p>
      <p className="text-sm text-[var(--color-text-secondary)]">{subLabel}</p>
    </div>
  );
}

// 概览卡片组件
function StatCard({
  icon: Icon,
  iconBgColor,
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  loading,
}: {
  icon: React.ElementType;
  iconBgColor: string;
  title: string;
  value: string;
  subtitle: string;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card padding="md" className="h-full">
        <div className="flex items-start gap-4">
          <Skeleton variant="circle" width={48} height={48} />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" className="mb-2" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      </Card>
    );
  }

  const trendIsPositive = trend !== undefined && trend >= 0;
  const trendAbs = trend !== undefined ? Math.abs(trend) : 0;

  return (
    <Card padding="md" className="h-full">
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-xl shrink-0"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--color-text-secondary)]">{title}</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
            {value}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {trend !== undefined && (
              <>
                {trendIsPositive ? (
                  <ArrowUp className="w-3 h-3 text-[var(--color-success)]" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-[var(--color-danger)]" />
                )}
                <span
                  className={`text-xs ${
                    trendIsPositive
                      ? 'text-[var(--color-success)]'
                      : 'text-[var(--color-danger)]'
                  }`}
                >
                  {trendAbs}%
                </span>
              </>
            )}
            <span className="text-xs text-[var(--color-text-secondary)] ml-1">
              {trendLabel || subtitle}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// 时间格式化
function formatTimeAgo(dateString: string, t: TFunction): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t('dashboard.sessions.justNow');
  if (minutes < 60) return t('dashboard.sessions.minutesAgo', { count: minutes });
  if (hours < 24) return t('dashboard.sessions.hoursAgo', { count: hours });
  if (days < 7) return t('dashboard.sessions.daysAgo', { count: days });
  return date.toLocaleDateString('zh-CN');
}

// 通道图标映射
const channelIcons: Record<string, React.ElementType> = {
  slack: MessageSquare,
  discord: MessageCircle,
  telegram: MessageCircle,
  email: FileText,
  web: Wifi,
};

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: overview, isLoading: overviewLoading } = useDashboardOverview();
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();
  const { data: sessions, isLoading: sessionsLoading } = useRecentSessions();
  const { data: trend, isLoading: trendLoading } = useMessageTrend();

  const handleRestartGateway = () => {
    // TODO: 实现重启 Gateway
    console.log('Restart Gateway');
  };

  const handleOpenChat = () => {
    navigate('/chat');
  };

  const handleViewLogs = () => {
    navigate('/monitor');
  };

  const handleCheckUpdate = () => {
    // TODO: 实现检查更新
    console.log('Check Update');
  };

  const getGatewayStatus = (status?: string) => {
    switch (status) {
      case 'running':
        return t('dashboard.overview.gatewayRunning');
      case 'stopped':
        return t('dashboard.overview.gatewayStopped');
      case 'error':
        return t('dashboard.overview.gatewayError');
      default:
        return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
            <Activity className="w-6 h-6 text-[var(--color-primary)]" />
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
      </div>

      {/* 区域 1: 状态概览卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wifi}
          iconBgColor="var(--color-success)"
          title={t('dashboard.overview.gateway')}
          value={getGatewayStatus(overview?.gateway.status)}
          subtitle={overview?.gateway.uptime || ''}
          trend={undefined}
          trendLabel={overview?.gateway.uptime || t('dashboard.overview.checkConnection')}
          loading={overviewLoading}
        />
        <StatCard
          icon={MessageSquare}
          iconBgColor="var(--color-info)"
          title={t('dashboard.overview.messages')}
          value={overviewLoading ? '-' : overview?.messages.today.toString() || '0'}
          subtitle={t('dashboard.overview.messagesYesterday')}
          trend={overview?.messages.trend}
          trendLabel={t('dashboard.overview.messagesYesterday')}
          loading={overviewLoading}
        />
        <StatCard
          icon={Bot}
          iconBgColor="var(--color-primary)"
          title={t('dashboard.overview.activeAgents')}
          value={overviewLoading ? '-' : `${overview?.agents.active || 0}/${overview?.agents.total || 0}`}
          subtitle={t('dashboard.overview.agentsRatio')}
          trend={overview?.agents.trend}
          trendLabel={t('dashboard.overview.messagesYesterday')}
          loading={overviewLoading}
        />
        <StatCard
          icon={Activity}
          iconBgColor="var(--color-warning)"
          title={t('dashboard.overview.channels')}
          value={overviewLoading ? '-' : `${overview?.channels.connected || 0}/${overview?.channels.total || 0}`}
          subtitle={t('dashboard.overview.channelsRatio')}
          trend={overview?.channels.trend}
          trendLabel={t('dashboard.overview.messagesYesterday')}
          loading={overviewLoading}
        />
      </div>

      {/* 区域 2: 系统资源监控 */}
      <Card title={t('dashboard.system.title')}>
        {metricsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
            <div className="flex flex-col items-center">
              <Skeleton variant="circle" width={128} height={128} />
              <Skeleton variant="text" width="80px" className="mt-4" />
            </div>
            <div className="flex flex-col items-center">
              <Skeleton variant="circle" width={128} height={128} />
              <Skeleton variant="text" width="80px" className="mt-4" />
            </div>
            <div className="flex flex-col items-center">
              <Skeleton variant="circle" width={128} height={128} />
              <Skeleton variant="text" width="80px" className="mt-4" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
            <RingChart
              percentage={metrics?.cpu.usagePercent || 0}
              label={t('dashboard.system.cpu')}
              subLabel={`${metrics?.cpu.count || 0} ${t('dashboard.system.cores')}`}
              icon={Cpu}
            />
            <RingChart
              percentage={metrics?.memory.usagePercent || 0}
              label={t('dashboard.system.memory')}
              subLabel={`${metrics?.memory.usedFormatted || '0'} / ${metrics?.memory.totalFormatted || '0'}`}
              icon={MemoryStick}
            />
            <RingChart
              percentage={metrics?.disk?.usagePercent || 0}
              label={t('dashboard.system.disk')}
              subLabel={metrics?.disk ? `${metrics.disk.used} / ${metrics.disk.size}` : 'N/A'}
              icon={HardDrive}
            />
          </div>
        )}
      </Card>

      {/* 区域 3: 左右两栏 - 最近会话 + 快速操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左栏：最近会话 */}
        <Card
          title={t('dashboard.sessions.title')}
          description={t('dashboard.sessions.description')}
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/chat')}
              className="text-[var(--color-primary)]"
            >
              {t('common.viewAll')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          }
        >
          <div className="space-y-3">
            {sessionsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton variant="circle" width={40} height={40} />
                  <div className="flex-1">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="60%" className="mt-1" />
                  </div>
                </div>
              ))
            ) : sessions && sessions.length > 0 ? (
              sessions.map((session) => {
                const ChannelIcon = channelIcons[session.channelType] || MessageSquare;
                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-primary-light)] cursor-pointer transition-colors"
                    onClick={() => navigate('/chat')}
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                      <ChannelIcon className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--color-text-primary)] truncate">
                          {session.userName}
                        </span>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          · {session.channelName}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] truncate">
                        {session.lastMessage}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {formatTimeAgo(session.lastMessageTime, t)}
                      </p>
                      {session.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 mt-1 text-xs font-medium text-white bg-[var(--color-primary)] rounded-full">
                          {session.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                {t('dashboard.sessions.noSessions')}
              </div>
            )}
          </div>
        </Card>

        {/* 右栏：快速操作 */}
        <Card title={t('dashboard.quickActions.title')} description={t('dashboard.quickActions.description')}>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleRestartGateway}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <RefreshCw className="w-6 h-6" />
              <span>{t('dashboard.quickActions.restartGateway')}</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleOpenChat}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <MessageCircle className="w-6 h-6" />
              <span>{t('dashboard.quickActions.openChat')}</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleViewLogs}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <FileText className="w-6 h-6" />
              <span>{t('dashboard.quickActions.viewLogs')}</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleCheckUpdate}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Download className="w-6 h-6" />
              <span>{t('dashboard.quickActions.checkUpdate')}</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* 区域 4: 消息趋势图表 */}
      <Card title={t('dashboard.trend.title')} description={t('dashboard.trend.description')}>
        {trendLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                />
                <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'var(--color-text-primary)' }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                  formatter={(value: number) => [`${value}`, t('dashboard.trend.messages')]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('zh-CN', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    });
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMessages)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
