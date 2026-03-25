import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ui';

const API_BASE = '/api';

// 通道类型定义
export type ChannelType =
  | 'telegram'
  | 'dingtalk'
  | 'feishu'
  | 'wecom'
  | 'whatsapp'
  | 'discord'
  | 'slack'
  | 'signal'
  | 'imessage'
  | 'irc'
  | 'matrix'
  | 'qq';

// 通道分组
export const channelGroups = {
  domestic: ['dingtalk', 'feishu', 'wecom', 'qq'] as ChannelType[],
  international: ['telegram', 'whatsapp', 'discord', 'slack', 'signal'] as ChannelType[],
  other: ['imessage', 'irc', 'matrix'] as ChannelType[],
};

export const channelGroupNames: Record<keyof typeof channelGroups, string> = {
  domestic: '国内通道',
  international: '国际通道',
  other: '其他',
};

// 通道配置定义
export interface ChannelConfig {
  // Telegram
  botToken?: string;
  webhookUrl?: string;
  // 钉钉
  appKey?: string;
  appSecret?: string;
  robotWebhook?: string;
  // 飞书
  appId?: string;
  // 企业微信
  corpId?: string;
  agentId?: string;
  secret?: string;
  // Discord
  guildId?: string;
  // WhatsApp
  phoneNumber?: string;
  apiKey?: string;
  // 通用
  enabled?: boolean;
  messageFormat?: 'text' | 'markdown' | 'html';
  [key: string]: string | boolean | undefined;
}

// 通道数据类型
export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description: string;
  connected: boolean;
  messageCount: number;
  config?: ChannelConfig;
  status: 'connected' | 'disconnected' | 'error';
  lastError?: string;
}

// 创建通道请求
export interface CreateChannelRequest {
  type: ChannelType;
  name: string;
  config: ChannelConfig;
}

// 更新通道请求
export interface UpdateChannelRequest {
  name?: string;
  config?: ChannelConfig;
  enabled?: boolean;
}

// 通道元数据
export const channelMetadata: Record<ChannelType, { name: string; description: string; icon: string }> = {
  telegram: {
    name: 'Telegram',
    description: '连接 Telegram Bot',
    icon: '📱',
  },
  dingtalk: {
    name: '钉钉',
    description: '连接钉钉机器人',
    icon: '💼',
  },
  feishu: {
    name: '飞书',
    description: '连接飞书机器人',
    icon: '📋',
  },
  wecom: {
    name: '企业微信',
    description: '连接企业微信应用',
    icon: '💬',
  },
  whatsapp: {
    name: 'WhatsApp',
    description: '连接 WhatsApp Business API',
    icon: '💚',
  },
  discord: {
    name: 'Discord',
    description: '连接 Discord Bot',
    icon: '🎮',
  },
  slack: {
    name: 'Slack',
    description: '连接 Slack App',
    icon: '💬',
  },
  signal: {
    name: 'Signal',
    description: '连接 Signal 消息服务',
    icon: '🔒',
  },
  imessage: {
    name: 'iMessage',
    description: '连接 iMessage (macOS only)',
    icon: '💙',
  },
  irc: {
    name: 'IRC',
    description: '连接 IRC 服务器',
    icon: '💻',
  },
  matrix: {
    name: 'Matrix',
    description: '连接 Matrix 服务器',
    icon: '🔷',
  },
  qq: {
    name: 'QQ',
    description: '连接 QQ Bot',
    icon: '🐧',
  },
};

// Mock 通道数据
const mockChannels: Channel[] = [
  {
    id: 'telegram-1',
    name: 'Telegram Bot',
    type: 'telegram',
    description: '主 Telegram 机器人',
    connected: true,
    messageCount: 1256,
    status: 'connected',
    config: {
      botToken: '7***:AA***',
      webhookUrl: 'https://api.example.com/webhook/telegram',
      enabled: true,
      messageFormat: 'markdown',
    },
  },
  {
    id: 'dingtalk-1',
    name: '钉钉工作通知',
    type: 'dingtalk',
    description: '企业内部通知机器人',
    connected: true,
    messageCount: 892,
    status: 'connected',
    config: {
      appKey: 'ding***',
      robotWebhook: 'https://oapi.dingtalk.com/robot/send',
      enabled: true,
      messageFormat: 'text',
    },
  },
  {
    id: 'discord-1',
    name: 'Discord Server',
    type: 'discord',
    description: '社区 Discord 服务器',
    connected: false,
    messageCount: 0,
    status: 'disconnected',
    config: {
      enabled: false,
      messageFormat: 'markdown',
    },
  },
  {
    id: 'slack-1',
    name: 'Slack Workspace',
    type: 'slack',
    description: '团队 Slack 工作区',
    connected: true,
    messageCount: 567,
    status: 'connected',
    config: {
      enabled: true,
      messageFormat: 'markdown',
    },
  },
];

// 获取通道列表
const fetchChannels = async (): Promise<Channel[]> => {
  const res = await fetch(`${API_BASE}/channels`);
  const data = await res.json();

  if (data.mockMode || (!data.channels || data.channels.length === 0)) {
    return mockChannels;
  }

  return data.channels || [];
};

// 创建通道
const createChannelApi = async (channel: CreateChannelRequest): Promise<Channel> => {
  const res = await fetch(`${API_BASE}/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(channel),
  });

  const data = await res.json();

  if (!data.success && !data.mockMode) {
    throw new Error(data.error || 'Failed to create channel');
  }

  return data.channel || { ...channel, id: Date.now().toString(), messageCount: 0, status: 'disconnected' };
};

// 更新通道
const updateChannelApi = async (id: string, updates: UpdateChannelRequest): Promise<Channel> => {
  const res = await fetch(`${API_BASE}/channels/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const data = await res.json();

  if (!data.success && !data.mockMode) {
    throw new Error(data.error || 'Failed to update channel');
  }

  return data.channel || { id, ...updates } as Channel;
};

// 删除通道
const deleteChannelApi = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/channels/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  const data = await res.json();

  if (!data.success && !data.mockMode) {
    throw new Error(data.error || 'Failed to delete channel');
  }
};

// 测试连接
const testChannelConnectionApi = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const res = await fetch(`${API_BASE}/channels/${encodeURIComponent(id)}/test`, {
    method: 'POST',
  });

  const data = await res.json();

  if (data.mockMode) {
    // Mock 模式：随机返回成功或失败
    const success = Math.random() > 0.3;
    return {
      success,
      message: success ? '连接测试成功' : '连接失败：无效的凭证',
    };
  }

  return {
    success: data.success,
    message: data.message,
  };
};

// Hooks
export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: fetchChannels,
    refetchInterval: 30000,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: createChannelApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      showToast('通道创建成功', 'success');
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '创建失败', 'error');
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateChannelRequest }) =>
      updateChannelApi(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      showToast('通道更新成功', 'success');
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '更新失败', 'error');
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: deleteChannelApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      showToast('通道删除成功', 'success');
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '删除失败', 'error');
    },
  });
}

export function useTestChannelConnection() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: testChannelConnectionApi,
    onSuccess: (result) => {
      if (result.success) {
        showToast(result.message || '连接测试成功', 'success');
      } else {
        showToast(result.message || '连接测试失败', 'error');
      }
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '测试失败', 'error');
    },
  });
}
