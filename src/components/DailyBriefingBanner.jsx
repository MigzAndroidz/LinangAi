import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Play, Clock, CheckCircle } from 'lucide-react';

export const DailyBriefingBanner = ({
  assignments,
  courses,
  onStartFocus,
  onOpenSchedule
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const now = Date.now();
  const activeAssignments = assignments.filter((a) => a.status !== 'completed');

  // Count due soon (<24h) and overdue
  let overdueCount = 0;
  let dueTodayCount = 0;

  activeAssignments.forEach((hw) => {
    const diffHours = (new Date(hw.dueDate).getTime() - now) / (1000 * 3600);
    if (diffHours < 0) {
      overdueCount++;
    } else if (diffHours <= 24) {
      dueTodayCount++;
    }
  });

  // Pick top priority/urgent task
  const topTask = [...activeAssignments].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  })[0];

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const topCourse = topTask ? courseMap[topTask.courseId] : null;

  // Time of day greeting
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  return (
    <div className="briefing-card">
      <div className="briefing-content">
        <h3>
          <Sparkles size={18} style={{ color: '#60a5fa' }} />
          <span>{greeting}! Here is your AI Study Briefing</span>
        </h3>
        
        {activeAssignments.length === 0 ? (
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={16} style={{ color: '#34d399' }} />
            <span>All caught up! You have 0 pending homework deadlines. Great job staying ahead!</span>
          </p>
        ) : (
          <p>
            You have <strong style={{ color: '#f8fafc' }}>{activeAssignments.length} active assignments</strong>.
            {dueTodayCount > 0 && (
              <span style={{ color: '#fbbf24', marginLeft: '4px' }}>
                ⏰ {dueTodayCount} due in the next 24h.
              </span>
            )}
            {overdueCount > 0 && (
              <span style={{ color: '#f87171', marginLeft: '4px' }}>
                ⚠️ {overdueCount} past due.
              </span>
            )}
            {topTask && (
              <span style={{ display: 'block', marginTop: '0.35rem', color: '#cbd5e1' }}>
                💡 <strong>AI Recommendation:</strong> Tackle <em>[{topCourse?.code || 'Task'}] {topTask.title}</em> first to stay on track.
              </span>
            )}
          </p>
        )}
      </div>

      <div className="briefing-actions">
        {topTask && (
          <button
            onClick={() => onStartFocus(topTask)}
            className="btn"
            style={{ background: '#2563eb', color: 'white', fontSize: '0.825rem', padding: '0.5rem 0.9rem' }}
          >
            <Play size={14} />
            <span>Focus Top Task</span>
          </button>
        )}
        <button
          onClick={onOpenSchedule}
          className="btn"
          style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', fontSize: '0.825rem', padding: '0.5rem 0.85rem' }}
        >
          <Clock size={14} />
          <span>Plan Timeline</span>
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          style={{ color: '#94a3b8', padding: '4px', background: 'none' }}
          title="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
