const pad = (n) => String(n).padStart(2, '0');

export const toDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const buildPostDateSet = (posts = []) => {
  const dates = new Set();

  posts.forEach((post) => {
    if (!post?.created_at) return;
    const date = new Date(post.created_at);
    if (!Number.isNaN(date.getTime())) {
      dates.add(toDateKey(date));
    }
  });

  return dates;
};

export const calculateCurrentStreak = (dateKeys, anchorDate = new Date(), maxDays = 365) => {
  let streak = 0;

  for (let i = 0; i < maxDays; i++) {
    const checkDate = new Date(anchorDate);
    checkDate.setDate(checkDate.getDate() - i);
    const key = toDateKey(checkDate);

    if (dateKeys.has(key)) {
      streak++;
    } else if (i > 0) {
      // Missing today is allowed, but stop once a gap appears after streak starts.
      break;
    }
  }

  return streak;
};

export const countPostingDaysInWindow = (dateKeys, days, anchorDate = new Date()) => {
  let count = 0;

  for (let i = 0; i < days; i++) {
    const checkDate = new Date(anchorDate);
    checkDate.setDate(checkDate.getDate() - i);
    const key = toDateKey(checkDate);
    if (dateKeys.has(key)) count++;
  }

  return count;
};
