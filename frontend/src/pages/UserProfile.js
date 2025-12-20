import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, getFriendStatus, sendFriendRequest, unfriend } from '../api';
import { User, Users as UsersIcon, UserX } from 'lucide-react';

export default function UserProfile() {
  const { id } = useParams();
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
    <div className="pt-20 pb-20 min-h-screen bg-gray-100 flex flex-col items-center">
      <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
        {user.profile_picture ? <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" /> : <User className="w-14 h-14 text-gray-500" />}
      </div>
      <h2 className="text-xl font-bold mt-4">@{user.username}</h2>
      <p className="text-sm text-gray-500">ID: {user.id}</p>
      <div className="mt-1 flex items-center gap-1 text-gray-700"><UsersIcon className="w-4 h-4" /><span>{friendsCount} Friends</span></div>
      <p className="mt-4 text-center text-gray-700">{user.bio || 'No bio yet.'}</p>
      <p className="text-gray-500">{user.location || 'No location specified'}</p>
      <div className="mt-4">
        {status === 'none' && <button onClick={handleSendRequest} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">Add Friend</button>}
        {status === 'sent' && <button disabled className="px-4 py-2 bg-gray-400 text-white rounded">Request Sent</button>}
        {status === 'friends' && <button onClick={handleUnfriend} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center gap-1"><UserX size={16} /> Unfriend</button>}
      </div>
    </div>
  );
}
