import React, { useState } from 'react';
import {
  Check,
  Clock,
  Calendar,
  Sparkles,
  Bot,
  Play,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
  Edit2,
  Star,
  Bell,
  CheckCircle2,
  BrainCircuit,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { COGNITIVE_SKILLS } from '../data/initialData';

export const AssignmentCard = ({
  assignment,
  course,
  onToggleStatus,
  onToggleMilestone,
  onOpenTutor,
  onStartFocus,
  onEdit,
  onDelete,
  onPlayChime
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isCompleted = assignment.status === 'completed';
  const isChallenge = assignment.isChallengeArea || (assignment.confidence && assignment.confidence <= 2);

  const now = Date.now();
  const dueTime = new Date(assignment.dueDate).getTime();
  const diffMs = dueTime - now;
  const diffHours = diffMs / (1000 * 3600);

  let urgencyClass = 'good';
  let urgencyText = '';
  if (diffMs <= 0) {
    urgencyClass = 'urgent';
    urgencyText = '⚠️ Overdue';
  } else if (diffHours <= 12) {
    urgencyClass = 'urgent';
    urgencyText = `⏰ Due in ${Math.ceil(diffHours)}h`;
  } else if (diffHours <= 48) {
    urgencyClass = 'soon';
    urgencyText = `Due in ${Math.ceil(diffHours / 24)}d`;
  } else {
    urgencyClass = 'good';
    const dueObj = new Date(assignment.dueDate);
    urgencyText = `Due ${dueObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
  }

  const milestones = assignment.milestones || [];
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const progressPercent = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

  const handleCompleteClick = () => {
    if (!isCompleted) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      if (onPlayChime) onPlayChime('success');
    }
    onToggleStatus(assignment.id);
  };

  const formattedDueDate = new Date(assignment.dueDate).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div className={`assignment-card ${isCompleted ? 'completed' : ''}`}>
      <div className="assignment-card-header">
        <div className="assignment-main-info">
          {/* Checkbox */}
          <button
            onClick={handleCompleteClick}
            className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as completed (+30 XP)'}
          >
            {isCompleted && <Check size={14} strokeWidth={3} />}
          </button>

          <div style={{ flex: 1 }}>
            <div className="assignment-title-row">
              {course && (
                <span
                  className="course-badge"
                  style={{
                    backgroundColor: `${course.color}18`,
                    color: course.color,
                    border: `1px solid ${course.color}35`
                  }}
                >
                  {course.code}
                </span>
              )}
              <span className="assignment-title">{assignment.title}</span>
            </div>

            {assignment.description && (
              <p className="assignment-desc">{assignment.description}</p>
            )}

            {/* Cognitive Skills & Growth Badges */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              {isChallenge && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-warning-subtle)',
                    border: '1px solid var(--color-warning-border)',
                    color: 'var(--color-warning-text)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <AlertTriangle size={11} />
                  <span>Growth Area ({assignment.confidence || 2}/5)</span>
                </span>
              )}

              {assignment.skills && assignment.skills.map((sId) => {
                const sk = COGNITIVE_SKILLS.find((s) => s.id === sId);
                return (
                  <span
                    key={sId}
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <span>{sk?.icon || '🏷️'}</span>
                    <span>{sk?.name || sId}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Urgency Pill & Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isCompleted && (
            <span className={`urgency-pill ${urgencyClass}`}>{urgencyText}</span>
          )}
          {isCompleted && (
            <span className="urgency-pill good" style={{ color: 'var(--color-success-text)' }}>
              <CheckCircle2 size={13} /> Completed
            </span>
          )}

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn btn-icon"
              style={{ width: '28px', height: '28px' }}
              title="More options"
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 20,
                  minWidth: '130px',
                  padding: '0.35rem 0',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <button
                  onClick={() => { setShowMenu(false); onEdit(assignment); }}
                  className="btn"
                  style={{ justifyContent: 'flex-start', padding: '0.45rem 0.85rem', fontSize: '0.8rem', width: '100%' }}
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDelete(assignment.id); }}
                  className="btn"
                  style={{ justifyContent: 'flex-start', padding: '0.45rem 0.85rem', fontSize: '0.8rem', width: '100%', color: 'var(--color-danger)' }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Reflection Note */}
      {assignment.reflection && (
        <div style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border-strong)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          📝 <strong>Student Reflection:</strong> {assignment.reflection}
        </div>
      )}

      {/* Milestones Checklist Accordion */}
      {milestones.length > 0 && (
        <div className="milestones-wrapper">
          <div
            className="milestones-header"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <span>
              Milestones ({completedMilestones}/{milestones.length})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                {Math.round(progressPercent)}%
              </span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>

          <div className="progress-track">
            <div
              className={`progress-fill ${progressPercent === 100 ? 'done' : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {isExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
              {milestones.map((m) => (
                <label
                  key={m.id}
                  className={`milestone-item ${m.completed ? 'done' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={m.completed}
                      onChange={() => onToggleMilestone(assignment.id, m.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{m.title}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Card Meta & Bottom Actions */}
      <div className="assignment-card-meta">
        <div className="meta-tags-group">
          <div className="meta-item" title={`Due at ${formattedDueDate}`}>
            <Calendar size={13} />
            <span>{formattedDueDate}</span>
          </div>

          <div className="meta-item" title={`Estimated time: ${assignment.estimatedMinutes || 60} minutes`}>
            <Clock size={13} />
            <span>{assignment.estimatedMinutes || 60}m</span>
          </div>

          <div className="meta-item" title={`Difficulty level: ${assignment.difficulty || 3}/5`}>
            <Star size={13} style={{ fill: 'var(--color-warning)', color: 'var(--color-warning)' }} />
            <span>Diff {assignment.difficulty || 3}/5</span>
          </div>

          {assignment.focusMinutesSpent > 0 && (
            <div className="meta-item" style={{ color: 'var(--accent-primary)', fontWeight: 600 }} title="Focus time logged">
              <Play size={12} />
              <span>{assignment.focusMinutesSpent}m logged</span>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="assignment-actions-group">
          <button
            onClick={() => onOpenTutor(assignment)}
            className="btn btn-subtle"
            style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
            title="Open AI Socratic Tutor tailored to your task skills and growth areas"
          >
            <Bot size={14} style={{ color: isChallenge ? 'var(--color-warning)' : 'var(--accent-primary)' }} />
            <span>{isChallenge ? '🎯 Tutor Support' : 'AI Tutor'}</span>
          </button>

          {!isCompleted && (
            <button
              onClick={() => onStartFocus(assignment)}
              className="btn btn-subtle"
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
              title="Start Pomodoro Focus Timer for this assignment"
            >
              <Play size={13} style={{ color: 'var(--color-success)' }} />
              <span>Focus</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
