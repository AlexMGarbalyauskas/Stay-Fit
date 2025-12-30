import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getFriendStatus, sendFriendRequest, unfriend } from '../api';
import { User, Users as UsersIcon, UserX, ArrowLeft } from 'lucide-react';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [friendsCount, setFriendsCount] = useState(0);

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

      const friendsRes = await fetch(`${API_URL}/api/friends`, authHeaders);
      const friendsData = await friendsRes.json();
      setFriendsCount(friendsData.friends.filter(f => f.id !== id).length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSendRequest = async () => {
    try { await sendFriendRequest(id); setStatus('sent'); }
    catch (err) { console.error(err); alert('Failed to send friend request'); }
  };

  const handleUnfriend = async () => {
    try { await unfriend(id); setStatus('none'); }
    catch (err) { console.error(err); alert('Failed to unfriend'); }
  };

  if (!user) return <p className="text-center mt-20 text-gray-500">Loading...</p>;

  return (
    <div className="pt-20 pb-20 min-h-screen bg-gray-50 px-4">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-gray-700"
        title="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Go back</span>
      </button>

      {/* Profile Container */}
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-4 mb-4">
          {/* Profile Picture */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
            {user.profile_picture ? (
              <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-gray-500" />
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900">@{user.username}</h2>
            {user.nickname && (
              <p className="text-xl font-light text-gray-700 mt-1">{user.nickname}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mb-3">
          <p className="text-sm text-gray-700">{user.bio || 'No bio'}</p>
        </div>

        {/* Location */}
        <div className="mb-4">
          <p className="text-sm text-gray-700">{user.location || 'No location'}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-4 text-sm">
          <div>
            <span className="font-semibold">{friendsCount}</span>
            <span className="text-gray-500"> friends</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          {status === 'none' && (
            <button 
              onClick={handleSendRequest} 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Add Friend
            </button>
          )}
          {status === 'sent' && (
            <button 
              disabled 
              className="w-full px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
            >
              Request Sent
            </button>
          )}
          {status === 'friends' && (
            <button 
              onClick={handleUnfriend} 
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center justify-center gap-2"
            >
              <UserX size={16} />
              Unfriend
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
