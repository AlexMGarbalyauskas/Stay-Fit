import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function OnboardingTutorial() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';

  const params = new URLSearchParams(location.search);
  const isAuto = params.get('auto') === '1';
  const returnTo = params.get('return');

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const userId = user?.id;
  const doneKey = userId ? `onboarding_done_${userId}` : null;

  const steps = useMemo(() => ([
    {
      title: t('onboardingStepWelcomeTitle'),
      body: t('onboardingStepWelcomeBody')
    },
    {
      title: t('onboardingStepPostTitle'),
      body: t('onboardingStepPostBody')
    },
    {
      title: t('onboardingStepPlanTitle'),
      body: t('onboardingStepPlanBody')
    },
    {
      title: t('onboardingStepConnectTitle'),
      body: t('onboardingStepConnectBody')
    },
    {
      title: t('onboardingStepPrivacyTitle'),
      body: t('onboardingStepPrivacyBody')
    }
  ]), [t]);

  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    if (isAuto && doneKey && localStorage.getItem(doneKey)) {
      navigate('/home');
    }
  }, [doneKey, isAuto, navigate, userId]);

  const markComplete = () => {
    if (doneKey) {
      localStorage.setItem(doneKey, 'true');
    }
    localStorage.removeItem('onboarding_pending');
  };

  const handleExit = () => {
    markComplete();
    if (returnTo === 'settings') {
      navigate('/settings');
      return;
    }
    navigate('/home');
  };

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
      return;
    }
    handleExit();
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          {returnTo === 'settings' ? (
            <button
              onClick={() => navigate('/settings')}
              className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ArrowLeft size={16} /> {t('backToSettings')}
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleExit}
            className={`text-sm ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t('skipTutorial')}
          </button>
        </div>

        <div className={`rounded-2xl border p-8 shadow-xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-blue-500" size={24} />
            <p className={`text-sm uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {t('appTutorial')}
            </p>
          </div>

          <h1 className="text-3xl font-bold mb-3">{steps[stepIndex].title}</h1>
          <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
            {steps[stepIndex].body}
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {t('tutorialStepCount')
                  .replace('{current}', stepIndex + 1)
                  .replace('{total}', steps.length)}
              </span>
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <span
                    key={`step-dot-${index}`}
                    className={`h-2.5 w-2.5 rounded-full ${index === stepIndex ? 'bg-blue-500' : isDark ? 'bg-gray-700' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleBack}
                disabled={stepIndex === 0}
                className={`px-4 py-2 rounded-lg border text-sm transition ${stepIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                {t('back')}
              </button>
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition"
              >
                {stepIndex === steps.length - 1 ? t('finishTutorial') : t('next')}
              </button>
            </div>
          </div>
        </div>

        <p className={`mt-6 text-sm text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          {t('tutorialAvailableInSettings')}
        </p>
      </div>
    </div>
  );
}
