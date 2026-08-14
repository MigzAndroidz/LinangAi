import React from 'react';
import { X, BarChart3, Zap, Flame, Clock, CheckCircle2, Award, Trophy } from 'lucide-react';

export const AnalyticsModal = ({
  isOpen,
  onClose,
  userStats,
  assignments,
  courses
}) => {
  if (!isOpen) return null;

  const completedCount = assignments.filter((a) => a.status === 'completed').length;
  const totalCount = assignments.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate focus minutes by course
  const courseMinutes = {};
  courses.forEach((c) => {
    courseMinutes[c.id] = { code: c.code, color: c.color, minutes: 0 };
  });

  assignments.forEach((hw) => {
    if (courseMinutes[hw.courseId]) {
      courseMinutes[hw.courseId].minutes += hw.focusMinutesSpent || 0;
    }
  });

  const totalCourseMins = Object.values(courseMinutes).reduce((acc, curr) => acc + curr.minutes, 0) || 1;

  // Level progress
  const currentLevel = userStats.level || 1;
  const currentXP = userStats.xp || 0;
  const nextLevelXP = currentLevel * 150;
  const prevLevelXP = (currentLevel - 1) * 150;
  const levelProgressPercent = Math.min(
    100,
    Math.max(0, Math.round(((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100))
  );

  // Badges list
  const badges = [
    {
      id: 'streak_3',
      title: 'Consistency Champion',
      desc: 'Maintained a 3+ day study streak',
      unlocked: (userStats.streak || 0) >= 3,
      icon: '🔥'
    },
    {
      id: 'focus_60',
      title: 'Deep Focus Pro',
      desc: 'Logged over 60 minutes in Pomodoro studio',
      unlocked: (userStats.totalFocusMinutes || 0) >= 60,
      icon: '🎧'
    },
    {
      id: 'level_scholar',
      title: 'Honor Scholar',
      desc: 'Reached Level 3 Scholar rank',
      unlocked: currentLevel >= 3,
      icon: '🎓'
    },
    {
      id: 'task_crusher',
      title: 'Assignment Crusher',
      desc: 'Completed 5+ homework assignments',
      unlocked: completedCount >= 5,
      icon: '⚡'
    }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BarChart3 size={18} />
            </div>
            <h3>Study Analytics & Gamification</h3>
          </div>
          <button onClick={onClose} className="btn btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Key Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <div className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
              <Zap size={18} style={{ color: 'var(--color-success)', margin: '0 auto 0.25rem auto' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{userStats.xp}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total XP</span>
            </div>

            <div className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
              <Flame size={18} style={{ color: '#ea580c', margin: '0 auto 0.25rem auto' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{userStats.streak} d</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active Streak</span>
            </div>

            <div className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
              <Clock size={18} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.25rem auto' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{userStats.totalFocusMinutes} m</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Focus Logged</span>
            </div>

            <div className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-good)', margin: '0 auto 0.25rem auto' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{completionRate}%</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Completion</span>
            </div>
          </div>

          {/* Level Progress */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                Level {currentLevel} — {userStats.levelTitle}
              </span>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                {currentXP} / {nextLevelXP} XP ({levelProgressPercent}%)
              </span>
            </div>
            <div className="progress-track" style={{ height: '8px' }}>
              <div className="progress-fill" style={{ width: `${levelProgressPercent}%` }} />
            </div>
          </div>

          {/* Time Distribution By Subject */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.9rem' }}>Focus Time by Subject</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.values(courseMinutes).map((item) => {
                const percent = Math.round((item.minutes / totalCourseMins) * 100);
                return (
                  <div key={item.code} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
                      <span style={{ fontWeight: 600 }}>{item.code}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.minutes} mins</span>
                    </div>
                    <div className="progress-track" style={{ height: '5px' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${item.minutes > 0 ? percent : 0}%`,
                          backgroundColor: item.color,
                          borderRadius: 'var(--radius-full)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievements / Badges */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Trophy size={16} style={{ color: 'var(--color-warning)' }} />
              <span>Milestone Badges</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
              {badges.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: b.unlocked ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                    opacity: b.unlocked ? 1 : 0.45
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{b.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
