import { useState } from 'react';
import { login } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(email, password);
      console.log('Login response:', res.data); // 🔥 Debug login response
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      console.log('Token saved to localStorage:', localStorage.getItem('token')); // 🔥 Debug token
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err.response?.data || err);
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href =
      `${process.env.REACT_APP_API_URL.replace('/api','')}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button
            className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition-colors"
            type="submit"
          >
            Login
          </button>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 p-3 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google logo"
              className="w-6 h-6 mr-2"
            />
            Login with Google
          </button>
        </div>

        <p className="mt-4 text-center text-gray-600">
          Don't have an account?{' '}
          <Link className="text-blue-500 hover:underline" to="/register">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
