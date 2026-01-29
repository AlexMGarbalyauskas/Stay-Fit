import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Terms() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const [acceptedAt, setAcceptedAt] = useState(() => localStorage.getItem('tosAcceptedAt'));

  useEffect(() => {
    setAcceptedAt(localStorage.getItem('tosAcceptedAt'));
  }, []);

  const accept = () => {
    const ts = new Date().toISOString();
    localStorage.setItem('tosAccepted', 'true');
    localStorage.setItem('tosAcceptedAt', ts);
    setAcceptedAt(ts);
    navigate(-1);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800' : 'bg-gray-100'}`}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="text-blue-600 mb-4">Back</button>
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Terms of Service</h1>
        {acceptedAt && (
          <p className="text-sm text-green-600 mb-3">Accepted on {new Date(acceptedAt).toLocaleString()}</p>
        )}
        <div className={`rounded-xl shadow p-4 h-[60vh] overflow-y-auto space-y-4 ${isDark ? 'bg-gray-900 border border-gray-800 text-gray-300' : 'bg-white text-gray-900'}`}>
          <p>Welcome to Stay Fit. Please read these Terms of Service carefully before using the app. By creating an account, you agree to be bound by these terms.</p>
          <p>1. Content. You are responsible for the content you post and share. Do not post illegal, harmful, or infringing content.</p>
          <p>2. Privacy. We process your data according to our privacy practices. Do not share your credentials with others.</p>
          <p>3. Conduct. Respect other users. No harassment or spam. We may restrict accounts that violate community guidelines.</p>
          <p>4. Liability. The app is provided "as is" without warranties. We are not liable for damages arising from your use of the app.</p>
          <p>5. Changes. We may update these terms. Continued use after changes constitutes acceptance.</p>
          <p>6. Termination. We may suspend or terminate accounts for violations.</p>
          <p>7. Contact. For questions, contact support.</p>
          <p>Scroll to the bottom and click Accept to proceed.</p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button onClick={accept} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">I have read and accept</button>
          <button onClick={() => navigate(-1)} className={`border px-4 py-2 rounded ${isDark ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'}`}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
