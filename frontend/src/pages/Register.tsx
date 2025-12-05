import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./../styles/Register.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setMsg("Passwords do not match.");
      return;
    }

    setMsg("Registering...");

    try {
      const res = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, password_confirm: passwordConfirm }),
      });

      const j = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(j.user)); // Auto-login after register
        setMsg("Registered successfully.");
        navigate("/home");
      } else {
        setMsg(j.message || "Registration failed.");
      }
    } catch (err) {
      setMsg("Network error.");
    }
  }

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
        />
        <button type="submit">Register</button>
        {msg && <div className="msg">{msg}</div>}
        <div className="switch-link">
          Already have an account? <Link to="/">Login</Link>
        </div>
      </form>
    </div>
  );
}
