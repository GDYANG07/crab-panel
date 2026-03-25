import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  Code,
  FileText,
  Settings,
  FileJson,
  Check,
  ChevronRight,
  Sparkles,
  Shield,
  Folder,
  Terminal,
  Globe,
  Cpu,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import {
  Button,
  Card,
  Input,
  Select,
  Toggle,
  Badge,
  Modal,
  useToast,
  Spinner,
} from '../components/ui';
import {
  useAgents,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  soulTemplates,
  availableTools,
  type Agent,
  type CreateAgentRequest,
  type UpdateAgentRequest,
} from '../hooks/useAgents';

// 模型选项
const modelOptions = [
  { value: 'claude-4-opus', label: 'Claude 4 Opus' },
  { value: 'claude-4-sonnet', label: 'Claude 4 Sonnet' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'deepseek-coder', label: 'DeepSeek Coder' },
];

// 工具分类图标
const categoryIcons = {
  system: Cpu,
  browser: Globe,
  filesystem: Folder,
  custom: Terminal,
};

// 工具分类名称
const categoryNames = {
  system: '系统工具',
  browser: '浏览器',
  filesystem: '文件系统',
  custom: '自定义工具',
};

// 通道图标映射
const channelIcons: Record<string, string> = {
  telegram: '📱',
  slack: '💬',
  discord: '🎮',
  web: '🌐',
  email: '📧',
  wechat: '💚',
};

type ViewMode = 'list' | 'detail' | 'create';
type TabType = 'overview' | 'soul' | 'tools' | 'files' | 'json';

export function Agents() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  // 视图状态
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // 搜索
  const [searchQuery, setSearchQuery] = useState('');

  // 删除确认
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  // 数据获取
  const { data: agents, isLoading } = useAgents();

  // Mutations
  const updateMutation = useUpdateAgent();
  const deleteMutation = useDeleteAgent();

  // 过滤后的 Agents
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    if (!searchQuery.trim()) return agents;
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [agents, searchQuery]);

  // 处理编辑 Agent
  const handleEdit = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setViewMode('detail');
    setActiveTab('overview');
  }, []);

  // 处理删除
  const handleDelete = useCallback(async () => {
    if (!agentToDelete) return;
    await deleteMutation.mutateAsync(agentToDelete.name);
    setAgentToDelete(null);
  }, [agentToDelete, deleteMutation]);

  // 处理创建
  const handleCreate = useCallback(() => {
    setViewMode('create');
  }, []);

  // 返回列表
  const handleBack = useCallback(() => {
    setViewMode('list');
    setSelectedAgent(null);
  }, []);

  // 渲染列表视图
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
              <Bot className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                {t('page.agents.title', '智能体管理')}
              </h1>
              <p className="text-[var(--color-text-secondary)]">
                {t('page.agents.description', '创建和管理你的 AI 智能体')}
              </p>
            </div>
          </div>
          <Button variant="primary" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-1" />
            {t('agents.createNew', '创建新智能体')}
          </Button>
        </div>

        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <Input
            type="text"
            placeholder={t('agents.searchPlaceholder', '搜索智能体...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 加载状态 */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Spinner size="lg" />
          </div>
        ) : filteredAgents.length === 0 ? (
          /* 空状态 */
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
            <Bot className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              {searchQuery ? t('agents.noSearchResults', '没有找到匹配的 Agent') : t('agents.noAgents', '暂无 Agent')}
            </h3>
            <p className="text-[var(--color-text-secondary)] max-w-md mb-4">
              {searchQuery
                ? t('agents.tryDifferentSearch', '尝试其他搜索词')
                : t('agents.createPrompt', '点击右上角「创建新智能体」按钮创建你的第一个 OpenClaw Agent。')}
            </p>
            {!searchQuery && (
              <Button variant="outline" size="sm" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-1" />
                {t('agents.createNew', '创建新智能体')}
              </Button>
            )}
          </div>
        ) : (
          /* Agent 网格 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.name}
                agent={agent}
                onEdit={() => handleEdit(agent)}
                onDelete={() => setAgentToDelete(agent)}
              />
            ))}
          </div>
        )}

        {/* 删除确认弹窗 */}
        <Modal
          isOpen={!!agentToDelete}
          onClose={() => setAgentToDelete(null)}
          title={t('agents.deleteTitle', '删除 Agent')}
          footer={
            <>
              <Button variant="ghost" onClick={() => setAgentToDelete(null)} disabled={deleteMutation.isPending}>
                {t('common.cancel', '取消')}
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
                {t('common.delete', '删除')}
              </Button>
            </>
          }
        >
          <p className="text-[var(--color-text-primary)]">
            {t('agents.deleteConfirm', '确定要删除 Agent')}「{agentToDelete?.name}」吗？此操作无法撤销。
          </p>
        </Modal>
      </div>
    );
  }

  // 渲染创建向导
  if (viewMode === 'create') {
    return (
      <CreateWizard
        onCancel={handleBack}
        onCreated={() => {
          handleBack();
          showToast(t('agents.createSuccess', 'Agent 创建成功'), 'success');
        }}
      />
    );
  }

  // 渲染详情编辑
  if (viewMode === 'detail' && selectedAgent) {
    return (
      <AgentDetail
        agent={selectedAgent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={handleBack}
        onUpdate={(updates) => {
          updateMutation.mutate({ name: selectedAgent.name, updates });
        }}
        isUpdating={updateMutation.isPending}
      />
    );
  }

  return null;
}

// Agent 卡片组件
interface AgentCardProps {
  agent: Agent;
  onEdit: () => void;
  onDelete: () => void;
}

function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      onClick={onEdit}
      className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5 cursor-pointer hover:shadow-lg hover:border-[var(--color-primary)]/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
            <Bot className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)] text-lg">{agent.name}</h3>
            <Badge variant={agent.status === 'active' ? 'success' : 'default'} size="sm">
              {agent.status === 'active' ? '活跃' : '停用'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEditClick}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2">
        {agent.description || '暂无描述'}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-1">
          {agent.channels?.map((channel) => (
            <span key={channel} className="text-lg" title={channel}>
              {channelIcons[channel] || '📡'}
            </span>
          ))}
          {(!agent.channels || agent.channels.length === 0) && (
            <span className="text-sm text-[var(--color-text-secondary)]">未连接通道</span>
          )}
        </div>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {agent.model || '默认模型'}
        </span>
      </div>
    </div>
  );
}

// Agent 详情组件
interface AgentDetailProps {
  agent: Agent;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onBack: () => void;
  onUpdate: (updates: UpdateAgentRequest) => void;
  isUpdating: boolean;
}

function AgentDetail({ agent, activeTab, onTabChange, onBack, onUpdate, isUpdating }: AgentDetailProps) {
  const { t } = useTranslation();

  // 本地编辑状态
  const [localAgent, setLocalAgent] = useState<Agent>(agent);
  const [jsonValue, setJsonValue] = useState(JSON.stringify(agent, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // 当 agent 变化时更新本地状态
  useState(() => {
    setLocalAgent(agent);
    setJsonValue(JSON.stringify(agent, null, 2));
  });

  const tabs = [
    { id: 'overview' as TabType, label: t('agents.tabs.overview', '概览'), icon: Settings },
    { id: 'soul' as TabType, label: t('agents.tabs.soul', '人格与身份'), icon: Sparkles },
    { id: 'tools' as TabType, label: t('agents.tabs.tools', '工具与权限'), icon: Shield },
    { id: 'files' as TabType, label: t('agents.tabs.files', '核心文件'), icon: FileText },
    { id: 'json' as TabType, label: t('agents.tabs.json', '高级 JSON'), icon: FileJson },
  ];

  const handleSave = () => {
    if (activeTab === 'json') {
      try {
        const parsed = JSON.parse(jsonValue);
        onUpdate(parsed);
      } catch (e) {
        setJsonError(t('config.invalidJson', '无效的 JSON'));
        return;
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name, ...updates } = localAgent;
      onUpdate(updates);
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('common.back', '返回')}
          </Button>
          <div className="h-6 w-px bg-[var(--color-border)]" />
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{agent.name}</h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              {t('agents.editing', '编辑 Agent 配置')}
            </p>
          </div>
        </div>
        <Button variant="primary" onClick={handleSave} loading={isUpdating}>
          <Save className="w-4 h-4 mr-1" />
          {t('common.save', '保存')}
        </Button>
      </div>

      {/* Tab 导航 */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <OverviewTab agent={localAgent} onChange={setLocalAgent} />
        )}
        {activeTab === 'soul' && <SoulTab agent={localAgent} onChange={setLocalAgent} />}
        {activeTab === 'tools' && <ToolsTab agent={localAgent} onChange={setLocalAgent} />}
        {activeTab === 'files' && <FilesTab agent={localAgent} onChange={setLocalAgent} />}
        {activeTab === 'json' && (
          <JsonTab
            value={jsonValue}
            error={jsonError}
            onChange={setJsonValue}
            onError={setJsonError}
          />
        )}
      </div>
    </div>
  );
}

// 概览 Tab
interface TabProps {
  agent: Agent;
  onChange: (agent: Agent) => void;
}

function OverviewTab({ agent, onChange }: TabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <div className="space-y-6">
          <Input
            label={t('agents.name', '名称')}
            value={agent.name}
            disabled
            helperText={t('agents.nameHelper', 'Agent 名称创建后不可修改')}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              {t('agents.description', '描述')}
            </label>
            <textarea
              value={agent.description || ''}
              onChange={(e) => onChange({ ...agent, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] resize-none"
              placeholder={t('agents.descriptionPlaceholder', '描述这个 Agent 的用途...')}
            />
          </div>

          <Select
            label={t('agents.model', '主模型')}
            value={agent.model || ''}
            onChange={(value) => onChange({ ...agent, model: value })}
            options={modelOptions}
            placeholder={t('agents.selectModel', '选择模型')}
          />

          <Toggle
            label={t('agents.status', '状态')}
            description={t('agents.statusDesc', '启用或停用此 Agent')}
            checked={agent.status === 'active'}
            onChange={(checked) => onChange({ ...agent, status: checked ? 'active' : 'inactive' })}
          />
        </div>
      </Card>
    </div>
  );
}

// 人格与身份 Tab
function SoulTab({ agent, onChange }: TabProps) {
  const { t } = useTranslation();

  const applyTemplate = (templateKey: keyof typeof soulTemplates) => {
    onChange({ ...agent, soul: soulTemplates[templateKey].content });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-[var(--color-text-secondary)] mr-2">
          {t('agents.quickTemplates', '快速模板:')}
        </span>
        {Object.entries(soulTemplates).map(([key, template]) => (
          <button
            key={key}
            onClick={() => applyTemplate(key as keyof typeof soulTemplates)}
            className="px-3 py-1.5 text-sm bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
          >
            {template.name}
          </button>
        ))}
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              {t('agents.soulEditor', 'SOUL 编辑器')}
            </label>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {t('agents.soulDesc', '定义 Agent 的人格、行为和响应方式')}
            </span>
          </div>
          <textarea
            value={agent.soul || ''}
            onChange={(e) => onChange({ ...agent, soul: e.target.value })}
            rows={15}
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] font-mono text-sm resize-y min-h-[300px]"
            placeholder={t('agents.soulPlaceholder', '在这里输入 Agent 的人格指令...')}
          />
        </div>
      </Card>
    </div>
  );
}

// 工具与权限 Tab
function ToolsTab({ agent, onChange }: TabProps) {
  const { t } = useTranslation();

  const tools = agent.tools || { enabled: [], requireApproval: false, sandboxMode: true };

  const toggleTool = (toolName: string) => {
    const enabled = tools.enabled.includes(toolName)
      ? tools.enabled.filter((t) => t !== toolName)
      : [...tools.enabled, toolName];
    onChange({ ...agent, tools: { ...tools, enabled } });
  };

  const toolsByCategory = availableTools.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<string, typeof availableTools>
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-4">
              {t('agents.toolsList', '工具列表')}
            </h3>

            <div className="space-y-6">
              {Object.entries(toolsByCategory).map(([category, categoryTools]) => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons];
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4 text-[var(--color-primary)]" />
                      <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">
                        {categoryNames[category as keyof typeof categoryNames]}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {categoryTools.map((tool) => (
                        <div
                          key={tool.name}
                          className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors"
                        >
                          <div>
                            <div className="font-medium text-[var(--color-text-primary)]">
                              {tool.name}
                            </div>
                            <div className="text-sm text-[var(--color-text-secondary)]">
                              {tool.description}
                            </div>
                          </div>
                          <Toggle
                            checked={tools.enabled.includes(tool.name)}
                            onChange={() => toggleTool(tool.name)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)] space-y-4">
            <Toggle
              label={t('agents.requireApproval', '执行审批')}
              description={t('agents.requireApprovalDesc', '敏感操作需要用户确认')}
              checked={tools.requireApproval}
              onChange={(checked) => onChange({ ...agent, tools: { ...tools, requireApproval: checked } })}
            />
            <Toggle
              label={t('agents.sandboxMode', '沙箱模式')}
              description={t('agents.sandboxModeDesc', '在受限环境中运行')}
              checked={tools.sandboxMode}
              onChange={(checked) => onChange({ ...agent, tools: { ...tools, sandboxMode: checked } })}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

// 核心文件 Tab
function FilesTab({ agent, onChange }: TabProps) {
  const { t } = useTranslation();
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');

  const files = agent.files || {};

  const openFile = (fileName: string) => {
    setEditingFile(fileName);
    setFileContent(files[fileName] || '');
  };

  const saveFile = () => {
    if (editingFile) {
      onChange({
        ...agent,
        files: { ...files, [editingFile]: fileContent },
      });
      setEditingFile(null);
    }
  };

  const fileList = [
    { key: 'memories', label: t('agents.fileMemories', 'memories.txt'), desc: t('agents.fileMemoriesDesc', 'Agent 的长期记忆') },
    { key: 'identity', label: t('agents.fileIdentity', 'identity.txt'), desc: t('agents.fileIdentityDesc', 'Agent 的身份信息') },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {fileList.map((file) => (
          <div
            key={file.key}
            onClick={() => openFile(file.key)}
            className="flex items-center gap-4 p-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl cursor-pointer hover:border-[var(--color-primary)]/30 transition-colors"
          >
            <div className="p-3 rounded-lg bg-[var(--color-primary-light)]">
              <FileText className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-[var(--color-text-primary)]">{file.label}</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">{file.desc}</p>
            </div>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* 文件编辑弹窗 */}
      <Modal
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        title={editingFile ? fileList.find((f) => f.key === editingFile)?.label : ''}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingFile(null)}>
              {t('common.cancel', '取消')}
            </Button>
            <Button variant="primary" onClick={saveFile}>
              <Save className="w-4 h-4 mr-1" />
              {t('common.save', '保存')}
            </Button>
          </>
        }
      >
        <div className="h-[400px] border border-[var(--color-border)] rounded-lg overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={fileContent}
            onChange={(value) => setFileContent(value || '')}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              folding: true,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
            theme="vs"
          />
        </div>
      </Modal>
    </div>
  );
}

// JSON Tab
interface JsonTabProps {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onError: (error: string | null) => void;
}

function JsonTab({ value, error, onChange, onError }: JsonTabProps) {
  const { t } = useTranslation();

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
      onError(null);
    } catch (e) {
      onError(t('config.invalidJson', '无效的 JSON'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t('agents.jsonWarning', '直接编辑 JSON 可能破坏配置，请谨慎操作')}
        </p>
        <Button variant="secondary" size="sm" onClick={handleFormat}>
          <Code className="w-4 h-4 mr-1" />
          {t('config.format', '格式化')}
        </Button>
      </div>

      <div className="h-[500px] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={value}
          onChange={(v) => {
            onChange(v || '');
            onError(null);
          }}
          options={{
            minimap: { enabled: false },
            lineNumbers: 'on',
            folding: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
          }}
          theme="vs"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[var(--color-danger)] text-sm">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// 创建向导组件
interface CreateWizardProps {
  onCancel: () => void;
  onCreated: () => void;
}

function CreateWizard({ onCancel, onCreated }: CreateWizardProps) {
  const { t } = useTranslation();
  const createMutation = useCreateAgent();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    description: '',
    soul: '',
    model: 'claude-3.5-sonnet',
    tools: {
      enabled: ['chat', 'memory', 'think'],
      requireApproval: false,
      sandboxMode: true,
    },
  });

  const totalSteps = 3;

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length >= 2;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleCreate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  };

  const handleCreate = async () => {
    await createMutation.mutateAsync(formData);
    onCreated();
  };

  const applyTemplate = (templateKey: keyof typeof soulTemplates) => {
    setFormData({ ...formData, soul: soulTemplates[templateKey].content });
  };

  const toggleTool = (toolName: string) => {
    const enabled = formData.tools?.enabled.includes(toolName)
      ? (formData.tools?.enabled || []).filter((t) => t !== toolName)
      : [...(formData.tools?.enabled || []), toolName];
    setFormData({ ...formData, tools: { ...formData.tools!, enabled } });
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {step === 1 ? t('common.cancel', '取消') : t('common.back', '上一步')}
        </Button>
        <div className="h-6 w-px bg-[var(--color-border)]" />
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {t('agents.createNew', '创建新智能体')}
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            {t('agents.step', '步骤')} {step} / {totalSteps}
          </p>
        </div>
      </div>

      {/* 进度条 */}
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i < step ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
            }`}
          />
        ))}
      </div>

      {/* 步骤内容 */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <Card className="max-w-xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-1">
                  {t('agents.step1Title', '基本信息')}
                </h3>
                <p className="text-[var(--color-text-secondary)]">
                  {t('agents.step1Desc', '设置 Agent 的基本信息')}
                </p>
              </div>

              <Input
                label={t('agents.name', '名称')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('agents.namePlaceholder', '给你的 Agent 起个名字')}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                  {t('agents.description', '描述')}
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] resize-none"
                  placeholder={t('agents.descriptionPlaceholder', '描述这个 Agent 的用途...')}
                />
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-1">
                  {t('agents.step2Title', '人格与身份')}
                </h3>
                <p className="text-[var(--color-text-secondary)]">
                  {t('agents.step2Desc', '选择人格模板或自定义')}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(soulTemplates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => applyTemplate(key as keyof typeof soulTemplates)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      formData.soul === template.content
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'
                    }`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>

              <textarea
                value={formData.soul || ''}
                onChange={(e) => setFormData({ ...formData, soul: e.target.value })}
                rows={12}
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] font-mono text-sm resize-y min-h-[250px]"
                placeholder={t('agents.soulPlaceholder', '定义 Agent 的人格和行为方式...')}
              />
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-1">
                  {t('agents.step3Title', '工具与权限')}
                </h3>
                <p className="text-[var(--color-text-secondary)]">
                  {t('agents.step3Desc', '选择 Agent 可以使用的工具')}
                </p>
              </div>

              <div className="space-y-4">
                {availableTools.slice(0, 6).map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)]"
                  >
                    <div>
                      <div className="font-medium text-[var(--color-text-primary)]">{tool.name}</div>
                      <div className="text-sm text-[var(--color-text-secondary)]">{tool.description}</div>
                    </div>
                    <Toggle
                      checked={formData.tools?.enabled.includes(tool.name) || false}
                      onChange={() => toggleTool(tool.name)}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[var(--color-border)] space-y-4">
                <Toggle
                  label={t('agents.requireApproval', '执行审批')}
                  description={t('agents.requireApprovalDesc', '敏感操作需要用户确认')}
                  checked={formData.tools?.requireApproval || false}
                  onChange={(checked) =>
                    setFormData({ ...formData, tools: { ...formData.tools!, requireApproval: checked } })
                  }
                />
                <Toggle
                  label={t('agents.sandboxMode', '沙箱模式')}
                  description={t('agents.sandboxModeDesc', '在受限环境中运行')}
                  checked={formData.tools?.sandboxMode !== false}
                  onChange={(checked) =>
                    setFormData({ ...formData, tools: { ...formData.tools!, sandboxMode: checked } })
                  }
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={handleBack}>
          {step === 1 ? t('common.cancel', '取消') : t('common.back', '上一步')}
        </Button>
        <Button variant="primary" onClick={handleNext} disabled={!canProceed()} loading={createMutation.isPending}>
          {step === totalSteps ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              {t('agents.create', '创建')}
            </>
          ) : (
            <>
              {t('common.next', '下一步')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
