import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  const handleNotificationsClick = () => {
    navigate('/notifications'); // Navigate to Notifications page
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="relative max-w-md mx-auto flex items-center px-4 py-3">
        
        {/* Centered Title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-gray-800">
          Stay Fit
        </h1>

        {/* Notification Icon (far right) */}
        <button
          onClick={handleNotificationsClick}
          className="ml-auto relative p-2 rounded-full hover:bg-gray-100 transition"
        >
          <Bell className="w-6 h-6 text-gray-700" />

          {/* Optional notification dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </button>

      </div>
    </header>
  );
}
