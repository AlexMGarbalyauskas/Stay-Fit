import { useState, useEffect } from 'react';
import { ArrowLeft, Flame, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

export default function StatsSettings() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const [stats, setStats] = useState({ posts: 0, friends: 0, streak: 0, comments: 0 });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Get posts
        const postsRes = await axios.get(`${API_URL}/api/posts/mine/export`, authHeaders);
        const postsCount = postsRes.data.posts?.length || 0;
        
        // Calculate streak from posts
        const dates = new Set();
        postsRes.data.posts?.forEach(post => {
          if (post.created_at) {
            const date = new Date(post.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            dates.add(key);
          }
        });

        let streak = 0;
        const currentDate = new Date();
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(currentDate);
          checkDate.setDate(checkDate.getDate() - i);
          const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          if (dates.has(key)) {
            streak++;
          } else if (i > 0) break;
        }

        // Get friends
        const friendsRes = await axios.get(`${API_URL}/api/friends`, authHeaders);
        const friendsCount = friendsRes.data.friends?.length || 0;

        setStats({
          posts: postsCount,
          friends: friendsCount,
          streak: streak,
          comments: 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [API_URL, token]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-white text-slate-800'}`}>
        <div className="pt-20 pb-20 px-4 max-w-md mx-auto">
          <p className="text-center text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-white text-slate-800'}`}>
      <div className="pt-20 pb-20 px-4 max-w-md mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-2 mb-6 transition ${isDark ? 'text-gray-200 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}
        >
          <ArrowLeft size={20} /> Back to Settings
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Your Statistics</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1`}>Track your activity and achievements</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Posts */}
          <div className={`p-6 rounded-xl shadow-md text-center transition transform hover:scale-105 ${isDark ? 'bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700' : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'}`}>
            <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{stats.posts}</div>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className={`w-4 h-4 ${isDark ? 'text-blue-200' : 'text-blue-700'}`} />
              <p className={`text-sm font-semibold ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>Posts</p>
            </div>
          </div>

          {/* Friends */}
          <div className={`p-6 rounded-xl shadow-md text-center transition transform hover:scale-105 ${isDark ? 'bg-gradient-to-br from-green-900 to-green-800 border border-green-700' : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'}`}>
            <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>{stats.friends}</div>
            <div className="flex items-center justify-center gap-2">
              <Users className={`w-4 h-4 ${isDark ? 'text-green-200' : 'text-green-700'}`} />
              <p className={`text-sm font-semibold ${isDark ? 'text-green-200' : 'text-green-700'}`}>Friends</p>
            </div>
          </div>

          {/* Streak */}
          <div className={`p-6 rounded-xl shadow-md text-center transition transform hover:scale-105 ${isDark ? 'bg-gradient-to-br from-orange-900 to-red-800 border border-orange-700' : 'bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200'}`}>
            <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>{stats.streak}</div>
            <div className="flex items-center justify-center gap-2">
              <Flame className={`w-4 h-4 fill-current ${isDark ? 'text-orange-200' : 'text-orange-700'}`} />
              <p className={`text-sm font-semibold ${isDark ? 'text-orange-200' : 'text-orange-700'}`}>Day Streak</p>
            </div>
          </div>

          {/* Total Activity */}
          <div className={`p-6 rounded-xl shadow-md text-center transition transform hover:scale-105 ${isDark ? 'bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-700' : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'}`}>
            <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>{stats.posts + stats.friends}</div>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className={`w-4 h-4 ${isDark ? 'text-purple-200' : 'text-purple-700'}`} />
              <p className={`text-sm font-semibold ${isDark ? 'text-purple-200' : 'text-purple-700'}`}>Total Activity</p>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className={`rounded-xl p-6 shadow-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Activity Breakdown</h2>
          
          <div className="space-y-3">
            {/* Posts Breakdown */}
            <div className={`p-3 rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Posts Created</span>
                <span className={`text-lg font-bold ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{stats.posts}</span>
              </div>
              <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.posts / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Friends Breakdown */}
            <div className={`p-3 rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Friends Connected</span>
                <span className={`text-lg font-bold ${isDark ? 'text-green-300' : 'text-green-600'}`}>{stats.friends}</span>
              </div>
              <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.friends / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Streak Breakdown */}
            <div className={`p-3 rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Current Streak</span>
                <span className={`text-lg font-bold ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>{stats.streak} days</span>
              </div>
              <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.streak / 30) * 100, 100)}%` }}
                ></div>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Keep posting daily to maintain your streak!</p>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className={`mt-6 rounded-xl p-6 shadow-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Achievements</h2>
          
          <div className="space-y-2">
            {stats.posts >= 5 && (
              <div className={`p-3 rounded flex items-center gap-3 ${isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                <span className="text-2xl">📝</span>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>Content Creator</p>
                  <p className={`text-xs ${isDark ? 'text-blue-300/70' : 'text-blue-600/70'}`}>Posted {stats.posts} times</p>
                </div>
              </div>
            )}

            {stats.friends >= 5 && (
              <div className={`p-3 rounded flex items-center gap-3 ${isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                <span className="text-2xl">👥</span>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-green-200' : 'text-green-700'}`}>Social Butterfly</p>
                  <p className={`text-xs ${isDark ? 'text-green-300/70' : 'text-green-600/70'}`}>{stats.friends} friends connected</p>
                </div>
              </div>
            )}

            {stats.streak >= 3 && (
              <div className={`p-3 rounded flex items-center gap-3 ${isDark ? 'bg-orange-900/30 border border-orange-700' : 'bg-orange-50 border border-orange-200'}`}>
                <span className="text-2xl">🔥</span>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-orange-200' : 'text-orange-700'}`}>On Fire</p>
                  <p className={`text-xs ${isDark ? 'text-orange-300/70' : 'text-orange-600/70'}`}>{stats.streak} day posting streak</p>
                </div>
              </div>
            )}

            {stats.posts === 0 && (
              <div className={`p-3 rounded text-center ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                <p className="text-sm">Start posting to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
