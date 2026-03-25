import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { cliBridge } from './services/cli-bridge.js';
import gatewayRoutes from './routes/gateway.js';
import systemRoutes from './routes/system.js';
import cliRoutes from './routes/cli.js';
import channelsRoutes from './routes/channels.js';
import skillsRoutes from './routes/skills.js';
import filesRoutes from './routes/files.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 获取当前文件目录（ESM 兼容）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/gateway', gatewayRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/cli', cliRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/chat', chatRoutes);

// 全局状态端点 - 前端轮询使用
app.get('/api/status', async (_req, res) => {
  const status = cliBridge.status;

  res.json({
    success: true,
    ...status,
    timestamp: new Date().toISOString(),
  });
});

// 健康检查路由
app.get('/api/health', async (_req, res) => {
  const status = cliBridge.status;

  res.json({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    openclaw: {
      installed: status.installed,
      version: status.version,
      gatewayRunning: status.gatewayRunning,
    },
    mockMode: status.mockMode,
  });
});

// 生产环境：托管前端静态文件
if (NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../client/dist');

  // 托管静态文件
  app.use(express.static(clientDistPath));

  // SPA 路由回退：所有非 API 路由都返回 index.html
  app.get('*', (req, res) => {
    // 排除 API 路径
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  console.log(`[Server] Production mode: serving static files from ${clientDistPath}`);
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🦀 CrabPanel Server running on http://localhost:${PORT}`);
  console.log(`\n📡 REST API Endpoints:`);
  console.log(`   Health check: GET  http://localhost:${PORT}/api/health`);
  console.log(`   Status:       GET  http://localhost:${PORT}/api/status`);
  console.log(`   Gateway:      GET  http://localhost:${PORT}/api/gateway/status`);
  console.log(`   Config:       GET  http://localhost:${PORT}/api/gateway/config`);
  console.log(`   Agents:       GET  http://localhost:${PORT}/api/gateway/agents`);
  console.log(`   Skills:       GET  http://localhost:${PORT}/api/skills/list`);
  console.log(`   Channels:     GET  http://localhost:${PORT}/api/channels`);
  console.log(`   Files:        GET  http://localhost:${PORT}/api/files/tree`);
  console.log(`   System:       GET  http://localhost:${PORT}/api/system/metrics`);
  console.log(`\n💬 Chat SSE:`);
  console.log(`   Stream:       GET  http://localhost:${PORT}/api/chat/stream`);
  console.log(`   Send:         POST http://localhost:${PORT}/api/chat/send`);
  console.log(`\n📁 OpenClaw Dir: ${path.join(process.env.HOME || '~', '.openclaw')}`);

  // 初始化 CLI 桥接状态检查
  console.log(`\n🔍 Checking OpenClaw installation...`);
  cliBridge.checkStatus().then((status) => {
    if (status.installed) {
      console.log(`✅ OpenClaw ${status.version} installed`);
      if (status.gatewayRunning) {
        console.log(`✅ Gateway is running`);
      } else {
        console.log(`⚠️  Gateway is not running`);
      }
    } else {
      console.log(`⚠️  OpenClaw not installed - running in Mock mode`);
      console.log(`   Install from: https://github.com/openclaw-org/openclaw`);
    }
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully');
  cliBridge.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully');
  cliBridge.destroy();
  process.exit(0);
});
