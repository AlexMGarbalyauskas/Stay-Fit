import { NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  PlusSquare,
  MessageCircle,
  User
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const { t } = useLanguage();
  const baseClass =
    'flex flex-col items-center text-xs gap-1 transition-colors';

  const activeClass = 'text-blue-600';
  const inactiveClass = 'text-gray-500';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-50">
      <div className="flex justify-around items-center h-14">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <Home size={22} />
          {t('home')}
        </NavLink>

        <NavLink
          to="/find"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <Search size={22} />
          {t('findFriends')}
        </NavLink>

        <NavLink
          to="/post"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <PlusSquare size={26} />
          {t('post')}
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <MessageCircle size={22} />
          {t('messages')}
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <User size={22} />
          {t('profile')}
        </NavLink>
      </div>
    </nav>
  );
}
