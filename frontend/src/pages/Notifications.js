import { useEffect, useState, useRef } from 'react';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest, getNotifications, markNotificationRead, markAllNotificationsRead } from '../api';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE } from '../api';

export default function Notifications({ onFriendUpdate }) {
  const [tab, setTab] = useState('requests'); // requests, unfriended, messages
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // for Go Back

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getFriendRequests();
      return res.data.requests || [];
    } catch (err) {
      console.error(err);
      return [];
    } finally { setLoading(false); }
  };

  const fetchNotifications = async (type) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications(type);
      setItems(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError(err?.response?.status === 404 ? 'Notifications service not found (restart backend)' : 'Failed to load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const socketRef = useRef(null);

  useEffect(() => {
    // Initial load for the default tab
    if (tab === 'requests') {
      fetchRequests().then(rs => setItems(rs));
    } else {
      fetchNotifications(tab);
    }

    const interval = setInterval(() => {
      if (tab === 'requests') fetchRequests().then(rs => setItems(rs));
      else fetchNotifications(tab);
    }, 5000);

    // Socket listener for new notifications
    const token = localStorage.getItem('token');
    if (token) {
      socketRef.current = io(API_BASE.replace('/api',''), { auth: { token } });
      socketRef.current.on('notification:new', (data) => {
        // Refresh current tab when a relevant notification arrives
        if (!tab || (data.type === tab) || (tab === 'requests' && data.type === 'friend_request')) {
          if (tab === 'requests') fetchRequests().then(rs => setItems(rs));
          else fetchNotifications(tab);
        }
      });
    }

    return () => { clearInterval(interval); if (socketRef.current) socketRef.current.disconnect(); };
  }, [tab]);

  const handleAccept = async (requestId, senderId) => {
    await acceptFriendRequest(requestId, senderId);
    setItems(prev => prev.filter(r => r.id !== requestId));
    if (onFriendUpdate) onFriendUpdate();
  };

  const handleReject = async (requestId) => {
    await rejectFriendRequest(requestId);
    setItems(prev => prev.filter(r => r.id !== requestId));
  };

  const handleMarkRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      setItems(prev => prev.map(i => i.id === notifId ? { ...i, read: 1 } : i));
    } catch (e) { console.error(e); }
  };

  const handleGoToChat = (fromUserId) => {
    // navigate to chat with that user
    navigate(`/chat/${fromUserId}`);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition">Go Back</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTab('requests'); }} className={`px-3 py-1 rounded ${tab==='requests' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Friend Requests</button>
          <button onClick={() => { setTab('unfriended'); }} className={`px-3 py-1 rounded ${tab==='unfriended' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Unfriended</button>
          <button onClick={() => { setTab('message'); }} className={`px-3 py-1 rounded ${tab==='message' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Messages</button>
        </div>
      </div>

      {loading && <p className="text-gray-500 text-center mt-4">Loading...</p>}

      {!loading && error && (
        <p className="text-red-500 text-center mt-4">{error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-gray-500 text-center mt-4">No notifications</p>
      )}

      {/* Friend Requests tab uses the friend_requests API so items are friend objects */}
      {tab === 'requests' && !loading && items.map(r => (
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

      {/* Unfriended tab */}
      {tab === 'unfriended' && !loading && items.map(n => (
        <div key={n.id} className="flex justify-between items-center mb-3 p-3 bg-white rounded shadow">
          <div>
            <p className="font-medium">@{n.data?.fromUsername || ('user #' + n.data?.byUserId)}</p>
            <p className="text-sm text-gray-500">unfriended you</p>
            <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
          </div>
          <div className="flex gap-2 items-center">
            {n.read === 0 && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">NEW</span>}
            <button onClick={() => { handleMarkRead(n.id); }} className="px-3 py-1 bg-gray-100 rounded">Mark Read</button>
          </div>
        </div>
      ))}

      {/* Messages tab */}
      {tab === 'message' && !loading && items.map(n => (
        <div key={n.id} className="flex justify-between items-center mb-3 p-3 bg-white rounded shadow">
          <div>
            <p className="font-medium">@{n.data?.fromUsername || ('user #' + n.data?.fromUserId)}</p>
            <p className="text-sm text-gray-500">{n.data?.content || 'You got a new message'}</p>
            <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
          </div>
          <div className="flex gap-2 items-center">
            {n.read === 0 && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">NEW</span>}
            <button onClick={() => { handleMarkRead(n.id); handleGoToChat(n.data?.fromUserId); }} className="px-3 py-1 bg-blue-500 text-white rounded">Open Chat</button>
          </div>
        </div>
      ))}

      <div className="mt-6">
        <button onClick={() => markAllNotificationsRead().then(() => setItems(prev => prev.map(i => ({ ...i, read: 1 })))).catch(() => {})} className="px-3 py-2 bg-gray-200 rounded">Mark all read</button>
      </div>
    </div>
  );
}
