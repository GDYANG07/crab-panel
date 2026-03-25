const API_BASE = '/api/files';

// 文件节点类型
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileNode[];
  extension?: string;
}

// 获取目录树
export async function getFileTree(agent?: string, subdir?: string): Promise<FileNode[]> {
  const params = new URLSearchParams();
  if (agent) params.append('agent', agent);
  if (subdir) params.append('subdir', subdir);

  const res = await fetch(`${API_BASE}/tree?${params.toString()}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch file tree');
  }

  return data.tree;
}

// 获取文件内容
export async function getFileContent(filePath: string, agent?: string): Promise<{
  content: string;
  size: number;
  modified: string;
}> {
  const params = new URLSearchParams();
  params.append('path', filePath);
  if (agent) params.append('agent', agent);

  const res = await fetch(`${API_BASE}/content?${params.toString()}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch file content');
  }

  return {
    content: data.content,
    size: data.size,
    modified: data.modified,
  };
}

// 保存文件内容
export async function saveFileContent(
  filePath: string,
  content: string,
  agent?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/content`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: filePath, content, agent }),
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to save file');
  }
}

// 创建文件或文件夹
export async function createFile(
  filePath: string,
  type: 'file' | 'directory',
  agent?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: filePath, type, agent }),
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to create file');
  }
}

// 删除文件或文件夹
export async function deleteFile(filePath: string, agent?: string): Promise<void> {
  const params = new URLSearchParams();
  params.append('path', filePath);
  if (agent) params.append('agent', agent);

  const res = await fetch(`${API_BASE}/delete?${params.toString()}`, {
    method: 'DELETE',
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to delete file');
  }
}

// 重命名文件或文件夹
export async function renameFile(
  oldPath: string,
  newPath: string,
  agent?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/rename`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ oldPath, newPath, agent }),
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to rename file');
  }
}

// 根据文件扩展名获取 Monaco Editor 语言
export function getLanguageFromExtension(extension?: string): string {
  if (!extension) return 'plaintext';

  const ext = extension.toLowerCase();
  const languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.jsx': 'javascript',
    '.json': 'json',
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',
    '.sql': 'sql',
    '.graphql': 'graphql',
    '.dockerfile': 'dockerfile',
  };

  return languageMap[ext] || 'plaintext';
}

// 格式化文件大小
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '-';
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
