// This module provides utility functions for 
// calculating posting streaks and activity 
// patterns based on post creation dates.



// Pads a number with leading zeros to ensure 
// it has at least 2 digits
const pad = (n) => String(n).padStart(2, '0');



// Converts a Date object to a string key in the format YYYY-MM-DD
export const toDateKey = (date) => {

  // Validate that the input is a valid Date object
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

    // If the date is invalid, throw an error to prevent incorrect keys
    throw new Error('Invalid date provided');
  }
  
  // Format the date as a string key for consistent storage and comparison
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};



// Builds a set of date keys from an array of posts
export const buildPostDateSet = (posts = []) => {

  // Use a Set to store unique date keys for efficient lookup
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



// Calculates the current posting streak based on a set of date keys
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


// Counts how many days within the specified window have posts
export const countPostingDaysInWindow = (dateKeys, days, anchorDate = new Date()) => {
  let count = 0;

  // Loop through the specified number of days, checking for posts on each day
  for (let i = 0; i < days; i++) {
    const checkDate = new Date(anchorDate);
    checkDate.setDate(checkDate.getDate() - i);
    const key = toDateKey(checkDate);
    if (dateKeys.has(key)) count++;
  }

  return count;
};
