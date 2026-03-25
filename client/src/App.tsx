import { useTranslation } from 'react-i18next';
import { CrabLogo } from './components/CrabLogo';

function App() {
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
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium
                       hover:bg-[#b55a3a] transition-colors shadow-sm"
          >
            {t('common.refresh')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
