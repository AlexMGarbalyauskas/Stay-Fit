import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function UserFriends() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's name
        const userRes = await axios.get(`${API_URL}/api/users/${id}`, authHeaders);
        setUserName(userRes.data.user.username);

        // Fetch friends
        const friendsRes = await axios.get(`${API_URL}/api/users/${id}/friends`, authHeaders);
        setFriends(friendsRes.data.friends || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <p className="text-center mt-20 text-gray-500">Loading...</p>;
  }

  return (
    <>
      <Navbar />
      <div className="pt-20 pb-20 min-h-screen bg-white">
        <div className="max-w-md mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Go back</span>
          </button>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">@{userName}'s Friends</h1>
            <p className="text-sm text-gray-500 mt-1">{friends.length} friends</p>
          </div>

          {/* Friends List */}
          {friends.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No friends yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => navigate(`/user/${friend.id}`)}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                >
                  {/* Profile Picture */}
                  {friend.profile_picture ? (
                    <img
                      src={
                        friend.profile_picture.startsWith('http')
                          ? friend.profile_picture
                          : `${API_URL}${friend.profile_picture}`
                      }
                      alt={friend.username}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                  )}

                  {/* Friend Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {friend.nickname || friend.username}
                    </p>
                    <p className="text-sm text-gray-500 truncate">@{friend.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
