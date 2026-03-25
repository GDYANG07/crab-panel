import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Save,
  Code,
  FileJson,
  List,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  AlertCircle,
  Play,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Input,
  Select,
  Toggle,
  ToggleGroup,
  Modal,
  useToast,
  Spinner,
} from '../components/ui';
import {
  getConfig,
  saveConfig,
  testConnection,
  restartGateway,
  configToJson,
  jsonToConfig,
  type OpenClawConfig,
} from '../services/config';

// AI 服务商选项
const providerOptions = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
];

// 认证模式选项
const authOptions = [
  { value: 'token', label: 'Token' },
  { value: 'password', label: 'Password' },
  { value: 'none', label: 'None' },
];

// 工具权限选项
const toolProfileOptions = [
  { value: 'full', label: 'Full (全部工具)' },
  { value: 'messaging', label: 'Messaging (仅消息)' },
  { value: 'custom', label: 'Custom (自定义)' },
];

// 根据服务商获取可用模型
function getModelsByProvider(provider: string): string[] {
  switch (provider) {
    case 'anthropic':
      return ['claude-4-opus', 'claude-4-sonnet', 'claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku'];
    case 'openai':
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
    case 'deepseek':
      return ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];
    case 'ollama':
      return ['llama3', 'llama3:70b', 'mistral', 'codellama', 'qwen'];
    default:
      return [];
  }
}

export function Config() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // 模式状态
  const [jsonMode, setJsonMode] = useState(false);

  // 配置状态
  const [config, setConfig] = useState<OpenClawConfig>({});

  // JSON 编辑器状态
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // 密码显示状态
  const [showApiKey, setShowApiKey] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // 测试连接状态
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // 重启确认弹窗状态
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // 获取配置
  const {
    data: fetchedConfig,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });

  // 初始化配置
  useEffect(() => {
    if (fetchedConfig) {
      setConfig(fetchedConfig);
      setJsonValue(configToJson(fetchedConfig));
    }
  }, [fetchedConfig]);

  // 保存配置 mutation
  const saveMutation = useMutation({
    mutationFn: saveConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      showToast(t('config.saveSuccess'), 'success');
      // 显示重启确认弹窗
      setShowRestartModal(true);
    },
    onError: (error) => {
      showToast(error.message || t('config.saveError'), 'error');
    },
  });

  // 处理配置字段更新
  const updateConfig = useCallback((path: string, value: unknown) => {
    setConfig((prev) => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = newConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  }, []);

  // 处理保存
  const handleSave = useCallback(() => {
    if (jsonMode) {
      // JSON 模式下，先验证 JSON
      try {
        const parsed = jsonToConfig(jsonValue);
        saveMutation.mutate(parsed);
      } catch (e) {
        setJsonError(t('config.invalidJson'));
        showToast(t('config.invalidJson'), 'error');
        return;
      }
    } else {
      // 表单模式直接保存
      saveMutation.mutate(config);
    }
  }, [jsonMode, jsonValue, config, saveMutation, showToast, t]);

  // 处理 JSON 格式化
  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonValue);
      setJsonValue(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e) {
      setJsonError(t('config.invalidJson'));
    }
  }, [jsonValue, t]);

  // 处理 JSON 变更
  const handleJsonChange = useCallback((value: string | undefined) => {
    setJsonValue(value || '');
    setJsonError(null);
  }, []);

  // 处理测试连接
  const handleTestConnection = useCallback(async () => {
    setTestStatus('testing');
    setTestMessage('');

    const result = await testConnection(
      config.model?.provider || '',
      config.model?.apiKey || '',
      config.model?.baseUrl,
      config.model?.model
    );

    if (result.success) {
      setTestStatus('success');
      setTestMessage(result.message || '');
      showToast(t('config.testSuccess'), 'success');
    } else {
      setTestStatus('error');
      setTestMessage(result.error || '');
      showToast(result.error || t('config.testError'), 'error');
    }
  }, [config.model, showToast, t]);

  // 处理重启 Gateway
  const handleRestart = useCallback(async () => {
    setIsRestarting(true);
    try {
      await restartGateway();
      showToast(t('config.restartSuccess'), 'success');
      setShowRestartModal(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('config.restartError'), 'error');
    } finally {
      setIsRestarting(false);
    }
  }, [showToast, t]);

  // 加载中状态
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
            <Settings className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {t('page.config.title')}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {t('page.config.description')}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  // 错误状态
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
            <Settings className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {t('page.config.title')}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {t('page.config.description')}
            </p>
          </div>
        </div>
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
          <p className="text-[var(--color-danger)]">{t('config.loadError')}</p>
          <p className="text-[var(--color-text-secondary)] text-sm mt-2">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </Card>
      </div>
    );
  }

  // 获取当前服务商的模型列表
  const modelOptions = getModelsByProvider(config.model?.provider || '').map((m) => ({
    value: m,
    label: m,
  }));

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
            <Settings className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {t('page.config.title')}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {t('page.config.description')}
            </p>
          </div>
        </div>

        {/* 模式切换 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[var(--color-background)] rounded-lg p-1 border border-[var(--color-border)]">
            <button
              onClick={() => setJsonMode(false)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                !jsonMode
                  ? 'bg-white text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <List className="w-4 h-4" />
              {t('config.formMode')}
            </button>
            <button
              onClick={() => setJsonMode(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                jsonMode
                  ? 'bg-white text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <FileJson className="w-4 h-4" />
              {t('config.jsonMode')}
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={saveMutation.isPending}
          >
            <Save className="w-4 h-4" />
            {t('common.save')}
          </Button>
        </div>
      </div>

      {/* JSON 模式 */}
      {jsonMode ? (
        <Card className="h-[calc(100vh-200px)] min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {t('config.jsonEditor')}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('config.jsonEditorDesc')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleFormat}>
                <Code className="w-4 h-4" />
                {t('config.format')}
              </Button>
            </div>
          </div>

          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden flex-1" style={{ height: 'calc(100% - 80px)' }}>
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonValue}
              onChange={handleJsonChange}
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

          {jsonError && (
            <div className="mt-4 flex items-center gap-2 text-[var(--color-danger)] text-sm">
              <AlertCircle className="w-4 h-4" />
              {jsonError}
            </div>
          )}
        </Card>
      ) : (
        /* 表单模式 */
        <div className="space-y-6">
          {/* 第一组：模型配置 */}
          <Card title={t('config.modelConfig')} description={t('config.modelConfigDesc')}>
            <div className="space-y-6">
              <Select
                label={t('config.provider')}
                value={config.model?.provider || ''}
                onChange={(value) => updateConfig('model.provider', value)}
                options={providerOptions}
                placeholder={t('config.selectProvider')}
              />

              <div className="relative">
                <Input
                  label={t('config.apiKey')}
                  type={showApiKey ? 'text' : 'password'}
                  value={config.model?.apiKey || ''}
                  onChange={(e) => updateConfig('model.apiKey', e.target.value)}
                  placeholder={t('config.apiKeyPlaceholder')}
                  suffix={
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              {['ollama', 'openai-compatible'].includes(config.model?.provider || '') && (
                <Input
                  label={t('config.baseUrl')}
                  type="text"
                  value={config.model?.baseUrl || ''}
                  onChange={(e) => updateConfig('model.baseUrl', e.target.value)}
                  placeholder={t('config.baseUrlPlaceholder')}
                />
              )}

              <Select
                label={t('config.model')}
                value={config.model?.model || ''}
                onChange={(value) => updateConfig('model.model', value)}
                options={modelOptions}
                placeholder={t('config.selectModel')}
                disabled={modelOptions.length === 0}
              />

              <Select
                label={t('config.fallbackModel')}
                value={config.model?.fallbackModel || ''}
                onChange={(value) => updateConfig('model.fallbackModel', value)}
                options={[
                  { value: '', label: t('config.none') },
                  ...modelOptions.filter((o) => o.value !== config.model?.model),
                ]}
                placeholder={t('config.selectFallbackModel')}
                disabled={modelOptions.length === 0}
              />

              {/* 测试连接按钮 */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestConnection}
                  loading={testStatus === 'testing'}
                  disabled={!config.model?.apiKey}
                >
                  {testStatus === 'testing' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : testStatus === 'success' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {t('config.testConnection')}
                </Button>

                {testStatus === 'success' && (
                  <span className="text-sm text-[var(--color-success)] flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    {testMessage}
                  </span>
                )}

                {testStatus === 'error' && (
                  <span className="text-sm text-[var(--color-danger)] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {testMessage}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={saveMutation.isPending}
              >
                <Save className="w-4 h-4" />
                {t('common.save')}
              </Button>
            </div>
          </Card>

          {/* 第二组：Gateway 配置 */}
          <Card title={t('config.gatewayConfig')} description={t('config.gatewayConfigDesc')}>
            <div className="space-y-6">
              <Input
                label={t('config.gatewayPort')}
                type="number"
                value={config.gateway?.port || 18789}
                onChange={(e) => updateConfig('gateway.port', parseInt(e.target.value, 10))}
                placeholder="18789"
              />

              <Select
                label={t('config.authMode')}
                value={config.gateway?.auth || 'token'}
                onChange={(value) => updateConfig('gateway.auth', value)}
                options={authOptions}
              />

              {config.gateway?.auth !== 'none' && (
                <div className="relative">
                  <Input
                    label={t('config.token')}
                    type={showToken ? 'text' : 'password'}
                    value={config.gateway?.token || ''}
                    onChange={(e) => updateConfig('gateway.token', e.target.value)}
                    placeholder={t('config.tokenPlaceholder')}
                    suffix={
                      <button
                        onClick={() => setShowToken(!showToken)}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </div>
              )}

              <Input
                label={t('config.bindAddress')}
                type="text"
                value={config.gateway?.bind || '127.0.0.1'}
                onChange={(e) => updateConfig('gateway.bind', e.target.value)}
                placeholder="127.0.0.1"
              />
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={saveMutation.isPending}
              >
                <Save className="w-4 h-4" />
                {t('common.save')}
              </Button>
            </div>
          </Card>

          {/* 第三组：Agent 默认配置 */}
          <Card title={t('config.agentDefaults')} description={t('config.agentDefaultsDesc')}>
            <div className="space-y-6">
              <Select
                label={t('config.toolsProfile')}
                value={config.agentDefaults?.tools?.profile || 'full'}
                onChange={(value) => updateConfig('agentDefaults.tools.profile', value)}
                options={toolProfileOptions}
              />

              <ToggleGroup>
                <Toggle
                  label={t('config.requireApproval')}
                  description={t('config.requireApprovalDesc')}
                  checked={config.agentDefaults?.requireApproval || false}
                  onChange={(checked) => updateConfig('agentDefaults.requireApproval', checked)}
                />

                <Toggle
                  label={t('config.browserControl')}
                  description={t('config.browserControlDesc')}
                  checked={config.agentDefaults?.browserControl || false}
                  onChange={(checked) => updateConfig('agentDefaults.browserControl', checked)}
                />

                <Toggle
                  label={t('config.sandboxMode')}
                  description={t('config.sandboxModeDesc')}
                  checked={config.agentDefaults?.sandboxMode || false}
                  onChange={(checked) => updateConfig('agentDefaults.sandboxMode', checked)}
                />
              </ToggleGroup>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={saveMutation.isPending}
              >
                <Save className="w-4 h-4" />
                {t('common.save')}
              </Button>
            </div>
          </Card>

          {/* 第四组：通知与安全 */}
          <Card title={t('config.security')} description={t('config.securityDesc')}>
            <div className="space-y-6">
              <ToggleGroup>
                <Toggle
                  label={t('config.deviceAuth')}
                  description={t('config.deviceAuthDesc')}
                  checked={config.security?.deviceAuth || false}
                  onChange={(checked) => updateConfig('security.deviceAuth', checked)}
                />

                <Toggle
                  label={t('config.allowTailscale')}
                  description={t('config.allowTailscaleDesc')}
                  checked={config.security?.allowTailscale || false}
                  onChange={(checked) => updateConfig('security.allowTailscale', checked)}
                />
              </ToggleGroup>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={saveMutation.isPending}
              >
                <Save className="w-4 h-4" />
                {t('common.save')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 重启确认弹窗 */}
      <Modal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        title={t('config.restartTitle')}
        description={t('config.restartDesc')}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowRestartModal(false)}
              disabled={isRestarting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleRestart}
              loading={isRestarting}
            >
              <RefreshCw className="w-4 h-4" />
              {t('config.restartNow')}
            </Button>
          </>
        }
      >
        <div className="py-2">
          <p className="text-[var(--color-text-primary)]">
            {t('config.restartConfirm')}
          </p>
        </div>
      </Modal>
    </div>
  );
}
