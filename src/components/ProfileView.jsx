import React, { useState, useMemo } from 'react';
import {
  User,
  Sparkles,
  Zap,
  Target,
  Flame,
  Clock,
  BookOpen,
  Edit3,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  GraduationCap
} from 'lucide-react';
import { AIService } from '../services/aiService';
import { COGNITIVE_SKILLS } from '../data/initialData';
import { Avatar } from './Avatar';

export const ProfileView = ({
  currentProfile,
  profiles,
  onSwitchProfile,
  onOpenCreateAccount,
  onOpenEditProfile,
  assignments,
  courses,
  userStats,
  onOpenTutor
}) => {
  const [activeSubTab, setActiveSubTab] = useState('diagnosis'); // 'diagnosis' | 'matrix' | 'reflections'

  const courseMap = useMemo(() => {
    return Object.fromEntries(courses.map((c) => [c.id, c]));
  }, [courses]);

  // Generate AI diagnosis
  const diagnosis = useMemo(() => {
    return AIService.generateCognitiveDiagnosis(currentProfile, assignments, courses);
  }, [currentProfile, assignments, courses]);

  const completedCount = assignments.filter((a) => a.status === 'completed').length;
  const challengeCount = assignments.filter((a) => a.isChallengeArea || (a.confidence && a.confidence <= 2)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profile Header & Account Switcher Hero Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-subtle) 100%)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative'
        }}
      >
        {/* Top: Profiles Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Active Student Account:
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {profiles.map((p) => {
                const isActive = p.id === currentProfile.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSwitchProfile(p.id)}
                    className="btn"
                    style={{
                      padding: '0.3rem 0.7rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.775rem',
                      background: isActive ? 'var(--accent-primary)' : 'var(--bg-surface)',
                      color: isActive ? 'white' : 'var(--text-primary)',
                      border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-strong)',
                      boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                      gap: '0.4rem',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    <Avatar avatar={p.avatar} size={18} backgroundColor={p.color || '#2563eb'} />
                    <span>{p.name}</span>
                    {isActive && <CheckCircle2 size={12} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onOpenCreateAccount}
              className="btn btn-secondary"
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
            >
              <Plus size={13} />
              <span>New Account</span>
            </button>
            <button
              onClick={onOpenEditProfile}
              className="btn btn-subtle"
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
            >
              <Edit3 size={13} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Info Details */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Mascot / Avatar Ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                avatar={currentProfile.avatar || '🦉'}
                size={68}
                borderRadius="var(--radius-lg)"
                backgroundColor={currentProfile.color || '#2563eb'}
                style={{
                  boxShadow: 'var(--shadow-md)',
                  border: '3px solid var(--bg-surface)'
                }}
              />
              <img
                src="/mascot.png"
                alt="Mascot"
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  right: '-6px',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: '2px solid var(--bg-surface)',
                  background: 'white'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{currentProfile.name}</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentProfile.handle}</span>
                <span
                  className="course-badge"
                  style={{ backgroundColor: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' }}
                >
                  {currentProfile.year}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <GraduationCap size={15} style={{ color: 'var(--accent-primary)' }} />
                <span><strong>Major:</strong> {currentProfile.major}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.85rem', color: 'var(--color-warning-text)' }}>
                <Target size={14} style={{ color: 'var(--color-warning)' }} />
                <span><strong>Academic Target:</strong> {currentProfile.targetGoal}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '0.75rem 1rem', textAlign: 'center', minWidth: '100px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Mastery Index</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{diagnosis.overallScore}/100</div>
            </div>
            <div className="card" style={{ padding: '0.75rem 1rem', textAlign: 'center', minWidth: '100px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total XP</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-success)' }}>{userStats.xp} ⚡</div>
            </div>
            <div className="card" style={{ padding: '0.75rem 1rem', textAlign: 'center', minWidth: '100px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Growth Tasks</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ea580c' }}>{challengeCount} 🎯</div>
            </div>
          </div>
        </div>

        {currentProfile.bio && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.6rem' }}>
            "{currentProfile.bio}"
          </p>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="nav-tabs">
        <button
          className={`tab-btn ${activeSubTab === 'diagnosis' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('diagnosis')}
        >
          🧠 AI Cognitive Strengths & Weaknesses
        </button>
        <button
          className={`tab-btn ${activeSubTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('matrix')}
        >
          📊 Cognitive Skills Mastery Matrix
        </button>
        <button
          className={`tab-btn ${activeSubTab === 'reflections' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('reflections')}
        >
          📝 Task Reflection Logs ({assignments.length})
        </button>
      </div>

      {/* Sub-Tab 1: AI Cognitive Diagnosis */}
      {activeSubTab === 'diagnosis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Dual Columns: Strengths vs Weaknesses */}
          <div className="profile-grid">
            {/* Strengths (Superpowers) */}
            <div className="card" style={{ borderLeft: '4px solid var(--color-success)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={18} style={{ color: 'var(--color-success)' }} />
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Identified Strengths (Superpowers)</h3>
                </div>
                <span className="urgency-pill good">High Proficiency</span>
              </div>

              <p style={{ fontSize: '0.825rem' }}>
                Cognitive areas where you consistently demonstrate high self-assessed confidence and swift milestone completion.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {diagnosis.strengths.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.875rem' }}>
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        {item.masteryScore}% Mastery
                      </span>
                    </div>
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      💡 {item.evidence}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses / Growth Areas */}
            <div className="card" style={{ borderLeft: '4px solid var(--color-warning)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Growth Areas & Friction Points</h3>
                </div>
                <span className="urgency-pill soon">Target for Review</span>
              </div>

              <p style={{ fontSize: '0.825rem' }}>
                Topics and task types with lower confidence scores, time friction, or requested AI tutor support.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {diagnosis.weaknesses.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.875rem' }}>
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning-text)' }}>
                        {item.avgConfidence}/5 Confidence
                      </span>
                    </div>
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      🎯 {item.evidence}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actionable AI Study Prescriptions */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lightbulb size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Actionable AI Study Recommendations</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {diagnosis.prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.6rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span className="course-badge" style={{ backgroundColor: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' }}>
                        {rx.targetCourse}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{rx.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rx.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Cognitive Skills Mastery Matrix */}
      {activeSubTab === 'matrix' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Cognitive Skills Mastery Matrix</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Real-time mastery index computed from your homework confidence logs, milestone completions, and difficulty ratings.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {diagnosis.skillStats.map((skill) => (
              <div
                key={skill.id}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{skill.icon}</span>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{skill.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>({skill.category})</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem' }}>
                    <span>Tasks: <strong>{skill.totalTasks}</strong></span>
                    <span>Avg Confidence: <strong>{skill.avgConfidence}/5</strong></span>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{skill.masteryScore}% Mastery</span>
                  </div>
                </div>

                <div className="progress-track" style={{ height: '6px', margin: '4px 0 0 0' }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${skill.masteryScore}%`,
                      backgroundColor: skill.masteryScore >= 80 ? 'var(--color-success)' : skill.masteryScore >= 60 ? 'var(--accent-primary)' : 'var(--color-warning)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Task Reflections Log */}
      {activeSubTab === 'reflections' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Task-Specific Reflections & Confidence Logs</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Historical log of your confidence ratings, identified friction points, and self-assessments on every assignment.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {assignments.map((hw) => {
              const course = courseMap[hw.courseId];
              const isChallenge = hw.isChallengeArea || (hw.confidence && hw.confidence <= 2);

              return (
                <div
                  key={hw.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {course && (
                        <span className="course-badge" style={{ backgroundColor: `${course.color}18`, color: course.color }}>
                          {course.code}
                        </span>
                      )}
                      <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>{hw.title}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`urgency-pill ${isChallenge ? 'soon' : 'good'}`}>
                        {isChallenge ? '🎯 Growth Challenge' : '⭐ Strong Area'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Confidence: {hw.confidence || 3}/5
                      </span>
                      <button
                        onClick={() => onOpenTutor(hw)}
                        className="btn btn-subtle"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      >
                        Ask Tutor
                      </button>
                    </div>
                  </div>

                  {hw.reflection ? (
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      📝 <strong>Reflection:</strong> {hw.reflection}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No reflection note logged yet.
                    </div>
                  )}

                  {hw.skills && hw.skills.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {hw.skills.map((sId) => {
                        const sk = COGNITIVE_SKILLS.find((s) => s.id === sId);
                        return (
                          <span
                            key={sId}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'var(--bg-subtle)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)'
                            }}
                          >
                            {sk?.icon || '🏷️'} {sk?.name || sId}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
