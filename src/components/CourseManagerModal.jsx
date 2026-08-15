import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, GraduationCap, Palette } from 'lucide-react';

export const CourseManagerModal = ({
  isOpen,
  onClose,
  courses,
  onSaveCourses
}) => {
  const [editingCourse, setEditingCourse] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [instructor, setInstructor] = useState('');
  const [schedule, setSchedule] = useState('');

  const colorPalette = [
    '#2563eb', // Blue
    '#d97706', // Amber
    '#059669', // Emerald
    '#9333ea', // Purple
    '#dc2626', // Red
    '#0891b2', // Cyan
    '#ea580c', // Orange
    '#4f46e5'  // Indigo
  ];

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingCourse({ id: `course-${Date.now()}` });
    setName('');
    setCode('');
    setColor(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
    setInstructor('');
    setSchedule('');
  };

  const handleStartEdit = (c) => {
    setEditingCourse(c);
    setName(c.name);
    setCode(c.code);
    setColor(c.color || '#2563eb');
    setInstructor(c.instructor || '');
    setSchedule(c.schedule || '');
  };

  const handleSaveCurrent = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const isNew = !courses.some((c) => c.id === editingCourse.id);
    const updatedCourse = {
      id: editingCourse.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      color,
      instructor: instructor.trim(),
      schedule: schedule.trim()
    };

    let nextList;
    if (isNew) {
      nextList = [...courses, updatedCourse];
    } else {
      nextList = courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
    }

    onSaveCourses(nextList);
    setEditingCourse(null);
  };

  const handleDeleteCourse = (id) => {
    if (courses.length <= 1) {
      alert('You must have at least one course.');
      return;
    }
    const nextList = courses.filter((c) => c.id !== id);
    onSaveCourses(nextList);
    if (editingCourse?.id === id) setEditingCourse(null);
  };

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
              <GraduationCap size={18} />
            </div>
            <h3>Manage Subjects & Courses</h3>
          </div>
          <button onClick={onClose} className="btn btn-icon" style={{ width: '36px', height: '36px' }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {editingCourse ? (
            <form onSubmit={handleSaveCurrent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. CS 250"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Color Theme</label>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                    {colorPalette.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          cursor: 'pointer',
                          border: color === c ? '2px solid white' : '2px solid transparent',
                          boxShadow: color === c ? '0 0 0 2px var(--accent-primary)' : 'none',
                          padding: 0
                        }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Course Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Instructor / Professor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. Turing"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Meeting Schedule</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mon, Wed 10:00 AM"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditingCourse(null)} className="btn btn-subtle">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Course
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Active Courses ({courses.length})
                </span>
                <button onClick={handleStartAdd} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                  <Plus size={14} />
                  <span>Add New Course</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {courses.map((course) => (
                  <div
                    key={course.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '4px',
                          backgroundColor: course.color
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{course.code}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>— {course.name}</span>
                        </div>
                        {course.instructor && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {course.instructor} • {course.schedule}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleStartEdit(course)}
                        className="btn btn-icon"
                        style={{ width: '34px', height: '34px' }}
                        title="Edit course"
                        aria-label="Edit course"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="btn btn-icon"
                        style={{ width: '34px', height: '34px', color: 'var(--color-danger)' }}
                        title="Delete course"
                        aria-label="Delete course"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
