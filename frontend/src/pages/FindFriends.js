import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { getUsers, sendFriendRequest, getFriendStatus, unfriend } from '../api';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import { Link } from 'react-router-dom';

export default function FindFriends({ onFriendUpdate }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    getUsers()
      .then(res => {
        setUsers(res.data.users || []);
        setFilteredUsers(res.data.users || []);
        res.data.users.forEach(user => {
          getFriendStatus(user.id).then(r =>
            setStatuses(prev => ({ ...prev, [user.id]: r.data.status }))
          );
        });
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!searchTerm) return setFilteredUsers(users);
    setFilteredUsers(users.filter(u =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [searchTerm, users]);

  const handleAddFriend = id =>
    sendFriendRequest(id).then(() => setStatuses(prev => ({ ...prev, [id]: 'sent' })));

  const handleUnfriend = id =>
    unfriend(id)
      .then(() => {
        setStatuses(prev => ({ ...prev, [id]: 'none' }));
        if (onFriendUpdate) onFriendUpdate();
      })
      .catch(() => alert('Failed to unfriend'));

  return (
    <div className="min-h-screen pt-20 pb-20 bg-gray-100">
      <Header title="Find Friends" showBack />

      <div className="max-w-md mx-auto px-4 mt-4">
        {/* Heading above search bar */}
        <h2 className="text-xl font-bold text-gray-800 mb-2">Find Friends</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 p-2 border rounded focus:outline-none focus:ring"
          />
          <button
            onClick={() => setSearchTerm(search)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Search
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredUsers.map(user => {
            const img = user.profile_picture ? (
              <img src={user.profile_picture} alt={user.username} className="w-20 h-20 rounded-full mb-2" />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                <User className="w-10 h-10 text-gray-500" />
              </div>
            );

            return (
              <Link to={`/users/${user.id}`} key={user.id}>
                <div className="flex flex-col items-center bg-white p-4 rounded shadow hover:shadow-md transition">
                  {img}
                  <p className="text-gray-700 font-medium">@{user.username}</p>
                  {statuses[user.id] === 'none' && (
                    <button
                      onClick={e => { e.preventDefault(); handleAddFriend(user.id); }}
                      className="mt-2 px-4 py-1 bg-blue-500 text-white rounded"
                    >
                      Add Friend
                    </button>
                  )}
                  {statuses[user.id] === 'sent' && (
                    <button disabled className="mt-2 px-4 py-1 bg-gray-400 text-white rounded">
                      Request Sent
                    </button>
                  )}
                  {statuses[user.id] === 'friends' && (
                    <button
                      onClick={e => { e.preventDefault(); handleUnfriend(user.id); }}
                      className="mt-2 px-4 py-1 bg-red-500 text-white rounded"
                    >
                      Unfriend
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <Navbar />
    </div>
  );
}
