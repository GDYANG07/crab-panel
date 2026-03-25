import type { WebSocket } from 'ws';
import { getGatewayClient } from '../gateway/client.js';

// 存储前端 WebSocket 连接到 Gateway 连接的映射
const clientGatewayMap = new Map<WebSocket, boolean>();

export function setupChatWebSocket(ws: WebSocket): void {
  console.log('[Chat-WS] Client connected to chat proxy');

  const gatewayClient = getGatewayClient();
  clientGatewayMap.set(ws, false);

  // 监听 Gateway 的消息并转发给前端
  const gatewayMessageHandler = (message: unknown) => {
    if (ws.readyState === ws.OPEN) {
      try {
        const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
        ws.send(msgStr);
      } catch (err) {
        console.error('[Chat-WS] Error forwarding Gateway message:', err);
      }
    }
  };

  // 监听 Gateway 的消息
  gatewayClient.on('message', gatewayMessageHandler);

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('[Chat-WS] Received from client:', message.type || 'unknown');

      // 处理不同类型的消息
      switch (message.type) {
        case 'chat':
        case 'message':
          // 转发聊天消息到 Gateway
          if (gatewayClient.isConnected) {
            gatewayClient.sendRaw({
              method: 'chat.send',
              params: {
                sessionId: message.sessionId,
                content: message.content,
                ...message.metadata,
              },
              id: `${Date.now()}-${Math.random()}`,
            });
          } else {
            // Mock 模式：回显消息
            ws.send(JSON.stringify({
              type: 'message',
              id: `mock-${Date.now()}`,
              content: `[Mock] 收到: ${message.content}`,
              role: 'assistant',
              timestamp: new Date().toISOString(),
            }));
          }
          break;

        case 'stream':
          // 流式消息转发
          if (gatewayClient.isConnected) {
            gatewayClient.sendRaw({
              method: 'chat.stream',
              params: {
                sessionId: message.sessionId,
                content: message.content,
                stream: true,
                ...message.metadata,
              },
              id: `${Date.now()}-${Math.random()}`,
            });
          } else {
            // Mock 模式：模拟流式响应
            simulateStreamResponse(ws, message.content);
          }
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        default:
          // 未知类型，直接转发到 Gateway
          if (gatewayClient.isConnected) {
            gatewayClient.sendRaw(message);
          }
      }
    } catch (err) {
      console.error('[Chat-WS] Error processing message:', err);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format',
      }));
    }
  });

  ws.on('close', () => {
    console.log('[Chat-WS] Client disconnected');
    clientGatewayMap.delete(ws);
    gatewayClient.off('message', gatewayMessageHandler);
  });

  ws.on('error', (error: Error) => {
    console.error('[Chat-WS] WebSocket error:', error);
  });

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to CrabPanel Chat Proxy',
    mockMode: !gatewayClient.isConnected || gatewayClient.isMockMode,
    timestamp: new Date().toISOString(),
  }));
}

// 模拟流式响应
function simulateStreamResponse(ws: WebSocket, originalContent: string): void {
  const responses = [
    '这是一个模拟响应。',
    'Gateway 当前未连接，',
    '正在使用 Mock 模式。',
    '您可以继续测试界面功能。',
  ];

  const response = responses[Math.floor(Math.random() * responses.length)];
  const chunks = response.split('');

  let index = 0;
  const interval = setInterval(() => {
    if (ws.readyState !== ws.OPEN) {
      clearInterval(interval);
      return;
    }

    if (index < chunks.length) {
      ws.send(JSON.stringify({
        type: 'stream_chunk',
        chunk: chunks[index],
        done: false,
      }));
      index++;
    } else {
      ws.send(JSON.stringify({
        type: 'stream_chunk',
        chunk: '',
        done: true,
      }));
      clearInterval(interval);
    }
  }, 50);
}
