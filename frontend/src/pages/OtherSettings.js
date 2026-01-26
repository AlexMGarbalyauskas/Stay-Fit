import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { deleteAccount, exportMyPosts } from '../api';
import { ArrowLeft, Trash2, Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function OtherSettings() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [downloadBeforeDelete, setDownloadBeforeDelete] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password.trim()) {
      alert(t('enterPasswordToDelete'));
      return;
    }

    if (!window.confirm(t('deleteAccountConfirm'))) return;

    setLoading(true);
    try {
      if (downloadBeforeDelete) {
        const resp = await exportMyPosts();
        const blob = new Blob([JSON.stringify(resp.data.posts || [], null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stayfit-posts-export.json';
        a.click();
        URL.revokeObjectURL(url);
      }

      await deleteAccount(password.trim());
      localStorage.clear();
      alert(t('accountDeleted'));
      window.location.href = '/login';
    } catch (err) {
      console.error('Delete account failed', err);
      alert(err.response?.data?.error || t('failedToDeleteAccount'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="pt-20 px-4 max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 mb-4 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" /> {t('backToSettings')}
        </button>

        <div className="bg-white p-4 rounded shadow border border-red-200">
          <h1 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2"><Trash2 className="w-5 h-5" /> {t('deleteAccountTitle')}</h1>
          <p className="text-sm text-gray-700 mb-3">{t('deleteAccountDescription')}</p>

          <label className="block text-sm text-gray-700 mb-1">{t('passwordForConfirmation')}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-red-200 mb-3"
            placeholder={t('enterPasswordPlaceholder')}
          />

          <label className="flex items-center gap-2 text-sm text-gray-700 mb-4">
            <input
              type="checkbox"
              checked={downloadBeforeDelete}
              onChange={e => setDownloadBeforeDelete(e.target.checked)}
            />
            <span className="flex items-center gap-1"><Download className="w-4 h-4" /> {t('downloadPostsBeforeDeleting')}</span>
          </label>

          <button
            onClick={handleDelete}
            disabled={loading}
            className={`w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? t('deleting') : (<><Trash2 className="w-4 h-4" /> {t('deleteMyAccount')}</>)}
          </button>
        </div>
      </div>
      <Navbar />
    </div>
  );
}
