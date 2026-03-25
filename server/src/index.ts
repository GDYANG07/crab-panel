import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查路由
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// WebSocket 连接处理
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    // 回显消息
    ws.send(JSON.stringify({ type: 'echo', data: message.toString() }));
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  // 发送欢迎消息
  ws.send(JSON.stringify({ type: 'connected', message: 'Welcome to CrabPanel Server' }));
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`🦀 CrabPanel Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
});
