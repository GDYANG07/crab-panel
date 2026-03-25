import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface GatewayMessage {
  id: string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
}

export class GatewayClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private reconnectInterval = 5000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageId = 0;
  private pendingRequests = new Map<string, PendingRequest>();
  private requestTimeout = 30000;
  private _status: ConnectionStatus = 'disconnected';
  private _version: string | null = null;
  private _mockMode = false;
  private intentionalClose = false;

  constructor(url?: string, token?: string) {
    super();
    this.url = url || process.env.OPENCLAW_GATEWAY_URL || 'ws://localhost:18789';
    this.token = token || process.env.OPENCLAW_GATEWAY_TOKEN || '';
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  get version(): string | null {
    return this._version;
  }

  get isMockMode(): boolean {
    return this._mockMode;
  }

  get isConnected(): boolean {
    return this._status === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.intentionalClose = false;
    this._status = 'connecting';
    this.emit('statusChange', this._status);

    try {
      console.log(`[Gateway] Connecting to ${this.url}...`);

      const headers: Record<string, string> = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      this.ws = new WebSocket(this.url, { headers });

      this.ws.on('open', () => {
        console.log('[Gateway] Connected successfully');
        this._status = 'connected';
        this._mockMode = false;
        this.emit('statusChange', this._status);
        this.emit('connected');

        // 获取 Gateway 版本信息
        this.call('system.getVersion', {}).then((result: unknown) => {
          const versionResult = result as { version?: string };
          if (versionResult?.version) {
            this._version = versionResult.version;
            console.log(`[Gateway] Version: ${this._version}`);
          }
        }).catch(() => {
          // 忽略版本获取错误
        });
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        try {
          const message = JSON.parse(data.toString()) as GatewayMessage;
          this.handleMessage(message);
        } catch (err) {
          console.error('[Gateway] Failed to parse message:', err);
        }
      });

      this.ws.on('error', (error: Error) => {
        console.error('[Gateway] WebSocket error:', error.message);
        this._status = 'error';
        this.emit('statusChange', this._status);
        this.emit('error', error);
      });

      this.ws.on('close', () => {
        console.log('[Gateway] Connection closed');
        this._status = 'disconnected';
        this.ws = null;
        this.emit('statusChange', this._status);
        this.emit('disconnected');

        // 清理未完成的请求
        this.pendingRequests.forEach((req) => {
          req.reject(new Error('Connection closed'));
        });
        this.pendingRequests.clear();

        // 自动重连
        if (!this.intentionalClose) {
          this.scheduleReconnect();
        }
      });
    } catch (error) {
      console.error('[Gateway] Failed to connect:', error);
      this._status = 'error';
      this.emit('statusChange', this._status);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    console.log(`[Gateway] Reconnecting in ${this.reconnectInterval / 1000}s...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
  }

  disconnect(): void {
    this.intentionalClose = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this._status = 'disconnected';
    this.emit('statusChange', this._status);
  }

  private handleMessage(message: GatewayMessage): void {
    // 处理响应
    if (message.id && this.pendingRequests.has(message.id)) {
      const request = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);
      clearTimeout(request.timer);

      if (message.error) {
        request.reject(new Error(message.error.message));
      } else {
        request.resolve(message.result);
      }
    }

    // 发射消息事件供订阅者使用
    this.emit('message', message);
  }

  async call(method: string, params: unknown): Promise<unknown> {
    if (this._mockMode) {
      return this.mockResponse(method, params);
    }

    if (!this.isConnected) {
      // 如果未连接，尝试启用 Mock 模式
      console.log('[Gateway] Not connected, switching to mock mode');
      this._mockMode = true;
      this._status = 'connected';
      this.emit('statusChange', this._status);
      return this.mockResponse(method, params);
    }

    const id = `${Date.now()}-${++this.messageId}`;
    const message: GatewayMessage = { id, method, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }, this.requestTimeout);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.ws!.send(JSON.stringify(message));
    });
  }

  sendRaw(data: string | object): void {
    if (!this.isConnected) {
      throw new Error('Gateway not connected');
    }
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws!.send(message);
  }

  private mockResponse(method: string, params: unknown): Promise<unknown> {
    console.log(`[Gateway/Mock] ${method}`, params);

    // 模拟响应数据
    const mocks: Record<string, unknown> = {
      'system.getVersion': { version: '0.0.0-mock', mock: true },
      'config.get': {
        gateway: { host: '0.0.0.0', port: 18789 },
        agents: {},
        skills: [],
        mock: true,
      },
      'config.set': { success: true },
      'agents.list': {
        agents: [
          { id: 'mock-agent-1', name: 'Mock Agent', status: 'idle', type: 'assistant' },
        ],
      },
      'agents.get': { id: 'mock-agent-1', name: 'Mock Agent', status: 'idle', type: 'assistant' },
      'agents.create': { success: true },
      'agents.update': { success: true },
      'agents.delete': { success: true },
      'sessions.list': {
        sessions: [
          {
            id: 'mock-session-1',
            channel: { type: 'web', name: 'Web' },
            user: { name: '访客' },
            lastMessage: { content: '你好，请问能帮我写一段代码吗？', timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
            unreadCount: 0,
          },
          {
            id: 'mock-session-2',
            channel: { type: 'slack', name: 'Slack' },
            user: { name: '张三' },
            lastMessage: { content: '帮我查一下今天的天气怎么样？', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
            unreadCount: 2,
          },
          {
            id: 'mock-session-3',
            channel: { type: 'discord', name: 'Discord' },
            user: { name: '李四' },
            lastMessage: { content: '这个任务已经处理完了', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
            unreadCount: 0,
          },
        ],
      },
      'channels.list': { channels: [], mock: true },
      'channels.create': { success: true, mock: true },
      'channels.update': { success: true, mock: true },
      'channels.delete': { success: true, mock: true },
      'channels.test': { success: true, message: 'Connection test passed', mock: true },
      'skills.list': { skills: [], mock: true },
      'skills.installed': { skills: [], mock: true },
      'skills.install': { success: true, mock: true },
      'skills.uninstall': { success: true, mock: true },
      'skills.configure': { success: true, mock: true },
    };

    const result = mocks[method] || { mock: true, method, params };
    return Promise.resolve(result);
  }

  enableMockMode(): void {
    this._mockMode = true;
    this._status = 'connected';
    this.emit('statusChange', this._status);
    console.log('[Gateway] Mock mode enabled');
  }

  disableMockMode(): void {
    this._mockMode = false;
    this._status = 'disconnected';
    this.emit('statusChange', this._status);
    this.connect();
  }
}

// 单例实例
let globalClient: GatewayClient | null = null;

export function getGatewayClient(url?: string, token?: string): GatewayClient {
  if (!globalClient) {
    globalClient = new GatewayClient(url, token);
  }
  return globalClient;
}

export function setGatewayClient(client: GatewayClient): void {
  globalClient = client;
}
