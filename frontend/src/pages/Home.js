import { useEffect, useState } from 'react';
import { getMe } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    getMe(token)
      .then(res => setUser(res.data.user))
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 600, margin: 'auto', paddingTop: 50 }}>
      <h2>Welcome, {user.username}!</h2>
      <p>User ID: {user.id}</p>
      <p>Email: {user.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
