import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Upload, RotateCcw, AlertCircle } from 'lucide-react';
import { Avatar } from './Avatar';

export const AccountModal = ({
  isOpen,
  onClose,
  onSave,
  profileToEdit = null,
  isOnboarding = false    // true on first-run: hides X/Cancel, shows welcome copy
}) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [avatar, setAvatar] = useState('🦉');
  const [color, setColor] = useState('#2563eb');
  const [year, setYear] = useState('Sophomore');
  const [major, setMajor] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [bio, setBio] = useState('');
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef(null);

  const avatarOptions = ['🦉', '🦊', '🚀', '🧠', '🔬', '🎓', '⚡', '💻', '📚', '🌟'];
  const colorOptions = ['#2563eb', '#059669', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#ea580c', '#4f46e5'];

  const isCustomPhoto = typeof avatar === 'string' && avatar.startsWith('data:image');

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
      setMajor('');
      setTargetGoal('');
      setBio('');
    }
    setUploadError('');
  }, [profileToEdit, isOpen]);

  if (!isOpen) return null;

  // During onboarding the modal must not be dismissable
  const handleBackdropClick = () => {
    if (!isOnboarding) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isOnboarding) onClose();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = '';

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    // Validate size (max 2MB)
    const MAX_SIZE_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError('Image size must be under 2MB.');
      return;
    }

    setUploadError('');

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const targetSize = 256;
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          // Center crop to square
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setAvatar(dataUrl);
        } catch {
          setUploadError('Failed to process image. Please try another photo.');
        }
      };
      img.onerror = () => {
        setUploadError('Unable to load image file.');
      };
      img.src = uploadEvent.target.result;
    };
    reader.onerror = () => {
      setUploadError('Failed to read selected image.');
    };
    reader.readAsDataURL(file);
  };

  const handleResetToEmoji = () => {
    setAvatar('🦉');
    setUploadError('');
  };

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

    // Only call onClose for non-onboarding edits; onboarding is handled by App
    if (!isOnboarding) onClose();
  };

  // ---- Onboarding header copy vs. normal edit/create copy ----
  const headerTitle = isOnboarding
    ? 'Welcome to Linang AI 🦉'
    : profileToEdit
    ? 'Edit Student Profile'
    : 'Create New Student Account';

  const headerSubtitle = isOnboarding
    ? 'Create your profile to get started — your data stays 100% local on your device.'
    : null;

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={isOnboarding ? { maxWidth: '520px' } : undefined}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Avatar
                avatar={avatar}
                size={34}
                borderRadius="var(--radius-md)"
                backgroundColor={color}
              />
              <h3 style={{ margin: 0 }}>{headerTitle}</h3>
            </div>
            {headerSubtitle && (
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '0.25rem' }}>
                {headerSubtitle}
              </p>
            )}
          </div>

          {/* X button is hidden during onboarding */}
          {!isOnboarding && (
            <button onClick={onClose} className="btn btn-icon" style={{ width: '36px', height: '36px' }} aria-label="Close">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form id="profile-form" onSubmit={handleSubmit} className="modal-body">
          {/* Avatar & Color Picker */}
          <div className="form-grid-2">
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label">Avatar</label>
                {isCustomPhoto && (
                  <button
                    type="button"
                    onClick={handleResetToEmoji}
                    className="btn btn-subtle"
                    style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', minHeight: 'auto', gap: '0.3rem' }}
                    title="Remove custom photo and use emoji"
                  >
                    <RotateCcw size={11} />
                    <span>Reset to Emoji</span>
                  </button>
                )}
              </div>

              {/* Emoji Options + Custom Photo Upload Button */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {avatarOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { setAvatar(emoji); setUploadError(''); }}
                    className="btn"
                    style={{
                      width: '36px',
                      height: '36px',
                      fontSize: '1.1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: avatar === emoji ? 'var(--accent-primary-subtle)' : 'var(--bg-subtle)',
                      border: avatar === emoji ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      padding: 0
                    }}
                    title={`Select ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}

                {/* Upload Photo Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn"
                  style={{
                    height: '36px',
                    padding: '0 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isCustomPhoto ? 'var(--accent-primary-subtle)' : 'var(--bg-subtle)',
                    border: isCustomPhoto ? '2px solid var(--accent-primary)' : '1px dashed var(--border-strong)',
                    color: isCustomPhoto ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    gap: '0.35rem'
                  }}
                  title="Upload a custom profile photo (JPEG/PNG/WebP under 2MB)"
                >
                  <Upload size={14} />
                  <span>{isCustomPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              </div>

              {/* Upload Error Banner */}
              {uploadError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-danger-text)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  <AlertCircle size={13} />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Profile Accent Color</label>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      cursor: 'pointer',
                      border: color === c ? '2px solid white' : '2px solid transparent',
                      boxShadow: color === c ? '0 0 0 2px var(--accent-primary)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                    title={`Color ${c}`}
                  >
                    {color === c && <Check size={14} color="white" />}
                  </button>
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
                placeholder="e.g. Maria Santos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={isOnboarding}
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

        {/* Footer — Cancel hidden during onboarding */}
        <div className="modal-footer">
          {!isOnboarding && (
            <button type="button" onClick={onClose} className="btn btn-subtle">
              Cancel
            </button>
          )}
          <button type="submit" form="profile-form" className="btn btn-primary">
            {isOnboarding ? 'Get Started 🚀' : profileToEdit ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
