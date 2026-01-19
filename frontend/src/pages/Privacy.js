import Navbar from '../components/Navbar';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="pt-20 px-4 max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 mb-4 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="bg-white p-6 rounded shadow">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-gray-900" />
            <h1 className="text-xl font-semibold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            We respect your privacy. This placeholder outlines that your data is used to provide and improve StayFit,
            never sold, and processed according to your settings. Update this page with your real policy text when ready.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
            <li>We store account data securely and only use it for core app features.</li>
            <li>You can request deletion of your account and data at any time from Settings.</li>
            <li>Contact support to learn how we handle exports, retention, and third-party services.</li>
          </ul>
        </div>
      </div>
      <Navbar />
    </div>
  );
}
