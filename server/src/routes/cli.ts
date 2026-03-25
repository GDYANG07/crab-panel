import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = Router();
const execAsync = promisify(exec);

// POST /api/cli/execute - 执行 openclaw CLI 命令并返回输出
router.post('/execute', async (req, res) => {
  try {
    const { command, args = [] } = req.body;

    // 安全验证：只允许执行 openclaw 开头的命令
    if (!command || typeof command !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Invalid command: expected string',
      });
      return;
    }

    // 严格的安全检查：命令必须以 openclaw 开头
    const trimmedCommand = command.trim();
    if (!trimmedCommand.startsWith('openclaw')) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Only openclaw commands are allowed',
      });
      return;
    }

    // 构建完整命令
    let fullCommand = trimmedCommand;
    if (args && Array.isArray(args) && args.length > 0) {
      // 转义参数以防止命令注入
      const escapedArgs = args.map((arg: string) => {
        // 简单的参数转义：如果包含空格或特殊字符，用引号包裹
        if (/[\s"'&|;<>$`\\]/.test(arg)) {
          return `"${arg.replace(/"/g, '\\"')}"`;
        }
        return arg;
      });
      fullCommand += ' ' + escapedArgs.join(' ');
    }

    console.log(`[CLI] Executing: ${fullCommand}`);

    // 执行命令，设置 30 秒超时
    const { stdout, stderr } = await execAsync(fullCommand, {
      timeout: 30000,
      maxBuffer: 1024 * 1024, // 1MB 输出缓冲区
    });

    res.json({
      success: true,
      command: fullCommand,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // 命令执行失败（包括非零退出码）
    if (error && typeof error === 'object' && 'stdout' in error) {
      const execError = error as {
        stdout: string;
        stderr: string;
        code?: number;
        message: string;
      };

      res.json({
        success: false,
        command: req.body.command,
        stdout: execError.stdout?.trim() || '',
        stderr: execError.stderr?.trim() || '',
        exitCode: execError.code || 1,
        error: execError.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 其他错误（如超时）
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/cli/commands - 获取支持的命令列表
router.get('/commands', (_req, res) => {
  res.json({
    success: true,
    commands: [
      { name: 'openclaw --version', description: '显示 OpenClaw 版本' },
      { name: 'openclaw gateway status', description: '检查 Gateway 状态' },
      { name: 'openclaw config get', description: '获取配置' },
      { name: 'openclaw skills list', description: '列出可用技能' },
      { name: 'openclaw agents list', description: '列出 Agent' },
    ],
  });
});

export default router;
