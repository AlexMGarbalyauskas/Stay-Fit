import { useState, useMemo } from 'react';
import { ArrowLeft, Play, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

// Sample exercise tutorials database
const EXERCISE_TUTORIALS = {
  'Push-ups': {
    description: 'A classic chest, shoulders, and triceps exercise',
    duration: '2:45',
    difficulty: 'Beginner',
    instructions: [
      'Start in a plank position with hands shoulder-width apart',
      'Lower your body until your chest nearly touches the ground',
      'Keep your elbows close to your body',
      'Push through your palms to return to starting position',
      'Repeat for desired number of reps'
    ],
    videoUrl: '' // Add your video link here
  },
  'Squats': {
    description: 'Strengthen your legs and glutes with this fundamental exercise',
    duration: '3:15',
    difficulty: 'Beginner',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower your body by bending knees and hips',
      'Keep chest up and weight in heels',
      'Lower until thighs are parallel to ground',
      'Push through heels to return to standing'
    ],
    videoUrl: '' // Add your video link here
  },
  'Deadlifts': {
    description: 'Full body strength training exercise',
    duration: '4:20',
    difficulty: 'Intermediate',
    instructions: [
      'Stand with feet hip-width apart',
      'Grip bar with hands just outside legs',
      'Keep back straight and core engaged',
      'Drive through heels to stand up',
      'Lower bar back to ground with control'
    ],
    videoUrl: '' // Add your video link here
  },
  'Pull-ups': {
    description: 'Build back and arm strength',
    duration: '3:50',
    difficulty: 'Intermediate',
    instructions: [
      'Grip bar with hands slightly wider than shoulder-width',
      'Pull body up until chin clears the bar',
      'Keep core tight and avoid swinging',
      'Lower body with control',
      'Repeat for desired reps'
    ],
    videoUrl: '' // Add your video link here
  },
  'Bench Press': {
    description: 'Develop chest, shoulders, and triceps',
    duration: '3:30',
    difficulty: 'Intermediate',
    instructions: [
      'Lie flat on bench with feet on ground',
      'Grip bar at shoulder width',
      'Lower bar to chest slowly',
      'Keep elbows at 45-degree angle',
      'Press bar back up to starting position'
    ],
    videoUrl: '' // Add your video link here
  },
  'Plank': {
    description: 'Core strengthening exercise',
    duration: '2:30',
    difficulty: 'Beginner',
    instructions: [
      'Start in forearm plank position',
      'Keep body in straight line from head to heels',
      'Engage core and avoid sagging hips',
      'Hold position for desired time',
      'Rest and repeat'
    ],
    videoUrl: '' // Add your video link here
  },
  'Dumbbell Curls': {
    description: 'Bicep isolation exercise',
    duration: '2:15',
    difficulty: 'Beginner',
    instructions: [
      'Stand with dumbbells at sides, palms facing forward',
      'Bend elbows to curl weights to shoulders',
      'Keep elbows stationary at sides',
      'Lower weights back down with control',
      'Repeat for desired reps'
    ],
    videoUrl: '' // Add your video link here
  },
  'Lunges': {
    description: 'Leg strengthening and balance exercise',
    duration: '3:00',
    difficulty: 'Beginner',
    instructions: [
      'Stand with feet together',
      'Step forward and lower hips until both knees bent 90 degrees',
      'Front knee should align with ankle',
      'Push back to starting position',
      'Alternate legs for desired reps'
    ],
    videoUrl: '' // Add your video link here
  },
  'Chest Press': {
    description: 'Chest and triceps strengthening exercise',
    duration: '3:15',
    difficulty: 'Beginner',
    instructions: [
      'Lie on bench with feet on ground',
      'Hold dumbbells at shoulder height',
      'Press dumbbells upward',
      'Lower dumbbells back to chest',
      'Repeat for desired reps'
    ],
    videoUrl: '' // Add your video link here
  },
  'Back Rows': {
    description: 'Back and biceps strengthening exercise',
    duration: '3:30',
    difficulty: 'Intermediate',
    instructions: [
      'Bend forward with knees slightly bent',
      'Hold dumbbells with arms hanging down',
      'Pull dumbbells up to chest',
      'Lower dumbbells back down',
      'Repeat for desired reps'
    ],
    videoUrl: '' // Add your video link here
  },
  'Shoulder Press': {
    description: 'Shoulder and upper body strength exercise',
    duration: '3:00',
    difficulty: 'Intermediate',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold dumbbells at shoulder height',
      'Press dumbbells overhead',
      'Lower back to shoulder height',
      'Repeat for desired reps'
    ],
    videoUrl: '' // Add your video link here
  },
  'Bicep Curls': {
    description: 'Arm and bicep isolation exercise',
    duration: '2:45',
    difficulty: 'Beginner',
    instructions: [
      'Stand with dumbbells at sides, palms facing forward',
      'Bend elbows to curl weights to shoulders',
      'Keep elbows stationary at sides',
      'Lower weights back down with control',
      'Repeat for desired reps'
    ],
    videoUrl: '' // Add your video link here
  },
  'Tricep Dips': {
    description: 'Tricep strengthening bodyweight exercise',
    duration: '2:30',
    difficulty: 'Intermediate',
    instructions: [
      'Use a bench or chair behind you',
      'Lower body by bending elbows',
      'Keep elbows close to body',
      'Push back up to starting position',
      'Repeat for desired reps'
    ],
    videoUrl: '' // Add your video link here
  }
};

// Extract unique exercises from plans - if empty, show all exercises
const getExercisesFromWorkouts = (plans) => {
  const exercises = new Set();
  
  // Common exercises in Full Body, Upper Body, Lower Body, etc.
  const workoutExercises = {
    'Full Body': ['Push-ups', 'Squats', 'Deadlifts', 'Bench Press'],
    'Upper Body': ['Push-ups', 'Pull-ups', 'Bench Press', 'Dumbbell Curls'],
    'Lower Body': ['Squats', 'Lunges', 'Deadlifts'],
    'Core': ['Plank', 'Push-ups', 'Squats'],
    'Cardio': ['Lunges', 'Squats'],
    'Strength': ['Deadlifts', 'Bench Press', 'Pull-ups']
  };

  Object.values(plans).forEach(plan => {
    const workout = plan.workout || 'Full Body';
    const exs = workoutExercises[workout] || ['Push-ups', 'Squats'];
    exs.forEach(ex => exercises.add(ex));
  });

  return Array.from(exercises);
};

export default function Tutorials({ isAuthenticated }) {
  const { t } = useLanguage();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  // Get exercises from user's workout plans
  const userExercises = useMemo(() => {
    try {
      const stored = localStorage.getItem('workout-plans');
      const plans = stored ? JSON.parse(stored) : {};
      const exercises = getExercisesFromWorkouts(plans);
      // If no exercises from plans, show all available exercises
      return exercises.length > 0 ? exercises : Object.keys(EXERCISE_TUTORIALS);
    } catch (e) {
      console.error('Failed to load exercises:', e);
      return Object.keys(EXERCISE_TUTORIALS);
    }
  }, []);

  // Filter exercises based on search and difficulty
  const filteredExercises = useMemo(() => {
    return userExercises.filter(exercise => {
      const tutorial = EXERCISE_TUTORIALS[exercise];
      const matchesSearch = exercise.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (tutorial?.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'All' || tutorial?.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [userExercises, searchTerm, filterDifficulty]);

  const selectedTutorial = selectedExercise ? EXERCISE_TUTORIALS[selectedExercise] : null;

  if (!isAuthenticated) {
    return (
      <div className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} style={{ minHeight: '100vh' }}>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <p>Please log in to view tutorials.</p>
        </main>
        <Navbar />
      </div>
    );
  }

  return (
    <div className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} style={{ minHeight: '100vh' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 pt-20">
        {!selectedTutorial ? (
          <>
            <div className="mb-8">
              <button
                onClick={() => navigate(-1)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-md transition ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 shadow-gray-800 hover:bg-gray-700'
                    : 'bg-white text-slate-700 shadow-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <h1 className="text-3xl font-bold mb-2">Exercise Tutorials</h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Learn proper form for exercises in your workout plans
              </p>
            </div>

            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className={`col-span-1 md:col-span-2 relative`}>
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className={`px-4 py-3 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option>All Difficulties</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            {/* Exercises Grid */}
            {filteredExercises.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExercises.map((exercise) => {
                  const tutorial = EXERCISE_TUTORIALS[exercise];
                  return (
                    <div
                      key={exercise}
                      onClick={() => setSelectedExercise(exercise)}
                      className={`rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
                        isDark ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    >
                      <div className={`relative h-40 ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-400 to-purple-500'} flex items-center justify-center`}>
                        <Play className="w-16 h-16 text-white opacity-80" />
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2">{exercise}</h3>
                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {tutorial?.description}
                        </p>

                        <div className="flex justify-between items-center text-sm">
                          <span className={`${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {tutorial?.duration}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            tutorial?.difficulty === 'Beginner'
                              ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                              : tutorial?.difficulty === 'Intermediate'
                              ? isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                              : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                          }`}>
                            {tutorial?.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  No exercises found matching your search.
                </p>
              </div>
            )}
          </>
        ) : (
          // Tutorial Details View
          <div>
            <button
              onClick={() => setSelectedExercise(null)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-md transition ${
                isDark
                  ? 'bg-gray-800 text-gray-300 shadow-gray-800 hover:bg-gray-700'
                  : 'bg-white text-slate-700 shadow-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tutorials
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Video Section */}
              <div className="lg:col-span-2">
                <div className={`rounded-xl overflow-hidden aspect-video ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  {selectedTutorial?.videoUrl ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={selectedTutorial?.videoUrl}
                      title={selectedExercise}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : null}
                </div>

                <div className="mt-6">
                  <h2 className="text-2xl font-bold mb-2">{selectedExercise}</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    {selectedTutorial?.description}
                  </p>
                </div>
              </div>

              {/* Info Sidebar */}
              <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className="mb-6">
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Duration</p>
                  <p className="text-2xl font-bold">{selectedTutorial?.duration}</p>
                </div>

                <div className="mb-6">
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Difficulty</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTutorial?.difficulty === 'Beginner'
                      ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                      : selectedTutorial?.difficulty === 'Intermediate'
                      ? isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                      : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedTutorial?.difficulty}
                  </span>
                </div>

                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>How to Perform</p>
                  <ol className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedTutorial?.instructions.map((instruction, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className={`font-semibold flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {idx + 1}.
                        </span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Navbar />
    </div>
  );
}
