import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Workflow,
  Plus,
  Search,
  ArrowLeft,
  Save,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  Settings,
  CheckCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Select,
  Toggle,
  Badge,
  Modal,
  Spinner,
} from '../components/ui';
import {
  useChannels,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
  useTestChannelConnection,
  channelGroups,
  channelGroupNames,
  channelMetadata,
  type Channel,
  type ChannelType,
  type ChannelConfig,
} from '../hooks/useChannels';

type ViewMode = 'list' | 'detail';
type ChannelGroup = keyof typeof channelGroups;

// 消息格式选项
const messageFormatOptions = [
  { value: 'text', label: '纯文本' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
];

// 分组顺序
const groupOrder: ChannelGroup[] = ['domestic', 'international', 'other'];

export function Channels() {
  const { t } = useTranslation();

  // 视图状态
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // 搜索
  const [searchQuery, setSearchQuery] = useState('');

  // 添加通道 Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null);

  // 数据获取
  const { data: channels, isLoading } = useChannels();

  // Mutations
  const createMutation = useCreateChannel();
  const updateMutation = useUpdateChannel();
  const deleteMutation = useDeleteChannel();
  const testConnection = useTestChannelConnection();

  // 过滤后的通道
  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    if (!searchQuery.trim()) return channels;
    return channels.filter(
      (channel) =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);

  // 按分组组织的通道
  const groupedChannels = useMemo(() => {
    const grouped: Record<ChannelGroup, Channel[]> = {
      domestic: [],
      international: [],
      other: [],
    };

    filteredChannels.forEach((channel) => {
      for (const group of groupOrder) {
        if (channelGroups[group].includes(channel.type)) {
          grouped[group].push(channel);
          break;
        }
      }
    });

    return grouped;
  }, [filteredChannels]);

  // 处理编辑通道
  const handleEdit = useCallback((channel: Channel) => {
    setSelectedChannel(channel);
    setViewMode('detail');
  }, []);

  // 处理删除
  const handleDelete = useCallback(
    async (channel: Channel) => {
      await deleteMutation.mutateAsync(channel.id);
    },
    [deleteMutation]
  );

  // 处理返回列表
  const handleBack = useCallback(() => {
    setViewMode('list');
    setSelectedChannel(null);
  }, []);

  // 处理添加通道
  const handleAdd = useCallback(
    async (type: ChannelType, name: string, config: ChannelConfig) => {
      await createMutation.mutateAsync({ type, name, config });
      setShowAddModal(false);
      setSelectedType(null);
    },
    [createMutation]
  );

  // 渲染列表视图
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
              <Workflow className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                {t('page.channels.title', '通道管理')}
              </h1>
              <p className="text-[var(--color-text-secondary)]">
                {t('page.channels.description', '配置和管理通讯通道')}
              </p>
            </div>
          </div>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t('channels.addChannel', '添加通道')}
          </Button>
        </div>

        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <Input
            type="text"
            placeholder={t('channels.searchPlaceholder', '搜索通道...')}
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
        ) : filteredChannels.length === 0 ? (
          /* 空状态 */
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
            <Workflow className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              {searchQuery ? t('channels.noSearchResults', '没有找到匹配的通道') : t('channels.noChannels', '暂无通道配置')}
            </h3>
            <p className="text-[var(--color-text-secondary)] max-w-md mb-4">
              {searchQuery
                ? t('channels.tryDifferentSearch', '尝试其他搜索词')
                : t('channels.addPrompt', '添加 Slack、Discord、邮件等通讯通道，让 Agent 可以与外部世界交互。')}
            </p>
            {!searchQuery && (
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-1" />
                {t('channels.addChannel', '添加通道')}
              </Button>
            )}
          </div>
        ) : (
          /* 按分组的通道列表 */
          <div className="space-y-8">
            {groupOrder.map((group) => {
              const groupChannels = groupedChannels[group];
              if (groupChannels.length === 0) return null;

              return (
                <div key={group}>
                  <h2 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
                    {channelGroupNames[group]}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupChannels.map((channel) => (
                      <ChannelCard
                        key={channel.id}
                        channel={channel}
                        onEdit={() => handleEdit(channel)}
                        onDelete={() => handleDelete(channel)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 添加通道 Modal */}
        <AddChannelModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedType(null);
          }}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          onAdd={handleAdd}
          isLoading={createMutation.isPending}
        />
      </div>
    );
  }

  // 渲染详情编辑
  if (viewMode === 'detail' && selectedChannel) {
    return (
      <ChannelDetail
        channel={selectedChannel}
        onBack={handleBack}
        onUpdate={(updates) => {
          updateMutation.mutate({ id: selectedChannel.id, updates });
        }}
        onTest={() => testConnection.mutate(selectedChannel.id)}
        isUpdating={updateMutation.isPending}
        isTesting={testConnection.isPending}
      />
    );
  }

  return null;
}

// 通道卡片组件
interface ChannelCardProps {
  channel: Channel;
  onEdit: () => void;
  onDelete: () => void;
}

function ChannelCard({ channel, onEdit, onDelete }: ChannelCardProps) {
  const meta = channelMetadata[channel.type];

  return (
    <div
      onClick={onEdit}
      className={`bg-[var(--color-card)] border-2 rounded-xl p-5 cursor-pointer hover:shadow-lg transition-all group ${
        channel.connected ? 'border-green-400' : 'border-[var(--color-border)]'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{meta.icon}</span>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)] text-lg">{channel.name}</h3>
            <div className="flex items-center gap-2">
              <Badge
                variant={channel.connected ? 'success' : 'default'}
                size="sm"
              >
                {channel.connected ? '已连接' : '未连接'}
              </Badge>
              {channel.status === 'error' && (
                <Badge variant="danger" size="sm">
                  配置错误
                </Badge>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-1">
        {channel.description || meta.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
          <MessageSquare className="w-4 h-4" />
          <span>{channel.messageCount.toLocaleString()} 条消息</span>
        </div>
        <span className="text-xs text-[var(--color-text-secondary)]">{meta.name}</span>
      </div>
    </div>
  );
}

// 通道详情组件
interface ChannelDetailProps {
  channel: Channel;
  onBack: () => void;
  onUpdate: (updates: { name?: string; config?: ChannelConfig }) => void;
  onTest: () => void;
  isUpdating: boolean;
  isTesting: boolean;
}

function ChannelDetail({ channel, onBack, onUpdate, onTest, isUpdating, isTesting }: ChannelDetailProps) {
  const { t } = useTranslation();
  const [localName, setLocalName] = useState(channel.name);
  const [localConfig, setLocalConfig] = useState<ChannelConfig>(channel.config || {});

  const meta = channelMetadata[channel.type];

  const handleSave = () => {
    onUpdate({ name: localName, config: localConfig });
  };

  // 根据通道类型渲染不同的配置表单
  const renderConfigForm = () => {
    switch (channel.type) {
      case 'telegram':
        return (
          <div className="space-y-4">
            <Input
              label="Bot Token"
              type="password"
              value={localConfig.botToken || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, botToken: e.target.value })}
              placeholder="输入 Telegram Bot Token"
              helperText="从 @BotFather 获取"
            />
            <Input
              label="Webhook URL"
              type="text"
              value={localConfig.webhookUrl || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, webhookUrl: e.target.value })}
              placeholder="https://your-domain.com/webhook"
              helperText="可选，用于接收实时消息"
            />
          </div>
        );

      case 'dingtalk':
        return (
          <div className="space-y-4">
            <Input
              label="App Key"
              type="text"
              value={localConfig.appKey || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, appKey: e.target.value })}
              placeholder="钉钉 App Key"
            />
            <Input
              label="App Secret"
              type="password"
              value={localConfig.appSecret || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, appSecret: e.target.value })}
              placeholder="钉钉 App Secret"
            />
            <Input
              label="Robot Webhook"
              type="text"
              value={localConfig.robotWebhook || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, robotWebhook: e.target.value })}
              placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxx"
            />
          </div>
        );

      case 'feishu':
        return (
          <div className="space-y-4">
            <Input
              label="App ID"
              type="text"
              value={localConfig.appId || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, appId: e.target.value })}
              placeholder="飞书 App ID"
            />
            <Input
              label="App Secret"
              type="password"
              value={localConfig.appSecret || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, appSecret: e.target.value })}
              placeholder="飞书 App Secret"
            />
          </div>
        );

      case 'wecom':
        return (
          <div className="space-y-4">
            <Input
              label="Corp ID"
              type="text"
              value={localConfig.corpId || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, corpId: e.target.value })}
              placeholder="企业微信 Corp ID"
            />
            <Input
              label="Agent ID"
              type="text"
              value={localConfig.agentId || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, agentId: e.target.value })}
              placeholder="应用 Agent ID"
            />
            <Input
              label="Secret"
              type="password"
              value={localConfig.secret || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, secret: e.target.value })}
              placeholder="应用 Secret"
            />
          </div>
        );

      case 'discord':
        return (
          <div className="space-y-4">
            <Input
              label="Bot Token"
              type="password"
              value={localConfig.botToken || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, botToken: e.target.value })}
              placeholder="Discord Bot Token"
            />
            <Input
              label="Guild ID"
              type="text"
              value={localConfig.guildId || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, guildId: e.target.value })}
              placeholder="Discord 服务器 ID"
              helperText="可选，用于限制 bot 只在特定服务器工作"
            />
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-4">
            <Input
              label="Phone Number"
              type="text"
              value={localConfig.phoneNumber || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, phoneNumber: e.target.value })}
              placeholder="WhatsApp 电话号码"
            />
            <Input
              label="API Key"
              type="password"
              value={localConfig.apiKey || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
              placeholder="WhatsApp Business API Key"
            />
          </div>
        );

      default:
        return (
          <div className="p-4 bg-[var(--color-background)] rounded-lg text-[var(--color-text-secondary)]">
            该通道类型的配置表单正在开发中
          </div>
        );
    }
  };

  // 获取配置状态
  const getConfigStatus = () => {
    if (channel.status === 'error') {
      return { icon: AlertTriangle, color: 'text-[var(--color-danger)]', text: '配置有误' };
    }
    if (channel.config && Object.keys(channel.config).some((k) => channel.config?.[k])) {
      return { icon: CheckCircle, color: 'text-[var(--color-success)]', text: '已配置' };
    }
    return { icon: Settings, color: 'text-[var(--color-text-secondary)]', text: '未配置' };
  };

  const configStatus = getConfigStatus();
  const StatusIcon = configStatus.icon;

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
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.icon}</span>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{channel.name}</h1>
              <p className="text-[var(--color-text-secondary)] text-sm">{meta.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 ${configStatus.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm">{configStatus.text}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：基本信息 */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="space-y-4">
              <h3 className="font-medium text-[var(--color-text-primary)]">基本信息</h3>
              <Input
                label="通道名称"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="输入通道名称"
              />
              <Toggle
                label="启用通道"
                description="启用后 Agent 可以通过此通道收发消息"
                checked={localConfig.enabled !== false}
                onChange={(checked) => setLocalConfig({ ...localConfig, enabled: checked })}
              />
              <Select
                label="消息格式"
                value={localConfig.messageFormat || 'text'}
                onChange={(value) => setLocalConfig({ ...localConfig, messageFormat: value as 'text' | 'markdown' | 'html' })}
                options={messageFormatOptions}
              />
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <h3 className="font-medium text-[var(--color-text-primary)]">操作</h3>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={onTest}
                  loading={isTesting}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  测试连接
                </Button>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleSave}
                  loading={isUpdating}
                >
                  <Save className="w-4 h-4 mr-1" />
                  保存配置
                </Button>
              </div>
            </div>
          </Card>

          {/* 状态卡片 */}
          <div className={`p-4 rounded-xl border-2 ${
            channel.connected ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              {channel.connected ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <div className="font-medium text-[var(--color-text-primary)]">
                  {channel.connected ? '已连接' : '未连接'}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  {channel.connected ? '通道正常工作' : '需要配置或检查连接'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：配置表单 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-[var(--color-text-primary)] mb-1">通道配置</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  配置 {meta.name} 的连接参数
                </p>
              </div>
              {renderConfigForm()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// 添加通道 Modal
interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedType: ChannelType | null;
  onSelectType: (type: ChannelType) => void;
  onAdd: (type: ChannelType, name: string, config: ChannelConfig) => void;
  isLoading: boolean;
}

function AddChannelModal({
  isOpen,
  onClose,
  selectedType,
  onSelectType,
  onAdd,
  isLoading,
}: AddChannelModalProps) {
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (selectedType && name.trim()) {
      onAdd(selectedType, name.trim(), { enabled: true, messageFormat: 'text' });
      setName('');
    }
  };

  const handleClose = () => {
    onClose();
    setName('');
  };

  // 按分组组织通道类型
  const groupedTypes = useMemo(() => {
    const grouped: Record<ChannelGroup, ChannelType[]> = {
      domestic: [],
      international: [],
      other: [],
    };

    (Object.keys(channelMetadata) as ChannelType[]).forEach((type) => {
      for (const group of groupOrder) {
        if (channelGroups[group].includes(type)) {
          grouped[group].push(type);
          break;
        }
      }
    });

    return grouped;
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedType ? '配置通道' : '添加通道'}
      size="lg"
      footer={
        selectedType ? (
          <>
            <Button variant="ghost" onClick={() => onSelectType(null as unknown as ChannelType)}>
              返回选择
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={!name.trim()}
              loading={isLoading}
            >
              <Check className="w-4 h-4 mr-1" />
              添加
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={handleClose}>
            取消
          </Button>
        )
      }
    >
      {selectedType ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-[var(--color-primary-light)] rounded-lg">
            <span className="text-3xl">{channelMetadata[selectedType].icon}</span>
            <div>
              <div className="font-medium text-[var(--color-text-primary)]">
                {channelMetadata[selectedType].name}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {channelMetadata[selectedType].description}
              </div>
            </div>
          </div>
          <Input
            label="通道名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`例如：我的${channelMetadata[selectedType].name}机器人`}
            autoFocus
          />
        </div>
      ) : (
        <div className="space-y-6">
          {groupOrder.map((group) => (
            <div key={group}>
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                {channelGroupNames[group]}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {groupedTypes[group].map((type) => (
                  <button
                    key={type}
                    onClick={() => onSelectType(type)}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all"
                  >
                    <span className="text-3xl">{channelMetadata[type].icon}</span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {channelMetadata[type].name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
