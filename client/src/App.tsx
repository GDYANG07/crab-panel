import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import DesignSystemDemo from './pages/DesignSystemDemo';
import { useTranslation } from 'react-i18next';
import { CrabLogo } from './components/CrabLogo';

function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)]">
      <div className="text-center">
        <CrabLogo size={80} className="mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-[var(--color-primary)] mb-4">
          {t('app.title')}
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)]">
          {t('app.subtitle')}
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/design"
            className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium
                       hover:bg-[#b55a3a] transition-colors shadow-sm"
          >
            查看设计系统
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/design" element={<DesignSystemDemo />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
