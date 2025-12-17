import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, getFriendStatus, sendFriendRequest } from '../api';

export default function UserProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    getUser(id).then(res => setUser(res.data.user));
    getFriendStatus(id).then(res => setStatus(res.data.status));
  }, [id]);

  const sendRequest = () => sendFriendRequest(id).then(() => setStatus('sent'));

  if (!user) return <p className="text-center mt-20 text-gray-500">Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">@{user.username}</h2>
      <p>{user.bio}</p>
      {status === 'none' && <button onClick={sendRequest} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Add Friend</button>}
      {status === 'sent' && <button disabled className="mt-4 bg-gray-400 text-white px-4 py-2 rounded">Request Sent</button>}
      {status === 'friends' && <button disabled className="mt-4 bg-green-500 text-white px-4 py-2 rounded">Friends</button>}
    </div>
  );
}
