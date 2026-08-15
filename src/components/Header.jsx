import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Zap,
  Bell,
  BellRing,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  Plus,
  Moon,
  Sun,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  BrainCircuit,
  Menu,
  X
} from 'lucide-react';
import { Avatar } from './Avatar';

export const Header = ({
  currentProfile,
  profiles,
  onSwitchProfile,
  onOpenCreateAccount,
  userStats,
  notificationPermission,
  onRequestNotificationPermission,
  theme,
  onToggleTheme,
  activeView,
  onViewChange,
  onOpenAddModal,
  onOpenSettings,
  onOpenAnalytics,
  onOpenCourses
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // Close menus on view change
  const handleViewChange = (view) => {
    onViewChange(view);
    setShowMobileMenu(false);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          {/* ── Brand ─────────────────────────────────────────── */}
          <div
            className="brand-section"
            onClick={() => handleViewChange('tasks')}
            style={{ cursor: 'pointer' }}
            title="Linang AI Dashboard"
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
                border: '2px solid var(--accent-primary-border)',
                background: 'white',
                flexShrink: 0
              }}
            >
              <img
                src="/mascot.png"
                alt="Linang AI Owl Mascot"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div className="brand-title">
                LinangAI
              </div>
              <div className="brand-subtitle">
                Your Academic Companion
              </div>
            </div>
          </div>

          {/* ── Desktop: Status pills + profile ───────────────── */}
          <div className="header-status-group desktop-only">
            {/* Profile dropdown */}
            <div style={{ position: 'relative' }} ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="btn btn-subtle"
                style={{ padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-full)', gap: '0.45rem' }}
                title="Switch user account or edit profile"
              >
                <Avatar
                  avatar={currentProfile?.avatar || '🦉'}
                  size={22}
                  backgroundColor={currentProfile?.color || '#2563eb'}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentProfile?.name}
                </span>
                <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </button>

              {showProfileMenu && (
                <ProfileDropdown
                  profiles={profiles}
                  currentProfile={currentProfile}
                  onSwitchProfile={(id) => { onSwitchProfile(id); setShowProfileMenu(false); }}
                  onViewChange={(v) => { handleViewChange(v); setShowProfileMenu(false); }}
                  onOpenCreateAccount={() => { setShowProfileMenu(false); onOpenCreateAccount(); }}
                  style={{ left: 0 }}
                />
              )}
            </div>

            {/* Streak */}
            <div className="stat-pill streak" title={`${userStats.streak} day streak`}>
              <Flame size={15} />
              <span>{userStats.streak}d</span>
            </div>

            {/* XP */}
            <div className="stat-pill xp" title={`Level ${userStats.level} — ${userStats.xp} XP`}>
              <Zap size={14} />
              <span>Lv.{userStats.level}</span>
              <span className="xp-text" style={{ opacity: 0.7, fontSize: '0.75rem' }}>({userStats.xp} XP)</span>
            </div>

            {/* Notification toggle */}
            {notificationPermission !== 'granted' ? (
              <button
                onClick={onRequestNotificationPermission}
                className="btn btn-subtle"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem', color: 'var(--color-warning-text)' }}
                title="Enable desktop alerts for upcoming homework deadlines"
              >
                <BellRing size={14} style={{ color: 'var(--color-warning)' }} />
                <span>Enable Alerts</span>
              </button>
            ) : (
              <div
                className="stat-pill"
                style={{ background: 'var(--color-success-subtle)', borderColor: 'var(--color-success-border)', color: 'var(--color-success-text)' }}
                title="Proactive homework reminders are active"
              >
                <Bell size={13} />
                <span>Alerts On</span>
              </div>
            )}
          </div>

          {/* ── Desktop: Nav tabs + action buttons ────────────── */}
          <div className="header-actions desktop-only">
            <div className="nav-tabs header-nav-tabs">
              <button className={`tab-btn ${activeView === 'tasks' ? 'active' : ''}`} onClick={() => handleViewChange('tasks')}>
                <BookOpen size={14} /><span>Tasks</span>
              </button>
              <button className={`tab-btn ${activeView === 'profile' ? 'active' : ''}`} onClick={() => handleViewChange('profile')}>
                <BrainCircuit size={14} /><span>Mastery</span>
              </button>
              <button className={`tab-btn ${activeView === 'schedule' ? 'active' : ''}`} onClick={() => handleViewChange('schedule')}>
                <Clock size={14} /><span>Schedule</span>
              </button>
              <button className={`tab-btn ${activeView === 'calendar' ? 'active' : ''}`} onClick={() => handleViewChange('calendar')}>
                <Calendar size={14} /><span>Calendar</span>
              </button>
            </div>

            <button onClick={onOpenAddModal} className="btn btn-primary" title="Add homework">
              <Plus size={16} /><span>Add Homework</span>
            </button>
            <button onClick={onOpenAnalytics} className="btn btn-icon" title="Study Analytics"><BarChart3 size={17} /></button>
            <button onClick={onOpenSettings} className="btn btn-icon" title="Settings"><Settings size={17} /></button>
            <button onClick={onToggleTheme} className="btn btn-icon" title="Toggle theme">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>

          {/* ── Mobile: compact right group ────────────────────── */}
          <div className="mobile-only" style={{ alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
            {/* Profile avatar pill */}
            <div style={{ position: 'relative' }} ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="btn btn-subtle"
                style={{ padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-full)', gap: '0.35rem' }}
                aria-label="Profile menu"
              >
                <Avatar
                  avatar={currentProfile?.avatar || '🦉'}
                  size={26}
                  backgroundColor={currentProfile?.color || '#2563eb'}
                />
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              </button>

              {showProfileMenu && (
                <ProfileDropdown
                  profiles={profiles}
                  currentProfile={currentProfile}
                  onSwitchProfile={(id) => { onSwitchProfile(id); setShowProfileMenu(false); }}
                  onViewChange={(v) => { handleViewChange(v); setShowProfileMenu(false); }}
                  onOpenCreateAccount={() => { setShowProfileMenu(false); onOpenCreateAccount(); }}
                  style={{ right: 0, left: 'auto' }}
                />
              )}
            </div>

            {/* Theme toggle */}
            <button onClick={onToggleTheme} className="btn btn-icon" title="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Hamburger */}
            <button
              className="hamburger-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Open menu"
            >
              {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* ── Mobile slide-down menu ─────────────────────────── */}
        {showMobileMenu && (
          <div
            ref={mobileMenuRef}
            style={{
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            {/* Quick stat row */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0 0.25rem' }}>
              <div className="stat-pill streak" style={{ flex: 1, justifyContent: 'center' }}>
                <Flame size={14} /><span>{userStats.streak}d Streak</span>
              </div>
              <div className="stat-pill xp" style={{ flex: 1, justifyContent: 'center' }}>
                <Zap size={14} /><span>Lv.{userStats.level} · {userStats.xp} XP</span>
              </div>
            </div>

            {/* Action buttons */}
            <button onClick={() => { onOpenAddModal(); setShowMobileMenu(false); }} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={16} /> Add Homework
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button onClick={() => { onOpenAnalytics(); setShowMobileMenu(false); }} className="btn btn-subtle" style={{ justifyContent: 'center' }}>
                <BarChart3 size={15} /> Analytics
              </button>
              <button onClick={() => { onOpenSettings(); setShowMobileMenu(false); }} className="btn btn-subtle" style={{ justifyContent: 'center' }}>
                <Settings size={15} /> Settings
              </button>
            </div>
            {notificationPermission !== 'granted' && (
              <button
                onClick={() => { onRequestNotificationPermission(); setShowMobileMenu(false); }}
                className="btn btn-subtle"
                style={{ width: '100%', justifyContent: 'center', color: 'var(--color-warning-text)' }}
              >
                <BellRing size={14} style={{ color: 'var(--color-warning)' }} /> Enable Homework Alerts
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── Mobile Bottom Navigation Bar ─────────────────────── */}
      <nav className="mobile-nav" aria-label="Main navigation">
        <div className="mobile-nav-inner">
          <button
            className={`mobile-nav-btn ${activeView === 'tasks' ? 'active' : ''}`}
            onClick={() => handleViewChange('tasks')}
          >
            <BookOpen size={20} />
            <span>Tasks</span>
          </button>
          <button
            className={`mobile-nav-btn ${activeView === 'schedule' ? 'active' : ''}`}
            onClick={() => handleViewChange('schedule')}
          >
            <Clock size={20} />
            <span>Schedule</span>
          </button>
          {/* Central FAB-style Add button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button
              className="mobile-nav-btn add-btn"
              onClick={onOpenAddModal}
              title="Add Homework"
              aria-label="Add Homework"
            >
              <Plus size={22} />
            </button>
          </div>
          <button
            className={`mobile-nav-btn ${activeView === 'calendar' ? 'active' : ''}`}
            onClick={() => handleViewChange('calendar')}
          >
            <Calendar size={20} />
            <span>Calendar</span>
          </button>
          <button
            className={`mobile-nav-btn ${activeView === 'profile' ? 'active' : ''}`}
            onClick={() => handleViewChange('profile')}
          >
            <BrainCircuit size={20} />
            <span>Mastery</span>
          </button>
        </div>
      </nav>
    </>
  );
};

// ── Shared Profile Dropdown ────────────────────────────────────────────────
function ProfileDropdown({ profiles, currentProfile, onSwitchProfile, onViewChange, onOpenCreateAccount, style }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        marginTop: '6px',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-xl)',
        minWidth: '220px',
        zIndex: 200,
        padding: '0.5rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.15rem',
        ...style
      }}
    >
      <div style={{ padding: '0.35rem 0.85rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Switch Account
      </div>

      {profiles.map((p) => {
        const isCur = p.id === currentProfile?.id;
        return (
          <button
            key={p.id}
            onClick={() => onSwitchProfile(p.id)}
            className="btn"
            style={{
              justifyContent: 'space-between',
              padding: '0.45rem 0.85rem',
              fontSize: '0.825rem',
              width: '100%',
              background: isCur ? 'var(--accent-primary-subtle)' : 'transparent',
              color: isCur ? 'var(--accent-primary)' : 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Avatar avatar={p.avatar} size={22} backgroundColor={p.color || '#2563eb'} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{p.name}</span>
            </div>
            {isCur && <CheckCircle2 size={13} />}
          </button>
        );
      })}

      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.35rem 0' }} />

      <button
        onClick={() => onViewChange('profile')}
        className="btn"
        style={{ justifyContent: 'flex-start', padding: '0.45rem 0.85rem', fontSize: '0.8rem', width: '100%' }}
      >
        <BrainCircuit size={14} style={{ color: 'var(--accent-primary)' }} />
        <span>Mastery & Profile</span>
      </button>

      <button
        onClick={onOpenCreateAccount}
        className="btn"
        style={{ justifyContent: 'flex-start', padding: '0.45rem 0.85rem', fontSize: '0.8rem', width: '100%', color: 'var(--accent-primary)' }}
      >
        <Plus size={14} />
        <span>Create New Account</span>
      </button>
    </div>
  );
}
