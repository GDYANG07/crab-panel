import { Router } from 'express';
import { cliBridge } from '../services/cli-bridge.js';

const router = Router();

// GET /api/gateway/status - 返回 Gateway 连接状态、版本号
router.get('/status', async (_req, res) => {
  try {
    const status = cliBridge.status;
    const config = await cliBridge.readConfig();

    // 安全获取端口配置
    let port = 18789;
    if (config && typeof config === 'object' && 'gateway' in config) {
      const gatewayConfig = config.gateway as { port?: number } | undefined;
      if (gatewayConfig && typeof gatewayConfig === 'object' && 'port' in gatewayConfig) {
        port = gatewayConfig.port ?? 18789;
      }
    }

    res.json({
      success: true,
      status: status.gatewayRunning ? 'connected' : 'disconnected',
      connected: status.gatewayRunning,
      mockMode: status.mockMode,
      installed: status.installed,
      version: status.version,
      port,
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

// GET /api/gateway/config - 获取 OpenClaw 配置
router.get('/config', async (_req, res) => {
  try {
    const config = await cliBridge.readConfig();
    const status = cliBridge.status;

    if (!config) {
      // 如果无法读取配置，返回默认配置
      res.json({
        success: true,
        config: {
          gateway: { host: '0.0.0.0', port: 18789 },
          agents: {},
          skills: [],
        },
        mockMode: status.mockMode,
      });
      return;
    }

    res.json({
      success: true,
      config,
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

// POST /api/gateway/config - 更新 OpenClaw 配置
router.post('/config', async (req, res) => {
  try {
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Invalid config: expected object',
      });
      return;
    }

    const success = await cliBridge.writeConfig(config as Record<string, unknown>);
    const status = cliBridge.status;

    if (!success) {
      res.status(500).json({
        success: false,
        error: 'Failed to write configuration',
        mockMode: status.mockMode,
      });
      return;
    }

    res.json({
      success: true,
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

// GET /api/gateway/agents - 获取 Agent 列表
router.get('/agents', async (_req, res) => {
  try {
    const agents = await cliBridge.getAgents();
    const status = cliBridge.status;

    res.json({
      success: true,
      agents,
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

// GET /api/gateway/agents/:name - 获取单个 Agent
router.get('/agents/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const agents = await cliBridge.getAgents();
    const status = cliBridge.status;

    const agent = agents.find((a: unknown) => {
      if (typeof a === 'object' && a !== null) {
        const agentObj = a as { id?: string; name?: string };
        return agentObj.id === name || agentObj.name === name;
      }
      return false;
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        error: `Agent '${name}' not found`,
      });
      return;
    }

    res.json({
      success: true,
      agent,
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

// POST /api/gateway/agents - 创建 Agent
router.post('/agents', async (req, res) => {
  try {
    const agent = req.body;
    const status = cliBridge.status;

    if (!agent.name) {
      res.status(400).json({
        success: false,
        error: 'Agent name is required',
      });
      return;
    }

    if (status.mockMode) {
      // Mock 模式下直接返回成功
      res.json({
        success: true,
        agent: { ...agent, id: agent.name },
        mockMode: true,
      });
      return;
    }

    // 使用 CLI 创建 Agent
    const result = await cliBridge.execJSON(
      `openclaw agents create --name "${agent.name}" --json`
    );

    if (result.success) {
      res.json({
        success: true,
        agent: result.data || agent,
        mockMode: false,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to create agent',
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

// PUT /api/gateway/agents/:name - 更新 Agent
router.put('/agents/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const updates = req.body;
    const status = cliBridge.status;

    if (status.mockMode) {
      res.json({
        success: true,
        agent: { ...updates, name },
        mockMode: true,
      });
      return;
    }

    // 使用 CLI 更新 Agent
    const result = await cliBridge.execJSON(
      `openclaw agents update "${name}" --json`,
      30000
    );

    if (result.success) {
      res.json({
        success: true,
        agent: result.data || { ...updates, name },
        mockMode: false,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to update agent',
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

// DELETE /api/gateway/agents/:name - 删除 Agent
router.delete('/agents/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const status = cliBridge.status;

    if (status.mockMode) {
      res.json({
        success: true,
        mockMode: true,
      });
      return;
    }

    // 使用 CLI 删除 Agent
    const result = await cliBridge.exec(`openclaw agents delete "${name}"`);

    res.json({
      success: result.success,
      mockMode: false,
      error: result.error,
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
    const sessions = await cliBridge.getSessions();
    const status = cliBridge.status;

    res.json({
      success: true,
      sessions,
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

// POST /api/gateway/restart - 重启 Gateway
router.post('/restart', async (_req, res) => {
  try {
    const status = cliBridge.status;

    if (status.mockMode) {
      res.json({
        success: true,
        message: 'Mock mode: restart simulated',
        mockMode: true,
      });
      return;
    }

    const success = await cliBridge.restartGateway();

    res.json({
      success,
      message: success ? 'Gateway restart initiated' : 'Failed to restart gateway',
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
