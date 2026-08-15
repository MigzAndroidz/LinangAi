import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DailyBriefingBanner } from './components/DailyBriefingBanner';
import { AssignmentList } from './components/AssignmentList';
import { FocusTimer } from './components/FocusTimer';
import { DailyScheduler } from './components/DailyScheduler';
import { CalendarView } from './components/CalendarView';
import { ProfileView } from './components/ProfileView';
import { AddAssignmentModal } from './components/AddAssignmentModal';
import { AITutorDrawer } from './components/AITutorDrawer';
import { CourseManagerModal } from './components/CourseManagerModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { SettingsModal } from './components/SettingsModal';
import { AccountModal } from './components/AccountModal';
import { ToastContainer } from './components/ToastContainer';

import { StorageService } from './services/storage';
import { notificationService } from './services/notificationService';
import { audioService } from './services/audioService';
import { subscribeToPush } from './services/pushService';

export function App() {
  // Profiles State
  const [profiles, setProfiles] = useState([]);
  const [currentProfileId, setCurrentProfileId] = useState(() => StorageService.getCurrentProfileId());
  const [isInitialized, setIsInitialized] = useState(false);

  // Profile-Scoped Core Data
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [userStats, setUserStats] = useState({ xp: 0, level: 1, levelTitle: 'Novice', streak: 1, totalFocusMinutes: 0, completedHomeworkCount: 0 });
  const [settings, setSettings] = useState({ theme: 'light', soundVolume: 0.75, alertTone: 'chime', enableDesktopNotifications: true, enableAudioChimes: true });
  const [theme, setTheme] = useState('light');

  // Active Main View: 'tasks' | 'profile' | 'schedule' | 'calendar'
  const [activeView, setActiveView] = useState('tasks');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [tutorAssignment, setTutorAssignment] = useState(null);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState(null);

  // Focus Timer linked assignment
  const [selectedFocusAssignment, setSelectedFocusAssignment] = useState(null);

  // Floating in-app toasts
  const [toasts, setToasts] = useState([]);

  // Notification permission state
  const [notifPermission, setNotifPermission] = useState(() => notificationService.getPermissionState());

  const addToast = useCallback((toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper: Load all profile-scoped data from IndexedDB
  const loadProfileData = useCallback(async (profileId) => {
    if (!profileId) return;
    const [profCourses, profAssignments, profStats, profSettings] = await Promise.all([
      StorageService.getCourses(profileId),
      StorageService.getAssignments(profileId),
      StorageService.getUserStats(profileId),
      StorageService.getSettings(profileId)
    ]);

    setCourses(profCourses);
    setAssignments(profAssignments);
    setUserStats(profStats);
    setSettings(profSettings);
    
    // Apply this profile's preferred theme
    const userTheme = profSettings?.theme || 'light';
    setTheme(userTheme);
    document.documentElement.setAttribute('data-theme', userTheme);

    // Apply audio volume preference
    audioService.setMasterVolume(profSettings?.soundVolume ?? 0.75);
  }, []);

  // Initial Boot & Database Setup
  useEffect(() => {
    const bootstrap = async () => {
      try {
        await StorageService.init();
        const allProfiles = await StorageService.getProfiles();
        setProfiles(allProfiles);

        // Empty database — first-time user. Show onboarding modal immediately.
        if (allProfiles.length === 0) {
          setProfileToEdit(null);
          setIsAccountModalOpen(true);
          setIsInitialized(true);
          return;
        }

        const activeId = StorageService.getCurrentProfileId();
        const validId = allProfiles.some((p) => p.id === activeId)
          ? activeId
          : allProfiles[0].id;

        setCurrentProfileId(validId);
        StorageService.setCurrentProfileId(validId);

        await loadProfileData(validId);
      } catch (err) {
        console.error('Bootstrap error, recovering with defaults:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    bootstrap();
  }, [loadProfileData]);

  // Apply theme changes to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    const updated = { ...settings, theme: nextTheme };
    setSettings(updated);
    await StorageService.saveSettings(updated, currentProfileId);
  };

  // Start background reminder worker — restarts whenever the active profile changes
  useEffect(() => {
    if (!currentProfileId) return;

    const unsubscribe = notificationService.subscribe((event) => {
      addToast({
        title: event.title,
        message: event.message,
        type: 'reminder',
        urgency: event.urgency
      });
    });

    notificationService.startPeriodicCheck(
      currentProfileId,
      async (updatedAssignments) => {
        if (updatedAssignments) {
          setAssignments(updatedAssignments);
        }
      },
      30000
    );

    return () => {
      unsubscribe();
      notificationService.stopPeriodicCheck();
    };
  }, [addToast, currentProfileId]);

  const handleRequestNotifPermission = async () => {
    const res = await notificationService.requestPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      addToast({
        title: '🔔 Reminders Enabled',
        message: 'You will receive proactive notifications before homework deadlines!',
        type: 'success'
      });
      // Also subscribe to Web Push so reminders fire even when the tab is closed
      subscribeToPush(currentProfileId).catch((err) =>
        console.warn('[App] Push subscription failed (non-fatal):', err)
      );
    }
  };

  // Switch User Profile with Complete State Transition
  const handleSwitchProfile = async (newProfileId) => {
    if (newProfileId === currentProfileId) return;

    setCurrentProfileId(newProfileId);
    StorageService.setCurrentProfileId(newProfileId);
    setSelectedFocusAssignment(null); // Clear active task link across users

    await loadProfileData(newProfileId);

    const target = profiles.find((p) => p.id === newProfileId);
    addToast({
      title: 'Switched Account',
      message: `Loaded ${target?.name || 'Student Profile'} (${target?.avatar}) with personal courses, homework & settings.`,
      type: 'info'
    });
  };

  const handleSaveProfile = async (profileData) => {
    if (profileData.id) {
      // Update existing
      await StorageService.updateProfile(profileData);
      const updatedList = await StorageService.getProfiles();
      setProfiles(updatedList);
      addToast({ title: 'Profile Updated', message: `Saved changes to ${profileData.name}`, type: 'success' });
    } else {
      // Create new user profile with clean isolated defaults
      const created = await StorageService.createProfile(profileData);
      const updatedList = await StorageService.getProfiles();
      setProfiles(updatedList);
      setCurrentProfileId(created.id);
      await loadProfileData(created.id);
      addToast({ title: 'Account Created', message: `Welcome to Linang AI, ${created.name}! Your workspace is ready.`, type: 'success' });
    }
    setProfileToEdit(null);
    // Always close the modal after saving (covers the onboarding case too)
    setIsAccountModalOpen(false);
  };

  // XP progression helper
  const handleAddXP = async (amount, reason = '') => {
    const updated = await StorageService.addXP(amount, currentProfileId);
    setUserStats(updated);
    if (amount > 0) {
      addToast({
        title: `+${amount} XP Earned! ⚡`,
        message: reason || 'Keep up the fantastic momentum!',
        type: 'success'
      });
    }
  };

  // Toggle homework completion
  const handleToggleStatus = async (assignmentId) => {
    const updated = assignments.map((hw) => {
      if (hw.id === assignmentId) {
        const nextStatus = hw.status === 'completed' ? 'todo' : 'completed';
        if (nextStatus === 'completed') {
          handleAddXP(30, `Completed "${hw.title}"`);
          const updatedMilestones = (hw.milestones || []).map((m) => ({ ...m, completed: true }));
          return { ...hw, status: nextStatus, milestones: updatedMilestones };
        }
        return { ...hw, status: nextStatus };
      }
      return hw;
    });

    setAssignments(updated);
    await StorageService.saveAssignments(updated, currentProfileId);
  };

  // Toggle single milestone
  const handleToggleMilestone = async (assignmentId, milestoneId) => {
    const updated = assignments.map((hw) => {
      if (hw.id === assignmentId) {
        const updatedMilestones = (hw.milestones || []).map((m) => {
          if (m.id === milestoneId) {
            const nextCompleted = !m.completed;
            if (nextCompleted) {
              handleAddXP(10, `Completed milestone: ${m.title}`);
            }
            return { ...m, completed: nextCompleted };
          }
          return m;
        });

        const allDone = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.completed);
        return {
          ...hw,
          milestones: updatedMilestones,
          status: allDone ? 'completed' : hw.status === 'completed' ? 'in_progress' : hw.status
        };
      }
      return hw;
    });

    setAssignments(updated);
    await StorageService.saveAssignments(updated, currentProfileId);
  };

  // Save / Add / Edit assignment
  const handleSaveAssignment = async (assignmentData) => {
    const exists = assignments.some((a) => a.id === assignmentData.id);
    let updated;
    if (exists) {
      updated = assignments.map((a) => (a.id === assignmentData.id ? assignmentData : a));
      addToast({ title: 'Assignment Updated', message: `Saved changes to "${assignmentData.title}"`, type: 'success' });
    } else {
      updated = [assignmentData, ...assignments];
      handleAddXP(15, `Added new assignment "${assignmentData.title}"`);
    }

    setAssignments(updated);
    await StorageService.saveAssignments(updated, currentProfileId);
    setEditingAssignment(null);
  };

  const handleDeleteAssignment = async (id) => {
    const target = assignments.find((a) => a.id === id);
    const updated = assignments.filter((a) => a.id !== id);
    setAssignments(updated);
    await StorageService.deleteSingleAssignment(id);
    addToast({ title: 'Assignment Removed', message: `Deleted "${target?.title || 'Homework'}"`, type: 'info' });
  };

  const handleStartFocus = (assignment) => {
    setSelectedFocusAssignment(assignment);
    addToast({
      title: '🎯 Focus Session Selected',
      message: `Linked Pomodoro timer to "${assignment.title}". Let's get to work!`,
      type: 'info'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFocusSessionComplete = async ({ assignmentId, minutes, xpEarned }) => {
    if (minutes > 0) {
      if (assignmentId) {
        const updated = assignments.map((a) => {
          if (a.id === assignmentId) {
            return { ...a, focusMinutesSpent: (a.focusMinutesSpent || 0) + minutes };
          }
          return a;
        });
        setAssignments(updated);
        await StorageService.saveAssignments(updated, currentProfileId);
      }

      const stats = await StorageService.getUserStats(currentProfileId);
      stats.totalFocusMinutes = (stats.totalFocusMinutes || 0) + minutes;
      const savedStats = await StorageService.saveUserStats(stats, currentProfileId);
      setUserStats(savedStats);
      handleAddXP(xpEarned, `Completed ${minutes}-minute deep focus sprint!`);
    }
  };

  const handleOpenTutor = (assignment) => {
    setTutorAssignment(assignment);
    setIsTutorOpen(true);
  };

  const handleSaveCourses = async (newCourses) => {
    setCourses(newCourses);
    await StorageService.saveCourses(newCourses, currentProfileId);
    addToast({ title: 'Courses Updated', message: 'Subject list successfully saved.', type: 'success' });
  };

  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings, currentProfileId);
    addToast({ title: 'Preferences Saved', message: 'User settings have been updated.', type: 'success' });
  };

  const handleReloadAll = async () => {
    const allProfiles = await StorageService.getProfiles();
    setProfiles(allProfiles);
    await loadProfileData(currentProfileId);
  };

  const currentProfile = profiles.find((p) => p.id === currentProfileId) || profiles[0];
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-app)' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <img src="/mascot.png" alt="Linang Mascot" style={{ width: '64px', height: '64px', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Initializing Linang AI...</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Setting up secure local IndexedDB store</span>
        </div>
      </div>
    );
  }

  // Compute onboarding flag — true when there are no profiles yet
  const isOnboarding = profiles.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Only render the full app shell once a real profile exists */}
      {!isOnboarding && currentProfile && (
        <>
          <Header
            currentProfile={currentProfile}
            profiles={profiles}
            onSwitchProfile={handleSwitchProfile}
            onOpenCreateAccount={() => { setProfileToEdit(null); setIsAccountModalOpen(true); }}
            userStats={userStats}
            notificationPermission={notifPermission}
            onRequestNotificationPermission={handleRequestNotifPermission}
            theme={theme}
            onToggleTheme={toggleTheme}
            activeView={activeView}
            onViewChange={setActiveView}
            onOpenAddModal={() => { setEditingAssignment(null); setIsAddModalOpen(true); }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAnalytics={() => setIsAnalyticsOpen(true)}
            onOpenCourses={() => setIsCoursesOpen(true)}
          />
        </>
      )}

      {/* Main Container — hidden during onboarding */}
      {!isOnboarding && currentProfile && <main className="app-container">
        {/* Daily AI Briefing Banner */}
        {activeView !== 'profile' && (
          <DailyBriefingBanner
            assignments={assignments}
            courses={courses}
            onStartFocus={handleStartFocus}
            onOpenSchedule={() => setActiveView('schedule')}
          />
        )}

        {/* View Switcher: Tasks (with Focus Sidebar) OR Profile & Mastery OR Schedule OR Calendar */}
        {activeView === 'tasks' && (
          <div className="main-content-layout">
            <AssignmentList
              assignments={assignments}
              courses={courses}
              onToggleStatus={handleToggleStatus}
              onToggleMilestone={handleToggleMilestone}
              onOpenTutor={handleOpenTutor}
              onStartFocus={handleStartFocus}
              onEdit={(hw) => { setEditingAssignment(hw); setIsAddModalOpen(true); }}
              onDelete={handleDeleteAssignment}
              onOpenAddModal={() => { setEditingAssignment(null); setIsAddModalOpen(true); }}
              onPlayChime={(tone) => audioService.playReminderSound(tone)}
            />

            <aside className="sidebar-column">
              <FocusTimer
                assignments={assignments}
                courses={courses}
                selectedAssignment={selectedFocusAssignment}
                onSelectAssignment={setSelectedFocusAssignment}
                onSessionComplete={handleFocusSessionComplete}
              />

              {notifPermission !== 'granted' && (
                <div className="notification-banner-box">
                  <h4>⏰ Proactive Homework Alerts</h4>
                  <p>
                    Enable browser alerts so Linang AI can chime and remind you 24h, 3h, and 30m before assignments are due.
                  </p>
                  <button
                    onClick={handleRequestNotifPermission}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', alignSelf: 'flex-start' }}
                  >
                    Enable Notifications
                  </button>
                </div>
              )}
            </aside>
          </div>
        )}

        {activeView === 'profile' && (
          <ProfileView
            currentProfile={currentProfile}
            profiles={profiles}
            onSwitchProfile={handleSwitchProfile}
            onOpenCreateAccount={() => { setProfileToEdit(null); setIsAccountModalOpen(true); }}
            onOpenEditProfile={() => { setProfileToEdit(currentProfile); setIsAccountModalOpen(true); }}
            assignments={assignments}
            courses={courses}
            userStats={userStats}
            onOpenTutor={handleOpenTutor}
          />
        )}

        {activeView === 'schedule' && (
          <DailyScheduler
            assignments={assignments}
            courses={courses}
            onStartFocus={handleStartFocus}
          />
        )}

        {activeView === 'calendar' && (
          <CalendarView
            assignments={assignments}
            courses={courses}
            onOpenTutor={handleOpenTutor}
            onOpenAddModal={() => { setEditingAssignment(null); setIsAddModalOpen(true); }}
          />
        )}
      </main>}

      {/* Floating In-App Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Modals & Drawers */}
      <AddAssignmentModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingAssignment(null); }}
        onSave={handleSaveAssignment}
        courses={courses}
        initialAssignment={editingAssignment}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          // Cannot dismiss the modal during onboarding — a profile must be created
          if (isOnboarding) return;
          setIsAccountModalOpen(false);
          setProfileToEdit(null);
        }}
        onSave={handleSaveProfile}
        profileToEdit={profileToEdit}
        isOnboarding={isOnboarding}
      />

      <AITutorDrawer
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        assignment={tutorAssignment}
        course={tutorAssignment ? courseMap[tutorAssignment.courseId] : null}
        currentProfile={currentProfile}
        onAddXP={handleAddXP}
      />

      <CourseManagerModal
        isOpen={isCoursesOpen}
        onClose={() => setIsCoursesOpen(false)}
        courses={courses}
        onSaveCourses={handleSaveCourses}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        userStats={userStats}
        assignments={assignments}
        courses={courses}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onReloadData={handleReloadAll}
      />
    </div>
  );
}

export default App;
