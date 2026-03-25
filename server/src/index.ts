import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { getGatewayClient } from './gateway/client.js';
import gatewayRoutes from './routes/gateway.js';
import systemRoutes from './routes/system.js';
import cliRoutes from './routes/cli.js';
import { setupChatWebSocket } from './routes/chat-ws.js';

dotenv.config();

const app = express();
const server = createServer(app);

// 创建两个 WebSocket 服务器：
// 1. 通用 WebSocket (/ws)
// 2. 聊天代理 WebSocket (/ws/chat)
const wss = new WebSocketServer({ server, path: '/ws' });
const chatWss = new WebSocketServer({ server, path: '/ws/chat' });

const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/gateway', gatewayRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/cli', cliRoutes);

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

// 启动服务器
server.listen(PORT, () => {
  console.log(`\n🦀 CrabPanel Server running on http://localhost:${PORT}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Gateway:      http://localhost:${PORT}/api/gateway/status`);
  console.log(`   System:       http://localhost:${PORT}/api/system/metrics`);
  console.log(`   CLI:          http://localhost:${PORT}/api/cli/commands`);
  console.log(`\n🔌 WebSocket:`);
  console.log(`   General:      ws://localhost:${PORT}/ws`);
  console.log(`   Chat Proxy:   ws://localhost:${PORT}/ws/chat`);

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
