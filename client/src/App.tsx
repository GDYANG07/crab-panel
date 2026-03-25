import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { AppLayout } from './components/layout/AppLayout';
import { Onboarding } from './components/Onboarding';
import DesignSystemDemo from './pages/DesignSystemDemo';
import {
  Dashboard,
  Chat,
  Agents,
  Channels,
  Skills,
  Memory,
  Config,
  Monitor,
} from './pages';

const ONBOARDING_KEY = 'crabpanel_onboarding_done';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      // Check if gateway is reachable; if not, show onboarding
      fetch('/api/gateway/status', { signal: AbortSignal.timeout(2000) })
        .then((res) => res.json())
        .then((data) => {
          if (!data.connected) {
            setShowOnboarding(true);
          }
        })
        .catch(() => {
          setShowOnboarding(true);
        });
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'skipped');
    setShowOnboarding(false);
  };

  return (
    <ToastProvider>
      {showOnboarding && (
        <Onboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
      <BrowserRouter>
        <Routes>
          {/* Design System 页面独立路由 */}
          <Route path="/design" element={<DesignSystemDemo />} />

          {/* 主应用布局路由 */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/channels" element={<Channels />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/config" element={<Config />} />
            <Route path="/monitor" element={<Monitor />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
