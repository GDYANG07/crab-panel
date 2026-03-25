import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const routeTitleKeys: Record<string, string> = {
  '/': 'page.dashboard.title',
  '/chat': 'page.chat.title',
  '/agents': 'page.agents.title',
  '/channels': 'page.channels.title',
  '/skills': 'page.skills.title',
  '/memory': 'page.memory.title',
  '/config': 'page.config.title',
  '/monitor': 'page.monitor.title',
};

export function usePageTitle() {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const key = routeTitleKeys[location.pathname];
    const pageTitle = key ? t(key) : 'CrabPanel';
    document.title = `${pageTitle} - CrabPanel`;
  }, [location.pathname, t]);
}
