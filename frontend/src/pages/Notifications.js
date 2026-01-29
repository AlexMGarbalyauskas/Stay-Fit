import { useEffect, useState, useRef, useMemo } from 'react';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest, getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, respondToWorkoutInvite } from '../api';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, Users, UserX, MessageSquare, BellRing, Check, X as Close, Trash2, Bell, Dumbbell } from 'lucide-react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import { SOCKET_BASE, getSocketOptions } from '../utils/socket';

export default function Notifications({ onFriendUpdate }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const [tab, setTab] = useState('requests'); // requests, unfriended, messages
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const workoutTypes = useMemo(() => ['workout_invite', 'workout_canceled', 'workout_opt_out', 'workout_cancelled'], []);

  const tabs = useMemo(() => ([
    { key: 'requests', label: t('friendRequests'), icon: Users, hint: t('approveDeclineNewConnections'), tone: 'blue' },
    { key: 'workout_invite', label: t('workoutInvites'), icon: BellRing, hint: t('acceptDeclineWorkoutPlans'), tone: 'purple' },
    { key: 'unfriended', label: t('unfriended'), icon: UserX, hint: t('peopleWhoRemovedYou'), tone: 'amber' },
    { key: 'message', label: t('messageNotifications'), icon: MessageSquare, hint: t('recentMessagePings'), tone: 'emerald' },
  ]), [t]);

  const toneClasses = {
    blue: {
      chip: 'bg-blue-50 text-blue-700 border border-blue-100',
      glow: 'shadow-[0_18px_50px_-24px_rgba(37,99,235,0.4)]',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    amber: {
      chip: 'bg-amber-50 text-amber-700 border border-amber-100',
      glow: 'shadow-[0_18px_50px_-24px_rgba(234,179,8,0.45)]',
      button: 'bg-amber-500 hover:bg-amber-600 text-slate-900',
    },
    emerald: {
      chip: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      glow: 'shadow-[0_18px_50px_-24px_rgba(16,185,129,0.45)]',
      button: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    },
    purple: {
      chip: 'bg-purple-50 text-purple-700 border border-purple-100',
      glow: 'shadow-[0_18px_50px_-24px_rgba(147,51,234,0.45)]',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    slate: {
      button: 'bg-slate-900 hover:bg-slate-800 text-slate-100',
    },
  };

  const fetchRequests = async () => {
    if (!isAuthenticated) return [];
    setLoading(true);
    try {
      const res = await getFriendRequests();
      return res.data.requests || [];
    } catch (err) {
      console.error(err);
      return [];
    } finally { setLoading(false); }
  };

  const fetchNotifications = async (type, transform) => {
    if (!isAuthenticated) return [];
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications(type);
      const notifications = res.data.notifications || [];
      setItems(transform ? transform(notifications) : notifications);
      return notifications;
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError(err?.response?.status === 404 ? t('notificationsServiceMissing') : t('failedToLoad'));
      setItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadCurrentTab = () => {
      if (tab === 'requests') {
        fetchRequests().then(rs => setItems(rs));
      } else if (tab === 'workout_invite') {
        fetchNotifications(undefined, (list) => list.filter((n) => workoutTypes.includes(n.type)));
      } else {
        fetchNotifications(tab);
      }
    };

    loadCurrentTab();

    const interval = setInterval(() => {
      loadCurrentTab();
    }, 5000);

    // Socket listener for new notifications
    const token = localStorage.getItem('token');
    if (token) {
      socketRef.current = io(SOCKET_BASE, getSocketOptions(token));
      socketRef.current.on('notification:new', (data) => {
        // Refresh current tab when a relevant notification arrives
        const isWorkoutNotification = workoutTypes.includes(data.type);
        if (!tab || (data.type === tab) || (tab === 'requests' && data.type === 'friend_request') || (tab === 'workout_invite' && isWorkoutNotification)) {
          if (tab === 'requests') fetchRequests().then(rs => setItems(rs));
          else if (tab === 'workout_invite') fetchNotifications(undefined, (list) => list.filter((n) => workoutTypes.includes(n.type)));
          else fetchNotifications(tab);
        }
      });
    }

    return () => { clearInterval(interval); if (socketRef.current) socketRef.current.disconnect(); };
  }, [tab, isAuthenticated]);

  const handleAccept = async (requestId, senderId) => {
    await acceptFriendRequest(requestId, senderId);
    setItems(prev => prev.filter(r => r.id !== requestId));
    if (onFriendUpdate) onFriendUpdate();
  };

  const handleReject = async (requestId) => {
    await rejectFriendRequest(requestId);
    setItems(prev => prev.filter(r => r.id !== requestId));
  };

  const handleMarkRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      setItems(prev => prev.map(i => i.id === notifId ? { ...i, read: 1 } : i));
    } catch (e) { console.error(e); }
  };

  const handleGoToChat = (fromUserId) => {
    // navigate to chat with that user
    navigate(`/chat/${fromUserId}`);
  };

  const handleDelete = async (notifId) => {
    try {
      await deleteNotification(notifId);
      setItems(prev => prev.filter(i => i.id !== notifId));
    } catch (e) { console.error(e); }
  };

  const handleAcceptWorkout = async (notifId, participantId, workoutData) => {
    try {
      await respondToWorkoutInvite(participantId, 'accepted');
      
      // Add workout to localStorage so user gets the timer
      if (workoutData && workoutData.date && workoutData.time) {
        const plans = JSON.parse(localStorage.getItem('workout-plans') || '{}');
        plans[workoutData.date] = {
          workout: workoutData.workout,
          time: workoutData.time,
          buddies: [], // This is an accepted invite, not created by user
          isAcceptedInvite: true,
          creatorUsername: workoutData.creatorUsername,
          scheduleId: workoutData.scheduleId,
          participantId: participantId
        };
        localStorage.setItem('workout-plans', JSON.stringify(plans));
      }
      
      // Delete notification from backend
      await deleteNotification(notifId);
      
      // Remove from UI
      setItems(prev => prev.filter(i => i.id !== notifId));
      
      alert('✅ Workout accepted! Your timer has been set.');
    } catch (e) { 
      console.error('Failed to accept workout invite:', e);
      // If invite is already gone (404), just remove the notification locally
      if (e?.response?.status === 404) {
        await deleteNotification(notifId).catch(() => {});
        setItems(prev => prev.filter(i => i.id !== notifId));
        alert('This invite is no longer active. It has been removed.');
      } else {
        alert('Failed to accept workout invite. Please try again.');
      }
    }
  };

  // Auth guard render
  if (!isAuthenticated) {
    return (
      <>
        <Header disableNotifications />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 pb-24 pt-20">
          <div className="px-4 max-w-md mx-auto text-center mt-20">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-400 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Bell className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('notifications')}</h1>
              <p className="text-gray-600 text-lg px-4">{t('loginToViewNotifications')}</p>
            </div>
            
            <div className="flex flex-col gap-4 mt-12">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white py-4 rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-green-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {t('goToLogin')}
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-white border-2 border-gray-200 text-gray-800 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md"
              >
                {t('createAnAccount')}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-8">
              {t('byJoining')}
            </p>
          </div>
        </div>
        <Navbar />
      </>
    );
  }

  const handleDeclineWorkout = async (notifId, participantId) => {
    try {
      await respondToWorkoutInvite(participantId, 'declined');
      
      // Delete notification from backend
      await deleteNotification(notifId);
      
      // Remove from UI
      setItems(prev => prev.filter(i => i.id !== notifId));
    } catch (e) { 
      console.error('Failed to decline workout invite:', e);
      if (e?.response?.status === 404) {
        await deleteNotification(notifId).catch(() => {});
        setItems(prev => prev.filter(i => i.id !== notifId));
        alert('This invite was already handled. It has been removed.');
      } else {
        alert('Failed to decline workout invite. Please try again.');
      }
    }
  };

  const renderEmptyState = (title, desc) => (
    <div className={`mt-8 rounded-2xl border shadow-lg p-8 text-center ${isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-slate-200 bg-white text-slate-700'}`}>
      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
        <BellRing className={`h-6 w-6 ${isDark ? 'text-gray-500' : 'text-slate-500'}`} />
      </div>
      <p className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-slate-800'}`}>{title}</p>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{desc}</p>
    </div>
  );

  const renderLoading = () => (
    <div className="mt-6 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className={`animate-pulse rounded-2xl border p-4 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
          <div className={`h-3 w-28 rounded-full ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`} />
          <div className="mt-2 h-3 w-48 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );

  const renderRequests = () => (
    <div className="mt-6 space-y-3">
      {items.map(r => (
        <div key={r.id} className={`flex items-center justify-between rounded-2xl border p-4 ${toneClasses.blue.glow} ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
          <div>
            <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>@{r.username}</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('sentYouFriendRequest')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(r.id, r.sender_id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${toneClasses.emerald.button}`}
            >
              <Check className="h-4 w-4" /> {t('accept')}
            </button>
            <button
              onClick={() => handleReject(r.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${toneClasses.amber.button}`}
            >
              <Close className="h-4 w-4" /> {t('reject')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderUnfriended = () => (
    <div className="mt-6 space-y-3">
      {items.map(n => (
        <div key={n.id} className={`rounded-2xl border p-4 ${toneClasses.amber.glow} ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>@{n.data?.fromUsername || ('user #' + n.data?.byUserId)}</p>
              <p className="text-sm text-slate-600">{t('unfriendedYou')}</p>
              <p className="text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {n.read === 0 && <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">NEW</span>}
              <button onClick={() => { handleMarkRead(n.id); }} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">{t('markRead')}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMessages = () => (
    <div className="mt-6 space-y-3">
      {items.map(n => (
        <div key={n.id} className={`rounded-2xl border p-4 ${toneClasses.emerald.glow} ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>@{n.data?.fromUsername || ('user #' + n.data?.fromUserId)}</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{n.data?.content || t('newMessage')}</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{new Date(n.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {n.read === 0 && <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isDark ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>NEW</span>}
              <button onClick={() => { handleMarkRead(n.id); handleGoToChat(n.data?.fromUserId); }} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${toneClasses.emerald.button}`}>
                {t('openChat')}
              </button>
              <button
                onClick={() => handleDelete(n.id)}
                className={`rounded-full p-2 transition ${isDark ? 'bg-red-900/30 hover:bg-red-800/30 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                title={t('delete')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderWorkoutInvites = () => {
    // Check if workout time has passed
    const isWorkoutOutdated = (date, time) => {
      if (!date || !time) return false;
      const workoutDateTime = new Date(`${date}T${time}`);
      return workoutDateTime < new Date();
    };

    return (
      <div className="mt-6 space-y-3">
        {items.filter((n) => workoutTypes.includes(n.type)).map(n => {
          const data = n.data || {};
          const isOutdated = isWorkoutOutdated(data.date, data.time);
          const isInvite = n.type === 'workout_invite';
          const isCanceled = n.type === 'workout_canceled';
          const isOptOut = n.type === 'workout_opt_out';
          const isCancelledByUser = n.type === 'workout_cancelled'; // User cancelled their own workout
          const label = (() => {
            if (isCancelledByUser) return data.message || `${t('youSkipped')} ${data.workoutName || t('workout')}`;
            if (isCanceled) return `${data.creatorUsername || t('yourBuddy')} ${t('workoutCanceled')}`;
            if (isOptOut) return `${data.fromUsername || t('yourBuddy')} ${t('workoutOptedOut')}`;
            return `${data.creatorUsername || t('yourBuddy')} ${t('workoutInvitedYou')} ${data.workout || t('workout')}`;
          })();
          
          return (
            <div key={n.id} className={`rounded-2xl border p-4 ${isOutdated || isCancelledByUser ? 'opacity-60' : toneClasses.purple.glow} ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {isCancelledByUser ? (
                    <>
                      <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>⏭️ {t('workoutSkipped')}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{label}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-900">@{data.creatorUsername || data.fromUsername || t('yourBuddy')}</p>
                      <p className="text-sm text-slate-600">{label}</p>
                    </>
                  )}
                  <p className="text-xs text-slate-500">
                    {data.date && `📅 ${data.date}`} {data.time && `⏰ ${data.time}`}
                  </p>
                  {isOutdated && (
                    <p className="text-xs text-amber-600 font-semibold mt-1">⚠️ {t('workoutTimeHasPassed')}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {n.read === 0 && <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-semibold text-purple-700">NEW</span>}
                  {isOutdated || isCanceled || isOptOut || isCancelledByUser || !isInvite ? (
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition bg-slate-200 text-slate-700 hover:bg-slate-300"
                    >
                      <Trash2 className="h-3 w-3" /> {t('dismiss')}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAcceptWorkout(n.id, data.participantId, data)}
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${toneClasses.emerald.button}`}
                      >
                        <Check className="h-3 w-3" /> {t('accept')}
                      </button>
                      <button
                        onClick={() => handleDeclineWorkout(n.id, data.participantId)}
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${toneClasses.amber.button}`}
                      >
                        <Close className="h-3 w-3" /> {t('decline')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br text-slate-800 ${isDark ? 'from-gray-950 via-gray-900 to-gray-800 text-gray-200' : 'from-slate-50 via-white to-slate-100'}`}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate(-1)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-md transition ${isDark ? 'bg-gray-800 text-gray-300 shadow-gray-800 hover:bg-gray-700' : 'bg-white text-slate-700 shadow-slate-200 hover:bg-slate-50'}`}>
            <ArrowLeft className="h-4 w-4" /> {t('back')}
          </button>
          <div className="flex flex-wrap gap-2">
            {tabs.map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              const tone = toneClasses[t.tone];
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active ? `${tone.button} ${tone.glow}` : isDark ? 'border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">Stay Fit</p>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>{t('notifications')}</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{tabs.find(t => t.key === tab)?.hint}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => markAllNotificationsRead().then(() => setItems(prev => prev.map(i => ({ ...i, read: 1 })))).catch(() => {})}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isDark ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {t('markAllRead')}
            </button>
          </div>
        </div>

        {loading && renderLoading()}
        {!loading && error && (
          <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">{error}</p>
        )}
        {!loading && !error && items.length === 0 && renderEmptyState(t('allCaughtUp'), t('noNotificationsInTab'))}

        {!loading && !error && tab === 'requests' && items.length > 0 && renderRequests()}
        {!loading && !error && tab === 'workout_invite' && items.length > 0 && renderWorkoutInvites()}
        {!loading && !error && tab === 'unfriended' && items.length > 0 && renderUnfriended()}
        {!loading && !error && tab === 'message' && items.length > 0 && renderMessages()}
      </div>
    </div>
  );
}
