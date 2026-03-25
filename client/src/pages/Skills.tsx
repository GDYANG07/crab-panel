import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Puzzle,
  Search,
  Download,
  Trash2,
  Star,
  User,
  Check,
  Loader2,
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Badge,
  Modal,
  Toggle,
  Spinner,
} from '../components/ui';
import {
  useSkills,
  useInstallSkill,
  useUninstallSkill,
  useConfigureSkill,
  skillCategories,
  type Skill,
  type SkillCategory,
} from '../hooks/useSkills';

// 分类图标映射
const categoryIcons: Record<SkillCategory, string> = {
  all: '📦',
  installed: '✅',
  productivity: '⚡',
  development: '💻',
  communication: '💬',
  data: '📊',
};

export function Skills() {
  const { t } = useTranslation();

  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SkillCategory>('all');

  // 详情 Modal
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 配置 Modal
  const [configSkill, setConfigSkill] = useState<Skill | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // 数据获取
  const { data: skills, isLoading } = useSkills();

  // Mutations
  const installMutation = useInstallSkill();
  const uninstallMutation = useUninstallSkill();
  const configureMutation = useConfigureSkill();

  // 过滤后的技能
  const filteredSkills = useMemo(() => {
    if (!skills) return [];

    let filtered = skills;

    // 按分类筛选
    if (activeCategory === 'installed') {
      filtered = filtered.filter((s) => s.installed);
    } else if (activeCategory !== 'all') {
      filtered = filtered.filter((s) => s.category === activeCategory);
    }

    // 按搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.author.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [skills, activeCategory, searchQuery]);

  // 处理安装
  const handleInstall = useCallback(
    async (skill: Skill) => {
      if (skill.requiresConfig) {
        setConfigSkill(skill);
        setShowConfigModal(true);
      } else {
        await installMutation.mutateAsync(skill.id);
      }
    },
    [installMutation]
  );

  // 处理卸载
  const handleUninstall = useCallback(
    async (skill: Skill) => {
      await uninstallMutation.mutateAsync(skill.id);
    },
    [uninstallMutation]
  );

  // 处理查看详情
  const handleViewDetail = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
    setShowDetailModal(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
            <Puzzle className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {t('page.skills.title', '技能商店')}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {t('page.skills.description', '浏览和安装技能扩展 Agent 能力')}
            </p>
          </div>
        </div>
      </div>

      {/* 搜索和分类 */}
      <div className="space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <Input
            type="text"
            placeholder={t('skills.searchPlaceholder', '搜索技能...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 分类 Tabs */}
        <div className="flex flex-wrap gap-2">
          {skillCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
              }`}
            >
              <span>{categoryIcons[cat.id]}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Spinner size="lg" />
        </div>
      ) : filteredSkills.length === 0 ? (
        /* 空状态 */
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
          <Puzzle className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
            {searchQuery ? t('skills.noSearchResults', '没有找到匹配的技能') : t('skills.noSkills', '暂无技能')}
          </h3>
          <p className="text-[var(--color-text-secondary)] max-w-md">
            {searchQuery
              ? t('skills.tryDifferentSearch', '尝试其他搜索词或分类')
              : t('skills.comingSoon', '更多技能正在开发中，敬请期待！')}
          </p>
        </div>
      ) : (
        /* 技能网格 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onInstall={() => handleInstall(skill)}
              onUninstall={() => handleUninstall(skill)}
              onViewDetail={() => handleViewDetail(skill)}
              isInstalling={installMutation.isPending && installMutation.variables === skill.id}
              isUninstalling={uninstallMutation.isPending && uninstallMutation.variables === skill.id}
            />
          ))}
        </div>
      )}

      {/* 技能详情 Modal */}
      <SkillDetailModal
        skill={selectedSkill}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSkill(null);
        }}
        onInstall={() => selectedSkill && handleInstall(selectedSkill)}
        onUninstall={() => selectedSkill && handleUninstall(selectedSkill)}
        isInstalling={installMutation.isPending}
        isUninstalling={uninstallMutation.isPending}
      />

      {/* 配置 Modal */}
      <SkillConfigModal
        skill={configSkill}
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false);
          setConfigSkill(null);
        }}
        onSave={async (config) => {
          if (configSkill) {
            await configureMutation.mutateAsync({ skillId: configSkill.id, config });
            await installMutation.mutateAsync(configSkill.id);
            setShowConfigModal(false);
            setConfigSkill(null);
          }
        }}
        isSaving={configureMutation.isPending || installMutation.isPending}
      />
    </div>
  );
}

// 技能卡片组件
interface SkillCardProps {
  skill: Skill;
  onInstall: () => void;
  onUninstall: () => void;
  onViewDetail: () => void;
  isInstalling: boolean;
  isUninstalling: boolean;
}

function SkillCard({
  skill,
  onInstall,
  onUninstall,
  onViewDetail,
  isInstalling,
  isUninstalling,
}: SkillCardProps) {
  const { t } = useTranslation();
  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex-1">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-xl">
              {skill.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-medium text-[var(--color-text-primary)]">{skill.name}</h3>
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <span>v{skill.version}</span>
                {skill.installed && (
                  <Badge variant="success" size="sm">
                    {t('skills.installed')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 描述 */}
        <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2">
          {skill.description}
        </p>

        {/* 作者和统计 */}
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] mb-4">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{skill.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            <span>{formatNumber(skill.installs)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span>{skill.rating}</span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 pt-3 border-t border-[var(--color-border)]">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={onViewDetail}
        >
          {t('skills.detail')}
        </Button>
        {skill.installed ? (
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            onClick={onUninstall}
            loading={isUninstalling}
            disabled={isUninstalling}
          >
            {isUninstalling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-1" />
            )}
            {t('skills.uninstall')}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={onInstall}
            loading={isInstalling}
            disabled={isInstalling}
          >
            {isInstalling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1" />
            )}
            {t('skills.install')}
          </Button>
        )}
      </div>
    </Card>
  );
}

// 技能详情 Modal
interface SkillDetailModalProps {
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  onUninstall: () => void;
  isInstalling: boolean;
  isUninstalling: boolean;
}

function SkillDetailModal({
  skill,
  isOpen,
  onClose,
  onInstall,
  onUninstall,
  isInstalling,
  isUninstalling,
}: SkillDetailModalProps) {
  const { t } = useTranslation();

  if (!skill) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={skill.name}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('skills.close')}
          </Button>
          {skill.installed ? (
            <Button
              variant="danger"
              onClick={onUninstall}
              loading={isUninstalling}
              disabled={isUninstalling}
            >
              {isUninstalling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              {t('skills.uninstall')}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onInstall}
              loading={isInstalling}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              {t('skills.install')}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {/* 头部信息 */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center text-3xl">
            {skill.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                {skill.name}
              </h2>
              <span className="text-sm text-[var(--color-text-secondary)]">v{skill.version}</span>
              {skill.installed && (
                <Badge variant="success">{t('skills.installed')}</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{skill.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                <span>{t('skills.installCount', { count: skill.installs })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{skill.rating} ({skill.ratingCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* 完整描述 */}
        <div>
          <h3 className="font-medium text-[var(--color-text-primary)] mb-2">{t('skills.featureIntro')}</h3>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            {skill.fullDescription}
          </p>
        </div>

        {/* 分类 */}
        <div>
          <h3 className="font-medium text-[var(--color-text-primary)] mb-2">{t('skills.category')}</h3>
          <div className="flex gap-2">
            <Badge>
              {skillCategories.find((c) => c.id === skill.category)?.label || skill.category}
            </Badge>
            {skill.requiresConfig && (
              <Badge variant="warning">{t('skills.requiresConfig')}</Badge>
            )}
          </div>
        </div>

        {/* 配置信息（如果已安装且有配置） */}
        {skill.installed && skill.config && (
          <div>
            <h3 className="font-medium text-[var(--color-text-primary)] mb-2">{t('skills.currentConfig')}</h3>
            <div className="bg-[var(--color-background)] rounded-lg p-4 font-mono text-sm">
              <pre className="text-[var(--color-text-secondary)]">
                {JSON.stringify(skill.config, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// 技能配置 Modal
interface SkillConfigModalProps {
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Record<string, unknown>) => void;
  isSaving: boolean;
}

function SkillConfigModal({ skill, isOpen, onClose, onSave, isSaving }: SkillConfigModalProps) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<Record<string, unknown>>({});

  // 当技能变化时，重置配置
  useState(() => {
    if (skill?.config) {
      setConfig(skill.config);
    } else {
      setConfig({});
    }
  });

  if (!skill) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('skills.configRequired').replace(':', '') + ' ' + skill.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={() => onSave(config)} loading={isSaving}>
            <Check className="w-4 h-4 mr-1" />
            {t('skills.saveAndInstall')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          {t('skills.configRequired')}
        </p>

        {/* 这里根据技能类型显示不同的配置项 */}
        {skill.id === 'calendar' && (
          <div className="space-y-4">
            <Input
              label="默认日历"
              value={(config.defaultCalendar as string) || ''}
              onChange={(e) => setConfig({ ...config, defaultCalendar: e.target.value })}
              placeholder="primary"
            />
            <Input
              label="时区"
              value={(config.timezone as string) || ''}
              onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
              placeholder="Asia/Shanghai"
            />
          </div>
        )}

        {skill.id === 'email' && (
          <div className="space-y-4">
            <Input
              label="SMTP 服务器"
              value={(config.smtpHost as string) || ''}
              onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
              placeholder="smtp.gmail.com"
            />
            <Input
              label="邮箱地址"
              value={(config.email as string) || ''}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="your@email.com"
            />
            <Input
              label="密码/授权码"
              type="password"
              value={(config.password as string) || ''}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
            />
          </div>
        )}

        {skill.id === 'code-execution' && (
          <div className="space-y-4">
            <Toggle
              label="允许网络访问"
              description="执行代码时是否允许访问网络"
              checked={(config.allowNetwork as boolean) || false}
              onChange={(checked) => setConfig({ ...config, allowNetwork: checked })}
            />
            <Toggle
              label="允许文件系统访问"
              description="执行代码时是否允许读写文件"
              checked={(config.allowFilesystem as boolean) || false}
              onChange={(checked) => setConfig({ ...config, allowFilesystem: checked })}
            />
            <Input
              label="超时时间（秒）"
              type="number"
              value={String(config.timeout || 30)}
              onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
            />
          </div>
        )}

        {skill.id === 'image-generation' && (
          <div className="space-y-4">
            <Input
              label="API Key"
              type="password"
              value={(config.apiKey as string) || ''}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="输入 API Key"
            />
            <Input
              label="默认图片尺寸"
              value={(config.defaultSize as string) || ''}
              onChange={(e) => setConfig({ ...config, defaultSize: e.target.value })}
              placeholder="1024x1024"
            />
          </div>
        )}

        {skill.id === 'news' && (
          <div className="space-y-4">
            <Input
              label="API Key"
              type="password"
              value={(config.apiKey as string) || ''}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            />
            <Input
              label="关键词过滤（逗号分隔）"
              value={(config.keywords as string) || ''}
              onChange={(e) => setConfig({ ...config, keywords: e.target.value })}
              placeholder="科技,AI,编程"
            />
          </div>
        )}

        {skill.id === 'database' && (
          <div className="space-y-4">
            <Input
              label="数据库类型"
              value={(config.type as string) || ''}
              onChange={(e) => setConfig({ ...config, type: e.target.value })}
              placeholder="mysql, postgresql, sqlite"
            />
            <Input
              label="连接字符串"
              value={(config.connectionString as string) || ''}
              onChange={(e) => setConfig({ ...config, connectionString: e.target.value })}
              placeholder="host=localhost port=5432 dbname=mydb"
            />
          </div>
        )}

        {skill.id === 'notes' && (
          <div className="space-y-4">
            <Input
              label="笔记存储路径"
              value={(config.storagePath as string) || ''}
              onChange={(e) => setConfig({ ...config, storagePath: e.target.value })}
              placeholder="~/.openclaw/notes"
            />
            <Toggle
              label="自动同步"
              description="是否自动同步到云端"
              checked={(config.autoSync as boolean) || false}
              onChange={(checked) => setConfig({ ...config, autoSync: checked })}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
