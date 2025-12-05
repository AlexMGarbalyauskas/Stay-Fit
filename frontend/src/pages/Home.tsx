import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../styles/Home.css";

interface User {
  id: number;
  username: string;
  email: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/"); // redirect if not logged in
    }
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/");
  }

  if (!user) return null;

  return (
    <div className="home-container">
      <div className="home-card">
        <h2>Welcome, {user.username}!</h2>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
