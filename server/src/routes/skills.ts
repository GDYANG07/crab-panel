import { Router } from 'express';
import { getGatewayClient } from '../gateway/client.js';

const router = Router();

// Mock 技能数据存储
const mockInstalledSkills = new Set<string>();
const mockSkillConfigs = new Map<string, Record<string, unknown>>();

// GET /api/skills/list - 获取所有可用技能
router.get('/list', async (_req, res) => {
  try {
    const client = getGatewayClient();
    const result = await client.call('skills.list', {});

    res.json({
      success: true,
      skills: (result as { skills?: unknown[] })?.skills || [],
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

// GET /api/skills/installed - 获取已安装技能
router.get('/installed', async (_req, res) => {
  try {
    const client = getGatewayClient();
    const result = await client.call('skills.installed', {});

    res.json({
      success: true,
      skills: (result as { skills?: unknown[] })?.skills || Array.from(mockInstalledSkills),
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

// POST /api/skills/install - 安装技能
router.post('/install', async (req, res) => {
  try {
    const client = getGatewayClient();
    const { skillId } = req.body;

    if (!skillId) {
      res.status(400).json({
        success: false,
        error: 'skillId is required',
      });
      return;
    }

    await client.call('skills.install', { skillId });

    // Mock 模式下记录安装
    if (client.isMockMode) {
      mockInstalledSkills.add(skillId);
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

// POST /api/skills/uninstall - 卸载技能
router.post('/uninstall', async (req, res) => {
  try {
    const client = getGatewayClient();
    const { skillId } = req.body;

    if (!skillId) {
      res.status(400).json({
        success: false,
        error: 'skillId is required',
      });
      return;
    }

    await client.call('skills.uninstall', { skillId });

    // Mock 模式下记录卸载
    if (client.isMockMode) {
      mockInstalledSkills.delete(skillId);
      mockSkillConfigs.delete(skillId);
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

// PUT /api/skills/:id/config - 配置技能
router.put('/:id/config', async (req, res) => {
  try {
    const client = getGatewayClient();
    const { id } = req.params;
    const { config } = req.body;

    await client.call('skills.configure', { skillId: id, config });

    // Mock 模式下保存配置
    if (client.isMockMode) {
      mockSkillConfigs.set(id, config);
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

export default router;
