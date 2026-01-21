import { useEffect, useState } from 'react';
import { getMe, getPosts, API_BASE } from '../api';
import { useNavigate } from 'react-router-dom';
import { User, Heart, MessageCircle, Share2, Bookmark, Clock, Dumbbell } from 'lucide-react';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import { toggleLike, toggleSave } from '../api';

export default function Home({ onLogout, isAuthenticated }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentsForPost, setCommentsForPost] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [todayWorkout, setTodayWorkout] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
      setPosts([]);
      return;
    }

    console.log('🔍 Home: Fetching user data...');
    console.log('🔍 isAuthenticated:', isAuthenticated);
    console.log('🔍 API_BASE:', API_BASE);
    console.log('🔍 Token:', localStorage.getItem('token'));

    getMe()
      .then(res => {
        console.log('✅ getMe response:', res);
        setUser(res.data.user || res.data);
      })
      .catch(err => {
        console.error('❌ getMe error:', err);
        console.error('❌ Error response:', err.response);
        if (err?.response?.status === 404) {
          alert('Session invalid or user not found. Please log in again.');
        }
        localStorage.clear();
        if (onLogout) onLogout();
        navigate('/login');
      });

    // Fetch posts for feed
    fetchPosts();

    // Listen for comment updates from other pages
    const handler = (e) => {
      const { postId, commentsCount } = e.detail || {};
      if (!postId) return;
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: commentsCount } : p));
    };
    const deleteHandler = (e) => {
      const { postId } = e.detail || {};
      if (!postId) return;
      setPosts(prev => prev.filter(p => p.id !== postId));
    };
    window.addEventListener('post:commentsUpdated', handler);
    window.addEventListener('post:deleted', deleteHandler);
    // Refresh feed when a friend creates a new post
    const refreshHandler = () => {
      fetchPosts();
    };
    window.addEventListener('feed:refresh', refreshHandler);
    return () => {
      window.removeEventListener('post:commentsUpdated', handler);
      window.removeEventListener('post:deleted', deleteHandler);
      window.removeEventListener('feed:refresh', refreshHandler);
    };
  }, [navigate, onLogout, isAuthenticated]);

  // Countdown timer for today's workout
  useEffect(() => {
    const pad = (n) => String(n).padStart(2, '0');
    const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
    
    const interval = setInterval(() => {
      const today = new Date();
      const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
      
      try {
        const stored = localStorage.getItem('workout-plans');
        if (stored) {
          const plans = JSON.parse(stored);
          const todayPlan = plans[todayKey];
          
          if (todayPlan && todayPlan.time) {
            setTodayWorkout(todayPlan);
            const now = new Date();
            const [hours, minutes] = todayPlan.time.split(':');
            const reminderDate = new Date();
            reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const diff = reminderDate - now;
            
            if (diff > 0) {
              const hours = Math.floor(diff / (1000 * 60 * 60));
              const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const secs = Math.floor((diff % (1000 * 60)) / 1000);
              setCountdown(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
            } else if (diff > -60000 && diff <= 0) {
              setCountdown('NOW!');
            } else {
              setCountdown('');
              setTodayWorkout(null);
            }
          } else {
            setCountdown('');
            setTodayWorkout(null);
          }
        }
      } catch (e) {
        console.error('Failed to load workout plans', e);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await getPosts();
      const fetched = res.data.posts || [];
      // API now includes likes_count, comments_count, saves_count, liked, saved
      setPosts(fetched);
    } catch (err) {
      console.error('Failed to load posts', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout();
    navigate('/');
  };

  // Check authentication first, before checking user
  if (!isAuthenticated) {
    return (
      <>
        <Header disableNotifications />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-24 pt-20">
          <div className="px-4 max-w-md mx-auto text-center mt-20">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Dumbbell className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to StayFit</h1>
              <p className="text-gray-600 text-lg px-4">Join our fitness community to share workouts, connect with friends, and achieve your goals together.</p>
            </div>
            
            <div className="flex flex-col gap-4 mt-12">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-white border-2 border-gray-200 text-gray-800 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md"
              >
                Create an Account
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-8">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
        <Navbar />
      </>
    );
  }

  // Now check if user is loaded
  if (!user) return <p className="text-center mt-20 text-gray-500">Loading user…</p>;

  return (
    <>
      <Header onNotificationsClick={() => alert('Notifications clicked')} />

      <main className="min-h-screen bg-gray-100 pt-16 pb-16">
        <div className="max-w-2xl mx-auto">
          {/* Countdown Timer Display */}
          {countdown && todayWorkout && (
            <div className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white shadow-lg cursor-pointer hover:shadow-xl transition" onClick={() => navigate('/calendar')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Next Workout</p>
                    <p className="text-lg font-bold">{todayWorkout.workout}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium opacity-90 flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" /> Time Until Reminder
                  </p>
                  <p className="text-3xl font-bold tabular-nums">{countdown}</p>
                </div>
              </div>
            </div>
          )}

          {/* Welcome / quick actions */}
          <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {user.profile_picture ? (
                  <img src={`${API_BASE}${user.profile_picture}`} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-lg">Welcome, {user.nickname || user.username}</h2>
                <p className="text-sm text-gray-600">Share a 30-60s video with your friends</p>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="mt-6 space-y-6">
            {posts.length === 0 && (
              <div className="bg-white rounded p-6 text-center text-gray-500">No posts yet — be the first!</div>
            )}

            {posts.map(post => (
              <div key={post.id} className="bg-white rounded shadow p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                    {post.profile_picture ? (
                      <img src={`${post.profile_picture.startsWith('http') ? '' : API_BASE}${post.profile_picture}`} alt="pf" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{post.nickname || post.username}</div>
                    <div className="text-xs text-gray-500">@{post.username} · {new Date(post.created_at).toLocaleString()}</div>
                  </div>
                </div>

                {post.title ? <div className="font-semibold mb-1">{post.title}</div> : null}
                {post.caption ? <div className="mb-2 text-gray-800">{post.caption}</div> : null}

                {post.media_path ? (
                  post.media_type && post.media_type.startsWith('image/') ? (
                    <img src={`${API_BASE}${post.media_path}`} className="w-full rounded object-cover" alt="post" />
                  ) : (
                    <video controls className="w-full rounded" src={`${API_BASE}${post.media_path}`} />
                  )
                ) : null}

                <div className="mt-2 flex gap-4 items-center">
                  <button onClick={() => toggleLike(post.id).then(res => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, liked: res.data.liked, likes_count: res.data.count } : p))).catch(err => { console.error(err); if (err?.response?.status === 404) { alert('Post not found (may have been deleted)'); setPosts(prev => prev.filter(p => p.id !== post.id)); } else alert(err?.response?.data?.error || 'Failed to like'); })} className={`flex items-center gap-1 text-sm ${post.liked ? 'text-red-500' : 'text-gray-600'}`}>
                    <Heart className="w-4 h-4" /> {post.likes_count || 0}
                  </button>

                  <button onClick={() => navigate(`/posts/${post.id}/comments`)} className="flex items-center gap-1 text-sm text-gray-600"><MessageCircle className="w-4 h-4" /> {post.comments_count || 0} Comments</button>

                  <button onClick={() => { navigator.clipboard.writeText(window.location.href + `#post-${post.id}`); alert('Link copied'); }} className="flex items-center gap-1 text-sm text-gray-600"><Share2 className="w-4 h-4" /> Share</button>

                  <button onClick={() => toggleSave(post.id).then(res => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, saved: res.data.saved, saves_count: res.data.count } : p))).catch(err => { console.error(err); if (err?.response?.status === 404) { alert('Post not found (may have been deleted)'); setPosts(prev => prev.filter(p => p.id !== post.id)); } else alert(err?.response?.data?.error || 'Failed to save'); })} className={`flex items-center gap-1 text-sm ${post.saved ? 'text-blue-600' : 'text-gray-600'}`}>
                    <Bookmark className="w-4 h-4" /> {post.saves_count ? post.saves_count : ''}
                  </button>
                </div>
              </div>
            ))}


          </div>
        </div>
      </main>

      <Navbar />
    </>
  );
}
