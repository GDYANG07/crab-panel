import { Router } from 'express';
import { cliBridge } from '../services/cli-bridge.js';

const router = Router();

// GET /api/channels - 获取通道列表
router.get('/', async (_req, res) => {
  try {
    const channels = await cliBridge.getChannels();
    const status = cliBridge.status;

    res.json({
      success: true,
      channels,
      mockMode: status.mockMode,
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
    const { type, name, config } = req.body;
    const status = cliBridge.status;

    if (!type || !name) {
      res.status(400).json({
        success: false,
        error: 'Type and name are required',
      });
      return;
    }

    if (status.mockMode) {
      const channel = {
        id: `channel-${Date.now()}`,
        type,
        name,
        config,
        connected: false,
        messageCount: 0,
        status: 'disconnected',
      };
      res.json({
        success: true,
        channel,
        mockMode: true,
      });
      return;
    }

    const result = await cliBridge.execJSON<{ channel?: unknown }>(
      `openclaw channels create --type "${type}" --name "${name}" --json`,
      30000
    );

    if (result.success) {
      res.json({
        success: true,
        channel: result.data?.channel || { id: `channel-${Date.now()}`, type, name, config },
        mockMode: false,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to create channel',
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

// PUT /api/channels/:id - 更新通道
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const status = cliBridge.status;

    if (status.mockMode) {
      res.json({
        success: true,
        channel: { ...updates, id },
        mockMode: true,
      });
      return;
    }

    const result = await cliBridge.execJSON<{ channel?: unknown }>(
      `openclaw channels update "${id}" --json`,
      30000
    );

    res.json({
      success: result.success,
      channel: result.data?.channel || { ...updates, id },
      mockMode: false,
      error: result.success ? undefined : result.error,
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
    const { id } = req.params;
    const status = cliBridge.status;

    if (status.mockMode) {
      res.json({
        success: true,
        mockMode: true,
      });
      return;
    }

    const result = await cliBridge.exec(`openclaw channels delete "${id}"`);

    res.json({
      success: result.success,
      mockMode: false,
      error: result.success ? undefined : result.error,
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
    const { id } = req.params;
    const status = cliBridge.status;

    if (status.mockMode) {
      res.json({
        success: true,
        message: 'Mock mode: connection test passed',
        mockMode: true,
      });
      return;
    }

    const result = await cliBridge.exec(`openclaw channels test "${id}"`);

    res.json({
      success: result.success,
      message: result.success ? 'Connection test passed' : (result.error || 'Connection test failed'),
      mockMode: false,
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
