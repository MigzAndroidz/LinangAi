import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Trash2, Calendar, Clock, BookOpen, AlertCircle, Loader2, BrainCircuit, Star, AlertTriangle } from 'lucide-react';
import { AIService } from '../services/aiService';
import { COGNITIVE_SKILLS } from '../data/initialData';

export const AddAssignmentModal = ({
  isOpen,
  onClose,
  onSave,
  courses,
  initialAssignment = null
}) => {
  const [tab, setTab] = useState('ai_paste');
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || 'course-1');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [difficulty, setDifficulty] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [selectedSkills, setSelectedSkills] = useState(['problem_decomp']);
  const [isChallengeArea, setIsChallengeArea] = useState(false);
  const [reflection, setReflection] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [milestones, setMilestones] = useState([
    { id: 'm-1', title: 'Review lecture notes & assignment requirements', completed: false },
    { id: 'm-2', title: 'Complete first section / drafting', completed: false },
    { id: 'm-3', title: 'Review answers and submit to portal', completed: false }
  ]);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [reminderOffsets, setReminderOffsets] = useState([1440, 180, 60, 15]);

  useEffect(() => {
    if (initialAssignment) {
      setTitle(initialAssignment.title || '');
      setCourseId(initialAssignment.courseId || courses[0]?.id || 'course-1');
      if (initialAssignment.dueDate) {
        const d = new Date(initialAssignment.dueDate);
        setDueDate(d.toISOString().slice(0, 10));
        setDueTime(d.toTimeString().slice(0, 5));
      }
      setEstimatedMinutes(initialAssignment.estimatedMinutes || 60);
      setDifficulty(initialAssignment.difficulty || 3);
      setConfidence(initialAssignment.confidence || 3);
      setSelectedSkills(initialAssignment.skills || ['problem_decomp']);
      setIsChallengeArea(initialAssignment.isChallengeArea ?? (initialAssignment.confidence <= 2));
      setReflection(initialAssignment.reflection || '');
      setPriority(initialAssignment.priority || 'medium');
      setDescription(initialAssignment.description || '');
      setMilestones(initialAssignment.milestones || []);
      setReminderOffsets(initialAssignment.reminderOffsets || [1440, 180, 60, 15]);
      setTab('manual');
    } else {
      const target = new Date();
      target.setDate(target.getDate() + 2);
      setDueDate(target.toISOString().slice(0, 10));
      setDueTime('17:00');
      setTitle('');
      setDescription('');
      setRawText('');
      setConfidence(3);
      setSelectedSkills(['problem_decomp']);
      setIsChallengeArea(false);
      setReflection('');
      setTab('ai_paste');
    }
  }, [initialAssignment, isOpen, courses]);

  if (!isOpen) return null;

  const handleAIParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await AIService.parseAssignmentText(rawText, courses);
      setTitle(parsed.title || '');
      if (parsed.courseId) setCourseId(parsed.courseId);
      if (parsed.dueDate) {
        const d = new Date(parsed.dueDate);
        setDueDate(d.toISOString().slice(0, 10));
        setDueTime(d.toTimeString().slice(0, 5));
      }
      setEstimatedMinutes(parsed.estimatedMinutes || 60);
      setDifficulty(parsed.difficulty || 3);
      setConfidence(parsed.confidence || 3);
      if (parsed.skills) setSelectedSkills(parsed.skills);
      setIsChallengeArea(parsed.isChallengeArea ?? (parsed.confidence <= 2));
      setDescription(parsed.notes || '');
      if (parsed.milestones && parsed.milestones.length > 0) {
        setMilestones(
          parsed.milestones.map((m, idx) => ({
            id: m.id || `m-${Date.now()}-${idx}`,
            title: m.title || m,
            completed: false
          }))
        );
      }
      setTab('manual');
    } catch (err) {
      console.error('AI Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      if (selectedSkills.length > 1) {
        setSelectedSkills(selectedSkills.filter((s) => s !== skillId));
      }
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;
    setMilestones([
      ...milestones,
      { id: `m-${Date.now()}`, title: newMilestoneText.trim(), completed: false }
    ]);
    setNewMilestoneText('');
  };

  const handleRemoveMilestone = (id) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalDueDate;
    if (dueDate) {
      const [h, m] = dueTime.split(':').map(Number);
      const d = new Date(dueDate);
      d.setHours(h || 17, m || 0, 0, 0);
      finalDueDate = d.toISOString();
    } else {
      finalDueDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    }

    const payload = {
      id: initialAssignment ? initialAssignment.id : `hw-${Date.now()}`,
      title: title.trim(),
      courseId,
      dueDate: finalDueDate,
      estimatedMinutes: Number(estimatedMinutes) || 60,
      difficulty: Number(difficulty) || 3,
      confidence: Number(confidence) || 3,
      skills: selectedSkills,
      isChallengeArea: isChallengeArea || confidence <= 2,
      reflection: reflection.trim(),
      priority,
      status: initialAssignment ? initialAssignment.status : 'todo',
      description: description.trim(),
      milestones,
      reminderOffsets,
      notifiedOffsets: initialAssignment?.notifiedOffsets || [],
      focusMinutesSpent: initialAssignment?.focusMinutesSpent || 0
    };

    onSave(payload);
    onClose();
  };

  const samplePrompts = [
    'Calculus 201 Problem Set 6 on Eigenvalues & Matrix Inverses (pg 180 #1-15). Due this Friday at 5:00 PM. Takes about 2 hours.',
    'CS 250 Binary Tree Balancing Project due next Monday at 11:59 PM. High difficulty, need to write unit tests and submit code zip.',
    'World History Essay Draft on the Industrial Revolution due in 3 days at midnight. Need 4 primary citations.'
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
              <Sparkles size={18} />
            </div>
            <h3>{initialAssignment ? 'Edit Homework Assignment' : 'Add Homework Assignment'}</h3>
          </div>
          <button onClick={onClose} className="btn btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        {!initialAssignment && (
          <div style={{ padding: '0.85rem 1.5rem 0 1.5rem' }}>
            <div className="nav-tabs">
              <button
                className={`tab-btn ${tab === 'ai_paste' ? 'active' : ''}`}
                onClick={() => setTab('ai_paste')}
                type="button"
              >
                <Sparkles size={14} />
                <span>AI Smart Ingest / Paste</span>
              </button>
              <button
                className={`tab-btn ${tab === 'manual' ? 'active' : ''}`}
                onClick={() => setTab('manual')}
                type="button"
              >
                <BookOpen size={14} />
                <span>Manual Fields & Cognitive Tags</span>
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="modal-body">
          {tab === 'ai_paste' && !initialAssignment ? (
            <div className="ai-smart-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                <Sparkles size={16} />
                <span>Paste Assignment Brief, Email, or Syllabus Note</span>
              </div>
              <p style={{ fontSize: '0.825rem' }}>
                StudyMind AI will automatically extract the course, deadlines, difficulty score, and generate sub-task milestones for you.
              </p>

              <textarea
                className="form-textarea"
                rows={4}
                placeholder="e.g. Read Campbell Bio chapter 5 pages 100-115 and do practice questions 1 to 10. Due Friday at 5:00 PM. Takes about 90 mins."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Or try a sample preset:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {samplePrompts.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRawText(preset)}
                      className="btn btn-subtle"
                      style={{ fontSize: '0.775rem', textAlign: 'left', justifyContent: 'flex-start', padding: '0.35rem 0.65rem' }}
                    >
                      💡 {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleAIParse}
                  disabled={isParsing || !rawText.trim()}
                  className="btn btn-primary"
                >
                  {isParsing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Parsing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Extract & Auto-Fill Form</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form id="assignment-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Title */}
              <div className="form-group">
                <label className="form-label">Assignment Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g., Problem Set 5: Eigenvalues & Matrix Inverses"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Course & Priority */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Subject / Course</label>
                  <select
                    className="form-select"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="high">🔴 High Urgency</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Time */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Due Time</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Cognitive Skills Tagger */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BrainCircuit size={15} style={{ color: 'var(--accent-primary)' }} />
                  <span>Cognitive Skill Dimensions (Select relevant skills)</span>
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {COGNITIVE_SKILLS.map((sk) => {
                    const isSelected = selectedSkills.includes(sk.id);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => toggleSkill(sk.id)}
                        className="btn"
                        style={{
                          fontSize: '0.775rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: isSelected ? 'var(--accent-primary-subtle)' : 'var(--bg-subtle)',
                          borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'
                        }}
                      >
                        <span>{sk.icon}</span>
                        <span>{sk.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confidence & Growth Challenge Toggles */}
              <div className="card" style={{ background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Self-Assessed Confidence: <strong>{confidence}/5</strong>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: confidence <= 2 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {confidence === 1 ? '⚠️ Very Shaky' : confidence === 2 ? '⚠️ Moderate Friction' : confidence === 3 ? 'Neutral / Standard' : confidence === 4 ? 'Confident' : '⭐ Mastered'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={confidence}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setConfidence(val);
                    if (val <= 2) setIsChallengeArea(true);
                  }}
                  style={{ accentColor: 'var(--accent-primary)' }}
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isChallengeArea || confidence <= 2}
                    onChange={(e) => setIsChallengeArea(e.target.checked)}
                  />
                  <span>Mark as a <strong>Known Growth / Challenge Area</strong> (Tutor will provide extra scaffolding)</span>
                </label>
              </div>

              {/* Reflection Notes */}
              <div className="form-group">
                <label className="form-label">Self-Reflection / Friction Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Struggled with eigenvalue null-spaces, nailed the rotation pointer logic..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </div>

              {/* Estimated Time & Difficulty */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Estimated Duration (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    step="5"
                    className="form-input"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Difficulty Rating (1 to 5)</label>
                  <select
                    className="form-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                  >
                    <option value="1">⭐ 1 - Quick & Easy</option>
                    <option value="2">⭐⭐ 2 - Straightforward</option>
                    <option value="3">⭐⭐⭐ 3 - Moderate</option>
                    <option value="4">⭐⭐⭐⭐ 4 - Challenging</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 - Heavy / Exam Level</option>
                  </select>
                </div>
              </div>

              {/* Instructions & Notes */}
              <div className="form-group">
                <label className="form-label">Instructions & Rubric Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Cite 3 academic papers, textbook page 104..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Milestones / Subtasks */}
              <div className="form-group">
                <label className="form-label">Sub-task Milestones</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-subtle)',
                        padding: '0.45rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span>• {m.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(m.id)}
                        style={{ color: 'var(--color-danger)', padding: '2px', background: 'none' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Add next sub-task milestone..."
                    value={newMilestoneText}
                    onChange={(e) => setNewMilestoneText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMilestone();
                      }
                    }}
                  />
                  <button type="button" onClick={handleAddMilestone} className="btn btn-secondary">
                    <Plus size={15} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-subtle">
            Cancel
          </button>
          {tab === 'manual' && (
            <button type="submit" form="assignment-form" className="btn btn-primary">
              {initialAssignment ? 'Save Changes' : 'Create Homework Task'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
