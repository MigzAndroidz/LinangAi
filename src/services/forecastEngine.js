// Forecast Engine for computing study projections based on daily snapshots

export function computeForecast(dailySnapshots, profileId) {
  const snapshots = dailySnapshots
    .filter(s => s.profileId === profileId)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (snapshots.length < 3) {
    return { insufficientData: true, daysTracked: snapshots.length };
  }

  // Compute daily deltas
  const deltas = [];
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];
    deltas.push({
      date: curr.date,
      xp: Math.max(0, curr.cumulativeXP - prev.cumulativeXP),
      focusMinutes: Math.max(0, curr.cumulativeFocusMinutes - prev.cumulativeFocusMinutes),
      completedCount: Math.max(0, curr.cumulativeCompletedCount - prev.cumulativeCompletedCount)
    });
  }

  const last7 = deltas.slice(-7);
  const avgDailyXP = last7.reduce((sum, d) => sum + d.xp, 0) / last7.length;
  const avgDailyFocusMinutes = last7.reduce((sum, d) => sum + d.focusMinutes, 0) / last7.length;
  const avgDailyCompleted = last7.reduce((sum, d) => sum + d.completedCount, 0) / last7.length;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Days left in current month (including today)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysLeftMonth = Math.max(0, daysInMonth - now.getDate() + 1);
  
  // Days left in current year (including today)
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDaysInYear = isLeap ? 366 : 365;
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
  const daysLeftYear = Math.max(0, totalDaysInYear - dayOfYear + 1);

  // Sum of actual deltas so far this calendar month
  const currentMonthString = String(month + 1).padStart(2, '0');
  const currentYearMonth = `${year}-${currentMonthString}`; // YYYY-MM
  const deltasThisMonth = deltas.filter(d => d.date.startsWith(currentYearMonth));
  const actualMonthXP = deltasThisMonth.reduce((s, d) => s + d.xp, 0);
  const actualMonthFocus = deltasThisMonth.reduce((s, d) => s + d.focusMinutes, 0);
  const actualMonthCompleted = deltasThisMonth.reduce((s, d) => s + d.completedCount, 0);

  // Sum of actual deltas so far this calendar year
  const currentYearString = String(year);
  const deltasThisYear = deltas.filter(d => d.date.startsWith(currentYearString));
  const actualYearXP = deltasThisYear.reduce((s, d) => s + d.xp, 0);
  const actualYearFocus = deltasThisYear.reduce((s, d) => s + d.focusMinutes, 0);
  const actualYearCompleted = deltasThisYear.reduce((s, d) => s + d.completedCount, 0);

  const monthly = {
    xp: Math.round(actualMonthXP + (avgDailyXP * daysLeftMonth)),
    focusMinutes: Math.round(actualMonthFocus + (avgDailyFocusMinutes * daysLeftMonth)),
    completedCount: Math.round(actualMonthCompleted + (avgDailyCompleted * daysLeftMonth))
  };

  const annual = {
    xp: Math.round(actualYearXP + (avgDailyXP * daysLeftYear)),
    focusMinutes: Math.round(actualYearFocus + (avgDailyFocusMinutes * daysLeftYear)),
    completedCount: Math.round(actualYearCompleted + (avgDailyCompleted * daysLeftYear))
  };

  // Trend direction ('up' | 'down' | 'flat')
  const getTrend = (metric) => {
    if (deltas.length < 6) return 'flat';
    const recent3 = deltas.slice(-3);
    const prev3 = deltas.slice(-6, -3);
    const avgRecent = recent3.reduce((s, d) => s + d[metric], 0) / 3;
    const avgPrev = prev3.reduce((s, d) => s + d[metric], 0) / 3;
    
    if (avgRecent > avgPrev * 1.05) return 'up';
    if (avgRecent < avgPrev * 0.95) return 'down';
    return 'flat';
  };

  return {
    insufficientData: false,
    daysTracked: snapshots.length,
    monthly,
    annual,
    trend: {
      xp: getTrend('xp'),
      focusMinutes: getTrend('focusMinutes'),
      completedCount: getTrend('completedCount')
    }
  };
}
