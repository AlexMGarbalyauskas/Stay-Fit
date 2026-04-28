//friend requests page where users can view, accept, or 
// reject incoming friend requests.
// The component fetches the list of pending 
// friend requests from the server and displays 
// them in a user-friendly format. Each request 
// shows the sender's nickname 
// (or username if no nickname is set) and 
// provides buttons to accept or reject the request. 
// When a user accepts a friend request, the component 
// updates the list of requests and can also trigger an 
// update to the friends list if a callback is provided. 
// The component also adapts its styling based on the 
// current theme (light or dark) for a consistent user experience.




//imports
import { useEffect, useState } from 'react';
import { acceptFriendRequest, rejectFriendRequest, getFriendRequests } from '../api';
//imports end




// The FriendRequests component 
// manages and displays incoming friend requests,
export default function FriendRequests({ onFriendUpdate }) {

  // State variables for theme, friend requests, and loading/error states
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const [requests, setRequests] = useState([]);

  const fetchRequests = () => getFriendRequests().then(res => setRequests(res.data.requests));

  // Fetch friend requests when the component mounts
  useEffect(() => { fetchRequests(); }, []);


  // Handler for accepting a friend request, 
  // which updates the server and local state
  const accept = async (id, senderId) => {
    await acceptFriendRequest(id, senderId);
    setRequests(r => r.filter(x => x.id !== id));
    if (onFriendUpdate) onFriendUpdate();
  };



  // Handler for rejecting a friend request,
  const reject = async (id) => {
    await rejectFriendRequest(id);
    setRequests(r => r.filter(x => x.id !== id));
  };




  // Render the list of friend requests 
  // with options to accept or reject each one
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

  //end of component
}
