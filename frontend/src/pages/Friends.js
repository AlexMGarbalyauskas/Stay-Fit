import { useEffect, useState } from 'react';
import { Users, UserX, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getFriends, unfriend, API_BASE } from '../api';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';



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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

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

  if (loading) return <p className="mt-20 text-center text-gray-500">Loading friends...</p>;

  return (
    <>
      <div className="pt-20 pb-24 min-h-screen bg-gray-100">
        <div className="max-w-md mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
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
                <li key={friend.id} className="bg-white rounded-lg shadow hover:shadow-md transition">
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
                      title="Unfriend"
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
        title="Remove Friend"
        message={`Are you sure you want to remove <strong>@${confirmTarget?.username}</strong> from your friends?`}
        onConfirm={handleUnfriend}
        onCancel={closeUnfriendModal}
        confirmText="Yes"
        cancelText="No"
      />

      <Navbar />
    </>
  );
}
