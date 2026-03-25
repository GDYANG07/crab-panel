import { create } from 'zustand';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface GatewayConfig {
  gateway: {
    host: string;
    port: number;
  };
  agents: Record<string, unknown>;
  skills: string[];
  [key: string]: unknown;
}

interface Agent {
  id: string;
  name: string;
  status: string;
  type: string;
  [key: string]: unknown;
}

interface Session {
  id: string;
  agentId: string;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

interface GatewayStatus {
  status: ConnectionStatus;
  connected: boolean;
  mockMode: boolean;
  version: string | null;
  url: string;
  timestamp: string;
}

interface GatewayState {
  // 连接状态
  status: ConnectionStatus;
  connected: boolean;
  mockMode: boolean;
  version: string | null;
  gatewayUrl: string;
  lastUpdated: string | null;

  // 数据
  config: GatewayConfig | null;
  agents: Agent[];
  sessions: Session[];

  // 加载状态
  isLoadingStatus: boolean;
  isLoadingConfig: boolean;
  isLoadingAgents: boolean;
  isLoadingSessions: boolean;

  // 错误
  error: string | null;

  // 轮询控制
  pollingInterval: number | null;

  // Actions
  fetchStatus: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  fetchAgents: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  updateConfig: (config: Partial<GatewayConfig>) => Promise<boolean>;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
  refreshAll: () => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useGatewayStore = create<GatewayState>((set, get) => ({
  // 初始状态
  status: 'disconnected',
  connected: false,
  mockMode: false,
  version: null,
  gatewayUrl: '',
  lastUpdated: null,

  config: null,
  agents: [],
  sessions: [],

  isLoadingStatus: false,
  isLoadingConfig: false,
  isLoadingAgents: false,
  isLoadingSessions: false,

  error: null,
  pollingInterval: null,

  // 获取状态
  fetchStatus: async () => {
    set({ isLoadingStatus: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/gateway/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: GatewayStatus = await response.json();

      set({
        status: data.status,
        connected: data.connected,
        mockMode: data.mockMode,
        version: data.version,
        gatewayUrl: data.url,
        lastUpdated: data.timestamp,
        isLoadingStatus: false,
      });
    } catch (err) {
      set({
        status: 'error',
        connected: false,
        error: err instanceof Error ? err.message : 'Failed to fetch status',
        isLoadingStatus: false,
      });
    }
  },

  // 获取配置
  fetchConfig: async () => {
    set({ isLoadingConfig: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/gateway/config`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        set({
          config: data.config,
          mockMode: data.mockMode,
          isLoadingConfig: false,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch config');
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch config',
        isLoadingConfig: false,
      });
    }
  },

  // 获取 Agent 列表
  fetchAgents: async () => {
    set({ isLoadingAgents: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/gateway/agents`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        set({
          agents: data.agents || [],
          mockMode: data.mockMode,
          isLoadingAgents: false,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch agents');
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch agents',
        isLoadingAgents: false,
      });
    }
  },

  // 获取会话列表
  fetchSessions: async () => {
    set({ isLoadingSessions: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/gateway/sessions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        set({
          sessions: data.sessions || [],
          mockMode: data.mockMode,
          isLoadingSessions: false,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch sessions',
        isLoadingSessions: false,
      });
    }
  },

  // 更新配置
  updateConfig: async (configUpdate: Partial<GatewayConfig>) => {
    set({ isLoadingConfig: true, error: null });
    try {
      const currentConfig = get().config || {};
      const newConfig = { ...currentConfig, ...configUpdate };

      const response = await fetch(`${API_BASE}/api/gateway/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: newConfig }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        set({
          config: newConfig as GatewayConfig,
          mockMode: data.mockMode,
          isLoadingConfig: false,
        });
        return true;
      } else {
        throw new Error(data.error || 'Failed to update config');
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update config',
        isLoadingConfig: false,
      });
      return false;
    }
  },

  // 开始轮询
  startPolling: (interval = 10000) => {
    // 先停止现有的轮询
    get().stopPolling();

    // 立即获取一次状态
    get().fetchStatus();

    // 设置轮询
    const intervalId = window.setInterval(() => {
      get().fetchStatus();
    }, interval);

    set({ pollingInterval: intervalId });
  },

  // 停止轮询
  stopPolling: () => {
    const currentInterval = get().pollingInterval;
    if (currentInterval) {
      window.clearInterval(currentInterval);
      set({ pollingInterval: null });
    }
  },

  // 刷新所有数据
  refreshAll: async () => {
    await Promise.all([
      get().fetchStatus(),
      get().fetchConfig(),
      get().fetchAgents(),
      get().fetchSessions(),
    ]);
  },
}));
