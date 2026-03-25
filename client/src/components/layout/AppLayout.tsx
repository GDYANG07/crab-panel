import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Workflow,
  Puzzle,
  Brain,
  Settings,
  Activity,
  Sun,
  Moon,
  Globe,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  description: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'nav.dashboard', description: 'nav.dashboardDesc' },
  { path: '/chat', icon: MessageSquare, label: 'nav.chat', description: 'nav.chatDesc' },
  { path: '/agents', icon: Bot, label: 'nav.agents', description: 'nav.agentsDesc' },
  { path: '/channels', icon: Workflow, label: 'nav.channels', description: 'nav.channelsDesc' },
  { path: '/skills', icon: Puzzle, label: 'nav.skills', description: 'nav.skillsDesc' },
  { path: '/memory', icon: Brain, label: 'nav.memory', description: 'nav.memoryDesc' },
  { path: '/config', icon: Settings, label: 'nav.config', description: 'nav.configDesc' },
  { path: '/monitor', icon: Activity, label: 'nav.monitor', description: 'nav.monitorDesc' },
];

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gatewayConnected] = useState(true);

  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);

      if (width < 768) {
        setCollapsed(true);
      } else if (width <= 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 暗色主题切换
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(newLang);
  };

  const sidebarWidth = collapsed ? '64px' : '220px';
  const showText = !collapsed;

  // 移动端底部导航
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
        {/* 顶部栏 */}
        <header className="h-14 bg-[var(--color-card)] border-b border-[var(--color-border)] flex items-center justify-between px-4 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦀</span>
            <span className="font-semibold text-[var(--color-text-primary)]">CrabPanel</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg hover:bg-[var(--color-primary-light)] text-[var(--color-text-secondary)]"
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--color-primary-light)] text-[var(--color-text-secondary)]"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 p-4 pb-24 overflow-auto">
          <Outlet />
        </main>

        {/* 底部导航 */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--color-card)] border-t border-[var(--color-border)] flex items-center justify-around px-2 z-50">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] ${
                  isActive
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)]'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1 truncate max-w-[60px]">{t(item.label)}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] text-[var(--color-text-secondary)]"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs mt-1">{t('common.expand')}</span>
          </button>
        </nav>

        {/* 移动端更多菜单 */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="absolute bottom-20 left-4 right-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-[var(--color-text-primary)]">{t('common.expand')}</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {navItems.slice(5).map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center p-3 rounded-lg ${
                        isActive
                          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                          : 'text-[var(--color-text-secondary)]'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 mb-1" />
                    <span className="text-xs">{t(item.label)}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* 顶部栏 */}
      <header
        className="h-14 bg-[var(--color-card)] border-b border-[var(--color-border)] flex items-center justify-between px-4 sticky top-0 z-40"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* 左侧：面包屑占位 */}
        <div className="flex-1" />

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
            title={i18n.language === 'zh-CN' ? 'Switch to English' : '切换到中文'}
          >
            <Globe className="w-4 h-4" />
            <span>{i18n.language === 'zh-CN' ? 'EN' : '中'}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
            title={theme === 'light' ? t('theme.dark') : t('theme.light')}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
            title={t('nav.settings')}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 左侧边栏 */}
      <aside
        className="fixed left-0 top-0 bottom-0 bg-[var(--color-card)] border-r border-[var(--color-border)] flex flex-col z-50 transition-all duration-200"
        style={{ width: sidebarWidth }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl flex-shrink-0">🦀</span>
            {showText && (
              <span className="font-semibold text-[var(--color-text-primary)] truncate">
                CrabPanel
              </span>
            )}
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-text-primary)]'
                }`}
                title={collapsed ? t(item.label) : undefined}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                {showText && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{t(item.label)}</span>
                    <span className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-[var(--color-text-secondary)]'}`}>
                      {t(item.description)}
                    </span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* 折叠按钮 */}
        <div className="p-2 border-t border-[var(--color-border)]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-text-primary)] transition-colors"
            title={collapsed ? t('common.expand') : t('common.collapse')}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {showText && <span className="text-sm">{t('common.collapse')}</span>}
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main
        className="flex-1 p-6 transition-all duration-200"
        style={{ marginLeft: sidebarWidth, marginTop: 0, marginBottom: '32px' }}
      >
        <Outlet />
      </main>

      {/* 底部状态栏 */}
      <footer
        className="h-8 bg-[var(--color-card)] border-t border-[var(--color-border)] flex items-center justify-between px-4 text-xs fixed bottom-0 right-0 z-40 transition-all duration-200"
        style={{ left: sidebarWidth }}
      >
        {/* 左侧：Gateway 状态 */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              gatewayConnected ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]'
            }`}
          />
          <span className="text-[var(--color-text-secondary)]">
            {gatewayConnected ? t('layout.gatewayConnected') : t('layout.gatewayDisconnected')}
          </span>
        </div>

        {/* 右侧：版本号 */}
        <span className="text-[var(--color-text-secondary)]">
          {t('common.version')} v0.1.0
        </span>
      </footer>
    </div>
  );
}
