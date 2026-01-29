import { useState } from 'react';
import Navbar from '../components/Navbar';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Privacy() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800' : 'bg-gray-100'}`}>
      <div className="pt-20 px-4 max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 mb-4 transition ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}
        >
          <ArrowLeft className="w-5 h-5" /> {t('back')}
        </button>

        <div className={`p-6 rounded shadow ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className={`w-5 h-5 ${isDark ? 'text-gray-200' : 'text-gray-900'}`} />
            <h1 className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('privacyPolicyTitle')}</h1>
          </div>
          <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('privacyPolicyIntro')}
          </p>
          <ul className={`list-disc list-inside text-sm space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <li>{t('privacyPolicyBullet1')}</li>
            <li>{t('privacyPolicyBullet2')}</li>
            <li>{t('privacyPolicyBullet3')}</li>
          </ul>
        </div>
      </div>
      <Navbar />
    </div>
  );
}
