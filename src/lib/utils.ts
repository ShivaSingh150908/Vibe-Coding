import { StudySession, Task } from '../types';

export const formatTime = (totalSeconds: number): string => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatMinutesToHours = (minutes: number): string => {
  const hrs = (minutes / 60).toFixed(1);
  return `${hrs}h`;
};

export const getTodayDateStr = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const formatDateReadable = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch (e) {}
  return dateStr;
};

// Calculate current streak of consecutive days with at least 1 study session
export const calculateStudyStreak = (sessions: StudySession[]): number => {
  if (!sessions || sessions.length === 0) return 0;

  const datesWithStudy = new Set<string>();
  sessions.forEach((s) => {
    if (s.durationMinutes > 0) {
      datesWithStudy.add(s.date);
    }
  });

  const sortedDates = Array.from(datesWithStudy).sort((a, b) => b.localeCompare(a));
  if (sortedDates.length === 0) return 0;

  const todayStr = getTodayDateStr();
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Streak must include today or yesterday
  if (!datesWithStudy.has(todayStr) && !datesWithStudy.has(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let currDate = datesWithStudy.has(todayStr) ? new Date() : new Date(Date.now() - 86400000);

  while (true) {
    const dateStr = currDate.toISOString().split('T')[0];
    if (datesWithStudy.has(dateStr)) {
      streak++;
      currDate.setDate(currDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// Heatmap intensity levels (0 to 4)
export const getHeatmapLevel = (minutes: number): number => {
  if (minutes === 0) return 0; // level 0 (dark grey)
  if (minutes < 60) return 1;  // level 1 (<1 hr - subtle accent)
  if (minutes < 150) return 2; // level 2 (1-2.5 hrs - medium)
  if (minutes < 240) return 3; // level 3 (2.5-4 hrs - high)
  return 4;                   // level 4 (4+ hrs - glowing intense)
};

// Generate list of days for a given year & month (0-indexed month: 0=Jan, 7=Aug)
export const getMonthDaysMatrix = (year: number, monthZeroIndexed: number) => {
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthZeroIndexed, 1).getDay(); // 0=Sun, 1=Mon

  const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

  // Padding days from previous month
  const prevMonthDays = new Date(year, monthZeroIndexed, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const dateObj = new Date(year, monthZeroIndexed - 1, dayNum);
    days.push({
      dateStr: dateObj.toISOString().split('T')[0],
      dayNum,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = (monthZeroIndexed + 1).toString().padStart(2, '0');
    const dStr = d.toString().padStart(2, '0');
    days.push({
      dateStr: `${year}-${mStr}-${dStr}`,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  return { days, daysInMonth, firstDayOfWeek };
};
