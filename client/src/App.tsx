import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { AppLayout } from './components/layout/AppLayout';
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

function App() {
  return (
    <ToastProvider>
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
