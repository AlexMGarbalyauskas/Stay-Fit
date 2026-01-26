import { ArrowLeft, FileText, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function AboutSettings() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="pt-20 px-4 max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 mb-4 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Settings
        </button>

        <div className="bg-white p-4 rounded shadow">
          <h1 className="text-lg font-semibold text-gray-900 mb-3">About</h1>
          <p className="text-sm text-gray-700 mb-4">Manage your legal docs and learn about how we handle your data.</p>

          <button
            onClick={() => navigate('/terms')}
            className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 text-gray-900 px-3 py-3 rounded mb-3"
          >
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Terms of Service</span>
            <span className="text-sm text-gray-600">View</span>
          </button>

          <button
            onClick={() => navigate('/privacy')}
            className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 text-gray-900 px-3 py-3 rounded"
          >
            <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Privacy Policy</span>
            <span className="text-sm text-gray-600">View</span>
          </button>
        </div>
      </div>
      <Navbar />
    </div>
  );
}
