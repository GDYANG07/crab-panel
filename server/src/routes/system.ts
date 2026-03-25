import { Router } from 'express';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = Router();
const execAsync = promisify(exec);

// GET /api/system/metrics - 返回 CPU 使用率、内存使用、磁盘使用
router.get('/metrics', async (_req, res) => {
  try {
    // CPU 信息
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const cpuCount = cpus.length;

    // 计算 CPU 使用率（基于负载平均值）
    const cpuUsage = Math.min(100, (loadAvg[0] / cpuCount) * 100);

    // 内存信息
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;

    // 系统运行时间
    const uptime = os.uptime();

    // 平台信息
    const platform = os.platform();
    const hostname = os.hostname();

    // 尝试获取磁盘使用情况（如果在类 Unix 系统上）
    let diskInfo = null;
    try {
      if (platform !== 'win32') {
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
      system: {
        platform,
        hostname,
        uptime,
        uptimeFormatted: formatUptime(uptime),
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
