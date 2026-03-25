import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api';

// 状态概览数据类型
export interface DashboardOverview {
  gateway: {
    status: 'running' | 'stopped' | 'error';
    uptime: string;
    uptimeSeconds: number;
  };
  messages: {
    today: number;
    yesterday: number;
    trend: number; // 百分比
  };
  agents: {
    active: number;
    total: number;
    trend: number;
  };
  channels: {
    connected: number;
    total: number;
    trend: number;
  };
}

// 系统资源数据类型
export interface SystemMetrics {
  cpu: {
    usagePercent: number;
    count: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    usagePercent: number;
    totalFormatted: string;
    usedFormatted: string;
  };
  disk: {
    size: string;
    used: string;
    usagePercent: number;
  } | null;
}

// 会话数据类型
export interface Session {
  id: string;
  channelType: string;
  channelName: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// 消息趋势数据类型
export interface MessageTrend {
  date: string;
  count: number;
}

const generateMockOverview = (): DashboardOverview => ({
  gateway: {
    status: 'running',
    uptime: '3天 12小时',
    uptimeSeconds: 302400,
  },
  messages: {
    today: 1284,
    yesterday: 1156,
    trend: 11.1,
  },
  agents: {
    active: 5,
    total: 8,
    trend: 25,
  },
  channels: {
    connected: 4,
    total: 6,
    trend: 0,
  },
});

const generateMockSessions = (): Session[] => [
  {
    id: '1',
    channelType: 'slack',
    channelName: 'Slack',
    userName: '张三',
    lastMessage: '帮我查一下今天的天气怎么样？',
    lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString(),
    unreadCount: 2,
  },
  {
    id: '2',
    channelType: 'discord',
    channelName: 'Discord',
    userName: '李四',
    lastMessage: '这个任务已经处理完了',
    lastMessageTime: new Date(Date.now() - 30 * 60000).toISOString(),
    unreadCount: 0,
  },
  {
    id: '3',
    channelType: 'email',
    channelName: '邮件',
    userName: '王五',
    lastMessage: '请帮我总结一下这份报告',
    lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    unreadCount: 1,
  },
  {
    id: '4',
    channelType: 'telegram',
    channelName: 'Telegram',
    userName: '赵六',
    lastMessage: '收到，谢谢！',
    lastMessageTime: new Date(Date.now() - 5 * 3600000).toISOString(),
    unreadCount: 0,
  },
  {
    id: '5',
    channelType: 'web',
    channelName: 'Web',
    userName: '访客',
    lastMessage: '你好，请问能帮我写一段代码吗？',
    lastMessageTime: new Date(Date.now() - 24 * 3600000).toISOString(),
    unreadCount: 0,
  },
];

const generateMockTrend = (): MessageTrend[] => {
  const data: MessageTrend[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 1000) + 500,
    });
  }
  return data;
};

// 获取仪表盘概览数据
const fetchOverview = async (): Promise<DashboardOverview> => {
  const res = await fetch(`${API_BASE}/health`);
  const data = await res.json();

  // 如果是 Mock 模式，返回 Mock 数据
  if (data.gateway?.mockMode) {
    return generateMockOverview();
  }

  // 真实数据 - 从各个 API 聚合
  const [agentsRes, _sessionsRes] = await Promise.all([
    fetch(`${API_BASE}/gateway/agents`),
    fetch(`${API_BASE}/gateway/sessions`),
  ]);

  const agentsData = await agentsRes.json();
  // sessions 数据暂不使用，但保留 API 调用以备将来使用
  await _sessionsRes.json();

  return {
    gateway: {
      status: data.gateway?.connected ? 'running' : 'stopped',
      uptime: '未知',
      uptimeSeconds: 0,
    },
    messages: {
      today: Math.floor(Math.random() * 1000) + 500, // 临时
      yesterday: Math.floor(Math.random() * 1000) + 500,
      trend: 0,
    },
    agents: {
      active: agentsData.agents?.filter((a: { status?: string }) => a.status === 'active').length || 0,
      total: agentsData.agents?.length || 0,
      trend: 0,
    },
    channels: {
      connected: 0, // 需要 channel API
      total: 0,
      trend: 0,
    },
  };
};

// 获取系统指标数据
const fetchMetrics = async (): Promise<SystemMetrics> => {
  const res = await fetch(`${API_BASE}/system/metrics`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch metrics');
  }

  return {
    cpu: {
      usagePercent: data.cpu.usagePercent,
      count: data.cpu.count,
      model: data.cpu.model,
    },
    memory: {
      total: data.memory.total,
      used: data.memory.used,
      usagePercent: data.memory.usagePercent,
      totalFormatted: data.memory.totalFormatted,
      usedFormatted: data.memory.usedFormatted,
    },
    disk: data.disk ? {
      size: data.disk.size,
      used: data.disk.used,
      usagePercent: data.disk.usagePercent,
    } : null,
  };
};

// 获取最近会话
const fetchRecentSessions = async (): Promise<Session[]> => {
  const res = await fetch(`${API_BASE}/gateway/sessions`);
  const data = await res.json();

  // 转换数据格式（兼容真实数据和 Mock 数据）
  const sessions = (data.sessions || []).slice(0, 5).map((s: {
    id: string;
    channel?: { type?: string; name?: string };
    channelType?: string;
    channelName?: string;
    user?: { name?: string };
    userName?: string;
    lastMessage?: { content?: string; timestamp?: string };
    lastMessageContent?: string;
    lastMessageTime?: string;
    unreadCount?: number;
  }) => ({
    id: s.id,
    channelType: s.channel?.type || s.channelType || 'unknown',
    channelName: s.channel?.name || s.channelName || '未知通道',
    userName: s.user?.name || s.userName || '未知用户',
    lastMessage: s.lastMessage?.content || s.lastMessageContent || '无消息',
    lastMessageTime: s.lastMessage?.timestamp || s.lastMessageTime || new Date().toISOString(),
    unreadCount: s.unreadCount || 0,
  }));

  // 如果返回的 sessions 为空且是 Mock 模式，使用生成的 Mock 数据
  if (sessions.length === 0 && data.mockMode) {
    return generateMockSessions();
  }

  return sessions;
};

// 获取消息趋势
const fetchMessageTrend = async (): Promise<MessageTrend[]> => {
  // 这里需要后端提供专门的 API，目前先用 Mock
  return generateMockTrend();
};

// Dashboard Hooks
export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: fetchOverview,
    refetchInterval: 30000, // 30 秒刷新一次
  });
}

export function useSystemMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 10000, // 10 秒刷新一次
  });
}

export function useRecentSessions() {
  return useQuery({
    queryKey: ['dashboard', 'sessions'],
    queryFn: fetchRecentSessions,
    refetchInterval: 15000, // 15 秒刷新一次
  });
}

export function useMessageTrend() {
  return useQuery({
    queryKey: ['dashboard', 'trend'],
    queryFn: fetchMessageTrend,
    refetchInterval: 60000, // 1 分钟刷新一次
  });
}
