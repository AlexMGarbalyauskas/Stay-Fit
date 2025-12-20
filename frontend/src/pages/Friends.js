import { useEffect, useState } from 'react';
import { Users, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFriends, unfriend, API_BASE } from '../api';
import Navbar from '../components/Navbar';



export default function Friends({ refreshTrigger }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFriends = async () => {
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

  useEffect(() => { fetchFriends(); }, [refreshTrigger]);

  const handleUnfriend = async (friendId) => {
    if (!window.confirm('Remove this friend?')) return;
    await unfriend(friendId);
    setFriends(prev => prev.filter(f => f.id !== friendId));
  };

  if (loading) return <p className="mt-20 text-center text-gray-500">Loading friends...</p>;

  return (
    <>
      <div className="pt-20 pb-24 min-h-screen bg-gray-100">
        <div className="max-w-md mx-auto px-4">
          <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> Friends
          </h1>

          {friends.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center shadow">
              <p className="text-gray-600 mb-4">You don’t have any friends yet.</p>
              <button
                onClick={() => navigate('/find')}
                className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition"
              >
                Make friends
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {friends.map(friend => (
                <li key={friend.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {friend.profile_picture ? (
                      <img src={friend.profile_picture.startsWith('http') ? friend.profile_picture : `${API_BASE}${friend.profile_picture}`} alt={friend.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <span className="font-medium">@{friend.username}</span>
                  </div>

                  <button onClick={() => handleUnfriend(friend.id)} className="text-red-500 hover:text-red-700" title="Unfriend">
                    <UserX size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Navbar />
    </>
  );
}
