import React, { useState } from 'react';
import { Play, Clock, X } from 'lucide-react';

export const DailyBriefingBanner = ({
  assignments,
  courses,
  onStartFocus,
  onOpenSchedule,
  currentProfile
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const now = Date.now();
  const activeAssignments = assignments.filter((a) => a.status !== 'completed');

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

  const topTask = [...activeAssignments].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  })[0];

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const topCourse = topTask ? courseMap[topTask.courseId] : null;

  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const dateString = new Date().toLocaleDateString('en-US', dateOptions).toUpperCase();

  const name = currentProfile?.name || 'Student';
  const firstName = name.split(' ')[0];

  return (
    <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
      {/* Date Header */}
      <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', marginBottom: '0.2rem' }}>
        {dateString}
      </div>
      
      {/* Greeting Header */}
      <h2 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 800, margin: '0 0 1rem 0', lineHeight: 1.2 }}>
        {greeting}, {firstName}!
      </h2>

      {/* Mascot & Speech Bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#5d8c6b', padding: '1rem', borderRadius: 'var(--radius-md)', position: 'relative' }}>
        <img 
          src="/mascot.png" 
          alt="Linang AI Mascot" 
          style={{ width: '80px', height: '80px', objectFit: 'contain', marginTop: '10px' }} 
        />
        
        <div style={{ 
          background: '#1a1a1a', 
          color: '#e2e8f0',
          padding: '1.25rem', 
          borderRadius: '16px',
          borderBottomLeftRadius: '4px',
          flex: 1,
          position: 'relative',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Speech Bubble Arrow */}
          <div style={{
            position: 'absolute',
            left: '-12px',
            top: '30px',
            borderTop: '12px solid transparent',
            borderRight: '12px solid #1a1a1a',
            borderBottom: '12px solid transparent'
          }} />

          <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
            LinangAI
          </div>
          
          <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
            {activeAssignments.length === 0 ? (
              <span>All caught up! You have 0 pending homework deadlines. Great job staying ahead!</span>
            ) : (
              <>
                You have <strong>{activeAssignments.length} active assignments</strong>.
                {dueTodayCount > 0 && <span style={{ color: '#fbbf24', marginLeft: '4px' }}>⏰ {dueTodayCount} due in the next 24h.</span>}
                {overdueCount > 0 && <span style={{ color: '#f87171', marginLeft: '4px' }}>⚠️ {overdueCount} past due.</span>}
                
                {topTask && (
                  <div style={{ marginTop: '0.65rem' }}>
                    Tighten up on <em>[{topCourse?.code || 'Task'}] {topTask.title}</em> first before the rest of the week gets harder.
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Actions inside speech bubble */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {topTask && (
              <button
                onClick={() => onStartFocus(topTask)}
                style={{ 
                  background: '#2563eb', color: 'white', fontSize: '0.8rem', padding: '0.5rem 0.85rem', 
                  borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' 
                }}
              >
                <Play size={14} /> Focus Top Task
              </button>
            )}
            <button
              onClick={onOpenSchedule}
              style={{ 
                background: 'rgba(255, 255, 255, 0.15)', color: 'white', fontSize: '0.8rem', padding: '0.5rem 0.85rem', 
                borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' 
              }}
            >
              <Clock size={14} /> Plan Timeline
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              style={{ 
                background: 'transparent', color: '#94a3b8', fontSize: '0.8rem', padding: '0.5rem', 
                marginLeft: 'auto', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' 
              }}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
