import React, { useState, useEffect } from 'react';
import { X, User, Sparkles, GraduationCap, Target, Heart, Check } from 'lucide-react';

export const AccountModal = ({
  isOpen,
  onClose,
  onSave,
  profileToEdit = null
}) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [avatar, setAvatar] = useState('🦉');
  const [color, setColor] = useState('#2563eb');
  const [year, setYear] = useState('Sophomore');
  const [major, setMajor] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [bio, setBio] = useState('');

  const avatarOptions = ['🦉', '🦊', '🚀', '🧠', '🔬', '🎓', '⚡', '💻', '📚', '🌟'];
  const colorOptions = ['#2563eb', '#059669', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#ea580c', '#4f46e5'];

  useEffect(() => {
    if (profileToEdit) {
      setName(profileToEdit.name || '');
      setHandle(profileToEdit.handle || '');
      setAvatar(profileToEdit.avatar || '🦉');
      setColor(profileToEdit.color || '#2563eb');
      setYear(profileToEdit.year || 'Sophomore');
      setMajor(profileToEdit.major || '');
      setTargetGoal(profileToEdit.targetGoal || '');
      setBio(profileToEdit.bio || '');
    } else {
      setName('');
      setHandle(`@student_${Math.floor(Math.random() * 1000)}`);
      setAvatar('🦉');
      setColor('#2563eb');
      setYear('Freshman');
      setMajor('Computer Science');
      setTargetGoal('3.8+ GPA • Dean\'s List');
      setBio('Organizing my academic journey with Linang AI.');
    }
  }, [profileToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: profileToEdit ? profileToEdit.id : undefined,
      name: name.trim(),
      handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      avatar,
      color,
      year,
      major: major.trim() || 'Undeclared',
      targetGoal: targetGoal.trim() || 'Academic Excellence',
      bio: bio.trim()
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}
            >
              {avatar}
            </div>
            <h3>{profileToEdit ? 'Edit Student Profile' : 'Create New Student Account'}</h3>
          </div>
          <button onClick={onClose} className="btn btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form id="profile-form" onSubmit={handleSubmit} className="modal-body">
          {/* Avatar & Color Picker */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Choose Avatar Icon</label>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {avatarOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className="btn"
                    style={{
                      width: '34px',
                      height: '34px',
                      fontSize: '1.1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: avatar === emoji ? 'var(--accent-primary-subtle)' : 'var(--bg-subtle)',
                      border: avatar === emoji ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      padding: 0
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Profile Accent Color</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                {colorOptions.map((c) => (
                  <div
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      cursor: 'pointer',
                      border: color === c ? '2px solid white' : '2px solid transparent',
                      boxShadow: color === c ? '0 0 0 2px var(--accent-primary)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {color === c && <Check size={14} color="white" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Handle */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Handle / Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="@username"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>
          </div>

          {/* Major & Year */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Major / Field of Study</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Computer Science & Math"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <select className="form-select" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate / PhD">Graduate / PhD</option>
                <option value="Independent Scholar">Independent Scholar</option>
              </select>
            </div>
          </div>

          {/* Target Academic Goal */}
          <div className="form-group">
            <label className="form-label">Academic Target & Aspirations</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 3.9 GPA • Dean's List • Graduate School Prep"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
            />
          </div>

          {/* Bio */}
          <div className="form-group">
            <label className="form-label">Student Bio / Focus</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="A few words about your study focus and interests..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-subtle">
            Cancel
          </button>
          <button type="submit" form="profile-form" className="btn btn-primary">
            {profileToEdit ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
