//Terms of Service page with accept button that 
// saves acceptance in localStorage and shows acceptance date. 
// Also has a back button to return to previous page. 
// Content is scrollable if it exceeds the height of the container. 
// Uses Tailwind CSS for styling and supports dark mode based on a theme value in localStorage. 
// Text content is internationalized using a language context.







//imports 
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
// End of imports





//Terms of Service page component
export default function Terms() {






  //hooks and state
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const [acceptedAt, setAcceptedAt] = useState(() => localStorage.getItem('tosAcceptedAt'));
 // End of hooks and state







  //used effect 1
  // Load acceptance date from localStorage on component mount
  useEffect(() => {
    setAcceptedAt(localStorage.getItem('tosAcceptedAt'));
  }, []);
// End of used effect 1








  //block 1 
  // Handle acceptance of terms
  const accept = () => {
    // Save acceptance in localStorage with timestamp
    const ts = new Date().toISOString();
    localStorage.setItem('tosAccepted', 'true');
    localStorage.setItem('tosAcceptedAt', ts);
    setAcceptedAt(ts);
    navigate(-1);
  };
// End of block 1









  //main render
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800' : 'bg-gray-100'}`}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="text-blue-600 mb-4">Back</button>
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('termsOfServiceTitle')}</h1>
        {acceptedAt && (
          <p className="text-sm text-green-600 mb-3">{t('acceptedOn').replace('{date}', new Date(acceptedAt).toLocaleString())}</p>
        )}
        <div className={`rounded-xl shadow p-4 h-[60vh] overflow-y-auto space-y-4 ${isDark ? 'bg-gray-900 border border-gray-800 text-gray-300' : 'bg-white text-gray-900'}`}>
          <p>{t('termsIntro')}</p>
          <p>{t('termsContent1')}</p>
          <p>{t('termsContent2')}</p>
          <p>{t('termsContent3')}</p>
          <p>{t('termsContent4')}</p>
          <p>{t('termsContent5')}</p>
          <p>{t('termsContent6')}</p>
          <p>{t('termsContent7')}</p>
          <p>{t('termsFooter')}</p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button onClick={accept} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{t('termsAcceptButton')}</button>
          <button onClick={() => navigate(-1)} className={`border px-4 py-2 rounded ${isDark ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'}`}>{t('termsCancelButton')}</button>
        </div>
      </div>
    </div>
  );
  // End of main render
}
