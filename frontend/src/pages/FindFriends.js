import { useEffect, useState } from 'react';
import { User, X, UserPlus, Dumbbell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import { getUsers, getFriendStatus, sendFriendRequest, unfriend, getMe } from '../api';

export default function FindFriends({ onFriendUpdate }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statuses, setStatuses] = useState({});
  const [me, setMe] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  // Fetch users
  const fetchUsers = () => {
    if (!isAuthenticated) return;
    getUsers()
      .then(res => {
        const allUsers = res.data.users || [];
        // Prepend API_URL to relative profile_picture paths
        const updatedUsers = allUsers.map(u => ({
          ...u,
          profile_picture: u.profile_picture
            ? u.profile_picture.startsWith('http')
              ? u.profile_picture
              : `${API_URL}${u.profile_picture}`
            : null
        }));
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
  }, [isAuthenticated]);

  // Fetch current user (me)
  useEffect(() => {
    if (!isAuthenticated) return;
    getMe()
      .then(res => {
        const user = res.data.user || res.data;
        const normalized = {
          ...user,
          profile_picture: user.profile_picture
            ? user.profile_picture.startsWith('http')
              ? user.profile_picture
              : `${API_URL}${user.profile_picture}`
            : null
        };
        setMe(normalized);
      })
      .catch(() => setMe(null));
  }, []);

  // When users or me change, fetch friend statuses for other users
  useEffect(() => {
    if (!isAuthenticated) return;
    users.forEach(u => {
      if (me && u.id === me.id) return;
      getFriendStatus(u.id).then(r =>
        setStatuses(prev => ({ ...prev, [u.id]: r.data.status }))
      ).catch(() => {});
    });
  }, [users, me]);

  // Re-filter when search term or location changes
  useEffect(() => {
    if (!isAuthenticated) return;
    let result = users;
    
    // Filter by username search
    if (searchTerm) {
      result = result.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    // Filter by location
    if (locationFilter.trim()) {
      result = result.filter(u => u.location && u.location.toLowerCase().includes(locationFilter.toLowerCase()));
    }
    
    setFilteredUsers(result);
  }, [searchTerm, locationFilter, users]);

  const handleAddFriend = id =>
    sendFriendRequest(id)
      .then(() => {
        setStatuses(prev => ({ ...prev, [id]: 'sent' }));
        if (onFriendUpdate) onFriendUpdate();
      });

  // Modal state for unfriend confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const openUnfriendModal = (id, username) => {
    setConfirmTarget({ id, username });
    setConfirmOpen(true);
  };

  const closeUnfriendModal = () => {
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  const confirmUnfriend = () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;
    unfriend(id)
      .then(() => {
        setStatuses(prev => ({ ...prev, [id]: 'none' }));
        if (onFriendUpdate) onFriendUpdate();
        closeUnfriendModal();
      })
      .catch(() => {
        alert('Failed to unfriend');
        closeUnfriendModal();
      });
  };

  // Auth guard render
  if (!isAuthenticated) {
    return (
      <>
        <Header disableNotifications />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-24 pt-20">
          <div className="px-4 max-w-md mx-auto text-center mt-20">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <UserPlus className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Fitness Friends</h1>
              <p className="text-gray-600 text-lg px-4">Please login to discover and connect with new fitness buddies in your area.</p>
            </div>
            
            <div className="flex flex-col gap-4 mt-12">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-white border-2 border-gray-200 text-gray-800 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md"
              >
                Create an Account
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-8">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
        <Navbar />
      </>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 bg-gray-100">
      <Header title="Find Friends" showBack />
      <div className="max-w-md mx-auto px-4 mt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Find Friends</h2>
        
        {/* Username Search */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Enter username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setSearchTerm(search.trim().replace(/^@/, '')); }}
            className="flex-1 p-2 border rounded focus:outline-none focus:ring"
          />
          <button
            onClick={() => setSearchTerm(search.trim().replace(/^@/, ''))}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Search
          </button>
        </div>

        {/* Location Filter */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter by location (e.g., New York)..."
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring text-sm"
          />
          {me?.location && (
            <p className="text-xs text-gray-500 mt-1">Your location: <strong>{me.location}</strong></p>
          )}
        </div>

        {/* Current user at top */}
        {me && (
          <div className="block">
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/profile')}
              onKeyDown={e => { if (e.key === 'Enter') navigate('/profile'); }}
              className="flex items-center justify-between bg-white p-3 rounded shadow mb-2 cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {me.profile_picture ? (
                  <img src={me.profile_picture} alt={me.username} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="text-gray-800 font-medium">@{me.username}</p>
                  <p className="text-xs text-gray-500">{me.nickname ? me.nickname : 'You'}</p>
                </div>
              </div>

              <div className="text-sm text-gray-500">View Profile</div>
            </div>
          </div>
        )}

        <div className="space-y-2 mt-3">
          {filteredUsers.filter(u => u.id !== me?.id).map(user => (
            <Link to={`/users/${user.id}`} key={user.id} className="block">
              <div className="flex items-center justify-between bg-white p-3 rounded shadow hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt={user.username} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-gray-800 font-medium">@{user.username}</p>
                    {user.nickname && <p className="text-xs text-gray-500">{user.nickname}</p>}
                    {user.location && <p className="text-xs text-gray-400">📍 {user.location}</p>}
                  </div>
                </div>

                <div className="ml-4 flex items-center gap-2">
                  {statuses[user.id] === 'none' && (
                    <button
                      onClick={e => { e.preventDefault(); handleAddFriend(user.id); }}
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                    >
                      Add
                    </button>
                  )}
                  {statuses[user.id] === 'sent' && (
                    <button disabled className="px-3 py-1 bg-gray-400 text-white rounded">
                      Sent
                    </button>
                  )}
                  {statuses[user.id] === 'friends' && (
                    <button
                      onClick={e => { e.preventDefault(); openUnfriendModal(user.id, user.username); }}
                      className="px-2 py-1 bg-red-500 text-white rounded-full"
                      aria-label="Unfriend"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Remove Friend"
        message={`Are you sure you want to remove <strong>@${confirmTarget?.username}</strong> from your friends?`}
        onConfirm={confirmUnfriend}
        onCancel={closeUnfriendModal}
        confirmText="Yes"
        cancelText="No"
      />

      <Navbar />
    </div>
  );
}
