import { Router } from 'express';
import { getGatewayClient } from '../gateway/client.js';

const router = Router();

// Mock 通道数据存储
const mockChannels = new Map();

// GET /api/channels - 获取通道列表
router.get('/', async (_req, res) => {
  try {
    const client = getGatewayClient();
    const result = await client.call('channels.list', {});

    res.json({
      success: true,
      channels: (result as { channels?: unknown[] })?.channels || Array.from(mockChannels.values()),
      mockMode: client.isMockMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// POST /api/channels - 创建通道
router.post('/', async (req, res) => {
  try {
    const client = getGatewayClient();
    const { type, name, config } = req.body;

    if (!type || !name) {
      res.status(400).json({
        success: false,
        error: 'Type and name are required',
      });
      return;
    }

    const result = await client.call('channels.create', { type, name, config });

    // Mock 模式下创建通道
    if (client.isMockMode) {
      const channel = {
        id: `channel-${Date.now()}`,
        type,
        name,
        config,
        connected: false,
        messageCount: 0,
        status: 'disconnected',
      };
      mockChannels.set(channel.id, channel);
      res.json({
        success: true,
        channel,
        mockMode: true,
      });
      return;
    }

    res.json({
      success: true,
      channel: result,
      mockMode: client.isMockMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// PUT /api/channels/:id - 更新通道
router.put('/:id', async (req, res) => {
  try {
    const client = getGatewayClient();
    const { id } = req.params;
    const updates = req.body;

    const result = await client.call('channels.update', { id, ...updates });

    // Mock 模式下更新通道
    if (client.isMockMode && mockChannels.has(id)) {
      const channel = mockChannels.get(id);
      Object.assign(channel, updates);
      mockChannels.set(id, channel);
      res.json({
        success: true,
        channel,
        mockMode: true,
      });
      return;
    }

    res.json({
      success: true,
      channel: result,
      mockMode: client.isMockMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// DELETE /api/channels/:id - 删除通道
router.delete('/:id', async (req, res) => {
  try {
    const client = getGatewayClient();
    const { id } = req.params;

    await client.call('channels.delete', { id });

    // Mock 模式下删除通道
    if (client.isMockMode) {
      mockChannels.delete(id);
    }

    res.json({
      success: true,
      mockMode: client.isMockMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// POST /api/channels/:id/test - 测试通道连接
router.post('/:id/test', async (req, res) => {
  try {
    const client = getGatewayClient();
    const { id } = req.params;

    const result = await client.call('channels.test', { id });

    res.json({
      success: true,
      ...result as object,
      mockMode: client.isMockMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

export default router;
