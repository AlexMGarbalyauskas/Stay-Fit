import { useEffect, useState } from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMe, changePassword } from '../api';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';

export default function UserDetails() {
  const { t } = useLanguage();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMe();
        setUser(res.data.user);
      } catch (err) {
        console.error('Failed to load user details', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-center mt-20 text-gray-500">{t('loading')}</p>;
  }

  if (!user) {
    return <p className="text-center mt-20 text-gray-500">{t('failedToLoadProfile')}</p>;
  }

  const detailRow = (label, value) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-200/30">
      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{label}</span>
      <span className={isDark ? 'text-gray-100' : 'text-gray-900'}>{value || '-'}</span>
    </div>
  );

  const togglePassword = () => {
    if (!showPassword) {
      setShowPasswordConfirm(true);
      return;
    }
    setShowPassword(false);
    setShowChangePassword(false);
  };

  const confirmShowPassword = () => {
    setShowPassword(true);
    setShowChangePassword(true);
    setShowPasswordConfirm(false);
  };

  const cancelShowPassword = () => {
    setShowPasswordConfirm(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return alert(t('fillAllPasswordFields'));
    }
    if (newPassword !== confirmPassword) {
      return alert(t('newPasswordsDoNotMatch'));
    }

    try {
      setSaving(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowChangePassword(false);
      alert(t('passwordUpdated'));
    } catch (err) {
      console.error('Failed to change password', err);
      alert(err?.response?.data?.error || t('failedToChangePassword'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${isDark ? 'from-gray-950 via-gray-900 to-gray-800 text-gray-200' : 'from-slate-50 via-white to-slate-100 text-slate-800'}`}>
      <div className="pt-20 pb-20 px-4 max-w-md mx-auto">
        <button
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-2 mb-4 transition ${isDark ? 'text-gray-200 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}
        >
          <ArrowLeft size={20} /> {t('backToSettings')}
        </button>

        <div className={`flex items-center gap-3 p-4 rounded shadow ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('accountDetails')}</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{user.email}</p>
          </div>
        </div>

        <div className={`mt-4 p-4 rounded shadow ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
          {detailRow(t('username'), user.username)}
          {detailRow(t('nickname'), user.nickname)}
          {detailRow(t('email'), user.email)}
          <div className="py-2 border-b border-gray-200/30">
            <div className="flex items-center justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{t('password')}</span>
              <button
                onClick={togglePassword}
                className={`text-xs px-2 py-1 rounded border transition ${isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {showPassword ? t('hide') : t('show')}
              </button>
            </div>
            {showChangePassword && (
              <>
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('passwordsNotRetrievable')}
                </p>
                <form onSubmit={handleChangePassword} className="mt-3 space-y-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('currentPassword')}
                    className={`w-full rounded px-3 py-2 text-sm border ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('newPassword')}
                    className={`w-full rounded px-3 py-2 text-sm border ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('confirmNewPassword')}
                    className={`w-full rounded px-3 py-2 text-sm border ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className={`w-full rounded py-2 text-sm font-semibold transition ${saving ? 'opacity-60 cursor-not-allowed' : ''} ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    {saving ? t('updating') : t('changePassword')}
                  </button>
                </form>
              </>
            )}
          </div>
          {detailRow(t('bio'), user.bio)}
          {detailRow(t('location'), user.location)}
          {detailRow(t('timezone'), user.timezone)}
          {detailRow(t('privacy'), user.privacy)}
          {detailRow(t('notifications'), user.notifications_enabled === 0 ? t('notificationsOff') : t('notificationsOn'))}
          {detailRow(t('joined'), user.created_at ? new Date(user.created_at).toLocaleString() : '-')}
        </div>
      </div>

      <Navbar />

      {showPasswordConfirm && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 ${
          isDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-black bg-opacity-50'
        }`}>
          <div className={`rounded-lg p-6 max-w-sm w-full mx-auto shadow-xl ${
            isDark ? 'bg-gray-900 text-gray-100 border border-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-gray-50' : 'text-gray-900'}`}>
              {t('showPasswordFieldsTitle')}
            </h3>
            <p className={isDark ? 'text-gray-300 mb-4' : 'text-gray-700 mb-4'}>
              {t('showPasswordFieldsDesc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelShowPassword}
                className={`flex-1 px-4 py-2 rounded-lg transition ${
                  isDark
                    ? 'bg-gray-800 text-gray-100 hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmShowPassword}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                {t('show')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
