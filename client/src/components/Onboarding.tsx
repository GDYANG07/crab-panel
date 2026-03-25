import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, AlertCircle, Loader2, ArrowRight, Globe, Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { Button, Input, Select } from './ui';
import { useThemeStore } from '../stores/themeStore';

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

type Step = 1 | 2 | 3 | 4;
type GatewayStatus = 'checking' | 'connected' | 'not_found';
type TestStatus = 'idle' | 'testing' | 'success' | 'failed';

const providerOptions = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'custom', label: 'Custom Provider' },
];

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const [step, setStep] = useState<Step>(1);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>('checking');
  const [provider, setProvider] = useState('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');

  // Step 1: detect gateway on mount
  useEffect(() => {
    const checkGateway = async () => {
      try {
        const res = await fetch('/api/gateway/status', { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          setGatewayStatus(data.connected ? 'connected' : 'not_found');
        } else {
          setGatewayStatus('not_found');
        }
      } catch {
        setGatewayStatus('not_found');
      }
    };

    checkGateway();
  }, []);

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const res = await fetch('/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
        signal: AbortSignal.timeout(10000),
      });
      setTestStatus(res.ok ? 'success' : 'failed');
    } catch {
      setTestStatus('failed');
    }
  };

  const handleSaveAndEnter = async () => {
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: { provider, apiKey } }),
      });
    } catch {
      // ignore save errors - user can configure later
    }
    onComplete();
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--color-background)] flex flex-col">
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦀</span>
          <span className="font-semibold text-[var(--color-text-primary)]">CrabPanel</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>{i18n.language === 'zh-CN' ? 'EN' : '中'}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
              {t('onboarding.title')}
            </h1>
            <p className="text-[var(--color-text-secondary)]">{t('onboarding.subtitle')}</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {([1, 2, 3, 4] as Step[]).map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    s < step
                      ? 'bg-[var(--color-success)] text-white'
                      : s === step
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {s < step ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-12 h-0.5 mx-1 transition-all ${
                      s < step ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm animate-fade-in">
            {/* Step 1: Detect environment */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {t('onboarding.step1Title')}
                </h2>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)]">
                  {gatewayStatus === 'checking' ? (
                    <>
                      <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin flex-shrink-0" />
                      <div>
                        <div className="font-medium text-[var(--color-text-primary)]">Gateway</div>
                        <div className="text-sm text-[var(--color-text-secondary)]">{t('onboarding.step1Checking')}</div>
                      </div>
                    </>
                  ) : gatewayStatus === 'connected' ? (
                    <>
                      <Wifi className="w-8 h-8 text-[var(--color-success)] flex-shrink-0" />
                      <div>
                        <div className="font-medium text-[var(--color-text-primary)]">Gateway</div>
                        <div className="text-sm text-[var(--color-success)]">{t('onboarding.step1Connected')}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-8 h-8 text-[var(--color-warning)] flex-shrink-0" />
                      <div>
                        <div className="font-medium text-[var(--color-text-primary)]">Gateway</div>
                        <div className="text-sm text-[var(--color-text-secondary)]">{t('onboarding.step1NotFoundDesc')}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Configure API Key */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {t('onboarding.step2Title')}
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">{t('onboarding.step2Desc')}</p>
                <Select
                  label={t('onboarding.step2Provider')}
                  value={provider}
                  onChange={setProvider}
                  options={providerOptions}
                />
                <Input
                  label={t('onboarding.step2ApiKey')}
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={t('onboarding.step2ApiKeyPlaceholder')}
                />
              </div>
            )}

            {/* Step 3: Test connection */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {t('onboarding.step3Title')}
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">{t('onboarding.step3Desc')}</p>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)]">
                  {testStatus === 'idle' && (
                    <>
                      <AlertCircle className="w-8 h-8 text-[var(--color-text-secondary)] flex-shrink-0" />
                      <div className="text-sm text-[var(--color-text-secondary)]">{t('onboarding.step3Desc')}</div>
                    </>
                  )}
                  {testStatus === 'testing' && (
                    <>
                      <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin flex-shrink-0" />
                      <div className="text-sm text-[var(--color-text-secondary)]">{t('onboarding.step3Testing')}</div>
                    </>
                  )}
                  {testStatus === 'success' && (
                    <>
                      <CheckCircle className="w-8 h-8 text-[var(--color-success)] flex-shrink-0" />
                      <div className="text-sm text-[var(--color-success)]">{t('onboarding.step3Success')}</div>
                    </>
                  )}
                  {testStatus === 'failed' && (
                    <>
                      <XCircle className="w-8 h-8 text-[var(--color-danger)] flex-shrink-0" />
                      <div>
                        <div className="text-sm text-[var(--color-danger)]">{t('onboarding.step3Failed')}</div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-1">{t('onboarding.step3FailedDesc')}</div>
                      </div>
                    </>
                  )}
                </div>
                {testStatus !== 'success' && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleTestConnection}
                    loading={testStatus === 'testing'}
                  >
                    {t('onboarding.testConnection')}
                  </Button>
                )}
              </div>
            )}

            {/* Step 4: Ready */}
            {step === 4 && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-[var(--color-primary)]" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {t('onboarding.step4Title')}
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">{t('onboarding.step4Desc')}</p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep((prev) => (prev - 1) as Step)}>
                {t('onboarding.prev')}
              </Button>
            ) : (
              <button
                onClick={onSkip}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {t('onboarding.skipToMock')}
              </button>
            )}

            {step < 4 ? (
              <Button
                variant="primary"
                onClick={() => {
                  if (step === 3 && testStatus === 'idle') {
                    handleTestConnection();
                  } else {
                    setStep((prev) => (prev + 1) as Step);
                  }
                }}
                disabled={
                  (step === 1 && gatewayStatus === 'checking') ||
                  (step === 3 && testStatus === 'testing')
                }
              >
                {t('onboarding.next')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSaveAndEnter}>
                {t('onboarding.enterPanel')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Skip to mock mode link (always visible) */}
          {step > 1 && (
            <div className="text-center mt-4">
              <button
                onClick={onSkip}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors underline"
              >
                {t('onboarding.skipToMock')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
