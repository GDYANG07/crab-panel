import { Router } from 'express';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const execAsync = promisify(exec);

// 模拟历史数据存储（生产环境应使用真实数据源）
const metricsHistory: {
  cpu: Array<{ time: string; value: number }>;
  memory: Array<{ time: string; value: number }>;
  diskIO: Array<{ time: string; read: number; write: number }>;
  network: Array<{ time: string; in: number; out: number }>;
} = {
  cpu: [],
  memory: [],
  diskIO: [],
  network: [],
};

// 生成初始历史数据
function generateInitialHistory() {
  const now = Date.now();
  const points = 60; // 5 分钟数据，每 5 秒一个点

  for (let i = points; i >= 0; i--) {
    const time = new Date(now - i * 5000).toISOString();
    metricsHistory.cpu.push({
      time,
      value: 15 + Math.random() * 25 + Math.sin(i / 10) * 10,
    });
    metricsHistory.memory.push({
      time,
      value: 40 + Math.random() * 15 + Math.cos(i / 15) * 5,
    });
    metricsHistory.diskIO.push({
      time,
      read: Math.random() * 50 + Math.sin(i / 5) * 20,
      write: Math.random() * 30 + Math.cos(i / 8) * 15,
    });
    metricsHistory.network.push({
      time,
      in: Math.random() * 100 + 50,
      out: Math.random() * 80 + 30,
    });
  }
}

generateInitialHistory();

// 日志存储（模拟）
let mockLogs: Array<{
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
}> = [];

// 生成初始日志
function generateInitialLogs() {
  const sources = ['Gateway', 'Agent', 'Channel', 'Skill', 'System'];
  const messages = {
    INFO: [
      'Gateway started successfully',
      'Agent connected',
      'Message processed',
      'Skill loaded',
      'Configuration updated',
      'Heartbeat received',
      'Session created',
    ],
    WARN: [
      'High memory usage detected',
      'Connection slow',
      'Retrying operation',
      'Deprecated API used',
      'Rate limit approaching',
    ],
    ERROR: [
      'Failed to connect to service',
      'Authentication failed',
      'Request timeout',
      'Invalid configuration',
      'Process crashed',
    ],
    DEBUG: [
      'Processing request',
      'Cache hit',
      'State transition',
      'Event dispatched',
    ],
  };

  const now = Date.now();
  for (let i = 100; i >= 0; i--) {
    const level = (['INFO', 'INFO', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const)[
      Math.floor(Math.random() * 6)
    ];
    mockLogs.push({
      id: `log-${i}`,
      timestamp: new Date(now - i * 3000).toISOString(),
      level,
      message: messages[level][Math.floor(Math.random() * messages[level].length)],
      source: sources[Math.floor(Math.random() * sources.length)],
    });
  }
}

generateInitialLogs();

// 定期添加新日志
setInterval(() => {
  const sources = ['Gateway', 'Agent', 'Channel', 'Skill', 'System'];
  const messages = {
    INFO: ['Gateway heartbeat', 'Message received', 'Task completed', 'Sync finished'],
    WARN: ['Memory usage increasing', 'Slow response detected'],
    ERROR: ['Connection lost', 'Request failed'],
    DEBUG: ['Debug info', 'Trace log'],
  };

  const level = Math.random() > 0.9 ? (Math.random() > 0.5 ? 'ERROR' : 'WARN') : 'INFO';
  mockLogs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    level: level as 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    message: messages[level as keyof typeof messages][
      Math.floor(Math.random() * messages[level as keyof typeof messages].length)
    ],
    source: sources[Math.floor(Math.random() * sources.length)],
  });

  // 保持最近 1000 条日志
  if (mockLogs.length > 1000) {
    mockLogs = mockLogs.slice(-1000);
  }
}, 2000);

// GET /api/system/metrics - 返回当前系统指标
router.get('/metrics', async (_req, res) => {
  try {
    // CPU 信息
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const cpuCount = cpus.length;
    const cpuUsage = Math.min(100, (loadAvg[0] / cpuCount) * 100);

    // 内存信息
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;

    // 网络接口信息
    const networkInterfaces = os.networkInterfaces();

    // 更新历史数据
    const now = new Date().toISOString();
    metricsHistory.cpu.push({ time: now, value: cpuUsage });
    metricsHistory.memory.push({ time: now, value: memoryUsage });
    metricsHistory.cpu = metricsHistory.cpu.slice(-60);
    metricsHistory.memory = metricsHistory.memory.slice(-60);

    // 模拟磁盘 I/O 和网络数据
    const diskRead = Math.random() * 50 + 10;
    const diskWrite = Math.random() * 30 + 5;
    metricsHistory.diskIO.push({ time: now, read: diskRead, write: diskWrite });
    metricsHistory.diskIO = metricsHistory.diskIO.slice(-60);

    const netIn = Math.random() * 100 + 50;
    const netOut = Math.random() * 80 + 30;
    metricsHistory.network.push({ time: now, in: netIn, out: netOut });
    metricsHistory.network = metricsHistory.network.slice(-60);

    // 尝试获取磁盘使用情况
    let diskInfo = null;
    try {
      if (os.platform() !== 'win32') {
        const { stdout } = await execAsync('df -h / | tail -1');
        const parts = stdout.trim().split(/\s+/);
        if (parts.length >= 6) {
          diskInfo = {
            filesystem: parts[0],
            size: parts[1],
            used: parts[2],
            available: parts[3],
            usagePercent: parseInt(parts[4].replace('%', ''), 10),
            mounted: parts[5],
          };
        }
      }
    } catch {
      // 忽略磁盘信息获取失败
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      cpu: {
        count: cpuCount,
        model: cpus[0]?.model || 'Unknown',
        usagePercent: Math.round(cpuUsage * 100) / 100,
        loadAverage: loadAvg,
      },
      memory: {
        total: totalMem,
        totalFormatted: formatBytes(totalMem),
        used: usedMem,
        usedFormatted: formatBytes(usedMem),
        free: freeMem,
        freeFormatted: formatBytes(freeMem),
        usagePercent: Math.round(memoryUsage * 100) / 100,
      },
      disk: diskInfo,
      network: {
        interfaces: Object.keys(networkInterfaces).length,
        rx: 0,
        tx: 0,
      },
      system: {
        platform: os.platform(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        uptimeFormatted: formatUptime(os.uptime()),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// GET /api/system/metrics/history - 返回历史指标数据
router.get('/metrics/history', (_req, res) => {
  res.json({
    success: true,
    data: metricsHistory,
  });
});

// GET /api/system/logs - 获取日志
router.get('/logs', (req, res) => {
  try {
    const { level, limit = '100', search = '' } = req.query;
    const limitNum = parseInt(limit as string, 10) || 100;

    let filteredLogs = [...mockLogs];

    // 按级别筛选
    if (level && level !== 'ALL') {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    // 按关键词搜索
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          log.source.toLowerCase().includes(searchLower)
      );
    }

    // 返回最近的日志
    const result = filteredLogs.slice(-limitNum);

    res.json({
      success: true,
      logs: result,
      total: filteredLogs.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// GET /api/system/versions - 获取版本信息
router.get('/versions', async (_req, res) => {
  try {
    // 读取 package.json 获取 CrabPanel 版本
    const packagePath = path.join(process.cwd(), 'package.json');
    let crabpanelVersion = '0.1.0';
    try {
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      crabpanelVersion = packageJson.version || '0.1.0';
    } catch {
      // 使用默认版本
    }

    // 获取 OpenClaw 版本
    let openclawVersion = 'not installed';
    let openclawInstalled = false;
    try {
      const { stdout } = await execAsync('openclaw --version', { timeout: 5000 });
      openclawVersion = stdout.trim();
      openclawInstalled = true;
    } catch {
      // openclaw 未安装
    }

    res.json({
      success: true,
      crabpanel: {
        version: crabpanelVersion,
        node: process.version,
        platform: os.platform(),
      },
      openclaw: {
        installed: openclawInstalled,
        version: openclawVersion,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// GET /api/system/update/check - 检查更新
router.get('/update/check', async (_req, res) => {
  try {
    // 模拟检查更新
    // 实际应该调用 GitHub API 或更新服务器
    const hasUpdate = Math.random() > 0.5;

    res.json({
      success: true,
      hasUpdate,
      currentVersion: '0.1.0',
      latestVersion: hasUpdate ? '0.2.0' : '0.1.0',
      releaseNotes: hasUpdate
        ? [
            '新增：系统监控实时图表',
            '优化：内存管理界面性能',
            '修复：WebSocket 连接稳定性问题',
            '更新：依赖库版本升级',
          ]
        : [],
      downloadUrl: hasUpdate ? 'https://github.com/openclaw/crabpanel/releases/latest' : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// POST /api/system/update - 执行更新
router.post('/update', async (_req, res) => {
  // 模拟更新过程，返回流式响应
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const steps = [
    { message: 'Checking for updates...', delay: 1000 },
    { message: 'Downloading latest version...', delay: 2000 },
    { message: 'Verifying package integrity...', delay: 1000 },
    { message: 'Backing up current configuration...', delay: 1000 },
    { message: 'Installing updates...', delay: 3000 },
    { message: 'Cleaning up...', delay: 1000 },
    { message: 'Update completed successfully!', delay: 500 },
  ];

  for (const step of steps) {
    await new Promise((resolve) => setTimeout(resolve, step.delay));
    res.write(`data: ${JSON.stringify({ type: 'progress', message: step.message })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ type: 'complete', success: true })}\n\n`);
  res.end();
});

// GET /api/system/openclaw-version - 执行 `openclaw --version` 并返回结果
router.get('/openclaw-version', async (_req, res) => {
  try {
    let version = 'not installed';
    let installed = false;

    try {
      const { stdout } = await execAsync('openclaw --version', { timeout: 5000 });
      version = stdout.trim();
      installed = true;
    } catch {
      // openclaw 未安装或不在 PATH 中
      installed = false;
    }

    res.json({
      success: true,
      installed,
      version,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// 辅助函数：格式化字节
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 辅助函数：格式化运行时间
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

export default router;
export { mockLogs };
