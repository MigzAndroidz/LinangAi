import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, Play, Coffee, CheckCircle, RefreshCw, Calendar } from 'lucide-react';
import { AIService } from '../services/aiService';

export const DailyScheduler = ({
  assignments,
  courses,
  onStartFocus
}) => {
  const [studyStart, setStudyStart] = useState('16:00');
  const [studyEnd, setStudyEnd] = useState('21:30');
  const [scheduleBlocks, setScheduleBlocks] = useState([]);

  const activeAssignments = assignments.filter((a) => a.status !== 'completed');

  const generateSchedule = () => {
    const blocks = AIService.generateDailyStudyPlan(assignments, courses, studyStart, studyEnd);
    setScheduleBlocks(blocks);
  };

  useEffect(() => {
    generateSchedule();
  }, [assignments, courses]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>AI Daily Study Time-Blocker</span>
          </h3>
          <p style={{ fontSize: '0.85rem' }}>
            AI analyzes your homework deadlines and generates a balanced chronological schedule with built-in rest breaks.
          </p>
        </div>

        {/* Study Window Inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>From</span>
            <input
              type="time"
              className="form-input"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              value={studyStart}
              onChange={(e) => setStudyStart(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>To</span>
            <input
              type="time"
              className="form-input"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              value={studyEnd}
              onChange={(e) => setStudyEnd(e.target.value)}
            />
          </div>

          <button onClick={generateSchedule} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            <RefreshCw size={13} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Schedule Timeline Blocks */}
      {scheduleBlocks.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {scheduleBlocks.map((block) => {
            const isBreak = block.type === 'break';
            const matchedAssignment = assignments.find((a) => a.id === block.taskId);

            if (isBreak) {
              return (
                <div
                  key={block.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 1rem',
                    background: 'var(--bg-subtle)',
                    border: '1px dashed var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.825rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Coffee size={15} style={{ color: 'var(--color-warning)' }} />
                    <span style={{ fontWeight: 600 }}>{block.title}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem' }}>
                    {block.timeWindow} ({block.durationMins}m)
                  </span>
                </div>
              );
            }

            return (
              <div
                key={block.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '4px',
                      alignSelf: 'stretch',
                      borderRadius: '4px',
                      backgroundColor: block.courseColor
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span
                        className="course-badge"
                        style={{
                          backgroundColor: `${block.courseColor}18`,
                          color: block.courseColor,
                          border: `1px solid ${block.courseColor}35`
                        }}
                      >
                        {block.courseCode}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {block.title}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      🎯 <strong>Focus Goal:</strong> {block.milestoneGoal}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem' }}>
                      {block.timeWindow}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {block.durationMins} mins focus
                    </span>
                  </div>

                  {matchedAssignment && (
                    <button
                      onClick={() => onStartFocus(matchedAssignment)}
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                      title="Launch Pomodoro Focus Timer for this task"
                    >
                      <Play size={13} />
                      <span>Start Session</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <CheckCircle size={32} style={{ margin: '0 auto 0.5rem auto', color: 'var(--color-success)' }} />
          <p>No active tasks to schedule for today. You're all clear!</p>
        </div>
      )}
    </div>
  );
};
