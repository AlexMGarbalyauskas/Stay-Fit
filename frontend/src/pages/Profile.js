import { useEffect, useState } from 'react';
import { User, Share2, Edit2, Check, Users as UsersIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProfileHeader from '../components/ProfileHeader';
import axios from 'axios';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [bioEditing, setBioEditing] = useState(false);
  const [locationEditing, setLocationEditing] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
      setBioInput(res.data.user.bio || '');
      setLocationInput(res.data.user.location || '');

      const friendsRes = await axios.get(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriendsCount(friendsRes.data.friends.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFriendUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const friendsRes = await axios.get(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriendsCount(friendsRes.data.friends.length);
    } catch (err) {
      console.error('Failed to update friends count', err);
    }
  };

  // --- Profile Picture ---
  const handleProfilePictureChange = e => {
    if (e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleUploadProfilePicture = async () => {
    if (!selectedFile) return alert('Select a file first');
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profile_picture', selectedFile);

    try {
      const res = await axios.post(`${API_URL}/me/profile-picture`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      // prepend API_URL in case backend returns relative path
      const pictureUrl = res.data.profile_picture.startsWith('http')
        ? res.data.profile_picture
        : `${API_URL}${res.data.profile_picture}`;
      setUser(prev => ({ ...prev, profile_picture: pictureUrl }));
      setSelectedFile(null);
      alert('Profile picture updated!');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    }
  };

  // --- Bio ---
  const handleSaveBio = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/me/update`, { bio: bioInput }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(prev => ({ ...prev, bio: bioInput }));
      setBioEditing(false);
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  };

  // --- Location ---
  const handleSaveLocation = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/me/update`, { location: locationInput }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(prev => ({ ...prev, location: locationInput }));
      setLocationEditing(false);
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  };

  if (!user) return <p className="text-center mt-20 text-gray-500">Loading...</p>;

  const videos = Array.from({ length: 12 });

  return (
    <>
      <ProfileHeader
        onFindFriendsClick={() => alert('Find Friends clicked!')}
        onCalendarClick={() => alert('Calendar clicked!')}
      />

      <div className="pt-20 pb-20 min-h-screen bg-gray-100">
        <div className="max-w-md mx-auto px-4">

          {/* Avatar */}
          <div className="flex justify-center mt-6 relative">
            {user.profile_picture ? (
              <img
                src={user.profile_picture.startsWith('http') ? user.profile_picture : `${API_URL}${user.profile_picture}`}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover"
              />
            ) : (
              <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-14 h-14 text-gray-500" />
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleProfilePictureChange} id="profilePicInput" className="hidden" />
            <button onClick={() => document.getElementById('profilePicInput').click()} className="absolute bottom-0 right-0 bg-blue-500 px-3 py-1 rounded-full text-white text-xs hover:bg-blue-600 transition">Change</button>
            {selectedFile && (
              <button onClick={handleUploadProfilePicture} className="absolute bottom-0 left-0 bg-green-500 px-3 py-1 rounded-full text-white text-xs hover:bg-green-600 transition">Upload</button>
            )}
          </div>

          {/* Username, ID, Friends Count */}
          <h2 className="text-center text-xl font-bold mt-4">@{user.username}</h2>
          <p className="text-center text-sm text-gray-500">ID: {user.id}</p>
          <div className="text-center mt-1 flex justify-center items-center gap-1 text-gray-700">
            <UsersIcon className="w-4 h-4" />
            <span>{friendsCount} Friends</span>
          </div>

          {/* Bio */}
          <div className="mt-4 flex items-center gap-2">
            {bioEditing ? (
              <>
                <input
                  type="text"
                  value={bioInput}
                  onChange={e => setBioInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveBio()}
                  className="w-full p-2 border rounded"
                  autoFocus
                />
                <button onClick={handleSaveBio} className="bg-green-500 px-2 py-1 rounded text-white"><Check size={16} /></button>
              </>
            ) : (
              <>
                <p className="flex-1">{user.bio || 'No bio yet.'}</p>
                <button onClick={() => setBioEditing(true)} className="text-blue-500 hover:underline"><Edit2 size={16} /></button>
              </>
            )}
          </div>

          {/* Location */}
          <div className="mt-2 flex items-center gap-2">
            {locationEditing ? (
              <>
                <input
                  type="text"
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveLocation()}
                  className="w-full p-2 border rounded"
                  autoFocus
                />
                <button onClick={handleSaveLocation} className="bg-green-500 px-2 py-1 rounded text-white"><Check size={16} /></button>
              </>
            ) : (
              <>
                <p className="flex-1">{user.location || 'No location yet.'}</p>
                <button onClick={() => setLocationEditing(true)} className="text-blue-500 hover:underline"><Edit2 size={16} /></button>
              </>
            )}
          </div>

          {/* Share */}
          <div className="flex justify-center mt-4">
            <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium hover:bg-gray-50 transition">
              <Share2 className="w-4 h-4" /> Share Profile
            </button>
          </div>

          {/* Videos */}
          <div className="border-t my-6 grid grid-cols-3 gap-1">
            {videos.map((_, i) => <div key={i} className="aspect-square bg-gray-300 flex items-center justify-center"><span className="text-xs text-gray-600">Video</span></div>)}
          </div>

        </div>
      </div>
      <Navbar />
    </>
  );
}
