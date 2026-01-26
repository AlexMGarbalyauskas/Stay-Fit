import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUser, getFriendStatus, sendFriendRequest, unfriend } from '../api';
import { User, UserX, ArrowLeft, Heart, Share2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

export default function UserProfile() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [friendsCount, setFriendsCount] = useState(0);
  const [posts, setPosts] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    try {
      const res = await getUser(id);
      const u = res.data.user;
      if (!u) return;
      u.profile_picture = u.profile_picture
        ? u.profile_picture.startsWith('http')
          ? u.profile_picture
          : `${API_URL}${u.profile_picture}`
        : null;
      setUser(u);

      const statusRes = await getFriendStatus(id);
      setStatus(statusRes.data.status);

      // Fetch user's friends list
      try {
        const friendsRes = await axios.get(`${API_URL}/api/users/${id}/friends`, authHeaders);
        const friends = friendsRes.data.friends || [];
        setFriendsCount(friends.length);
      } catch (err) {
        console.error('Failed to fetch user friends:', err);
      }

      // Fetch user's posts if public
      if (u.privacy === 'Public') {
        try {
          const postsRes = await axios.get(`${API_URL}/api/users/${id}/posts`, authHeaders);
          setPosts(postsRes.data.posts || []);
        } catch (err) {
          console.error('Failed to fetch user posts:', err);
          setPosts([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSendRequest = async () => {
    try { await sendFriendRequest(id); setStatus('sent'); }
    catch (err) { console.error(err); alert(t('friendRequestFailed')); }
  };

  const handleUnfriend = async () => {
    try { await unfriend(id); setStatus('none'); }
    catch (err) { console.error(err); alert(t('unfriendFailed')); }
  };

  if (!user) return <p className="text-center mt-20 text-gray-500">{t('loading')}</p>;

  return (
    <>
      <Navbar />
      <div className="pt-20 pb-20 min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
            title={t('back')}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('back')}</span>
          </button>

          {/* Profile Header Section */}
          <div className="flex gap-8 py-8 border-b">
            {/* Profile Picture */}
            <div className="flex justify-center">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-500" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {/* Username */}
              <div className="mb-1">
                <h1 className="text-2xl font-light text-gray-900">@{user.username}</h1>
              </div>

              {/* Nickname */}
              <div className="mb-4">
                <p className="text-xl font-light text-gray-700">{user.nickname || t('noNickname')}</p>
              </div>

              {/* Bio */}
              <div className="mb-3">
                <p className="text-sm text-gray-700">{user.bio || t('noBio')}</p>
              </div>

              {/* Location */}
              <div className="mb-4">
                <p className="text-sm text-gray-700">{user.location || t('noLocation')}</p>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-4 text-sm">
                <div>
                  <span className="font-semibold">{posts.length}</span>
                  <span className="text-gray-500"> {t('posts')}</span>
                </div>
                <button
                  onClick={() => navigate(`/user/${id}/friends`)}
                  className="flex items-center gap-1 hover:text-blue-600 transition cursor-pointer"
                >
                  <span className="font-semibold">{friendsCount}</span>
                  <span className="text-gray-500"> {t('friends_count')}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert(t('profileLinkCopied'));
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 rounded font-semibold text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> {t('share')}
                </button>
                {status === 'none' && (
                  <button
                    onClick={handleSendRequest}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded font-semibold text-sm hover:bg-blue-600 transition"
                  >
                    {t('addFriend')}
                  </button>
                )}
                {status === 'sent' && (
                  <button
                    disabled
                    className="flex-1 px-4 py-2 bg-gray-400 text-white rounded font-semibold text-sm cursor-not-allowed"
                  >
                    {t('requestSent')}
                  </button>
                )}
                {status === 'friends' && (
                  <button
                    onClick={handleUnfriend}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded font-semibold text-sm hover:bg-red-600 transition flex items-center justify-center gap-2"
                  >
                    <UserX size={16} />
                    {t('unfriend')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Posts Section (only if user is public) */}
          {user.privacy === 'Public' && (
            <div className="mt-8">
              <h2 className="font-semibold text-sm uppercase tracking-wider border-t py-4">Posts</h2>
              <div className="grid grid-cols-3 gap-1 mt-4">
                {posts.length === 0 ? (
                  <div className="col-span-3 text-center text-gray-500 py-8">{t('noPostsYet')}</div>
                ) : (
                  posts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/posts/${p.id}/comments`)}
                      className="aspect-square bg-gray-200 relative overflow-hidden rounded group cursor-pointer"
                    >
                      {p.media_type && p.media_type.startsWith('image/') ? (
                        <img
                          src={`${API_URL}${p.media_path}`}
                          className="w-full h-full object-cover"
                          alt="post"
                        />
                      ) : (
                        <video
                          src={`${API_URL}${p.media_path}`}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                        {/* Like Count */}
                        <div className="text-white flex items-center gap-2">
                          <Heart
                            size={20}
                            fill={p.liked ? 'currentColor' : 'none'}
                            className={p.liked ? 'text-red-500' : ''}
                          />
                          <span className="text-sm font-semibold">{p.likes_count || 0}</span>
                        </div>
                      </div>

                      {/* Title overlay */}
                      {p.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                          <p className="text-white text-xs truncate">{p.title}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {user.privacy !== 'Public' && (
            <div className="mt-8 text-center py-8 text-gray-500">
              <p>{user.privacy === 'Private' ? t('userPostsPrivate') : t('userPostsFriendsOnly')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
