import { useEffect, useState } from 'react';
import { acceptFriendRequest, rejectFriendRequest, getFriendRequests } from '../api';

export default function FriendRequests({ onFriendUpdate }) {
  const [requests, setRequests] = useState([]);

  const fetchRequests = () => getFriendRequests().then(res => setRequests(res.data.requests));

  useEffect(() => { fetchRequests(); }, []);

  const accept = async (id, senderId) => {
    await acceptFriendRequest(id, senderId);
    setRequests(r => r.filter(x => x.id !== id));
    if (onFriendUpdate) onFriendUpdate();
  };

  const reject = async (id) => {
    await rejectFriendRequest(id);
    setRequests(r => r.filter(x => x.id !== id));
  };

  return (
    <div className="p-4">
      {requests.map(r => (
        <div key={r.id} className="flex justify-between items-center mb-3">
          <div>
            <p className="font-medium">{r.nickname || r.username}</p>
            {r.nickname && <p className="text-xs text-gray-500">@{r.username}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => accept(r.id, r.sender_id)} className="px-2 py-1 bg-green-500 text-white rounded">Accept</button>
            <button onClick={() => reject(r.id)} className="px-2 py-1 bg-red-500 text-white rounded">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
