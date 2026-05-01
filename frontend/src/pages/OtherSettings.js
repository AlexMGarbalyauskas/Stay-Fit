// This page is for other settings that don't fit into the main 
// settings categories, such as account deletion and data export.






//imports 
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { deleteAccount, exportMyPosts } from '../api';
import { ArrowLeft, Trash2, Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
//end of imports










//main component
export default function OtherSettings() {





  
  //hooks and state
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [downloadBeforeDelete, setDownloadBeforeDelete] = useState(true);
  const [loading, setLoading] = useState(false);
  //end of hooks and state











  //block 1 big 
  // function to handle account deletion, including optional data export beforehand.
  //handlers
  const handleDelete = async () => {

    // First, check if the password field is empty. If it is, we alert the user and stop the process.
    if (!password.trim()) {
      alert(t('enterPasswordToDelete'));
      return;
    }

    // ask for confirmation before proceeding with deletion, as this action is irreversible.
    if (!window.confirm(t('deleteAccountConfirm'))) return;






    // If the user wants to download their posts before deletion, 
    // we first call the export API,
    setLoading(true);

    // create a JSON file from the response and trigger a download in the browser.
    try {

      // We wrap this in a try-catch to handle any errors that might occur during export or deletion.
      if (downloadBeforeDelete) {

        // Call the export API to get the user's posts. We assume it returns an array of posts in resp.data.posts.
        const resp = await exportMyPosts();
        const blob = new Blob([JSON.stringify(resp.data.posts || [], null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stayfit-posts-export.json';
        a.click();

        // Clean up the URL object after the download is triggered.
        URL.revokeObjectURL(url);
      }


      // After the export (or immediately if they chose not to), 
      // we call the delete account API.
      await deleteAccount(password.trim());

      // If successful, we clear local storage, show a success message, and redirect to login.
      localStorage.clear();

      // We use an alert here for simplicity, but in a real app you might want a nicer UI element.
      alert(t('accountDeleted'));
      window.location.href = '/login';

      // If there's an error (like wrong password), we catch it and show an error message.
    } catch (err) {

      // Log the error for debugging and show a user-friendly message.
      console.error('Delete account failed', err);
      alert(err.response?.data?.error || t('failedToDeleteAccount'));

      // We don't redirect on error, so the user can try again or correct their password.
    } finally {
      setLoading(false);
    }
  };
//end of block 1 big










  //main render 
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
  //end of main render
}
