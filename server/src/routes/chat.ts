import { Router } from 'express';
import { cliBridge } from '../services/cli-bridge.js';

const router = Router();

/**
 * POST /api/chat/send - 发送聊天消息，返回 SSE 流式响应
 *
 * 请求体: { message: string, agent?: string, sessionId?: string }
 * 响应: text/event-stream
 */
router.post('/send', async (req, res) => {
  try {
    const { message, agent = 'main', sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Message is required',
      });
      return;
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲

    const status = cliBridge.status;

    // 发送初始事件
    res.write(`data: ${JSON.stringify({ type: 'start', mockMode: status.mockMode, sessionId })}

`);

    if (status.mockMode) {
      // Mock 模式下模拟流式响应
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
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunks[index] })}

`);
          index++;
        } else {
          clearInterval(interval);
          res.write(`data: ${JSON.stringify({ type: 'end', fullResponse: response })}

`);
          res.end();
        }
      }, 50);

      // 清理函数
      req.on('close', () => {
        clearInterval(interval);
      });

      return;
    }

    // 使用 CLI 发送消息并流式获取响应
    const escapedMessage = message.replace(/"/g, '\\"');
    const escapedAgent = agent.replace(/"/g, '\\"');

    // 尝试使用不同的命令格式，根据 OpenClaw 的实际 CLI 调整
    const command = `openclaw agent --agent "${escapedAgent}" --message "${escapedMessage}"`;

    let hasEnded = false;

    const child = await cliBridge.execStream(
      command,
      // onData - 收到数据块
      (chunk: string) => {
        if (!hasEnded && res.writable) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}

`);
        }
      },
      // onError - 错误处理
      (error: string) => {
        if (!hasEnded && res.writable) {
          res.write(`data: ${JSON.stringify({ type: 'error', error })}

`);
        }
      },
      // onExit - 进程退出
      (code: number) => {
        if (!hasEnded && res.writable) {
          hasEnded = true;
          res.write(`data: ${JSON.stringify({ type: 'end', exitCode: code })}

`);
          res.end();
        }
      }
    );

    // 客户端断开连接时清理
    req.on('close', () => {
      hasEnded = true;
      if (child && !child.killed) {
        child.kill();
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // 如果 SSE 已经开始，发送错误事件
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: message })}

`);
      res.write(`data: ${JSON.stringify({ type: 'end' })}

`);
      res.end();
    } else {
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }
});

/**
 * GET /api/chat/stream - SSE 端点（替代 WebSocket）
 *
 * 用于建立长期 SSE 连接，支持服务器主动推送
 * 查询参数: ?sessionId=xxx&agent=main
 */
router.get('/stream', (req, res) => {
  const { sessionId, agent = 'main' } = req.query;

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const status = cliBridge.status;

  // 发送连接成功事件
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    mockMode: status.mockMode,
    sessionId: sessionId || `session-${Date.now()}`,
    agent,
    timestamp: new Date().toISOString(),
  })}

`);

  // 定期发送心跳保持连接
  const heartbeat = setInterval(() => {
    if (res.writable) {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}

`);
    }
  }, 30000);

  // 客户端断开时清理
  req.on('close', () => {
    clearInterval(heartbeat);
    if (res.writable) {
      res.end();
    }
  });

  req.on('error', () => {
    clearInterval(heartbeat);
    if (res.writable) {
      res.end();
    }
  });
});

/**
 * POST /api/chat/message - 非流式发送消息
 *
 * 请求体: { message: string, agent?: string }
 * 响应: { success: boolean, response: string }
 */
router.post('/message', async (req, res) => {
  try {
    const { message, agent = 'main' } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Message is required',
      });
      return;
    }

    const status = cliBridge.status;

    if (status.mockMode) {
      const responses = [
        '这是一个模拟响应。OpenClaw 未安装，正在使用 Mock 模式。',
        'Mock 模式：您的消息已收到，但实际功能需要安装 OpenClaw。',
        '这是一个 Mock 回复，用于测试界面功能。',
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];

      res.json({
        success: true,
        response,
        mockMode: true,
      });
      return;
    }

    // 使用 CLI 发送消息
    const escapedMessage = message.replace(/"/g, '\\"');
    const escapedAgent = agent.replace(/"/g, '\\"');
    const command = `openclaw agent --agent "${escapedAgent}" --message "${escapedMessage}"`;

    const result = await cliBridge.exec(command, 120000);

    if (result.success) {
      res.json({
        success: true,
        response: result.stdout,
        mockMode: false,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || result.stderr || 'Failed to get response',
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

export default router;
