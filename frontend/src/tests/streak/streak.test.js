//streak.test.js used to test the streak helper functions, 
// which are responsible for calculating 
// the user's current posting streak and 
// the number of posting days within a 
// specified window. The tests cover various 
// scenarios, including consecutive posting days, 
// missing days, and edge cases to ensure that the 
// streak calculations are accurate and robust. 
// The test suite uses a fixed anchor date to 
// provide consistent results across test runs.



//imports 
import { toDateKey, buildPostDateSet, calculateCurrentStreak, countPostingDaysInWindow } from '../../utils/streak';
//imports end



// The test suite includes tests to check that
describe('streak helpers', () => {
  const anchor = new Date('2026-04-25T12:00:00');
// A helper function to create a date key in the format YYYY-MM-DD



// A helper function to build a 
// set of date keys from an array of posts
  test('buildPostDateSet extracts unique day keys from posts', () => {
    const posts = [
      { created_at: '2026-04-25T08:00:00Z' },
      { created_at: '2026-04-25T19:00:00Z' },
      { created_at: '2026-04-24T10:30:00Z' },
      { created_at: null },
    ];


    // Build a set of date keys 
    // from the provided posts and 
    // verify that it contains the 
    // correct unique keys for the posting days
    const set = buildPostDateSet(posts);


    // Verify that the set contains the expected date keys for the posting days, ensuring that duplicate entries for the same day are not included and that null values are handled gracefully
    expect(set.has('2026-04-25')).toBe(true);
    expect(set.has('2026-04-24')).toBe(true);
    expect(set.size).toBe(2);
  });

  // Test that the calculateCurrentStreak function correctly counts consecutive posting days, allowing for a missing day if it's today, and that the countPostingDaysInWindow function accurately counts unique posting days within a specified window of time. Additionally, test that the toDateKey function formats dates correctly as YYYY-MM-DD strings.
  test('calculateCurrentStreak counts consecutive posting days', () => {
    const dateKeys = new Set(['2026-04-25', '2026-04-24', '2026-04-23']);
    expect(calculateCurrentStreak(dateKeys, anchor)).toBe(3);
  });

  // Test that the calculateCurrentStreak function allows for a missing day if it's today but still counts the streak from yesterday, ensuring that users don't lose their streak if they miss posting on the current day but had posted on the previous day.
  test('calculateCurrentStreak allows missing today but still counts from yesterday', () => {
    const dateKeys = new Set(['2026-04-24', '2026-04-23']);
    expect(calculateCurrentStreak(dateKeys, anchor)).toBe(2);
  });


  // Test that the calculateCurrentStreak function returns 0 when there are no posting days, ensuring that users who haven't posted at all are correctly shown a streak of zero.
  test('countPostingDaysInWindow counts unique posting days in last 7 days', () => {
    const dateKeys = new Set([
      '2026-04-25',
      '2026-04-24',
      '2026-04-22',
      '2026-04-21',
      '2026-04-19',
      '2026-03-01',
    ]);

    expect(countPostingDaysInWindow(dateKeys, 7, anchor)).toBe(5);
  });

  // Test that the calculateCurrentStreak function returns 0 when there are no posting days, ensuring that users who haven't posted at all are correctly shown a streak of zero.
  test('toDateKey formats date as YYYY-MM-DD', () => {
    const date = new Date('2026-01-03T09:10:11');
    expect(toDateKey(date)).toBe('2026-01-03');
  });
});
