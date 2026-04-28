// This page allows users to plan their workouts on a calendar, set reminders, and invite friends to join them.
// It displays a calendar view with indicators for days that have planned workouts and posting activity.
// Users can click on a day to assign a workout, set a reminder time, add notes, and invite workout buddies.
// The page also tracks the user's posting streak and shows a countdown to the next workout reminder.




//imports
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Dumbbell, Save, Clock, Users, Bell, X as Close, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { startReminderService } from '../utils/workoutReminders';
import { buildPostDateSet, calculateCurrentStreak } from '../utils/streak';
import { useWorkoutReminder } from '../context/WorkoutReminderContext';
import { useLanguage } from '../context/LanguageContext';
//imports end

//const 
const pad = (n) => String(n).padStart(2, '0');
const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
//const 




// Main component for the Calendar page
export default function CalendarPage() {


  //all const and states
  const { t } = useLanguage();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { countdown } = useWorkoutReminder();
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  
  // Limit year range to current year ± 2
  const [year, setYear] = useState(currentYear);
  const minYear = currentYear - 2;
  const maxYear = currentYear + 2;
  
  // State for workout plans, 
  // selected day, form inputs, buddies, and UI controls
  const [plans, setPlans] = useState({}); 
  const [selected, setSelected] = useState({ key: dateKey(today.getFullYear(), today.getMonth(), today.getDate()) });
  const [workout, setWorkout] = useState('Full Body');
  const [note, setNote] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [saved, setSaved] = useState(false);
  const [showBuddyModal, setShowBuddyModal] = useState(false);
  const [availableBuddies, setAvailableBuddies] = useState([]);
  const [selectedBuddies, setSelectedBuddies] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [postDates, setPostDates] = useState(new Set()); // Set of dates with posts
  const [currentStreak, setCurrentStreak] = useState(0); // Current posting streak
  const [plannerActivated, setPlannerActivated] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };





  //use effect 1
  // Fetch user's posts to track posting dates
  useEffect(() => {
    const fetchPostDates = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/posts/mine/export`, authHeaders);
        const posts = response.data.posts || [];
        
        // Extract unique dates from posts
        const dates = buildPostDateSet(posts);
        
        setPostDates(dates);

        setCurrentStreak(calculateCurrentStreak(dates));
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    fetchPostDates();
  }, []);
  //use effect 1 end 





//use effect 2
  // Load saved plans from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('workout-plans');
      if (stored) {
        const parsed = JSON.parse(stored);
        setPlans(parsed);
        if (parsed[selected.key]) {
          setWorkout(parsed[selected.key].workout || 'Full Body');
          setNote(parsed[selected.key].note || '');
          setReminderTime(parsed[selected.key].time || '');
          setSelectedBuddies(parsed[selected.key].buddies || []);
        }
      }
    } catch (e) {
      console.error('Failed to load plans', e);
    }
  }, []);
//use effect 2 end




//use effect 3
  // Start workout reminder service
  useEffect(() => {
    const cleanup = startReminderService(() => plans);
    return cleanup;
  }, [plans]);
//use effect 3 end





//use effect 4
  // When selection changes, populate form
  useEffect(() => {
    const plan = plans[selected.key];
    setWorkout(plan?.workout || 'Full Body');
    setNote(plan?.note || '');
    setReminderTime(plan?.time || '');
    setSelectedBuddies(plan?.buddies || []);
  }, [selected.key, plans]);
//use effect 4 end





//block 1 
  // Load friends for buddy selection
  const loadFriends = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/friends`, authHeaders);
      setAvailableBuddies(response.data.friends || []);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };
//block 1 end





//block 2
  const savePlan = async () => {
    const planData = { 
      workout, 
      note, 
      time: reminderTime, 
      buddies: selectedBuddies,
      date: selected.key
    };
    
    // Persist locally first
    setPlans(prev => {
      const next = { ...prev, [selected.key]: planData };
      localStorage.setItem('workout-plans', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('workout-plans-changed', { detail: { date: selected.key } }));
      return next;
    });

    // Send workout invites to buddies and capture scheduleId for cancellation
    if (selectedBuddies.length > 0) {
      const scheduleId = await sendWorkoutInvites();
      if (scheduleId) {
        setPlans(prev => {
          const updated = { ...prev, [selected.key]: { ...planData, scheduleId } };
          localStorage.setItem('workout-plans', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('workout-plans-changed', { detail: { date: selected.key } }));
          return updated;
        });
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };
//block 2 end






//block 3
  const sendWorkoutInvites = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/workout-schedules`, {
        date: selected.key,
        workout,
        time: reminderTime,
        buddies: selectedBuddies.map(b => b.id)
      }, authHeaders);
      return res?.data?.scheduleId;
    } catch (error) {
      console.error('Failed to send workout invites:', error);
      return null;
    }
  };
//block 3 end




//block 4
  const cancelPlan = async () => {
    if (!window.confirm(t('cancelPlanConfirm'))) {
      return;
    }

    const currentPlan = plans[selected.key];

    // Inform backend and buddies if a scheduleId exists
    if (currentPlan?.scheduleId) {
      try {
        await axios.delete(`${API_URL}/api/workout-schedules/${currentPlan.scheduleId}`, authHeaders);
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.error('Failed to cancel workout on server:', err);
        }
        // If 404, proceed with local cleanup anyway
      }
    }

    setPlans(prev => {
      const next = { ...prev };
      delete next[selected.key];
      localStorage.setItem('workout-plans', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('workout-plans-changed', { detail: { date: selected.key } }));
      return next;
    });

    // Reset form
    setWorkout('Full Body');
    setNote('');
    setReminderTime('');
    setSelectedBuddies([]);
    setSaved(false);
  };
//block 4 end




//block 5
// Additional handlers for posting workout, 
// skipping, camera, and buddy modal
  const handlePostWorkout = () => {
    navigate('/post');
  };
//block 5 end






//block 6
  const handleSkipWorkout = () => {
    // Handled by context dismissPrompt
  };
//block 6 end










//block 7
  const handleCloseCamera = () => {
    setShowCamera(false);
  };
//block 7 end









//block 8
  const openBuddyModal = async () => {
    await loadFriends();
    setShowBuddyModal(true);
  };
//block 8 end








//block 9
  const toggleBuddy = (friend) => {
    setSelectedBuddies(prev => {
      const exists = prev.find(b => b.id === friend.id);
      if (exists) {
        return prev.filter(b => b.id !== friend.id);
      } else {
        return [...prev, friend];
      }
    });
  };
//block 9 end








//block 10
// Memoized workout options and month/day labels for localization
  const workoutOptions = useMemo(() => ([
    { value: 'Rest', label: t('workoutRest') },
    { value: 'Full Body', label: t('workoutFullBody') },
    { value: 'Legs', label: t('workoutLegs') },
    { value: 'Chest', label: t('workoutChest') },
    { value: 'Back', label: t('workoutBack') },
    { value: 'Arms', label: t('workoutArms') },
    { value: 'Shoulders', label: t('workoutShoulders') },
    { value: 'Cardio', label: t('workoutCardio') },
    { value: 'Core', label: t('workoutCore') }
  ]), [t]);
//block 10 end










//block 11
// Memoized month and day labels for localization
  const months = useMemo(() => [
    t('monthJanuary'), t('monthFebruary'), t('monthMarch'), t('monthApril'), t('monthMay'), t('monthJune'),
    t('monthJuly'), t('monthAugust'), t('monthSeptember'), t('monthOctober'), t('monthNovember'), t('monthDecember')
  ], [t]);
//block 11 end











//block 12
  const dayLabels = useMemo(() => [
    t('daySunShort'), t('dayMonShort'), t('dayTueShort'), t('dayWedShort'),
    t('dayThuShort'), t('dayFriShort'), t('daySatShort')
  ], [t]);
//block 12 end












//block 13
// Helper function to generate calendar weeks for a given month and year
  const weeksForMonth = (y, m) => {
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  };
//block 13 end








//block 14
// Helper functions to check if a date is today, has a plan, or has a post
  const isToday = (y, m, d) => {
    return today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  };
// block 14 end






//block 15
// Check if a given date has a workout plan
  const hasPlan = (y, m, d) => {
    if (!d) return false;
    return !!plans[dateKey(y, m, d)];
  };
//block 15 end




//block 16
// Check if a given date has a post (for streak tracking)
  const hasPost = (y, m, d) => {
    if (!d) return false;
    return postDates.has(dateKey(y, m, d));
  };
//block 16 end






//block 17
// Handler for when a user selects a day on the calendar
  const handleSelectDay = (y, m, d) => {
    if (!d) return;
    const key = dateKey(y, m, d);
    setSelected({ key, y, m, d });
  };
//block 17 end








//blcok 18
// Function to change the displayed year, with bounds checking
  const changeYear = (delta) => {
    const nextYear = year + delta;
    if (nextYear < minYear || nextYear > maxYear) return;
    setYear(nextYear);
    if (selected.y !== undefined) {
      setSelected(prev => ({ key: dateKey(nextYear, prev.m ?? today.getMonth(), prev.d ?? 1), y: nextYear, m: prev.m, d: prev.d }));
    } else {
      setSelected({ key: dateKey(nextYear, 0, 1), y: nextYear, m: 0, d: 1 });
    }
  };
//  block 18 end








  //main stucture 
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-white text-slate-800'}`}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-md transition ${
              isDark
                ? 'bg-gray-800 text-gray-300 shadow-gray-800 hover:bg-gray-700'
                : 'bg-white text-slate-700 shadow-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowLeft size={16} /> {t('back')}
          </button>
        </div>

        {!plannerActivated ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Dumbbell className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('workoutPlannerTitle')}</h2>
            <p className="text-sm text-gray-500 mb-2">{t('workoutPlannerIntro')}</p>
            <p className="text-sm text-gray-600 mb-5">{t('workoutPlannerOpenHint')}</p>
            <button
              onClick={() => setPlannerActivated(true)}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              <Dumbbell size={16} /> {t('openPlanner')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => changeYear(-1)} 
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" 
                  aria-label={t('previousYear')}
                  disabled={year <= minYear}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-lg font-bold text-gray-800">{year}</div>
                <button 
                  onClick={() => changeYear(1)} 
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" 
                  aria-label={t('nextYear')}
                  disabled={year >= maxYear}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Posting Streak Display */}
            {currentStreak > 0 && (
              <div className="mb-4 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 p-4 text-white shadow-lg">
                <div className="flex items-center justify-center gap-3">
                  <Flame className="w-8 h-8 fill-white" />
                  <div className="text-center">
                    <p className="text-sm font-semibold uppercase tracking-wide">{t('postingStreak')}</p>
                    <p className="text-3xl font-bold">{currentStreak} {currentStreak === 1 ? t('daySingular') : t('days')}</p>
                  </div>
                  <Flame className="w-8 h-8 fill-white" />
                </div>
              </div>
            )}

            {/* Countdown Timer Display */}
            {countdown && (
              <div className="mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide">{t('nextWorkout')}</p>
                    <p className="text-lg font-bold">{plans[dateKey(today.getFullYear(), today.getMonth(), today.getDate())]?.workout || t('workout')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{t('timeUntilReminder')}</p>
                    <p className="text-3xl font-bold tabular-nums">{countdown}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3 md:grid-cols-2">
          {months.map((month, idx) => (
            <div key={month} className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">{month}</span>
              </div>
              <div className="grid grid-cols-7 text-[11px] text-gray-400 px-3 pt-2">
                {dayLabels.map((d, i) => (
                  <div key={`${d}-${i}`} className="text-center pb-1">{d}</div>
                ))}
              </div>
              <div className="px-3 pb-3 text-sm text-gray-700">
                {weeksForMonth(year, idx).map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                    {week.map((day, di) => {
                      const active = day && selected.key === dateKey(year, idx, day);
                      const planned = hasPlan(year, idx, day);
                      const posted = hasPost(year, idx, day);
                      return (
                        <button
                          key={di}
                          onClick={() => handleSelectDay(year, idx, day)}
                          className={`h-9 rounded-md text-center transition relative ${day ? 'hover:bg-blue-50' : ''} ${active ? 'bg-blue-100 text-blue-700 font-semibold' : ''}`}
                          disabled={!day}
                          title={posted ? t('postedToday') : ''}
                        >
                          <div className={`flex items-center justify-center gap-0.5 relative ${!day ? 'text-transparent' : ''}`}>
                            <span className="leading-none">{day || ''}</span>
                            {posted && <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />}
                            {planned && !posted && <span className="h-2 w-2 rounded-full bg-emerald-500"></span>}
                            {isToday(year, idx, day) && !posted && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
          </div>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">{t('selectedDay')}</p>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-blue-600" /> {selected.key}
              </h2>
              <p className="text-sm text-gray-500">{t('assignWorkoutHelp')}</p>
            </div>
            <div className="flex items-center gap-2">
              {plans[selected.key] && (
                <button
                  onClick={cancelPlan}
                  className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-600"
                >
                  <Close size={16} /> {t('cancelPlan')}
                </button>
              )}
              <button
                onClick={savePlan}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                <Save size={16} /> {saved ? t('saved') : t('savePlan')}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-gray-800">{t('workout')}</label>
              <select
                value={workout}
                onChange={(e) => { setWorkout(e.target.value); setSaved(false); }}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
              >
                {workoutOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Clock size={14} /> {t('reminderTimeLabel')}
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => { setReminderTime(e.target.value); setSaved(false); }}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                placeholder={t('selectTime')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-800">{t('notes')}</label>
              <textarea
                value={note}
                onChange={(e) => { setNote(e.target.value); setSaved(false); }}
                rows={3}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                placeholder={t('notesPlaceholder')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <Users size={14} /> {t('workoutBuddies')}
              </label>
              <button
                onClick={openBuddyModal}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                <Users size={16} />
                {selectedBuddies.length > 0 
                  ? `${selectedBuddies.length} ${selectedBuddies.length > 1 ? t('friendsInvited_plural') : t('friendsInvited')}` 
                  : t('inviteFriendsWorkout')}
              </button>
              {selectedBuddies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedBuddies.map(buddy => (
                    <span key={buddy.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {buddy.username}
                    </span>
                  ))}
                </div>
              )}
              {reminderTime && selectedBuddies.length > 0 && (
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Bell size={12} /> 
                  {t('notificationSentAt')} {reminderTime}
                </p>
              )}
            </div>
          </div>

          {saved && <p className="mt-3 text-sm font-semibold text-green-600">{t('savedLocally')}</p>}
            </div>
          </>
        )}
      </div>

      {/* Buddy Selection Modal */}
      {showBuddyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className={`rounded-lg shadow-xl p-6 max-w-md w-full mx-auto max-h-[80vh] flex flex-col border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-500" />
                {t('inviteWorkoutBuddies')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {t('selectFriendsToJoin')} {workout} {t('workout').toLowerCase()} {t('on')} {selected.key}
                {reminderTime && ` ${t('at')} ${reminderTime}`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              {availableBuddies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('noFriendsAvailable')}</p>
                  <button
                    onClick={() => navigate('/find-friends')}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    {t('findFriends')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableBuddies.map(friend => {
                    const isSelected = selectedBuddies.find(b => b.id === friend.id);
                    return (
                      <button
                        key={friend.id}
                        onClick={() => toggleBuddy(friend)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">@{friend.username}</div>
                            {friend.bio && (
                              <div className="text-xs text-gray-500 mt-0.5">{friend.bio}</div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setShowBuddyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                  {t('cancel')}
              </button>
              <button
                onClick={() => {
                  setShowBuddyModal(false);
                  setSaved(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                  {t('done')} ({selectedBuddies.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  //html end 
}
