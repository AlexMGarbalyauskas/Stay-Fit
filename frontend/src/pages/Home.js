import { useEffect, useState } from 'react';
import { getMe } from '../api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Header from '../components/Header';

export default function Home({ onLogout }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    getMe()
      .then(res => setUser(res.data.user || res.data))
      .catch(err => {
        console.error(err);
        localStorage.clear();
        if (onLogout) onLogout();
        navigate('/login');
      });
  }, [navigate, onLogout]);

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout();
    navigate('/login');
  };

  if (!user) return <p className="text-center mt-20 text-gray-500">Loading user…</p>;

  return (
    <>
      <Header onNotificationsClick={() => alert('Notifications clicked')} />

      <main className="flex justify-center items-center min-h-screen bg-gray-100 pt-16 pb-16">
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome, {user.username}!</h2>
          <p className="text-gray-600 mb-1">User ID: {user.id}</p>
          <p className="text-gray-600 mb-6">Email: {user.email}</p>

          <button
            onClick={handleLogout}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </main>
      <Navbar />
    </>
  );
}
