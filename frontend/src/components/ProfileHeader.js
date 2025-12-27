import { Users, Calendar, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfileHeader({ onFindFriendsClick, onCalendarClick }) {
  const navigate = useNavigate();

  const handleCalendar = () => {
    if (onCalendarClick) {
      onCalendarClick();
    } else {
      navigate('/calendar');
    }
  };

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
