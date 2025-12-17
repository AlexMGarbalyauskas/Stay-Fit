import { useEffect, useState } from 'react';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Notifications({ onFriendUpdate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // for Go Back

  const fetchRequests = () => {
    setLoading(true);
    getFriendRequests()
      .then(res => {
        setRequests(res.data.requests || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (requestId, senderId) => {
    await acceptFriendRequest(requestId, senderId);
    setRequests(prev => prev.filter(r => r.id !== requestId));
    if (onFriendUpdate) onFriendUpdate();
  };

  const handleReject = async (requestId) => {
    await rejectFriendRequest(requestId);
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  return (
    <div className="p-4">
      {/* Go Back Button - always visible */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
      >
        Go Back
      </button>

      {/* Loading State */}
      {loading && <p className="text-gray-500 text-center mt-4">Loading...</p>}

      {/* No Requests */}
      {!loading && requests.length === 0 && (
        <p className="text-gray-500 text-center mt-4">No notifications</p>
      )}

      {/* Friend Requests */}
      {!loading && requests.length > 0 && requests.map(r => (
        <div key={r.id} className="flex justify-between items-center mb-3 p-3 bg-white rounded shadow">
          <div>
            <p className="font-medium">@{r.username}</p>
            <p className="text-sm text-gray-500">sent you a friend request</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(r.id, r.sender_id)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Accept
            </button>
            <button
              onClick={() => handleReject(r.id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
