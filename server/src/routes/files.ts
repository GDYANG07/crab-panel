import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const router = Router();

// OpenClaw 工作目录
const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');

// 文件节点类型
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileNode[];
  extension?: string;
}

// 获取文件扩展名
function getExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext;
}

// 递归获取目录树
async function getDirectoryTree(dirPath: string, basePath: string = ''): Promise<FileNode[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name);
      const stats = await fs.stat(fullPath);

      if (entry.isDirectory()) {
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: 'directory',
          modified: stats.mtime.toISOString(),
          children: await getDirectoryTree(fullPath, relativePath),
        });
      } else {
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          extension: getExtension(entry.name),
        });
      }
    }

    // 排序：文件夹在前，文件在后，按名称排序
    return nodes.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}

// GET /api/files/tree — 获取目录树
router.get('/tree', async (req, res) => {
  try {
    const { agent, subdir } = req.query;
    let targetDir = OPENCLAW_DIR;

    // 如果指定了 Agent，切换到 Agent 的记忆目录
    if (agent && typeof agent === 'string') {
      targetDir = path.join(OPENCLAW_DIR, 'agents', agent, 'memory');
    }

    // 如果指定了子目录，追加到路径
    if (subdir && typeof subdir === 'string') {
      // 防止目录遍历攻击
      const normalizedSubdir = path.normalize(subdir).replace(/^(\.\.\/|\/)/g, '');
      targetDir = path.join(targetDir, normalizedSubdir);
    }

    // 确保目标目录在 OpenClaw 目录下
    if (!targetDir.startsWith(OPENCLAW_DIR)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: path outside of OpenClaw directory',
      });
    }

    // 确保目录存在
    try {
      await fs.access(targetDir);
    } catch {
      // 目录不存在，返回空数组
      return res.json({
        success: true,
        tree: [],
        path: targetDir,
      });
    }

    const tree = await getDirectoryTree(targetDir);

    res.json({
      success: true,
      tree,
      path: targetDir,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// GET /api/files/content — 获取文件内容
router.get('/content', async (req, res) => {
  try {
    const { path: filePath, agent } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Path parameter is required',
      });
    }

    let targetDir = OPENCLAW_DIR;
    if (agent && typeof agent === 'string') {
      targetDir = path.join(OPENCLAW_DIR, 'agents', agent, 'memory');
    }

    // 防止目录遍历
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.\/|\/)/g, '');
    const fullPath = path.join(targetDir, normalizedPath);

    // 安全检查
    if (!fullPath.startsWith(targetDir)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: path outside of allowed directory',
      });
    }

    // 检查是否是文件
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: 'Path is a directory, not a file',
      });
    }

    // 读取文件内容
    const content = await fs.readFile(fullPath, 'utf-8');

    res.json({
      success: true,
      content,
      path: filePath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// PUT /api/files/content — 保存文件
router.put('/content', async (req, res) => {
  try {
    const { path: filePath, content, agent } = req.body;

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Path parameter is required',
      });
    }

    if (content === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Content parameter is required',
      });
    }

    let targetDir = OPENCLAW_DIR;
    if (agent && typeof agent === 'string') {
      targetDir = path.join(OPENCLAW_DIR, 'agents', agent, 'memory');
    }

    // 防止目录遍历
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.\/|\/)/g, '');
    const fullPath = path.join(targetDir, normalizedPath);

    // 安全检查
    if (!fullPath.startsWith(targetDir)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: path outside of allowed directory',
      });
    }

    // 确保父目录存在
    const parentDir = path.dirname(fullPath);
    await fs.mkdir(parentDir, { recursive: true });

    // 写入文件
    await fs.writeFile(fullPath, content, 'utf-8');

    // 获取文件信息
    const stats = await fs.stat(fullPath);

    res.json({
      success: true,
      path: filePath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// POST /api/files/create — 新建文件或文件夹
router.post('/create', async (req, res) => {
  try {
    const { path: filePath, type, agent } = req.body;

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Path parameter is required',
      });
    }

    if (!type || !['file', 'directory'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be "file" or "directory"',
      });
    }

    let targetDir = OPENCLAW_DIR;
    if (agent && typeof agent === 'string') {
      targetDir = path.join(OPENCLAW_DIR, 'agents', agent, 'memory');
    }

    // 防止目录遍历
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.\/|\/)/g, '');
    const fullPath = path.join(targetDir, normalizedPath);

    // 安全检查
    if (!fullPath.startsWith(targetDir)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: path outside of allowed directory',
      });
    }

    // 检查是否已存在
    try {
      await fs.access(fullPath);
      return res.status(409).json({
        success: false,
        error: 'File or directory already exists',
      });
    } catch {
      // 不存在，继续创建
    }

    // 创建
    if (type === 'directory') {
      await fs.mkdir(fullPath, { recursive: true });
    } else {
      // 确保父目录存在
      const parentDir = path.dirname(fullPath);
      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(fullPath, '', 'utf-8');
    }

    const stats = await fs.stat(fullPath);

    res.json({
      success: true,
      path: filePath,
      type,
      modified: stats.mtime.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// DELETE /api/files/delete — 删除文件或文件夹
router.delete('/delete', async (req, res) => {
  try {
    const { path: filePath, agent } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Path parameter is required',
      });
    }

    let targetDir = OPENCLAW_DIR;
    if (agent && typeof agent === 'string') {
      targetDir = path.join(OPENCLAW_DIR, 'agents', agent, 'memory');
    }

    // 防止目录遍历
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.\/|\/)/g, '');
    const fullPath = path.join(targetDir, normalizedPath);

    // 安全检查
    if (!fullPath.startsWith(targetDir)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: path outside of allowed directory',
      });
    }

    // 检查是否存在
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File or directory not found',
      });
    }

    // 获取文件信息用于响应
    const stats = await fs.stat(fullPath);

    // 删除
    if (stats.isDirectory()) {
      await fs.rmdir(fullPath, { recursive: true });
    } else {
      await fs.unlink(fullPath);
    }

    res.json({
      success: true,
      path: filePath,
      type: stats.isDirectory() ? 'directory' : 'file',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// PUT /api/files/rename — 重命名文件或文件夹
router.put('/rename', async (req, res) => {
  try {
    const { oldPath, newPath, agent } = req.body;

    if (!oldPath || typeof oldPath !== 'string' || !newPath || typeof newPath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Both oldPath and newPath are required',
      });
    }

    let targetDir = OPENCLAW_DIR;
    if (agent && typeof agent === 'string') {
      targetDir = path.join(OPENCLAW_DIR, 'agents', agent, 'memory');
    }

    // 防止目录遍历
    const normalizedOldPath = path.normalize(oldPath).replace(/^(\.\.\/|\/)/g, '');
    const normalizedNewPath = path.normalize(newPath).replace(/^(\.\.\/|\/)/g, '');
    const fullOldPath = path.join(targetDir, normalizedOldPath);
    const fullNewPath = path.join(targetDir, normalizedNewPath);

    // 安全检查
    if (!fullOldPath.startsWith(targetDir) || !fullNewPath.startsWith(targetDir)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: path outside of allowed directory',
      });
    }

    // 检查源文件是否存在
    try {
      await fs.access(fullOldPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Source file or directory not found',
      });
    }

    // 检查目标是否已存在
    try {
      await fs.access(fullNewPath);
      return res.status(409).json({
        success: false,
        error: 'Destination already exists',
      });
    } catch {
      // 不存在，继续
    }

    // 重命名
    await fs.rename(fullOldPath, fullNewPath);

    const stats = await fs.stat(fullNewPath);

    res.json({
      success: true,
      oldPath,
      newPath,
      type: stats.isDirectory() ? 'directory' : 'file',
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
