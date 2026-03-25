import { Router } from 'express';
import { getGatewayClient } from '../gateway/client.js';

const router = Router();

// GET /api/gateway/status - 返回 Gateway 连接状态、版本号
router.get('/status', (_req, res) => {
  const client = getGatewayClient();

  res.json({
    status: client.status,
    connected: client.isConnected,
    mockMode: client.isMockMode,
    version: client.version,
    url: process.env.OPENCLAW_GATEWAY_URL || 'ws://localhost:18789',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/gateway/config - 获取 OpenClaw 配置
router.get('/config', async (_req, res) => {
  try {
    const client = getGatewayClient();
    const config = await client.call('config.get', {});

    res.json({
      success: true,
      config,
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

// POST /api/gateway/config - 更新 OpenClaw 配置
router.post('/config', async (req, res) => {
  try {
    const client = getGatewayClient();
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Invalid config: expected object',
      });
      return;
    }

    const result = await client.call('config.set', { config });

    res.json({
      success: true,
      result,
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

// GET /api/gateway/agents - 获取 Agent 列表
router.get('/agents', async (_req, res) => {
  try {
    const client = getGatewayClient();
    const result = await client.call('agents.list', {});

    res.json({
      success: true,
      agents: (result as { agents?: unknown[] })?.agents || [],
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

// GET /api/gateway/agents/:name - 获取单个 Agent
router.get('/agents/:name', async (req, res) => {
  try {
    const client = getGatewayClient();
    const { name } = req.params;
    const result = await client.call('agents.get', { name });

    res.json({
      success: true,
      agent: result,
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

// POST /api/gateway/agents - 创建 Agent
router.post('/agents', async (req, res) => {
  try {
    const client = getGatewayClient();
    const agent = req.body;

    if (!agent.name) {
      res.status(400).json({
        success: false,
        error: 'Agent name is required',
      });
      return;
    }

    const result = await client.call('agents.create', agent);

    res.json({
      success: true,
      agent: result,
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

// PUT /api/gateway/agents/:name - 更新 Agent
router.put('/agents/:name', async (req, res) => {
  try {
    const client = getGatewayClient();
    const { name } = req.params;
    const updates = req.body;

    const result = await client.call('agents.update', { name, ...updates });

    res.json({
      success: true,
      agent: result,
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

// DELETE /api/gateway/agents/:name - 删除 Agent
router.delete('/agents/:name', async (req, res) => {
  try {
    const client = getGatewayClient();
    const { name } = req.params;

    await client.call('agents.delete', { name });

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

// GET /api/gateway/sessions - 获取会话列表
router.get('/sessions', async (_req, res) => {
  try {
    const client = getGatewayClient();
    const result = await client.call('sessions.list', {});

    res.json({
      success: true,
      sessions: (result as { sessions?: unknown[] })?.sessions || [],
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
