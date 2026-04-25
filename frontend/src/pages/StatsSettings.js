import { useState, useEffect } from 'react';
import { ArrowLeft, Flame, Users, MessageSquare, TrendingUp, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildPostDateSet, calculateCurrentStreak, countPostingDaysInWindow } from '../utils/streak';
import { useLanguage } from '../context/LanguageContext';

export default function StatsSettings() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const [stats, setStats] = useState({ posts: 0, friends: 0, streak: 0, comments: 0 });
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState(false);
  const [postsData, setPostsData] = useState(null);
  const [monthlyPosts, setMonthlyPosts] = useState([]);
  const [weeklyPostingDays, setWeeklyPostingDays] = useState(0);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Get posts
        const postsRes = await axios.get(`${API_URL}/api/posts/mine/export`, authHeaders);
        const allPosts = postsRes.data.posts || [];
        const postsCount = allPosts.length;
        setPostsData(allPosts);
        
        // Calculate posts by month
        const monthMap = {};
        allPosts.forEach(post => {
          if (post.created_at) {
            const date = new Date(post.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
          }
        });

        // Get last 12 months
        const months = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          months.push({
            key: monthKey,
            label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            count: monthMap[monthKey] || 0
          });
        }
        setMonthlyPosts(months);
        
        const dates = buildPostDateSet(allPosts);

        // Count how many unique posting days happened in the last 7 days (including today)
        const last7DaysPosted = countPostingDaysInWindow(dates, 7);
        setWeeklyPostingDays(last7DaysPosted);

        const streak = calculateCurrentStreak(dates);

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
          <ArrowLeft size={20} /> {t('backToSettings')}
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('yourStatistics')}</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1`}>{t('trackYourActivity')}</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Posts */}
          <div className={`p-6 rounded-xl shadow-md text-center transition transform hover:scale-105 ${isDark ? 'bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700' : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'}`}>
            <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{stats.posts}</div>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className={`w-4 h-4 ${isDark ? 'text-blue-200' : 'text-blue-700'}`} />
              <p className={`text-sm font-semibold ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>{t('postCount')}</p>
            </div>
          </div>

          {/* Friends */}
          <div className={`p-6 rounded-xl shadow-md text-center transition transform hover:scale-105 ${isDark ? 'bg-gradient-to-br from-green-900 to-green-800 border border-green-700' : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'}`}>
            <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>{stats.friends}</div>
            <div className="flex items-center justify-center gap-2">
              <Users className={`w-4 h-4 ${isDark ? 'text-green-200' : 'text-green-700'}`} />
              <p className={`text-sm font-semibold ${isDark ? 'text-green-200' : 'text-green-700'}`}>{t('friendsCount')}</p>
            </div>
          </div>

          {/* Streak */}
          <div className={`p-6 rounded-xl shadow-md text-center transition transform hover:scale-105 ${isDark ? 'bg-gradient-to-br from-orange-900 to-red-800 border border-orange-700' : 'bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200'}`}>
            <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>{stats.streak}</div>
            <div className="flex items-center justify-center gap-2">
              <Flame className={`w-4 h-4 fill-current ${isDark ? 'text-orange-200' : 'text-orange-700'}`} />
              <p className={`text-sm font-semibold ${isDark ? 'text-orange-200' : 'text-orange-700'}`}>{t('dayStreak')}</p>
            </div>
          </div>

          {/* Total Activity */}
          <div className={`p-6 rounded-xl shadow-md text-center transition transform hover:scale-105 ${isDark ? 'bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-700' : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'}`}>
            <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>{stats.posts + stats.friends}</div>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className={`w-4 h-4 ${isDark ? 'text-purple-200' : 'text-purple-700'}`} />
              <p className={`text-sm font-semibold ${isDark ? 'text-purple-200' : 'text-purple-700'}`}>{t('totalActivity')}</p>
            </div>
          </div>
        </div>

        {/* Posting Chart Section */}
        <div className={`mt-6 rounded-xl shadow-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <button
            onClick={() => setShowChart(!showChart)}
            className={`w-full flex items-center justify-between p-6 rounded-xl transition ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white'}`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className={`w-5 h-5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
              <h2 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('postingTrends')}</h2>
            </div>
            {showChart ? (
              <ChevronUp className={isDark ? 'text-gray-400' : 'text-gray-600'} />
            ) : (
              <ChevronDown className={isDark ? 'text-gray-400' : 'text-gray-600'} />
            )}
          </button>

          {showChart && (
            <div className={`px-6 pb-6 ${isDark ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
              {monthlyPosts && monthlyPosts.length > 0 && monthlyPosts.some(m => m.count > 0) ? (
                <>
                  {/* Line Chart */}
                  <div className="mt-6 w-full">
                    {/* SVG Line Chart */}
                    <svg viewBox="0 0 1000 400" className="w-full h-64" preserveAspectRatio="xMidYMid meet">
                      {/* Grid Lines */}
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <line
                          key={`grid-h-${i}`}
                          x1="80"
                          y1={60 + (i * 60)}
                          x2="950"
                          y2={60 + (i * 60)}
                          stroke={isDark ? '#374151' : '#e5e7eb'}
                          strokeWidth="1"
                          strokeDasharray="4"
                        />
                      ))}

                      {/* Y-Axis */}
                      <line x1="80" y1="40" x2="80" y2="380" stroke={isDark ? '#6b7280' : '#9ca3af'} strokeWidth="2" />
                      {/* X-Axis */}
                      <line x1="80" y1="380" x2="950" y2="380" stroke={isDark ? '#6b7280' : '#9ca3af'} strokeWidth="2" />

                      {/* Y-Axis Labels */}
                      {[0, 1, 2, 3, 4, 5].map((i) => {
                        const maxCount = Math.max(...monthlyPosts.map(m => m.count), 1);
                        const label = Math.ceil((maxCount / 5) * (5 - i));
                        return (
                          <text
                            key={`y-label-${i}`}
                            x="50"
                            y={75 + (i * 60)}
                            textAnchor="end"
                            fill={isDark ? '#9ca3af' : '#6b7280'}
                            fontSize="12"
                            fontWeight="500"
                          >
                            {label}
                          </text>
                        );
                      })}

                      {/* Line Path */}
                      {(() => {
                        const maxCount = Math.max(...monthlyPosts.map(m => m.count), 1);
                        const points = monthlyPosts.map((month, index) => {
                          const x = 80 + (index * ((950 - 80) / (monthlyPosts.length - 1)));
                          const y = 380 - ((month.count / maxCount) * 300);
                          return `${x},${y}`;
                        });

                        return (
                          <>
                            {/* Gradient Area Under Line */}
                            <defs>
                              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={isDark ? '#3b82f6' : '#60a5fa'} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={isDark ? '#3b82f6' : '#60a5fa'} stopOpacity="0.01" />
                              </linearGradient>
                            </defs>
                            
                            {/* Area */}
                            <path
                              d={`M ${points[0]} L ${points.join(' L ')} L ${points[points.length - 1].split(',')[0]},380 L ${points[0].split(',')[0]},380 Z`}
                              fill="url(#areaGradient)"
                            />

                            {/* Line */}
                            <polyline
                              points={points.join(' ')}
                              fill="none"
                              stroke={isDark ? '#60a5fa' : '#3b82f6'}
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Data Points */}
                            {monthlyPosts.map((month, index) => {
                              const x = 80 + (index * ((950 - 80) / (monthlyPosts.length - 1)));
                              const y = 380 - ((month.count / maxCount) * 300);
                              return (
                                <circle
                                  key={`point-${index}`}
                                  cx={x}
                                  cy={y}
                                  r="5"
                                  fill={isDark ? '#1f2937' : '#ffffff'}
                                  stroke={isDark ? '#60a5fa' : '#3b82f6'}
                                  strokeWidth="3"
                                />
                              );
                            })}
                          </>
                        );
                      })()}

                      {/* X-Axis Labels */}
                      {monthlyPosts.map((month, index) => {
                        if (index % 2 === 0 || monthlyPosts.length <= 6) {
                          const x = 80 + (index * ((950 - 80) / (monthlyPosts.length - 1)));
                          return (
                            <text
                              key={`x-label-${index}`}
                              x={x}
                              y="400"
                              textAnchor="middle"
                              fill={isDark ? '#9ca3af' : '#6b7280'}
                              fontSize="11"
                              fontWeight="500"
                            >
                              {month.label}
                            </text>
                          );
                        }
                        return null;
                      })}
                    </svg>
                  </div>

                    {/* Chart Stats */}
                    <div className={`mt-6 p-4 rounded-lg grid grid-cols-3 gap-3 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                      <div className="text-center">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('average')}</p>
                        <p className={`text-lg font-bold ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                          {(monthlyPosts.reduce((sum, m) => sum + m.count, 0) / 12).toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('peak')}</p>
                        <p className={`text-lg font-bold ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                          {Math.max(...monthlyPosts.map(m => m.count), 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('total')}</p>
                        <p className={`text-lg font-bold ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                          {monthlyPosts.reduce((sum, m) => sum + m.count, 0)}
                        </p>
                      </div>
                    </div>
                </>
              ) : (
                <div className={`py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p className="text-sm">{t('noPostingData')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detailed Stats */}
        <div className={`mt-6 rounded-xl p-6 shadow-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('activityBreakdown')}</h2>
          
          <div className="space-y-3">
            {/* Posts Breakdown */}
            <div className={`p-3 rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('postsCreated')}</span>
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
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('friendsConnected')}</span>
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
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('currentStreak')}</span>
                <span className={`text-lg font-bold ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>{stats.streak} {t('days')}</span>
              </div>
              <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.streak / 30) * 100, 100)}%` }}
                ></div>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('keepPostingDaily')}</p>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className={`mt-6 rounded-xl p-6 shadow-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('achievements')}</h2>
          
          <div className="space-y-2">
            {stats.posts >= 5 && (
              <div className={`p-3 rounded flex items-center gap-3 ${isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                <span className="text-2xl">📝</span>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>{t('contentCreator')}</p>
                  <p className={`text-xs ${isDark ? 'text-blue-300/70' : 'text-blue-600/70'}`}>{t('postedTimes').replace('{count}', stats.posts)}</p>
                </div>
              </div>
            )}

            {stats.friends >= 5 && (
              <div className={`p-3 rounded flex items-center gap-3 ${isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                <span className="text-2xl">👥</span>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-green-200' : 'text-green-700'}`}>{t('socialButterfly')}</p>
                  <p className={`text-xs ${isDark ? 'text-green-300/70' : 'text-green-600/70'}`}>{t('friendsConnectedCount').replace('{count}', stats.friends)}</p>
                </div>
              </div>
            )}

            {weeklyPostingDays >= 5 && (
              <div className={`p-3 rounded flex items-center gap-3 ${isDark ? 'bg-indigo-900/30 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200'}`}>
                <span className="text-2xl">🏅</span>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-indigo-200' : 'text-indigo-700'}`}>{t('fiveDayWeekChampion')}</p>
                  <p className={`text-xs ${isDark ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>{t('postedFiveDaysThisWeek')}</p>
                </div>
              </div>
            )}

            {stats.streak >= 3 && (
              <div className={`p-3 rounded flex items-center gap-3 ${isDark ? 'bg-orange-900/30 border border-orange-700' : 'bg-orange-50 border border-orange-200'}`}>
                <span className="text-2xl">🔥</span>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-orange-200' : 'text-orange-700'}`}>{t('onFire')}</p>
                  <p className={`text-xs ${isDark ? 'text-orange-300/70' : 'text-orange-600/70'}`}>{t('dayPostingStreak').replace('{count}', stats.streak)}</p>
                </div>
              </div>
            )}

            {stats.streak >= 30 && (
              <div className={`p-3 rounded flex items-center gap-3 ${isDark ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
                <span className="text-2xl">⭐</span>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-yellow-200' : 'text-yellow-700'}`}>{t('monthStreakStar')}</p>
                  <p className={`text-xs ${isDark ? 'text-yellow-300/70' : 'text-yellow-600/70'}`}>{t('postedMonthStraight')}</p>
                </div>
              </div>
            )}

            {stats.posts === 0 && (
              <div className={`p-3 rounded text-center ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                <p className="text-sm">{t('startPostingToUnlock')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
