import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  useQuery,
} from '@tanstack/react-query';
import {
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Terminal,
  Package,
  RefreshCw,
  Download,
  Play,
  Pause,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import {
  Button,
  Select,
  Badge,
  useToast,
  Spinner,
  Card,
} from '../components/ui';
import {
  getSystemMetrics,
  getMetricsHistory,
  getVersions,
  checkUpdate,
  connectLogWebSocket,
  filterLogs,
  exportLogs,
  type LogEntry,
  type SystemMetrics,
  type MetricsHistory,
} from '../services/monitor';

// Tab 类型
type TabType = 'resources' | 'logs' | 'versions';

// 日志级别配置
const logLevelConfig = {
  INFO: { color: 'text-green-500', bg: 'bg-green-500/10', icon: Info },
  WARN: { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle },
  ERROR: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
  DEBUG: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Info },
};

// 格式化时间
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-CN', { hour12: false });
}

// 资源监控 Tab
function ResourcesTab() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<MetricsHistory | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);

  // 获取历史数据
  const { data: initialHistory } = useQuery({
    queryKey: ['metricsHistory'],
    queryFn: getMetricsHistory,
    staleTime: Infinity,
  });

  // 获取当前指标
  const { data: metrics } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: getSystemMetrics,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (initialHistory) {
      setHistory(initialHistory);
    }
  }, [initialHistory]);

  useEffect(() => {
    if (metrics) {
      setCurrentMetrics(metrics);
      // 更新历史数据
      setHistory((prev) => {
        if (!prev) return prev;
        const now = new Date().toISOString();
        return {
          cpu: [...prev.cpu.slice(1), { time: now, value: metrics.cpu.usagePercent }],
          memory: [...prev.memory.slice(1), { time: now, value: metrics.memory.usagePercent }],
          diskIO: [
            ...prev.diskIO.slice(1),
            {
              time: now,
              read: Math.random() * 50 + 10,
              write: Math.random() * 30 + 5,
            },
          ],
          network: [
            ...prev.network.slice(1),
            {
              time: now,
              in: Math.random() * 100 + 50,
              out: Math.random() * 80 + 30,
            },
          ],
        };
      });
    }
  }, [metrics]);

  if (!history || !currentMetrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  // 图表配置
  const chartData = history.cpu.map((_, index) => ({
    time: formatTime(history.cpu[index].time),
    cpu: Math.round(history.cpu[index].value * 10) / 10,
    memory: Math.round(history.memory[index].value * 10) / 10,
    diskRead: Math.round(history.diskIO[index].read * 10) / 10,
    diskWrite: Math.round(history.diskIO[index].write * 10) / 10,
    netIn: Math.round(history.network[index].in * 10) / 10,
    netOut: Math.round(history.network[index].out * 10) / 10,
  }));

  return (
    <div className="space-y-6">
      {/* 指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[var(--color-primary)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">{t('monitor.cpu')}</span>
            </div>
            <Badge
              variant={currentMetrics.cpu.usagePercent > 80 ? 'danger' : 'default'}
            >
              {currentMetrics.cpu.usagePercent.toFixed(1)}%
            </Badge>
          </div>
          <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {currentMetrics.cpu.usagePercent.toFixed(1)}%
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            {currentMetrics.cpu.count} {t('monitor.cores')}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-5 h-5 text-[var(--color-primary)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('monitor.memory')}
              </span>
            </div>
            <Badge
              variant={currentMetrics.memory.usagePercent > 80 ? 'danger' : 'default'}
            >
              {currentMetrics.memory.usagePercent.toFixed(1)}%
            </Badge>
          </div>
          <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {currentMetrics.memory.usedFormatted}
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            / {currentMetrics.memory.totalFormatted}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[var(--color-primary)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">{t('monitor.disk')}</span>
            </div>
            <Badge
              variant={
                currentMetrics.disk && currentMetrics.disk.usagePercent > 80 ? 'danger' : 'default'
              }
            >
              {currentMetrics.disk ? `${currentMetrics.disk.usagePercent}%` : 'N/A'}
            </Badge>
          </div>
          <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {currentMetrics.disk?.used || 'N/A'}
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            / {currentMetrics.disk?.size || 'N/A'}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-[var(--color-primary)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('monitor.network')}
              </span>
            </div>
            <Badge variant="default">{currentMetrics.network.interfaces} IF</Badge>
          </div>
          <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {t('monitor.active')}
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            {currentMetrics.system.platform}
          </p>
        </Card>
      </div>

      {/* 图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU 图表 */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-4">
            {t('monitor.cpuTrend')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C96442" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C96442" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke="var(--color-text-secondary)"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="var(--color-text-secondary)"
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#C96442"
                  fillOpacity={1}
                  fill="url(#cpuGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 内存图表 */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-4">
            {t('monitor.memoryTrend')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke="var(--color-text-secondary)"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="var(--color-text-secondary)"
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stroke="#1D9E75"
                  fillOpacity={1}
                  fill="url(#memoryGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 磁盘 I/O 图表 */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-4">
            {t('monitor.diskIO')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke="var(--color-text-secondary)"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-secondary)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="diskRead"
                  stroke="#378ADD"
                  strokeWidth={2}
                  dot={false}
                  name={t('monitor.read')}
                />
                <Line
                  type="monotone"
                  dataKey="diskWrite"
                  stroke="#BA7517"
                  strokeWidth={2}
                  dot={false}
                  name={t('monitor.write')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 网络流量图表 */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-4">
            {t('monitor.networkTraffic')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke="var(--color-text-secondary)"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-secondary)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="netIn"
                  stroke="#1D9E75"
                  strokeWidth={2}
                  dot={false}
                  name={t('monitor.in')}
                />
                <Line
                  type="monotone"
                  dataKey="netOut"
                  stroke="#E24B4A"
                  strokeWidth={2}
                  dot={false}
                  name={t('monitor.out')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

// 日志查看器 Tab
function LogsTab() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // 建立 WebSocket 连接
  useEffect(() => {
    const ws = connectLogWebSocket(
      (data) => {
        if (data.type === 'initial') {
          setLogs(data.logs || []);
        } else if (data.type === 'logs' && !isPaused) {
          setLogs((prev) => [...prev, ...(data.logs || [])].slice(-1000));
        } else if (data.type === 'filtered') {
          setLogs(data.logs || []);
        }
      },
      () => {
        setIsConnected(false);
      }
    );

    ws.onopen = () => {
      setIsConnected(true);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [isPaused]);

  // 自动滚动到底部
  useEffect(() => {
    if (!isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  // 发送筛选请求
  useEffect(() => {
    if (wsRef.current && isConnected) {
      filterLogs(wsRef.current, levelFilter, searchQuery);
    }
  }, [levelFilter, searchQuery, isConnected]);

  // 清空日志
  const handleClear = () => {
    setLogs([]);
    showToast(t('monitor.logsCleared'), 'success');
  };

  // 导出日志
  const handleExport = () => {
    exportLogs(logs);
    showToast(t('monitor.logsExported'), 'success');
  };

  // 筛选后的日志
  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(query) ||
        log.source.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const levelOptions = [
    { value: 'ALL', label: t('monitor.allLevels') },
    { value: 'INFO', label: t('monitor.info') },
    { value: 'WARN', label: t('monitor.warn') },
    { value: 'ERROR', label: t('monitor.error') },
    { value: 'DEBUG', label: t('monitor.debug') },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Select
            value={levelFilter}
            onChange={setLevelFilter}
            options={levelOptions}
            className="w-32"
          />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder={t('monitor.searchLogs')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-64"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'success' : 'default'}>
            {isConnected ? t('monitor.connected') : t('monitor.disconnected')}
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? t('monitor.resume') : t('monitor.pause')}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleClear}>
            <Trash2 className="w-4 h-4" />
            {t('monitor.clear')}
          </Button>
          <Button variant="primary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
            {t('monitor.export')}
          </Button>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden flex flex-col">
        {/* 表头 */}
        <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700 text-xs font-mono text-gray-400">
          <span className="w-24 shrink-0">{t('monitor.time')}</span>
          <span className="w-16 shrink-0">{t('monitor.level')}</span>
          <span className="w-24 shrink-0">{t('monitor.source')}</span>
          <span className="flex-1">{t('monitor.message')}</span>
        </div>

        {/* 日志内容 */}
        <div className="flex-1 overflow-y-auto p-0 font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              {t('monitor.noLogs')}
            </div>
          ) : (
            filteredLogs.map((log) => {
              const config = logLevelConfig[log.level];
              const Icon = config.icon;
              return (
                <div
                  key={log.id}
                  className="flex items-start px-4 py-1.5 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50"
                >
                  <span className="w-24 shrink-0 text-gray-500 text-xs pt-0.5">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className="w-16 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                      <Icon className="w-3 h-3 mr-1" />
                      {log.level}
                    </span>
                  </span>
                  <span className="w-24 shrink-0 text-gray-400 text-xs pt-0.5">
                    {log.source}
                  </span>
                  <span className="flex-1 text-gray-300 break-all">{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}

// 版本与更新 Tab
function VersionsTab() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [updateOutput, setUpdateOutput] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  // 获取版本信息
  const { data: versions, isLoading: isVersionsLoading } = useQuery({
    queryKey: ['versions'],
    queryFn: getVersions,
  });

  // 检查更新
  const {
    data: updateInfo,
    isLoading: isCheckingUpdate,
    refetch: checkForUpdate,
  } = useQuery({
    queryKey: ['updateCheck'],
    queryFn: checkUpdate,
    enabled: false,
  });

  // 执行更新
  const handleUpdate = async () => {
    setIsUpdating(true);
    setShowOutput(true);
    setUpdateOutput([]);

    const eventSource = new EventSource('/api/system/update');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'progress') {
          setUpdateOutput((prev) => [...prev, data.message]);
        } else if (data.type === 'complete') {
          setUpdateOutput((prev) => [...prev, 'Update completed!']);
          eventSource.close();
          setIsUpdating(false);
          showToast(t('monitor.updateSuccess'), 'success');
        }
      } catch {
        // 忽略解析错误
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsUpdating(false);
      showToast(t('monitor.updateError'), 'error');
    };
  };

  return (
    <div className="space-y-6">
      {/* 版本信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
              <Package className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                CrabPanel
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('monitor.crabpanelVersion')}
              </p>
            </div>
          </div>
          {isVersionsLoading ? (
            <Spinner size="sm" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {t('monitor.version')}
                </span>
                <span className="font-mono text-[var(--color-text-primary)]">
                  {versions?.crabpanel.version}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Node.js
                </span>
                <span className="font-mono text-[var(--color-text-primary)]">
                  {versions?.crabpanel.node}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {t('monitor.platform')}
                </span>
                <span className="font-mono text-[var(--color-text-primary)]">
                  {versions?.crabpanel.platform}
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Terminal className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                OpenClaw
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('monitor.openclawVersion')}
              </p>
            </div>
          </div>
          {isVersionsLoading ? (
            <Spinner size="sm" />
          ) : versions?.openclaw.installed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {t('monitor.version')}
                </span>
                <span className="font-mono text-[var(--color-text-primary)]">
                  {versions?.openclaw.version}
                </span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">{t('monitor.installed')}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{t('monitor.notInstalled')}</span>
            </div>
          )}
        </Card>
      </div>

      {/* 更新检查 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {t('monitor.softwareUpdate')}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('monitor.updateDesc')}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => checkForUpdate()}
            loading={isCheckingUpdate}
            disabled={isUpdating}
          >
            <RefreshCw className="w-4 h-4" />
            {t('monitor.checkUpdate')}
          </Button>
        </div>

        {updateInfo && (
          <div className="mt-4">
            {updateInfo.hasUpdate ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      {t('monitor.newVersionAvailable')}
                    </p>
                    <p className="text-sm text-green-600">
                      {updateInfo.currentVersion} → {updateInfo.latestVersion}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleUpdate}
                    loading={isUpdating}
                  >
                    <Download className="w-4 h-4" />
                    {t('monitor.updateNow')}
                  </Button>
                </div>

                {updateInfo.releaseNotes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                      {t('monitor.releaseNotes')}
                    </h4>
                    <ul className="space-y-1">
                      {updateInfo.releaseNotes.map((note, index) => (
                        <li
                          key={index}
                          className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {t('monitor.upToDate')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 更新输出 */}
        {showOutput && updateOutput.length > 0 && (
          <div className="mt-4">
            <button
              className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-2"
              onClick={() => setShowOutput(!showOutput)}
            >
              {showOutput ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {t('monitor.updateOutput')}
            </button>
            {showOutput && (
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300 max-h-60 overflow-y-auto">
                {updateOutput.map((line, index) => (
                  <div key={index} className="py-0.5">
                    {line.startsWith('✓') ? (
                      <span className="text-green-400">{line}</span>
                    ) : line.startsWith('✗') ? (
                      <span className="text-red-400">{line}</span>
                    ) : (
                      line
                    )}
                  </div>
                ))}
                {isUpdating && (
                  <div className="py-0.5 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-gray-500">{t('monitor.processing')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export function Monitor() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('resources');

  const tabs = [
    {
      id: 'resources' as const,
      label: t('monitor.resources'),
      icon: Activity,
      component: ResourcesTab,
    },
    {
      id: 'logs' as const,
      label: t('monitor.logs'),
      icon: Terminal,
      component: LogsTab,
    },
    {
      id: 'versions' as const,
      label: t('monitor.versions'),
      icon: Package,
      component: VersionsTab,
    },
  ];

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component || ResourcesTab;

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
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

      {/* Tab 导航 */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="min-h-[500px]">
        <ActiveComponent />
      </div>
    </div>
  );
}
