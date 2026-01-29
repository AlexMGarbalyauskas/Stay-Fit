import { useEffect, useRef, useState } from 'react';
import { Bell, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../api';
import { io } from 'socket.io-client';
import { SOCKET_BASE, getSocketOptions } from '../utils/socket';
import { useLanguage } from '../context/LanguageContext';

export default function Header({ disableNotifications = false }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hasUnread, setHasUnread] = useState(false);
  const socketRef = useRef(null);

  const refreshUnread = async () => {
    try {
      const res = await getNotifications();
      const anyUnread = (res.data.notifications || []).some(n => n.read === 0);
      setHasUnread(anyUnread);
    } catch (err) {
      // non-blocking: keep prior state
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (disableNotifications) return;
    refreshUnread();
    const interval = setInterval(refreshUnread, 10000);

    const token = localStorage.getItem('token');
    if (token) {
      socketRef.current = io(SOCKET_BASE, getSocketOptions(token));
      socketRef.current.on('notification:new', () => refreshUnread());
    }

    return () => {
      clearInterval(interval);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [disableNotifications]);

  const handleNotificationsClick = () => {
    if (disableNotifications) return;
    navigate('/notifications'); // Navigate to Notifications page
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="relative max-w-md mx-auto flex items-center px-4 py-3">
        
        {/* Centered Title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-gray-800">
          Stay Fit
        </h1>

        {/* Tutorials and Notification Icons (far right) */}
        <button
          onClick={() => navigate('/tutorials')}
          className="ml-auto p-2 rounded-full transition hover:bg-gray-100"
          title="Exercise Tutorials"
        >
          <BookOpen className="w-6 h-6 text-gray-700" />
        </button>

        <button
          onClick={handleNotificationsClick}
          disabled={disableNotifications}
          className={`relative p-2 rounded-full transition ${
            disableNotifications ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'
          }`}
        >
          <Bell className="w-6 h-6 text-gray-700" />

          {/* Optional notification dot */}
          {hasUnread && !disableNotifications && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
        </button>

      </div>
    </header>
  );
}
