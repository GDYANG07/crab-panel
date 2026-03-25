import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ui';

const API_BASE = '/api';

// 技能分类
export type SkillCategory = 'all' | 'installed' | 'productivity' | 'development' | 'communication' | 'data';

// 技能数据类型
export interface Skill {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  author: string;
  version: string;
  category: SkillCategory;
  installed: boolean;
  installs: number;
  rating: number;
  ratingCount: number;
  config?: Record<string, unknown>;
  requiresConfig: boolean;
}

// Mock 技能数据
const mockSkills: Skill[] = [
  {
    id: 'calendar',
    name: '日历管理',
    description: '管理日程安排、创建会议、设置提醒',
    fullDescription: '日历管理技能允许 Agent 帮你管理日程安排。你可以让它创建会议、查询空闲时间、设置提醒等。支持与 Google Calendar、Outlook 等主流日历服务集成。',
    author: 'OpenClaw Team',
    version: '1.2.0',
    category: 'productivity',
    installed: true,
    installs: 15234,
    rating: 4.8,
    ratingCount: 892,
    requiresConfig: true,
    config: {
      defaultCalendar: 'primary',
      timezone: 'Asia/Shanghai',
    },
  },
  {
    id: 'email',
    name: '邮件管理',
    description: '发送邮件、管理收件箱、自动回复',
    fullDescription: '邮件管理技能让 Agent 可以帮你处理邮件。支持发送邮件、整理收件箱、设置自动回复、识别重要邮件等功能。兼容 Gmail、Outlook 等邮箱服务。',
    author: 'OpenClaw Team',
    version: '1.5.0',
    category: 'communication',
    installed: true,
    installs: 23456,
    rating: 4.6,
    ratingCount: 1456,
    requiresConfig: true,
  },
  {
    id: 'filesystem',
    name: '文件管理',
    description: '浏览文件系统、读取和写入文件',
    fullDescription: '文件管理技能允许 Agent 访问本地文件系统。可以列出目录内容、读取文件、创建新文件、删除文件等。支持文本文件、图片、PDF 等多种格式。',
    author: 'OpenClaw Team',
    version: '2.0.0',
    category: 'productivity',
    installed: true,
    installs: 45678,
    rating: 4.9,
    ratingCount: 3421,
    requiresConfig: false,
  },
  {
    id: 'browser',
    name: '网页浏览',
    description: '打开网页、提取内容、执行网页操作',
    fullDescription: '网页浏览技能让 Agent 能够像人类一样浏览网页。支持打开网页、点击元素、填写表单、截图、提取内容等功能。可用于数据采集、自动化测试等场景。',
    author: 'OpenClaw Team',
    version: '1.8.0',
    category: 'development',
    installed: true,
    installs: 38901,
    rating: 4.7,
    ratingCount: 2156,
    requiresConfig: false,
  },
  {
    id: 'code-execution',
    name: '代码执行',
    description: '在沙箱环境中执行代码',
    fullDescription: '代码执行技能允许 Agent 在安全的沙箱环境中运行代码。支持 Python、JavaScript、Bash 等多种语言。可用于数据分析、脚本执行、自动化任务等。',
    author: 'DevTools Inc.',
    version: '1.3.0',
    category: 'development',
    installed: false,
    installs: 12345,
    rating: 4.5,
    ratingCount: 678,
    requiresConfig: true,
  },
  {
    id: 'image-generation',
    name: '图片生成',
    description: '使用 AI 生成图片',
    fullDescription: '图片生成技能集成了多种 AI 图像生成模型。支持根据文本描述生成图片、图像编辑、风格迁移等功能。需要配置 API 密钥。',
    author: 'AI Labs',
    version: '0.9.0',
    category: 'data',
    installed: false,
    installs: 8765,
    rating: 4.3,
    ratingCount: 432,
    requiresConfig: true,
  },
  {
    id: 'weather',
    name: '天气查询',
    description: '查询全球各地的天气信息',
    fullDescription: '天气查询技能提供准确的天气信息服务。支持查询当前天气、未来预报、空气质量等。数据来源权威，覆盖全球主要城市。',
    author: 'WeatherData Corp',
    version: '1.1.0',
    category: 'productivity',
    installed: false,
    installs: 21567,
    rating: 4.4,
    ratingCount: 1234,
    requiresConfig: false,
  },
  {
    id: 'news',
    name: '新闻摘要',
    description: '获取最新新闻、生成摘要',
    fullDescription: '新闻摘要技能让 Agent 能够获取最新新闻并生成摘要。支持自定义新闻源、关键词过滤、定时推送等功能。',
    author: 'InfoStream',
    version: '1.0.0',
    category: 'productivity',
    installed: false,
    installs: 9876,
    rating: 4.2,
    ratingCount: 567,
    requiresConfig: true,
  },
  {
    id: 'translation',
    name: '翻译工具',
    description: '多语言翻译服务',
    fullDescription: '翻译工具技能提供高质量的机器翻译服务。支持 100+ 种语言互译，保留格式，支持专业术语。集成多个翻译引擎以获得最佳效果。',
    author: 'LinguaSoft',
    version: '2.1.0',
    category: 'communication',
    installed: true,
    installs: 45678,
    rating: 4.7,
    ratingCount: 2345,
    requiresConfig: false,
  },
  {
    id: 'database',
    name: '数据库查询',
    description: '连接数据库、执行 SQL 查询',
    fullDescription: '数据库查询技能允许 Agent 连接各种数据库并执行查询。支持 MySQL、PostgreSQL、SQLite 等。可用于数据分析、报表生成等场景。',
    author: 'DataTools Pro',
    version: '1.4.0',
    category: 'data',
    installed: false,
    installs: 7654,
    rating: 4.6,
    ratingCount: 432,
    requiresConfig: true,
  },
  {
    id: 'pdf',
    name: 'PDF 处理',
    description: '读取、创建、编辑 PDF 文件',
    fullDescription: 'PDF 处理技能提供全面的 PDF 操作功能。支持读取文本、提取图片、合并文件、添加水印、填写表单等。',
    author: 'DocuTech',
    version: '1.2.0',
    category: 'productivity',
    installed: false,
    installs: 11234,
    rating: 4.5,
    ratingCount: 789,
    requiresConfig: false,
  },
  {
    id: 'notes',
    name: '笔记管理',
    description: '创建和管理笔记',
    fullDescription: '笔记管理技能让 Agent 帮你管理笔记。支持创建、搜索、分类、标签等功能。可与主流笔记应用同步。',
    author: 'NoteSync',
    version: '1.0.0',
    category: 'productivity',
    installed: false,
    installs: 8765,
    rating: 4.3,
    ratingCount: 456,
    requiresConfig: true,
  },
];

// 分类标签
export const skillCategories: { id: SkillCategory; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'installed', label: '已安装' },
  { id: 'productivity', label: '效率工具' },
  { id: 'development', label: '开发工具' },
  { id: 'communication', label: '通信工具' },
  { id: 'data', label: '数据分析' },
];

// 获取所有技能
const fetchSkills = async (): Promise<Skill[]> => {
  const res = await fetch(`${API_BASE}/skills/list`);
  const data = await res.json();

  if (data.mockMode || (!data.skills || data.skills.length === 0)) {
    return mockSkills;
  }

  return data.skills || [];
};

// 获取已安装技能
const fetchInstalledSkills = async (): Promise<Skill[]> => {
  const res = await fetch(`${API_BASE}/skills/installed`);
  const data = await res.json();

  if (data.mockMode) {
    return mockSkills.filter((s) => s.installed);
  }

  return data.skills || [];
};

// 安装技能
const installSkillApi = async (skillId: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/skills/install`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skillId }),
  });

  const data = await res.json();

  if (!data.success && !data.mockMode) {
    throw new Error(data.error || 'Failed to install skill');
  }

  // Mock 安装延迟
  if (data.mockMode) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
};

// 卸载技能
const uninstallSkillApi = async (skillId: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/skills/uninstall`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skillId }),
  });

  const data = await res.json();

  if (!data.success && !data.mockMode) {
    throw new Error(data.error || 'Failed to uninstall skill');
  }

  // Mock 卸载延迟
  if (data.mockMode) {
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
};

// 配置技能
const configureSkillApi = async (skillId: string, config: Record<string, unknown>): Promise<void> => {
  const res = await fetch(`${API_BASE}/skills/${encodeURIComponent(skillId)}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });

  const data = await res.json();

  if (!data.success && !data.mockMode) {
    throw new Error(data.error || 'Failed to configure skill');
  }
};

// Hooks
export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: fetchSkills,
    refetchInterval: 60000,
  });
}

export function useInstalledSkills() {
  return useQuery({
    queryKey: ['skills', 'installed'],
    queryFn: fetchInstalledSkills,
  });
}

export function useInstallSkill() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: installSkillApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills', 'installed'] });
      showToast('技能安装成功', 'success');
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '安装失败', 'error');
    },
  });
}

export function useUninstallSkill() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: uninstallSkillApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills', 'installed'] });
      showToast('技能卸载成功', 'success');
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '卸载失败', 'error');
    },
  });
}

export function useConfigureSkill() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ skillId, config }: { skillId: string; config: Record<string, unknown> }) =>
      configureSkillApi(skillId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      showToast('技能配置已保存', 'success');
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '配置失败', 'error');
    },
  });
}
