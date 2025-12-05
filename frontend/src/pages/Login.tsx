import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./../styles/Login.css";

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Logging in...");

    try {
      const res = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const j = await res.json();
      if (res.ok) {
        // ✅ Save user info to localStorage
        localStorage.setItem("user", JSON.stringify(j.user));
        setMsg("Login successful.");
        navigate("/home"); // go to React frontend home page
      } else {
        setMsg(j.message || "Login failed.");
      }
    } catch (err) {
      setMsg("Network error.");
    }
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          type="text"
          placeholder="Username or Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {msg && <div className="msg">{msg}</div>}
        <div className="switch-link">
          No account? <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
}
