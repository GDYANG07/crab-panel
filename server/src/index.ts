import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { getGatewayClient } from './gateway/client.js';
import gatewayRoutes from './routes/gateway.js';
import systemRoutes from './routes/system.js';
import cliRoutes from './routes/cli.js';
import channelsRoutes from './routes/channels.js';
import skillsRoutes from './routes/skills.js';
import filesRoutes from './routes/files.js';
import { setupChatWebSocket } from './routes/chat-ws.js';
import { mockLogs } from './routes/system.js';

dotenv.config();

const app = express();
const server = createServer(app);

// 创建 WebSocket 服务器：
// 1. 通用 WebSocket (/ws)
// 2. 聊天代理 WebSocket (/ws/chat)
// 3. 实时日志 WebSocket (/ws/logs)
const wss = new WebSocketServer({ server, path: '/ws' });
const chatWss = new WebSocketServer({ server, path: '/ws/chat' });
const logsWss = new WebSocketServer({ server, path: '/ws/logs' });

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

// 健康检查路由
app.get('/api/health', (_req, res) => {
  const gatewayClient = getGatewayClient();

  res.json({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    gateway: {
      status: gatewayClient.status,
      connected: gatewayClient.isConnected,
      mockMode: gatewayClient.isMockMode,
      version: gatewayClient.version,
    },
  });
});

// 通用 WebSocket 连接处理
wss.on('connection', (ws) => {
  console.log('[WS] Client connected to general WebSocket');

  ws.on('message', (message) => {
    console.log('[WS] Received:', message.toString());
    // 回显消息
    ws.send(JSON.stringify({ type: 'echo', data: message.toString() }));
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });

  // 发送欢迎消息
  ws.send(JSON.stringify({ type: 'connected', message: 'Welcome to CrabPanel Server' }));
});

// 聊天 WebSocket 代理
chatWss.on('connection', (ws) => {
  setupChatWebSocket(ws);
});

// 实时日志 WebSocket
logsWss.on('connection', (ws: WebSocket) => {
  console.log('[WS] Client connected to logs WebSocket');

  let lastLogIndex = mockLogs.length - 1;

  // 发送现有日志给新连接
  const recentLogs = mockLogs.slice(-50);
  ws.send(JSON.stringify({ type: 'initial', logs: recentLogs }));

  // 定期推送新日志
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const newLogs = mockLogs.slice(lastLogIndex + 1);
      if (newLogs.length > 0) {
        ws.send(JSON.stringify({ type: 'logs', logs: newLogs }));
        lastLogIndex = mockLogs.length - 1;
      }
    }
  }, 1000);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'filter') {
        // 处理筛选请求
        const { level, search } = data;
        let filtered = [...mockLogs];
        if (level && level !== 'ALL') {
          filtered = filtered.filter((log) => log.level === level);
        }
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(
            (log) =>
              log.message.toLowerCase().includes(searchLower) ||
              log.source.toLowerCase().includes(searchLower)
          );
        }
        ws.send(JSON.stringify({ type: 'filtered', logs: filtered.slice(-100) }));
      }
    } catch {
      // 忽略解析错误
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected from logs WebSocket');
    clearInterval(interval);
  });
});

// 生产环境：托管前端静态文件
if (NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../client/dist');

  // 托管静态文件
  app.use(express.static(clientDistPath));

  // SPA 路由回退：所有非 API 和 WebSocket 路由都返回 index.html
  app.get('*', (req, res) => {
    // 排除 API 和 WebSocket 路径
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/ws')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  console.log(`[Server] Production mode: serving static files from ${clientDistPath}`);
}

// 启动服务器
server.listen(PORT, () => {
  console.log(`\n🦀 CrabPanel Server running on http://localhost:${PORT}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Gateway:      http://localhost:${PORT}/api/gateway/status`);
  console.log(`   System:       http://localhost:${PORT}/api/system/metrics`);
  console.log(`   Files:        http://localhost:${PORT}/api/files/tree`);
  console.log(`   CLI:          http://localhost:${PORT}/api/cli/commands`);
  console.log(`\n🔌 WebSocket:`);
  console.log(`   General:      ws://localhost:${PORT}/ws`);
  console.log(`   Chat Proxy:   ws://localhost:${PORT}/ws/chat`);
  console.log(`   Logs:         ws://localhost:${PORT}/ws/logs`);

  // 连接到 OpenClaw Gateway
  console.log(`\n🔗 Connecting to OpenClaw Gateway...`);
  const gatewayClient = getGatewayClient();

  // 监听 Gateway 连接事件
  gatewayClient.on('connected', () => {
    console.log('✅ Gateway connected successfully');
  });

  gatewayClient.on('disconnected', () => {
    console.log('⚠️  Gateway disconnected');
  });

  gatewayClient.on('error', (error) => {
    console.log('❌ Gateway error:', error.message);
  });

  gatewayClient.on('statusChange', (status) => {
    if (status === 'connected') {
      console.log('✅ Gateway status: connected');
    } else if (status === 'error') {
      console.log('❌ Gateway status: error');
    } else if (status === 'disconnected') {
      console.log('⚠️  Gateway status: disconnected');
    }
  });

  // 启动连接
  gatewayClient.connect();

  // 如果 5 秒后仍未连接，启用 Mock 模式
  setTimeout(() => {
    if (!gatewayClient.isConnected) {
      console.log('\n⚡ Gateway not available, enabling Mock mode');
      gatewayClient.enableMockMode();
    }
  }, 5000);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully');
  getGatewayClient().disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully');
  getGatewayClient().disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
