import { toDateKey, buildPostDateSet, calculateCurrentStreak, countPostingDaysInWindow } from '../../utils/streak';

describe('streak helpers', () => {
  const anchor = new Date('2026-04-25T12:00:00');

  test('buildPostDateSet extracts unique day keys from posts', () => {
    const posts = [
      { created_at: '2026-04-25T08:00:00Z' },
      { created_at: '2026-04-25T19:00:00Z' },
      { created_at: '2026-04-24T10:30:00Z' },
      { created_at: null },
    ];

    const set = buildPostDateSet(posts);

    expect(set.has('2026-04-25')).toBe(true);
    expect(set.has('2026-04-24')).toBe(true);
    expect(set.size).toBe(2);
  });

  test('calculateCurrentStreak counts consecutive posting days', () => {
    const dateKeys = new Set(['2026-04-25', '2026-04-24', '2026-04-23']);
    expect(calculateCurrentStreak(dateKeys, anchor)).toBe(3);
  });

  test('calculateCurrentStreak allows missing today but still counts from yesterday', () => {
    const dateKeys = new Set(['2026-04-24', '2026-04-23']);
    expect(calculateCurrentStreak(dateKeys, anchor)).toBe(2);
  });

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

  test('toDateKey formats date as YYYY-MM-DD', () => {
    const date = new Date('2026-01-03T09:10:11');
    expect(toDateKey(date)).toBe('2026-01-03');
  });
});
