import { useEffect, useState } from 'react';
import { Users, UserX, ArrowLeft, Dumbbell } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getFriends, unfriend, API_BASE } from '../api';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '../context/LanguageContext';



export default function Friends({ refreshTrigger }) {
  const { t } = useLanguage();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const fetchFriends = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getFriends();
      setFriends(res.data.friends);
    } catch (err) {
      console.error('Failed to load friends', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFriends(); }, [refreshTrigger, isAuthenticated]);

  const openUnfriendModal = (friend) => {
    setConfirmTarget(friend);
    setConfirmOpen(true);
  };
  const closeUnfriendModal = () => { setConfirmOpen(false); setConfirmTarget(null); };
  const handleUnfriend = async () => {
    if (!confirmTarget) return;
    await unfriend(confirmTarget.id);
    setFriends(prev => prev.filter(f => f.id !== confirmTarget.id));
    closeUnfriendModal();
  };

  // Auth guard render
  if (!isAuthenticated) {
    return (
      <>
        <Header disableNotifications />
        <div className={`min-h-screen bg-gradient-to-br pb-24 pt-20 ${isDark ? 'from-gray-950 via-gray-900 to-gray-800 text-gray-200' : 'from-slate-50 via-white to-slate-100 text-slate-800'}`}>
          <div className="px-4 max-w-md mx-auto text-center mt-20">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-400 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('yourFriends')}</h1>
              <p className="text-gray-600 text-lg px-4">{t('loginToViewFriends')}</p>
            </div>
            
            <div className="flex flex-col gap-4 mt-12">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white py-4 rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-green-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {t('goToLogin')}
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-white border-2 border-gray-200 text-gray-800 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md"
              >
                {t('createAnAccount')}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-8">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
        <Navbar />
      </>
    );
  }

  if (loading) return <p className="mt-20 text-center text-gray-500">{t('loadingFriends')}</p>;

  return (
    <>
      <div className={`pt-20 pb-24 min-h-screen ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-slate-800'}`}>
        <div className="max-w-md mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} /> {t('back')}
          </button>
          <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> {t('friends')}
          </h1>

          {friends.length === 0 ? (
            <div className={`rounded-lg p-6 text-center shadow border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
              <p className="text-gray-600 mb-4">{t('noFriendsYet')}</p>
              <button
                onClick={() => navigate('/find')}
                className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition"
              >
                {t('findFriends')}
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {friends.map(friend => (
                <li key={friend.id} className={`rounded-lg shadow hover:shadow-md transition border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
                  <div className="flex items-center justify-between p-4">
                    <Link 
                      to={`/users/${friend.id}`} 
                      className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition"
                    >
                      {friend.profile_picture ? (
                        <img src={friend.profile_picture.startsWith('http') ? friend.profile_picture : `${API_BASE}${friend.profile_picture}`} alt={friend.username} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <span className="font-medium">{friend.nickname || friend.username}</span>
                        {friend.nickname && <div className="text-xs text-gray-500">@{friend.username}</div>}
                      </div>
                    </Link>

                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        openUnfriendModal(friend);
                      }} 
                      className="text-red-500 hover:text-red-700 ml-2" 
                        title={t('unfriend')}
                    >
                      <UserX size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={t('removeFriend')}
        message={`${t('removeFriendConfirm')} @${confirmTarget?.username}?`}
        onConfirm={handleUnfriend}
        onCancel={closeUnfriendModal}
        confirmText={t('yes')}
        cancelText={t('no')}
      />

      <Navbar />
    </>
  );
}
