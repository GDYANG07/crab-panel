import { Router } from 'express';
import { cliBridge } from '../services/cli-bridge.js';

const router = Router();

// GET /api/skills/list - 获取所有可用技能
router.get('/list', async (_req, res) => {
  try {
    const skills = await cliBridge.getSkills();
    const status = cliBridge.status;

    res.json({
      success: true,
      skills,
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

// GET /api/skills/installed - 获取已安装技能
router.get('/installed', async (_req, res) => {
  try {
    const status = cliBridge.status;

    if (status.mockMode) {
      res.json({
        success: true,
        skills: [],
        mockMode: true,
      });
      return;
    }

    const result = await cliBridge.execJSON<{ skills?: unknown[] }>(
      'openclaw skills installed --json'
    );

    res.json({
      success: true,
      skills: result.success && result.data?.skills ? result.data.skills : [],
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

// POST /api/skills/install - 安装技能
router.post('/install', async (req, res) => {
  try {
    const { skillId } = req.body;
    const status = cliBridge.status;

    if (!skillId) {
      res.status(400).json({
        success: false,
        error: 'skillId is required',
      });
      return;
    }

    const success = await cliBridge.installSkill(skillId);

    res.json({
      success,
      mockMode: status.mockMode,
      error: success ? undefined : 'Failed to install skill',
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
    const { skillId } = req.body;
    const status = cliBridge.status;

    if (!skillId) {
      res.status(400).json({
        success: false,
        error: 'skillId is required',
      });
      return;
    }

    const success = await cliBridge.uninstallSkill(skillId);

    res.json({
      success,
      mockMode: status.mockMode,
      error: success ? undefined : 'Failed to uninstall skill',
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
    const { id } = req.params;
    const { config } = req.body;
    const status = cliBridge.status;

    if (status.mockMode) {
      res.json({
        success: true,
        mockMode: true,
      });
      return;
    }

    // 使用 CLI 配置技能
    const configJson = JSON.stringify(config);
    const result = await cliBridge.exec(
      `openclaw skills configure "${id}" --config '${configJson}'`
    );

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

export default router;
