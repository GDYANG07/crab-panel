import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ui';

const API_BASE = '/api';

// Agent 数据类型
export interface Agent {
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  model?: string;
  soul?: string;
  channels?: string[];
  tools?: {
    enabled: string[];
    requireApproval: boolean;
    sandboxMode: boolean;
  };
  files?: {
    memories?: string;
    identity?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

// 创建 Agent 请求
export interface CreateAgentRequest {
  name: string;
  description?: string;
  soul?: string;
  model?: string;
  tools?: {
    enabled: string[];
    requireApproval: boolean;
    sandboxMode: boolean;
  };
}

// 更新 Agent 请求
export interface UpdateAgentRequest {
  description?: string;
  status?: 'active' | 'inactive';
  model?: string;
  soul?: string;
  channels?: string[];
  tools?: {
    enabled: string[];
    requireApproval: boolean;
    sandboxMode: boolean;
  };
  files?: {
    memories?: string;
    identity?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

// 工具定义
export interface Tool {
  name: string;
  description: string;
  category: 'system' | 'browser' | 'filesystem' | 'custom';
  enabled: boolean;
}

// 预设人格模板
export const soulTemplates = {
  general: {
    name: '通用助手',
    content: `你是一个 helpful 的 AI 助手，擅长回答各种问题。你友好、专业，总是尽力帮助用户解决问题。

你的特点：
- 回答简洁清晰，直击要点
- 善于倾听，理解用户需求
- 遇到不确定的问题会诚实告知
- 尊重用户隐私，不泄露敏感信息`,
  },
  code: {
    name: '代码助手',
    content: `你是一个专业的编程助手，精通多种编程语言和开发技术。

你的专长：
- 编写高质量、可维护的代码
- 代码审查和重构建议
- 调试和解决技术问题
- 解释复杂的技术概念

代码风格：
- 遵循最佳实践和设计模式
- 注重代码可读性和注释
- 考虑性能和安全性
- 提供完整的示例代码`,
  },
  writing: {
    name: '写作助手',
    content: `你是一个专业的写作助手，擅长各类文案创作和文字润色。

你的能力：
- 撰写各类文章、报告、邮件
- 文案优化和润色
- 创意写作和故事创作
- 翻译和本地化

写作风格：
- 根据场景调整语气和风格
- 注重逻辑结构和流畅度
- 精准用词，避免歧义
- 保持原创性和可读性`,
  },
  service: {
    name: '客服助手',
    content: `你是一个专业的客服代表，代表公司为用户提供优质服务。

服务准则：
- 热情友好，耐心倾听
- 快速理解用户问题
- 提供准确有效的解决方案
- 遇到无法解决的问题及时升级

沟通风格：
- 使用礼貌用语
- 表达清晰简洁
- 主动确认用户理解
- 关注用户满意度`,
  },
};

// 可用工具列表
export const availableTools: Tool[] = [
  // 系统工具
  { name: 'chat', description: '发送和接收消息', category: 'system', enabled: true },
  { name: 'memory', description: '记忆存储和检索', category: 'system', enabled: true },
  { name: 'think', description: '深度思考和分析', category: 'system', enabled: true },

  // 浏览器工具
  { name: 'browser_navigate', description: '浏览器页面导航', category: 'browser', enabled: false },
  { name: 'browser_click', description: '模拟鼠标点击', category: 'browser', enabled: false },
  { name: 'browser_type', description: '模拟键盘输入', category: 'browser', enabled: false },
  { name: 'browser_screenshot', description: '网页截图', category: 'browser', enabled: false },
  { name: 'browser_read', description: '读取页面内容', category: 'browser', enabled: false },

  // 文件系统工具
  { name: 'file_read', description: '读取文件内容', category: 'filesystem', enabled: false },
  { name: 'file_write', description: '写入文件内容', category: 'filesystem', enabled: false },
  { name: 'file_list', description: '列出目录内容', category: 'filesystem', enabled: false },
  { name: 'shell', description: '执行 Shell 命令', category: 'filesystem', enabled: false },

  // 自定义工具
  { name: 'search', description: '网络搜索', category: 'custom', enabled: false },
  { name: 'weather', description: '获取天气信息', category: 'custom', enabled: false },
  { name: 'calendar', description: '日历管理', category: 'custom', enabled: false },
];

// Mock Agents 数据
const mockAgents: Agent[] = [
  {
    name: '小助手',
    description: '通用 AI 助手，可以回答各种日常问题',
    status: 'active',
    model: 'claude-3.5-sonnet',
    soul: soulTemplates.general.content,
    channels: ['telegram'],
    tools: {
      enabled: ['chat', 'memory', 'think', 'search'],
      requireApproval: false,
      sandboxMode: true,
    },
    files: {
      memories: '',
      identity: '',
    },
  },
  {
    name: '代码猫',
    description: '专业编程助手，精通多种编程语言',
    status: 'active',
    model: 'claude-4-opus',
    soul: soulTemplates.code.content,
    channels: ['slack', 'discord'],
    tools: {
      enabled: ['chat', 'memory', 'think', 'file_read', 'file_write', 'shell', 'search'],
      requireApproval: true,
      sandboxMode: false,
    },
    files: {
      memories: '',
      identity: '',
    },
  },
  {
    name: '客服小蟹',
    description: '客服机器人，处理用户咨询和问题',
    status: 'inactive',
    model: 'claude-3-haiku',
    soul: soulTemplates.service.content,
    channels: ['web'],
    tools: {
      enabled: ['chat', 'memory'],
      requireApproval: false,
      sandboxMode: true,
    },
    files: {
      memories: '',
      identity: '',
    },
  },
];

// 获取 Agent 列表
const fetchAgents = async (): Promise<Agent[]> => {
  const res = await fetch(`${API_BASE}/gateway/agents`);
  const data = await res.json();

  // 如果是 Mock 模式，返回 Mock 数据
  if (data.mockMode || (!data.agents || data.agents.length === 0)) {
    return mockAgents;
  }

  return data.agents || [];
};

// 创建 Agent
const createAgentApi = async (agent: CreateAgentRequest): Promise<Agent> => {
  const res = await fetch(`${API_BASE}/gateway/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agent),
  });

  const data = await res.json();

  if (!data.success && !data.mockMode) {
    throw new Error(data.error || 'Failed to create agent');
  }

  return data.agent || agent;
};

// 更新 Agent
const updateAgentApi = async (name: string, updates: UpdateAgentRequest): Promise<Agent> => {
  const res = await fetch(`${API_BASE}/gateway/agents/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const data = await res.json();

  if (!data.success && !data.mockMode) {
    throw new Error(data.error || 'Failed to update agent');
  }

  return data.agent || { name, ...updates };
};

// 删除 Agent
const deleteAgentApi = async (name: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/gateway/agents/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });

  const data = await res.json();

  if (!data.success && !data.mockMode) {
    throw new Error(data.error || 'Failed to delete agent');
  }
};

// 获取 Agent 详情
const fetchAgentDetail = async (name: string): Promise<Agent | null> => {
  const res = await fetch(`${API_BASE}/gateway/agents/${encodeURIComponent(name)}`);
  const data = await res.json();

  if (data.mockMode) {
    return mockAgents.find((a) => a.name === name) || null;
  }

  return data.agent || null;
};

// Hooks
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    refetchInterval: 30000,
  });
}

export function useAgent(name: string | null) {
  return useQuery({
    queryKey: ['agent', name],
    queryFn: () => fetchAgentDetail(name!),
    enabled: !!name,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: createAgentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      showToast('Agent 创建成功', 'success');
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '创建失败', 'error');
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ name, updates }: { name: string; updates: UpdateAgentRequest }) =>
      updateAgentApi(name, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', variables.name] });
      showToast('Agent 更新成功', 'success');
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '更新失败', 'error');
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: deleteAgentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      showToast('Agent 删除成功', 'success');
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : '删除失败', 'error');
    },
  });
}
