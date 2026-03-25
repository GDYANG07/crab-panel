import { exec, spawn, type ChildProcess } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// OpenClaw 配置目录
const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const OPENCLAW_CONFIG_PATH = path.join(OPENCLAW_DIR, 'openclaw.json');

// 命令执行超时（毫秒）
const DEFAULT_TIMEOUT = 30000;
const STREAM_TIMEOUT = 120000;

// CLI 执行结果
export interface CLIResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
}

// 连接状态
export interface ConnectionStatus {
  installed: boolean;
  version: string | null;
  gatewayRunning: boolean;
  mockMode: boolean;
  lastChecked: string;
}

/**
 * CLI 桥接服务
 * 封装所有 openclaw CLI 调用，提供安全、统一的命令执行接口
 */
export class CliBridge {
  private static instance: CliBridge;
  private _status: ConnectionStatus = {
    installed: false,
    version: null,
    gatewayRunning: false,
    mockMode: true,
    lastChecked: new Date().toISOString(),
  };
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // 初始检查
    this.checkStatus();
    // 每 15 秒检查一次 Gateway 状态
    this.checkInterval = setInterval(() => {
      this.checkStatus();
    }, 15000);
  }

  static getInstance(): CliBridge {
    if (!CliBridge.instance) {
      CliBridge.instance = new CliBridge();
    }
    return CliBridge.instance;
  }

  get status(): ConnectionStatus {
    return { ...this._status };
  }

  get isMockMode(): boolean {
    return this._status.mockMode;
  }

  /**
   * 安全检查：只允许执行 openclaw 开头的命令
   */
  private validateCommand(command: string): boolean {
    const trimmed = command.trim();
    // 只允许 openclaw 开头的命令
    return trimmed.startsWith('openclaw');
  }

  /**
   * 转义命令参数，防止命令注入
   */
  private escapeArg(arg: string): string {
    // 如果包含空格或特殊字符，用引号包裹
    if (/[\s"'&|;<>$`\\]/.test(arg)) {
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
    return arg;
  }

  /**
   * 执行命令并返回输出
   */
  async exec(command: string, timeout = DEFAULT_TIMEOUT): Promise<CLIResult> {
    if (!this.validateCommand(command)) {
      return {
        success: false,
        stdout: '',
        stderr: 'Forbidden: Only openclaw commands are allowed',
        exitCode: 403,
        error: 'Command validation failed',
      };
    }

    try {
      console.log(`[CLI] Executing: ${command}`);
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        maxBuffer: 1024 * 1024, // 1MB 输出缓冲区
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
      };
    } catch (error) {
      // 命令执行失败（包括非零退出码）
      if (error && typeof error === 'object') {
        const execError = error as {
          stdout?: string;
          stderr?: string;
          code?: number;
          message: string;
        };

        return {
          success: execError.code === 0,
          stdout: execError.stdout?.trim() || '',
          stderr: execError.stderr?.trim() || '',
          exitCode: execError.code ?? 1,
          error: execError.message,
        };
      }

      return {
        success: false,
        stdout: '',
        stderr: '',
        exitCode: 1,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 执行命令并尝试解析 JSON 输出
   */
  async execJSON<T>(command: string, timeout = DEFAULT_TIMEOUT): Promise<{ success: boolean; data?: T; error?: string; raw?: string }> {
    const result = await this.exec(command, timeout);

    if (!result.success && result.exitCode !== 0) {
      return {
        success: false,
        error: result.error || result.stderr || 'Command failed',
        raw: result.stdout,
      };
    }

    // 如果输出为空，返回空对象
    if (!result.stdout) {
      return { success: true, data: {} as T };
    }

    try {
      const data = JSON.parse(result.stdout) as T;
      return { success: true, data };
    } catch {
      // JSON 解析失败，返回原始输出
      return {
        success: false,
        error: 'Failed to parse JSON output',
        raw: result.stdout,
      };
    }
  }

  /**
   * 执行流式命令，通过回调实时返回输出
   * 用于聊天等需要实时响应的场景
   */
  async execStream(
    command: string,
    onData: (chunk: string) => void,
    onError?: (error: string) => void,
    onExit?: (code: number) => void
  ): Promise<ChildProcess> {
    if (!this.validateCommand(command)) {
      throw new Error('Forbidden: Only openclaw commands are allowed');
    }

    console.log(`[CLI/Stream] Executing: ${command}`);

    const parts = command.split(' ').filter(Boolean);
    const cmd = parts[0];
    const args = parts.slice(1);

    const child = spawn(cmd, args, {
      env: { ...process.env, FORCE_COLOR: '0' },
      timeout: STREAM_TIMEOUT,
    });

    // 处理标准输出
    child.stdout?.on('data', (data: Buffer) => {
      onData(data.toString());
    });

    // 处理标准错误
    child.stderr?.on('data', (data: Buffer) => {
      const err = data.toString();
      console.error(`[CLI/Stream] stderr: ${err}`);
      onError?.(err);
    });

    // 处理进程退出
    child.on('close', (code) => {
      console.log(`[CLI/Stream] Process exited with code ${code}`);
      onExit?.(code ?? 0);
    });

    // 处理错误
    child.on('error', (error) => {
      console.error(`[CLI/Stream] Process error:`, error);
      onError?.(error.message);
    });

    return child;
  }

  /**
   * 检查 openclaw 是否安装
   */
  async isInstalled(): Promise<boolean> {
    try {
      const result = await this.exec('openclaw --version', 5000);
      return result.success && result.exitCode === 0;
    } catch {
      return false;
    }
  }

  /**
   * 获取 openclaw 版本
   */
  async getVersion(): Promise<string | null> {
    try {
      const result = await this.exec('openclaw --version', 5000);
      if (result.success) {
        return result.stdout.trim() || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 检查 Gateway 是否运行中
   */
  async isGatewayRunning(): Promise<boolean> {
    try {
      const result = await this.exec('openclaw gateway status', 5000);
      // 如果命令成功执行，通常意味着 Gateway 在运行
      // 根据实际输出格式调整判断逻辑
      return result.success && (
        result.stdout.toLowerCase().includes('running') ||
        result.stdout.toLowerCase().includes('online') ||
        result.exitCode === 0
      );
    } catch {
      return false;
    }
  }

  /**
   * 检查并更新状态
   */
  async checkStatus(): Promise<ConnectionStatus> {
    const [installed, version, gatewayRunning] = await Promise.all([
      this.isInstalled(),
      this.getVersion(),
      this.isGatewayRunning(),
    ]);

    this._status = {
      installed,
      version,
      gatewayRunning,
      mockMode: !installed, // 如果未安装，启用 Mock 模式
      lastChecked: new Date().toISOString(),
    };

    return this._status;
  }

  /**
   * 读取 OpenClaw 配置文件
   */
  async readConfig(): Promise<Record<string, unknown> | null> {
    try {
      // 优先尝试直接读取配置文件
      const content = await fs.readFile(OPENCLAW_CONFIG_PATH, 'utf-8');
      return JSON.parse(content);
    } catch {
      // 文件读取失败，尝试使用 CLI
      if (this._status.installed) {
        const result = await this.execJSON<Record<string, unknown>>('openclaw config get --json');
        if (result.success && result.data) {
          return result.data;
        }
      }
      return null;
    }
  }

  /**
   * 写入 OpenClaw 配置文件
   */
  async writeConfig(config: Record<string, unknown>): Promise<boolean> {
    try {
      // 先备份原配置
      try {
        const backupPath = `${OPENCLAW_CONFIG_PATH}.backup.${Date.now()}`;
        await fs.copyFile(OPENCLAW_CONFIG_PATH, backupPath);
      } catch {
        // 备份失败继续
      }

      // 确保目录存在
      await fs.mkdir(OPENCLAW_DIR, { recursive: true });

      // 写入新配置
      await fs.writeFile(OPENCLAW_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('[CLI] Failed to write config:', error);
      return false;
    }
  }

  /**
   * 获取 Agent 列表
   */
  async getAgents(): Promise<unknown[]> {
    if (this._status.mockMode) {
      return this.getMockAgents();
    }

    const result = await this.execJSON<{ agents?: unknown[] }>('openclaw agents list --json');
    if (result.success && result.data?.agents) {
      return result.data.agents;
    }

    // CLI 失败，尝试从文件系统读取
    try {
      const agentsDir = path.join(OPENCLAW_DIR, 'agents');
      const entries = await fs.readdir(agentsDir, { withFileTypes: true });
      const agents = await Promise.all(
        entries
          .filter((e) => e.isDirectory())
          .map(async (e) => {
            const agentPath = path.join(agentsDir, e.name);
            let identity = {};
            try {
              const identityContent = await fs.readFile(path.join(agentPath, 'identity.md'), 'utf-8');
              // 简单解析 identity.md
              identity = this.parseIdentityMd(identityContent);
            } catch {
              // ignore
            }
            return {
              id: e.name,
              name: e.name,
              ...identity,
            };
          })
      );
      return agents;
    } catch {
      return [];
    }
  }

  /**
   * 获取技能列表
   */
  async getSkills(): Promise<unknown[]> {
    if (this._status.mockMode) {
      return [];
    }

    const result = await this.execJSON<{ skills?: unknown[] }>('openclaw skills list --json');
    return result.success && result.data?.skills ? result.data.skills : [];
  }

  /**
   * 安装技能
   */
  async installSkill(skillId: string): Promise<boolean> {
    if (this._status.mockMode) {
      return true;
    }
    const result = await this.exec(`openclaw skills install ${this.escapeArg(skillId)}`);
    return result.success;
  }

  /**
   * 卸载技能
   */
  async uninstallSkill(skillId: string): Promise<boolean> {
    if (this._status.mockMode) {
      return true;
    }
    const result = await this.exec(`openclaw skills uninstall ${this.escapeArg(skillId)}`);
    return result.success;
  }

  /**
   * 获取通道列表
   */
  async getChannels(): Promise<unknown[]> {
    if (this._status.mockMode) {
      return [];
    }

    const result = await this.execJSON<{ channels?: unknown[] }>('openclaw channels list --json');
    return result.success && result.data?.channels ? result.data.channels : [];
  }

  /**
   * 获取会话列表
   */
  async getSessions(): Promise<unknown[]> {
    if (this._status.mockMode) {
      return this.getMockSessions();
    }

    const result = await this.execJSON<{ sessions?: unknown[] }>('openclaw sessions list --json');
    return result.success && result.data?.sessions ? result.data.sessions : [];
  }

  /**
   * 重启 Gateway
   */
  async restartGateway(): Promise<boolean> {
    if (this._status.mockMode) {
      return true;
    }
    const result = await this.exec('openclaw gateway restart', 60000);
    return result.success;
  }

  /**
   * 发送聊天消息（流式）
   */
  async sendChatMessage(
    message: string,
    agent: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    const escapedMessage = this.escapeArg(message);
    const escapedAgent = this.escapeArg(agent);

    if (this._status.mockMode) {
      // Mock 模式下模拟流式响应
      this.simulateMockChatResponse(onChunk, onComplete);
      return;
    }

    // 使用 CLI 发送消息
    // 注意：这里假设 openclaw CLI 支持 --message 参数
    // 实际命令可能需要根据 OpenClaw 的实际 CLI 调整
    const command = `openclaw agent --message ${escapedMessage} --agent ${escapedAgent}`;

    await this.execStream(
      command,
      onChunk,
      onError,
      (code) => {
        if (code === 0) {
          onComplete();
        } else {
          onError(`Process exited with code ${code}`);
        }
      }
    );
  }

  /**
   * 模拟 Mock Agent 数据
   */
  private getMockAgents(): unknown[] {
    return [
      {
        id: 'mock-agent-1',
        name: 'Assistant',
        status: 'idle',
        type: 'assistant',
        description: '通用助手 Agent',
      },
      {
        id: 'mock-agent-2',
        name: 'Coder',
        status: 'idle',
        type: 'coder',
        description: '代码编写助手',
      },
    ];
  }

  /**
   * 模拟 Mock 会话数据
   */
  private getMockSessions(): unknown[] {
    return [
      {
        id: 'mock-session-1',
        channel: { type: 'web', name: 'Web' },
        user: { name: '访客' },
        lastMessage: {
          content: '你好，请问能帮我写一段代码吗？',
          timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
        },
        unreadCount: 0,
      },
      {
        id: 'mock-session-2',
        channel: { type: 'slack', name: 'Slack' },
        user: { name: '张三' },
        lastMessage: {
          content: '帮我查一下今天的天气怎么样？',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        unreadCount: 2,
      },
    ];
  }

  /**
   * 模拟 Mock 聊天响应
   */
  private simulateMockChatResponse(
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ): void {
    const responses = [
      '这是一个模拟响应。',
      'OpenClaw 未安装，正在使用 Mock 模式。',
      '您可以继续测试界面功能。',
      '安装 OpenClaw 后将获得完整功能。',
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    const chunks = response.split('');

    let index = 0;
    const interval = setInterval(() => {
      if (index < chunks.length) {
        onChunk(chunks[index]);
        index++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 50);
  }

  /**
   * 解析 identity.md 文件
   */
  private parseIdentityMd(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        result[match[1].trim().toLowerCase()] = match[2].trim();
      }
    }

    return result;
  }

  /**
   * 销毁实例，清理资源
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// 导出单例
export const cliBridge = CliBridge.getInstance();

// 导出便捷函数
export async function execCLI(command: string, timeout?: number): Promise<CLIResult> {
  return cliBridge.exec(command, timeout);
}

export async function execCLIJSON<T>(command: string, timeout?: number): Promise<{ success: boolean; data?: T; error?: string }> {
  return cliBridge.execJSON<T>(command, timeout);
}

export function getCLIStatus(): ConnectionStatus {
  return cliBridge.status;
}

export function isMockMode(): boolean {
  return cliBridge.isMockMode;
}
