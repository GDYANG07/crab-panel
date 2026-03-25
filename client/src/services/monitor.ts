const API_BASE = '/api/system';

// 系统指标类型
export interface SystemMetrics {
  timestamp: string;
  cpu: {
    count: number;
    model: string;
    usagePercent: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    totalFormatted: string;
    used: number;
    usedFormatted: string;
    free: number;
    freeFormatted: string;
    usagePercent: number;
  };
  disk: {
    filesystem: string;
    size: string;
    used: string;
    available: string;
    usagePercent: number;
    mounted: string;
  } | null;
  network: {
    interfaces: number;
    rx: number;
    tx: number;
  };
  system: {
    platform: string;
    hostname: string;
    uptime: number;
    uptimeFormatted: string;
  };
}

// 历史指标数据
export interface MetricsHistory {
  cpu: Array<{ time: string; value: number }>;
  memory: Array<{ time: string; value: number }>;
  diskIO: Array<{ time: string; read: number; write: number }>;
  network: Array<{ time: string; in: number; out: number }>;
}

// 日志条目
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
}

// 版本信息
export interface VersionInfo {
  crabpanel: {
    version: string;
    node: string;
    platform: string;
  };
  openclaw: {
    installed: boolean;
    version: string;
  };
}

// 更新信息
export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string[];
  downloadUrl: string | null;
}

// 获取当前系统指标
export async function getSystemMetrics(): Promise<SystemMetrics> {
  const res = await fetch(`${API_BASE}/metrics`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch metrics');
  }

  return data;
}

// 获取历史指标数据
export async function getMetricsHistory(): Promise<MetricsHistory> {
  const res = await fetch(`${API_BASE}/metrics/history`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch metrics history');
  }

  return data.data;
}

// 获取日志
export async function getLogs(
  level?: string,
  limit: number = 100,
  search?: string
): Promise<LogEntry[]> {
  const params = new URLSearchParams();
  if (level && level !== 'ALL') params.append('level', level);
  params.append('limit', limit.toString());
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/logs?${params.toString()}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch logs');
  }

  return data.logs;
}

// 获取版本信息
export async function getVersions(): Promise<VersionInfo> {
  const res = await fetch(`${API_BASE}/versions`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch versions');
  }

  return data;
}

// 检查更新
export async function checkUpdate(): Promise<UpdateInfo> {
  const res = await fetch(`${API_BASE}/update/check`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to check for updates');
  }

  return data;
}

// 执行更新（返回 EventSource 用于流式输出）
export function startUpdate(): EventSource {
  return new EventSource(`${API_BASE}/update`);
}

// WebSocket 日志连接
export function connectLogWebSocket(
  onMessage: (data: { type: string; logs?: LogEntry[] }) => void,
  onError?: (error: Event) => void
): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}/ws/logs`);

  ws.onopen = () => {
    console.log('[WS] Connected to logs');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      // 忽略解析错误
    }
  };

  ws.onerror = (error) => {
    console.error('[WS] Error:', error);
    onError?.(error);
  };

  ws.onclose = () => {
    console.log('[WS] Disconnected from logs');
  };

  return ws;
}

// 发送日志筛选请求
export function filterLogs(ws: WebSocket, level: string, search?: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'filter', level, search }));
  }
}

// 导出日志为文件
export function exportLogs(logs: LogEntry[]) {
  const content = logs
    .map(
      (log) =>
        `[${new Date(log.timestamp).toLocaleString()}] [${log.level}] [${log.source}] ${log.message}`
    )
    .join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crabpanel-logs-${new Date().toISOString().slice(0, 10)}.log`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
