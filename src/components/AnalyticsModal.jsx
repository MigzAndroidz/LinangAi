import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BarChart3,
  Zap,
  Flame,
  Clock,
  CheckCircle2,
  Trophy,
  Sparkles,
  Award,
  TrendingUp,
  Target,
  Lightbulb,
  AlertTriangle,
  Loader2,
  Info
} from 'lucide-react';
import { computeCognitiveInsights } from '../services/insightsEngine';
import { AIService } from '../services/aiService';
import { COGNITIVE_SKILLS } from '../data/initialData';

export const AnalyticsModal = ({
  isOpen,
  onClose,
  userStats = {},
  assignments = [],
  courses = [],
  currentProfile = null
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  // ─── Algorithmic Insights Computation ────────────────────────────────────────
  const insights = useMemo(() => {
    return computeCognitiveInsights(assignments, courses);
  }, [assignments, courses]);

  // Map skill id to human-readable metadata
  const skillMetaMap = useMemo(() => {
    return Object.fromEntries(COGNITIVE_SKILLS.map((s) => [s.id, s]));
  }, []);

  // ─── Fetch Grounded AI Recommendations ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingRecs(true);

    AIService.getActionableRecommendations(insights, currentProfile)
      .then((recs) => {
        if (isMounted) {
          setRecommendations(Array.isArray(recs) ? recs : [recs]);
          setIsLoadingRecs(false);
        }
      })
      .catch((err) => {
        console.warn('Recommendation fetch failed:', err);
        if (isMounted) {
          setRecommendations(AIService.offlineActionableRecommendations(insights, currentProfile));
          setIsLoadingRecs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, insights, currentProfile]);

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

  // Milestone Badges
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

  // Combine Growth Areas and Friction Points with distinction tags
  const combinedGrowthAndFriction = useMemo(() => {
    const map = new Map();

    insights.growthAreas.forEach((item) => {
      map.set(item.skill, {
        ...item,
        isGrowth: true,
        isFriction: false
      });
    });

    insights.frictionPoints.forEach((item) => {
      if (map.has(item.skill)) {
        const existing = map.get(item.skill);
        existing.isFriction = true;
      } else {
        map.set(item.skill, {
          ...item,
          isGrowth: false,
          isFriction: true
        });
      }
    });

    return Array.from(map.values());
  }, [insights]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Study Analytics & Cognitive Mastery</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Real-time study metrics and algorithmic diagnosis
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-icon" style={{ width: '36px', height: '36px' }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Key Stat Cards (Responsive Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            <div className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
              <Zap size={18} style={{ color: 'var(--color-success)', margin: '0 auto 0.25rem auto' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{userStats.xp || 0}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total XP</span>
            </div>

            <div className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
              <Flame size={18} style={{ color: '#ea580c', margin: '0 auto 0.25rem auto' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{userStats.streak || 0} d</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active Streak</span>
            </div>

            <div className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
              <Clock size={18} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.25rem auto' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{userStats.totalFocusMinutes || 0} m</div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                Level {currentLevel} — {userStats.levelTitle || 'Novice'}
              </span>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                {currentXP} / {nextLevelXP} XP ({levelProgressPercent}%)
              </span>
            </div>
            <div className="progress-track" style={{ height: '8px', margin: 0 }}>
              <div className="progress-fill" style={{ width: `${levelProgressPercent}%` }} />
            </div>
          </div>

          {/* Time Distribution By Subject */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.9rem', margin: 0 }}>Focus Time by Subject</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.values(courseMinutes).map((item) => {
                const percent = Math.round((item.minutes / totalCourseMins) * 100);
                return (
                  <div key={item.code} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
                      <span style={{ fontWeight: 600 }}>{item.code}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.minutes} mins</span>
                    </div>
                    <div className="progress-track" style={{ height: '5px', margin: 0 }}>
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
            <h4 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
              <Trophy size={16} style={{ color: 'var(--color-warning)' }} />
              <span>Milestone Badges</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
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

          {/* ========================================================================= */}
          {/* 1. Identified Strengths (Superpowers) — Algorithmic */}
          {/* ========================================================================= */}
          <div className="card" style={{ borderLeft: '4px solid var(--color-good)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
              <h4 style={{ fontSize: '0.925rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--text-primary)' }}>
                <Sparkles size={16} style={{ color: 'var(--color-good)' }} />
                <span>Identified Strengths (Superpowers)</span>
              </h4>
              <span className="urgency-pill good" style={{ fontSize: '0.72rem' }}>
                Algorithmic Diagnosis
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Cognitive skills where you consistently maintain high self-assessed confidence (≥ 4.0/5) with low friction.
            </p>

            {insights.strengths.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {insights.strengths.map((item) => {
                  const meta = skillMetaMap[item.skill];
                  const label = meta ? meta.name : item.skill.replace(/_/g, ' ');
                  const icon = meta ? meta.icon : '✨';
                  return (
                    <div
                      key={item.skill}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 700 }}>{label}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Based on {item.sampleSize} verified tasks
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-good)' }}>
                          ★ {item.avgConfidence} / 5 Confidence
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Info size={15} />
                <span>Log and complete more tagged homework tasks to compute strength mastery milestones (minimum 2 tasks per skill required).</span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 2. Growth Areas & Friction Points — Algorithmic */}
          {/* ========================================================================= */}
          <div className="card" style={{ borderLeft: '4px solid var(--color-warning)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
              <h4 style={{ fontSize: '0.925rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--text-primary)' }}>
                <TrendingUp size={16} style={{ color: 'var(--color-warning)' }} />
                <span>Growth Areas & Friction Points</span>
              </h4>
              <span className="urgency-pill soon" style={{ fontSize: '0.72rem' }}>
                Focus Targets
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Constructive growth areas identified from lower confidence ratings or disproportionate time investment.
            </p>

            {combinedGrowthAndFriction.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {combinedGrowthAndFriction.map((item) => {
                  const meta = skillMetaMap[item.skill];
                  const label = meta ? meta.name : item.skill.replace(/_/g, ' ');
                  const icon = meta ? meta.icon : '🎯';

                  let badgeText = 'Growth Area';
                  let badgeClass = 'urgency-pill soon';
                  if (item.isGrowth && item.isFriction) {
                    badgeText = 'Growth & Friction';
                    badgeClass = 'urgency-pill soon';
                  } else if (item.isFriction) {
                    badgeText = 'Time Friction';
                    badgeClass = 'urgency-pill soon';
                  }

                  return (
                    <div
                      key={item.skill}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 700 }}>{label}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Avg Focus: {Math.round(item.avgFocusMinutes)}m · Challenge Rate: {Math.round(item.challengeFlagRate * 100)}%
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={badgeClass} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                          {badgeText}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning-text)' }}>
                          {item.avgConfidence} / 5 Conf
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Info size={15} />
                <span>No severe friction points detected. As you log challenging homework assignments, areas for improvement will appear here.</span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. Actionable AI Study Recommendations (Grounded strictly in data) */}
          {/* ========================================================================= */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
              <h4 style={{ fontSize: '0.925rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--text-primary)' }}>
                <Lightbulb size={16} style={{ color: 'var(--accent-primary)' }} />
                <span>Actionable AI Study Recommendations</span>
              </h4>
              <span className="course-badge" style={{ background: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' }}>
                Grounded in Real Stats
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Targeted study techniques synthesized specifically from your logged performance metrics.
            </p>

            {isLoadingRecs ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Synthesizing personalized study recommendations...</span>
              </div>
            ) : recommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.825rem',
                      lineHeight: 1.45,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {rec}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Log a few more tagged assignments to receive algorithmic study recommendations.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
