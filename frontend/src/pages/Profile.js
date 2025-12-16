import { useEffect, useState } from 'react';
import { User, Share2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProfileHeader from '../components/ProfileHeader';
import { getMe } from '../api'; // Make sure you have this API call

export default function Profile() {
  const [user, setUser] = useState(null);

  // Fetch logged-in user info
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    getMe(token)
      .then(res => setUser(res.data.user))
      .catch(err => console.error(err));
  }, []);

  const handleShareProfile = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${user?.username}'s Stay Fit Profile`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied!');
    }
  };

  const handleFindFriends = () => alert('Find Friends clicked!');
  const handleCalendar = () => alert('Calendar clicked!');
  const handleSettings = () => alert('Settings clicked!');
  const handleAddProfilePicture = () => alert('Add profile picture clicked!');
  const handleAddBio = () => alert('Add bio clicked!');
  const handleAddLocation = () => alert('Add location clicked!');

  // Dummy video thumbnails
  const videos = Array.from({ length: 12 });

  if (!user) return <p className="text-center mt-20 text-gray-500">Loading...</p>;

  return (
    <>
      {/* Custom Profile Header */}
      <ProfileHeader
        onFindFriendsClick={handleFindFriends}
        onCalendarClick={handleCalendar}
        onSettingsClick={handleSettings}
      />

      <div className="pt-20 pb-20 min-h-screen bg-gray-100">
        <div className="max-w-md mx-auto px-4">

          {/* Avatar */}
          <div className="flex justify-center mt-6">
            <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center relative">
              <User className="w-14 h-14 text-gray-500" />
              <button
                onClick={handleAddProfilePicture}
                className="absolute bottom-0 right-0 bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-600 transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Username and User ID */}
          <h2 className="text-center text-xl font-bold mt-4">@{user.username}</h2>
          <p className="text-center text-sm text-gray-500">ID: {user.id}</p>

          {/* Profile Actions */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={handleAddBio}
              className="px-3 py-1 border rounded-full text-sm hover:bg-gray-50 transition"
            >
              Add Bio
            </button>
            <button
              onClick={handleAddLocation}
              className="px-3 py-1 border rounded-full text-sm hover:bg-gray-50 transition"
            >
              Add Location
            </button>
          </div>

          {/* Share Profile Button */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleShareProfile}
              className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium hover:bg-gray-50 transition"
            >
              <Share2 className="w-4 h-4" />
              Share Profile
            </button>
          </div>

          {/* Divider */}
          <div className="border-t my-6" />

          {/* Video Grid */}
          <div className="grid grid-cols-3 gap-1">
            {videos.map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-300 flex items-center justify-center"
              >
                <span className="text-xs text-gray-600">Video</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      <Navbar />
    </>
  );
}
