// Workout Reminder Notification System

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showWorkoutNotification = (workout, time, note = '') => {
  if (Notification.permission === 'granted') {
    new Notification('Workout Reminder! 🏋️', {
      body: `Time for ${workout}${time ? ` at ${time}` : ''}${note ? `\n${note}` : ''}`,
      icon: '/manifest.json', // You can add a custom icon
      badge: '/manifest.json',
      tag: 'workout-reminder',
      requireInteraction: true,
      silent: false
    });
  }
};

export const checkWorkoutReminders = (plans) => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  if (!plans[today]) return;
  
  const plan = plans[today];
  if (!plan.time) return;

  // Parse the time from the plan
  const [hours, minutes] = plan.time.split(':').map(Number);
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);

  // Show notification if within 5 minutes of reminder time
  const timeDiff = reminderTime - now;
  const fiveMinutes = 5 * 60 * 1000;

  if (timeDiff > 0 && timeDiff <= fiveMinutes) {
    showWorkoutNotification(plan.workout, plan.time, plan.note);
    
    // Mark as shown to avoid duplicate notifications
    const shownKey = `shown_${today}_${plan.time}`;
    if (!sessionStorage.getItem(shownKey)) {
      sessionStorage.setItem(shownKey, 'true');
    }
  }
};

// Start checking for reminders every minute
export const startReminderService = (getPlans) => {
  // Request permission on start
  requestNotificationPermission();

  // Check immediately
  checkWorkoutReminders(getPlans());

  // Then check every minute
  const interval = setInterval(() => {
    checkWorkoutReminders(getPlans());
  }, 60000); // Check every minute

  return () => clearInterval(interval);
};
