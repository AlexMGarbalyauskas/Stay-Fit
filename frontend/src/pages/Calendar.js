import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Dumbbell, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const workoutOptions = ['Rest', 'Full Body', 'Legs', 'Chest', 'Back', 'Arms', 'Shoulders', 'Cardio', 'Core'];

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function CalendarPage() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [plans, setPlans] = useState({}); // { '2025-01-15': { workout: 'Legs', note: '' } }
  const [selected, setSelected] = useState({ key: dateKey(today.getFullYear(), today.getMonth(), today.getDate()) });
  const [workout, setWorkout] = useState('Full Body');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

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
        }
      }
    } catch (e) {
      console.error('Failed to load plans', e);
    }
  }, []);

  // When selection changes, populate form
  useEffect(() => {
    const plan = plans[selected.key];
    setWorkout(plan?.workout || 'Full Body');
    setNote(plan?.note || '');
  }, [selected.key, plans]);

  const savePlan = () => {
    setPlans(prev => {
      const next = { ...prev, [selected.key]: { workout, note } };
      localStorage.setItem('workout-plans', JSON.stringify(next));
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const months = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  const weeksForMonth = (y, m) => {
    const firstDay = new Date(y, m, 1).getDay(); // 0 Sunday
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  };

  const isToday = (y, m, d) => {
    return today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  };

  const hasPlan = (y, m, d) => {
    if (!d) return false;
    return !!plans[dateKey(y, m, d)];
  };

  const handleSelectDay = (y, m, d) => {
    if (!d) return;
    const key = dateKey(y, m, d);
    setSelected({ key, y, m, d });
  };

  const changeYear = (delta) => {
    const nextYear = year + delta;
    setYear(nextYear);
    // if selected day not in new year, move selection to same month/day in next year
    if (selected.y !== undefined) {
      setSelected(prev => ({ key: dateKey(nextYear, prev.m ?? today.getMonth(), prev.d ?? 1), y: nextYear, m: prev.m, d: prev.d }));
    } else {
      setSelected({ key: dateKey(nextYear, 0, 1), y: nextYear, m: 0, d: 1 });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => changeYear(-1)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Previous year">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-lg font-bold text-gray-800">{year}</div>
            <button onClick={() => changeYear(1)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Next year">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 md:grid-cols-2">
          {months.map((month, idx) => (
            <div key={month} className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">{month}</span>
              </div>
              <div className="grid grid-cols-7 text-[11px] text-gray-400 px-3 pt-2">
                {['S','M','T','W','T','F','S'].map((d) => (
                  <div key={d} className="text-center pb-1">{d}</div>
                ))}
              </div>
              <div className="px-3 pb-3 text-sm text-gray-700">
                {weeksForMonth(year, idx).map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                    {week.map((day, di) => {
                      const active = day && selected.key === dateKey(year, idx, day);
                      const planned = hasPlan(year, idx, day);
                      return (
                        <button
                          key={di}
                          onClick={() => handleSelectDay(year, idx, day)}
                          className={`h-9 rounded-md text-center transition ${day ? 'hover:bg-blue-50' : ''} ${active ? 'bg-blue-100 text-blue-700 font-semibold' : ''}`}
                          disabled={!day}
                        >
                          <div className={`flex items-center justify-center gap-1 ${!day ? 'text-transparent' : ''}`}>
                            <span className="leading-none">{day || ''}</span>
                            {planned && <span className="h-2 w-2 rounded-full bg-emerald-500"></span>}
                            {isToday(year, idx, day) && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
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
              <p className="text-xs uppercase tracking-wide text-gray-500">Selected Day</p>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-blue-600" /> {selected.key}
              </h2>
              <p className="text-sm text-gray-500">Assign a workout and notes for this day.</p>
            </div>
            <button
              onClick={savePlan}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              <Save size={16} /> {saved ? 'Saved' : 'Save Plan'}
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-gray-800">Workout</label>
              <select
                value={workout}
                onChange={(e) => { setWorkout(e.target.value); setSaved(false); }}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
              >
                {workoutOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-800">Notes</label>
              <textarea
                value={note}
                onChange={(e) => { setNote(e.target.value); setSaved(false); }}
                rows={3}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                placeholder="Add reminders, reps, or focus areas"
              />
            </div>
          </div>

          {saved && <p className="mt-3 text-sm font-semibold text-green-600">Saved locally.</p>}
        </div>
      </div>
    </div>
  );
}
