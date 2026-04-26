// ProfileHeader.js - A reusable header 
// component for profile-related pages,


// providing navigation to calendar, friends, and settings.
import { Users, Calendar, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';






// This component is used in the profile page and saved posts page,
export default function ProfileHeader({ onFindFriendsClick, onCalendarClick }) {
  const navigate = useNavigate();




  // Handler for calendar button click, 
  // navigates to calendar page or calls provided callback
  const handleCalendar = () => {
    if (onCalendarClick) {
      onCalendarClick();
    } else {
      navigate('/calendar');
    }
  };




  // The header is fixed at the top of the page, 
  // with a white background and a bottom border.
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">

        {/* Left Icons: Calendar + Find Friends */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCalendar}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Calendar className="w-6 h-6 text-gray-700" />
          </button>

          <button
            onClick={() => navigate('/friends')}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Users className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Right Icon: Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <Settings className="w-6 h-6 text-gray-700" />
        </button>

      </div>
    </header>
  );
}
