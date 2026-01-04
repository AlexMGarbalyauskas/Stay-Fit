import { useEffect, useState, useRef, useMemo } from 'react';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest, getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, respondToWorkoutInvite } from '../api';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE } from '../api';
import { ArrowLeft, Users, UserX, MessageSquare, BellRing, Check, X as Close, Trash2 } from 'lucide-react';

export default function Notifications({ onFriendUpdate }) {
  const [tab, setTab] = useState('requests'); // requests, unfriended, messages
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // for Go Back

  const workoutTypes = useMemo(() => ['workout_invite', 'workout_canceled', 'workout_opt_out', 'workout_cancelled'], []);

  const tabs = useMemo(() => ([
    { key: 'requests', label: 'Friend Requests', icon: Users, hint: 'Approve or decline new connections', tone: 'blue' },
    { key: 'workout_invite', label: 'Workout Invites', icon: BellRing, hint: 'Accept or decline workout plans', tone: 'purple' },
    { key: 'unfriended', label: 'Unfriended', icon: UserX, hint: 'People who removed you', tone: 'amber' },
    { key: 'message', label: 'Messages', icon: MessageSquare, hint: 'Recent message pings', tone: 'emerald' },
  ]), []);

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
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications(type);
      const notifications = res.data.notifications || [];
      setItems(transform ? transform(notifications) : notifications);
      return notifications;
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError(err?.response?.status === 404 ? 'Notifications service not found (restart backend)' : 'Failed to load notifications');
      setItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const socketRef = useRef(null);

  useEffect(() => {
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
      socketRef.current = io(API_BASE.replace('/api',''), { auth: { token } });
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
  }, [tab]);

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
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700 shadow-lg">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <BellRing className="h-6 w-6 text-slate-500" />
      </div>
      <p className="text-lg font-semibold text-slate-800">{title}</p>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );

  const renderLoading = () => (
    <div className="mt-6 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
          <div className="h-3 w-28 rounded-full bg-slate-200" />
          <div className="mt-2 h-3 w-48 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );

  const renderRequests = () => (
    <div className="mt-6 space-y-3">
      {items.map(r => (
        <div key={r.id} className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 ${toneClasses.blue.glow}`}>
          <div>
            <p className="font-semibold text-slate-900">@{r.username}</p>
            <p className="text-sm text-slate-500">sent you a friend request</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(r.id, r.sender_id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${toneClasses.emerald.button}`}
            >
              <Check className="h-4 w-4" /> Accept
            </button>
            <button
              onClick={() => handleReject(r.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${toneClasses.amber.button}`}
            >
              <Close className="h-4 w-4" /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderUnfriended = () => (
    <div className="mt-6 space-y-3">
      {items.map(n => (
        <div key={n.id} className={`rounded-2xl border border-slate-200 bg-white p-4 ${toneClasses.amber.glow}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">@{n.data?.fromUsername || ('user #' + n.data?.byUserId)}</p>
              <p className="text-sm text-slate-600">unfriended you</p>
              <p className="text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {n.read === 0 && <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">NEW</span>}
              <button onClick={() => { handleMarkRead(n.id); }} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">Mark Read</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMessages = () => (
    <div className="mt-6 space-y-3">
      {items.map(n => (
        <div key={n.id} className={`rounded-2xl border border-slate-200 bg-white p-4 ${toneClasses.emerald.glow}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-semibold text-slate-900">@{n.data?.fromUsername || ('user #' + n.data?.fromUserId)}</p>
              <p className="text-sm text-slate-600">{n.data?.content || 'You got a new message'}</p>
              <p className="text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {n.read === 0 && <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">NEW</span>}
              <button onClick={() => { handleMarkRead(n.id); handleGoToChat(n.data?.fromUserId); }} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${toneClasses.emerald.button}`}>
                Open Chat
              </button>
              <button
                onClick={() => handleDelete(n.id)}
                className="rounded-full bg-red-50 hover:bg-red-100 p-2 text-red-600 transition"
                title="Delete notification"
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
            if (isCancelledByUser) return data.message || `You skipped your scheduled ${data.workoutName || 'workout'}`;
            if (isCanceled) return `${data.creatorUsername || 'Your buddy'} canceled the workout.`;
            if (isOptOut) return `${data.fromUsername || 'Your buddy'} opted out of the workout.`;
            return `${data.creatorUsername || 'Unknown'} invited you to workout: ${data.workout || 'Workout'}`;
          })();
          
          return (
            <div key={n.id} className={`rounded-2xl border border-slate-200 bg-white p-4 ${isOutdated || isCancelledByUser ? 'opacity-60' : toneClasses.purple.glow}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {isCancelledByUser ? (
                    <>
                      <p className="font-semibold text-slate-900">⏭️ Workout Skipped</p>
                      <p className="text-sm text-slate-600">{label}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-900">@{data.creatorUsername || data.fromUsername || 'Unknown'}</p>
                      <p className="text-sm text-slate-600">{label}</p>
                    </>
                  )}
                  <p className="text-xs text-slate-500">
                    {data.date && `📅 ${data.date}`} {data.time && `⏰ ${data.time}`}
                  </p>
                  {isOutdated && (
                    <p className="text-xs text-amber-600 font-semibold mt-1">⚠️ Workout time has passed</p>
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
                      <Trash2 className="h-3 w-3" /> Dismiss
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAcceptWorkout(n.id, data.participantId, data)}
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${toneClasses.emerald.button}`}
                      >
                        <Check className="h-3 w-3" /> Accept
                      </button>
                      <button
                        onClick={() => handleDeclineWorkout(n.id, data.participantId)}
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${toneClasses.amber.button}`}
                      >
                        <Close className="h-3 w-3" /> Decline
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-md shadow-slate-200 transition hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" /> Back
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
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active ? `${tone.button} ${tone.glow}` : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
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
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-500">{tabs.find(t => t.key === tab)?.hint}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => markAllNotificationsRead().then(() => setItems(prev => prev.map(i => ({ ...i, read: 1 })))).catch(() => {})}
              className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Mark all read
            </button>
          </div>
        </div>

        {loading && renderLoading()}
        {!loading && error && (
          <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">{error}</p>
        )}
        {!loading && !error && items.length === 0 && renderEmptyState('All caught up', 'You have no notifications in this tab right now.')}

        {!loading && !error && tab === 'requests' && items.length > 0 && renderRequests()}
        {!loading && !error && tab === 'workout_invite' && items.length > 0 && renderWorkoutInvites()}
        {!loading && !error && tab === 'unfriended' && items.length > 0 && renderUnfriended()}
        {!loading && !error && tab === 'message' && items.length > 0 && renderMessages()}
      </div>
    </div>
  );
}
