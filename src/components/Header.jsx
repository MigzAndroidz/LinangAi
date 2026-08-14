import React, { useState } from 'react';
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
  User,
  CheckCircle2,
  ChevronDown,
  BrainCircuit
} from 'lucide-react';

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

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand with New Mascot Logo */}
        <div
          className="brand-section"
          onClick={() => onViewChange('tasks')}
          style={{ cursor: 'pointer' }}
          title="StudyMind AI Dashboard"
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              border: '2px solid var(--accent-primary-border)',
              background: 'white'
            }}
          >
            <img
              src="/mascot.png"
              alt="StudyMind Owl Mascot"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <div className="brand-title">
              Linang<span>.ai</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Your Academic Companion
            </div>
          </div>
        </div>

        {/* Status Indicators & Profile Dropdown */}
        <div className="header-status-group">
          {/* User Account / Profile Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="btn btn-subtle"
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
              title="Switch user account or edit profile"
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: currentProfile?.color || '#2563eb',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem'
                }}
              >
                {currentProfile?.avatar || '🦉'}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{currentProfile?.name}</span>
              <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  marginTop: '6px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xl)',
                  minWidth: '220px',
                  zIndex: 100,
                  padding: '0.5rem 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem'
                }}
              >
                <div style={{ padding: '0.4rem 0.85rem', fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Switch Student Account
                </div>

                {profiles.map((p) => {
                  const isCur = p.id === currentProfile.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSwitchProfile(p.id);
                        setShowProfileMenu(false);
                      }}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span>{p.avatar}</span>
                        <span>{p.name}</span>
                      </div>
                      {isCur && <CheckCircle2 size={13} />}
                    </button>
                  );
                })}

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.35rem 0' }} />

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onViewChange('profile');
                  }}
                  className="btn"
                  style={{ justifyContent: 'flex-start', padding: '0.45rem 0.85rem', fontSize: '0.8rem', width: '100%' }}
                >
                  <BrainCircuit size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>Cognitive Diagnosis & Mastery</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenCreateAccount();
                  }}
                  className="btn"
                  style={{ justifyContent: 'flex-start', padding: '0.45rem 0.85rem', fontSize: '0.8rem', width: '100%', color: 'var(--accent-primary)' }}
                >
                  <Plus size={14} />
                  <span>+ Create New Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Streak Counter */}
          <div className="stat-pill streak" title={`${userStats.streak} day consecutive study streak!`}>
            <Flame size={16} />
            <span>{userStats.streak}d Streak</span>
          </div>

          {/* XP & Level */}
          <div className="stat-pill xp" title={`Level ${userStats.level} (${userStats.levelTitle}) — Total ${userStats.xp} XP`}>
            <Zap size={15} />
            <span>Lv.{userStats.level}</span>
            <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>({userStats.xp} XP)</span>
          </div>

          {/* Proactive Notification Permission Button */}
          {notificationPermission !== 'granted' ? (
            <button
              onClick={onRequestNotificationPermission}
              className="btn btn-subtle"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem', color: 'var(--color-warning-text)' }}
              title="Click to enable desktop alerts for upcoming homework deadlines"
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

        {/* Actions & Navigation */}
        <div className="header-actions">
          {/* Main Navigation Tabs */}
          <div className="nav-tabs" style={{ padding: '0.2rem' }}>
            <button
              className={`tab-btn ${activeView === 'tasks' ? 'active' : ''}`}
              onClick={() => onViewChange('tasks')}
              title="Homework List & Milestones"
            >
              <BookOpen size={15} />
              <span>Tasks</span>
            </button>
            <button
              className={`tab-btn ${activeView === 'profile' ? 'active' : ''}`}
              onClick={() => onViewChange('profile')}
              title="User Account, Summary, Weaknesses & Strengths"
            >
              <BrainCircuit size={15} />
              <span>Mastery & Profile</span>
            </button>
            <button
              className={`tab-btn ${activeView === 'schedule' ? 'active' : ''}`}
              onClick={() => onViewChange('schedule')}
              title="AI Daily Time-Blocker"
            >
              <Clock size={15} />
              <span>Schedule</span>
            </button>
            <button
              className={`tab-btn ${activeView === 'calendar' ? 'active' : ''}`}
              onClick={() => onViewChange('calendar')}
              title="Calendar & .ICS Export"
            >
              <Calendar size={15} />
              <span>Calendar</span>
            </button>
          </div>

          {/* Primary Add Homework CTA */}
          <button onClick={onOpenAddModal} className="btn btn-primary" title="Add homework manually or paste text for instant AI extraction">
            <Plus size={16} />
            <span>Add Homework</span>
          </button>

          {/* Analytics */}
          <button onClick={onOpenAnalytics} className="btn btn-icon" title="Study Analytics & Stats">
            <BarChart3 size={17} />
          </button>

          {/* Settings */}
          <button onClick={onOpenSettings} className="btn btn-icon" title="Settings, API Key & Reminders">
            <Settings size={17} />
          </button>

          {/* Theme Toggle */}
          <button onClick={onToggleTheme} className="btn btn-icon" title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
};
