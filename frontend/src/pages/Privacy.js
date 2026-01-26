import Navbar from '../components/Navbar';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Privacy() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="pt-20 px-4 max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 mb-4 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" /> {t('back')}
        </button>

        <div className="bg-white p-6 rounded shadow">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-gray-900" />
            <h1 className="text-xl font-semibold text-gray-900">{t('privacyPolicyTitle')}</h1>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            {t('privacyPolicyIntro')}
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
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
