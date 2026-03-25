const API_BASE = '/api';

// OpenClaw 配置类型定义
export interface OpenClawConfig {
  // 模型配置
  model?: {
    provider?: 'anthropic' | 'openai' | 'deepseek' | 'ollama' | 'openai-compatible';
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    fallbackModel?: string;
  };
  // Gateway 配置
  gateway?: {
    port?: number;
    auth?: 'token' | 'password' | 'none';
    token?: string;
    bind?: string;
  };
  // Agent 默认配置
  agentDefaults?: {
    tools?: {
      profile?: 'full' | 'messaging' | 'custom';
    };
    requireApproval?: boolean;
    browserControl?: boolean;
    sandboxMode?: boolean;
  };
  // 通知与安全
  security?: {
    deviceAuth?: boolean;
    allowTailscale?: boolean;
  };
  // 其他可能的配置
  [key: string]: unknown;
}

// 测试连接响应
export interface TestConnectionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// 获取配置
export async function getConfig(): Promise<OpenClawConfig> {
  const res = await fetch(`${API_BASE}/gateway/config`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch config');
  }

  return data.config || {};
}

// 保存配置
export async function saveConfig(config: OpenClawConfig): Promise<void> {
  const res = await fetch(`${API_BASE}/gateway/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ config }),
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to save config');
  }
}

// 测试 API 连接
export async function testConnection(
  provider: string,
  apiKey: string,
  baseUrl?: string,
  model?: string
): Promise<TestConnectionResponse> {
  try {
    // 构建测试命令
    const testCommand = `openclaw config test-model`;
    const args: string[] = [];

    if (provider) args.push('--provider', provider);
    if (apiKey) args.push('--api-key', apiKey);
    if (baseUrl) args.push('--base-url', baseUrl);
    if (model) args.push('--model', model);

    const res = await fetch(`${API_BASE}/cli/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: testCommand,
        args,
      }),
    });

    const data = await res.json();

    if (data.success) {
      return {
        success: true,
        message: '连接测试成功',
      };
    } else {
      return {
        success: false,
        error: data.stderr || data.error || '连接测试失败',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '测试连接时发生错误',
    };
  }
}

// 重启 Gateway
export async function restartGateway(): Promise<void> {
  const res = await fetch(`${API_BASE}/cli/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      command: 'openclaw gateway restart',
    }),
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || data.stderr || '重启失败');
  }
}

// 获取配置为 JSON 字符串
export function configToJson(config: OpenClawConfig): string {
  return JSON.stringify(config, null, 2);
}

// 解析 JSON 字符串为配置
export function jsonToConfig(json: string): OpenClawConfig {
  try {
    return JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON format');
  }
}
