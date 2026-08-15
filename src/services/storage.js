// IndexedDB & Local Storage Service for Linang AI with Strict Profile Isolation

import { db, initDatabase } from '../lib/db';
import {
  INITIAL_PROFILES,
  INITIAL_COURSES,
  INITIAL_ASSIGNMENTS,
  INITIAL_USER_STATS,
  INITIAL_SETTINGS
} from '../data/initialData';

const CURRENT_PROFILE_KEY = 'linang_active_profile_id_v2';

// ─── Server-side sync helper ─────────────────────────────────────────────────
// Fire-and-forget: after every local IndexedDB write, push a minimal summary
// of active assignments to /api/push/sync-assignments so the server-side cron
// can check reminder thresholds even when the browser tab is closed.
// A failed sync NEVER throws — it must never break local saves.
async function syncAssignmentsToServer(profileId, courseMap = {}) {
  try {
    const allAssignments = await db.assignments
      .where('profileId')
      .equals(profileId)
      .toArray();

    const minimal = allAssignments
      .filter((a) => a.status !== 'completed')
      .map((a) => ({
        id: a.id,
        title: a.title,
        // courseCode is resolved client-side from the courseMap passed in,
        // or from a cached field on the assignment itself
        courseCode: courseMap[a.courseId]?.code || a.courseCode || '',
        dueDate: a.dueDate,
        reminderOffsets: a.reminderOffsets || [1440, 180, 60, 15],
        status: a.status
      }));

    fetch('/api/push/sync-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, assignments: minimal })
    }).catch(() => {}); // truly fire-and-forget; ignore network failures
  } catch {
    // Non-fatal — local save already succeeded
  }
}

// Known identifiers for the old hardcoded demo seed profiles.
// We use both id AND handle so we never accidentally delete a real user
// who happened to pick the same id format.
const DEMO_PROFILES_TO_PURGE = [
  { id: 'prof-1', handle: '@arivera_cs' },
  { id: 'prof-2', handle: '@elena_bio' }
];
const MIGRATION_FLAG = 'linang_demo_migration_v1_done';

async function purgeDemoProfile(id) {
  await db.profiles.delete(id);
  await db.courses.where('profileId').equals(id).delete();
  await db.assignments.where('profileId').equals(id).delete();
  await db.userStats.delete(id);
  await db.userSettings.delete(id);
}

async function runDemoMigration() {
  // Only run once per browser session
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  let purged = 0;
  for (const { id, handle } of DEMO_PROFILES_TO_PURGE) {
    try {
      const existing = await db.profiles.get(id);
      // Guard: only delete if it really is the known demo profile
      if (existing && existing.handle === handle) {
        await purgeDemoProfile(id);
        purged++;
        console.info(`[Linang AI] Removed stale demo profile: ${existing.name} (${id})`);
      }
    } catch (e) {
      console.warn(`[Linang AI] Migration: could not check/purge ${id}:`, e);
    }
  }

  // Clear the stale active-profile pointer if it pointed at a purged profile
  if (purged > 0) {
    const activeId = localStorage.getItem(CURRENT_PROFILE_KEY);
    if (DEMO_PROFILES_TO_PURGE.some((p) => p.id === activeId)) {
      localStorage.removeItem(CURRENT_PROFILE_KEY);
    }
  }

  localStorage.setItem(MIGRATION_FLAG, '1');
}

export const StorageService = {
  init: async () => {
    try {
      // Step 1: Run the one-time migration to remove stale demo profiles
      await runDemoMigration();
      // Step 2: Initialise the DB schema (seeds demo data only in dev + flag)
      await initDatabase();
    } catch (e) {
      console.warn('StorageService.init non-fatal warning:', e);
    }
  },

  // ==========================================
  // Profile & Account Management
  // ==========================================
  getProfiles: async () => {
    try {
      const list = await db.profiles.toArray();
      // Return whatever is in the DB — including an empty array.
      // The onboarding flow in App.jsx handles the empty-array case.
      return list || [];
    } catch {
      return [];
    }
  },

  getCurrentProfileId: () => {
    try {
      return localStorage.getItem(CURRENT_PROFILE_KEY) || null;
    } catch {
      return null;
    }
  },

  setCurrentProfileId: (id) => {
    try {
      localStorage.setItem(CURRENT_PROFILE_KEY, id);
    } catch (e) {
      console.warn('Could not save current profile id to localStorage:', e);
    }
  },

  createProfile: async (profileData) => {
    const newId = `prof_${Date.now()}`;
    const newProfile = {
      id: newId,
      name: profileData.name || 'New Student',
      handle: profileData.handle || `@student_${Math.floor(Math.random() * 1000)}`,
      avatar: profileData.avatar || '🦉',
      color: profileData.color || '#2563eb',
      year: profileData.year || 'Freshman',
      major: profileData.major || 'Undeclared',
      targetGoal: profileData.targetGoal || 'Academic Excellence',
      bio: profileData.bio || '',
      createdAt: new Date().toISOString()
    };

    try {
      await db.profiles.put(newProfile);

      // Initialize stats at zero — no fake XP, streak, or pre-seeded courses.
      // Users earn everything from scratch.
      const defaultStats = {
        profileId: newId,
        xp: 0,
        level: 1,
        levelTitle: 'Novice',
        streak: 0,
        totalFocusMinutes: 0,
        completedHomeworkCount: 0,
        lastActiveDate: new Date().toISOString().slice(0, 10)
      };
      await db.userStats.put(defaultStats);

      // Initialize user preferences (required for app functionality)
      const defaultSettings = {
        profileId: newId,
        ...INITIAL_SETTINGS
      };
      await db.userSettings.put(defaultSettings);
    } catch (e) {
      console.warn('createProfile IndexedDB write error:', e);
    }

    StorageService.setCurrentProfileId(newId);
    return newProfile;
  },

  updateProfile: async (profileData) => {
    try {
      await db.profiles.put(profileData);
    } catch (e) {
      console.warn('updateProfile error:', e);
    }
    return profileData;
  },

  deleteProfile: async (id) => {
    try {
      const allProfiles = await db.profiles.toArray();
      if (allProfiles.length <= 1) return false;

      await db.profiles.delete(id);
      await db.courses.where('profileId').equals(id).delete();
      await db.assignments.where('profileId').equals(id).delete();
      await db.userStats.delete(id);
      await db.userSettings.delete(id);

      const remaining = await db.profiles.toArray();
      StorageService.setCurrentProfileId(remaining[0].id);
      return true;
    } catch {
      return false;
    }
  },

  // ==========================================
  // Courses (Strictly Scoped by profileId)
  // ==========================================
  getCourses: async (profileId) => {
    const targetId = profileId || StorageService.getCurrentProfileId();
    try {
      const list = await db.courses.where('profileId').equals(targetId).toArray();
      if (list && list.length > 0) return list;

      const defaults = INITIAL_COURSES.map((c) => ({ ...c, profileId: targetId }));
      await db.courses.bulkPut(defaults);
      return defaults;
    } catch {
      return INITIAL_COURSES.map((c) => ({ ...c, profileId: targetId }));
    }
  },

  saveCourses: async (courses, profileId) => {
    const targetId = profileId || StorageService.getCurrentProfileId();
    try {
      await db.courses.where('profileId').equals(targetId).delete();
      const withProfile = courses.map((c) => ({ ...c, profileId: targetId }));
      await db.courses.bulkPut(withProfile);
    } catch (e) {
      console.warn('saveCourses error:', e);
    }
  },

  // ==========================================
  // Assignments (Strictly Scoped by profileId)
  // ==========================================
  getAssignments: async (profileId) => {
    const targetId = profileId || StorageService.getCurrentProfileId();
    try {
      const list = await db.assignments.where('profileId').equals(targetId).toArray();
      if (list && list.length > 0) return list;

      // If Alex Rivera (prof-1) has no assignments yet, seed defaults
      if (targetId === INITIAL_PROFILES[0].id) {
        const defaults = INITIAL_ASSIGNMENTS.map((hw) => ({ ...hw, profileId: targetId, createdAt: new Date().toISOString() }));
        await db.assignments.bulkPut(defaults);
        return defaults;
      }
      return list || [];
    } catch {
      return [];
    }
  },

  saveAssignments: async (assignments, profileId) => {
    const targetId = profileId || StorageService.getCurrentProfileId();
    try {
      await db.assignments.where('profileId').equals(targetId).delete();
      const withProfile = assignments.map((a) => ({ ...a, profileId: targetId }));
      await db.assignments.bulkPut(withProfile);
      // Best-effort server sync for push reminders
      syncAssignmentsToServer(targetId);
    } catch (e) {
      console.warn('saveAssignments error:', e);
    }
  },

  saveSingleAssignment: async (assignment, profileId) => {
    const targetId = profileId || StorageService.getCurrentProfileId();
    try {
      const record = { ...assignment, profileId: targetId };
      await db.assignments.put(record);
      // Best-effort server sync for push reminders
      syncAssignmentsToServer(targetId);
    } catch (e) {
      console.warn('saveSingleAssignment error:', e);
    }
  },

  deleteSingleAssignment: async (id, profileId) => {
    const targetId = profileId || StorageService.getCurrentProfileId();
    try {
      await db.assignments.delete(id);
      // Best-effort server sync for push reminders
      syncAssignmentsToServer(targetId);
    } catch (e) {
      console.warn('deleteSingleAssignment error:', e);
    }
  },

  // ==========================================
  // User Stats & Streaks (Strictly Scoped by profileId)
  // ==========================================
  getUserStats: async (profileId) => {
    const targetId = profileId || StorageService.getCurrentProfileId();
    try {
      let stats = await db.userStats.get(targetId);
      if (!stats) {
        stats = {
          profileId: targetId,
          ...INITIAL_USER_STATS
        };
        await db.userStats.put(stats);
      }

      const today = new Date().toISOString().slice(0, 10);
      if (stats.lastActiveDate !== today) {
        const lastDate = new Date(stats.lastActiveDate);
        const currDate = new Date(today);
        const diffDays = Math.round((currDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          stats.streak += 1;
        } else if (diffDays > 1) {
          stats.streak = 1;
        }
        stats.lastActiveDate = today;
        await db.userStats.put(stats);
      }
      return stats;
    } catch {
      return { profileId: targetId, ...INITIAL_USER_STATS };
    }
  },

  saveUserStats: async (stats, profileId) => {
    const targetId = profileId || StorageService.getCurrentProfileId();
    try {
      const level = Math.floor((stats.xp || 0) / 150) + 1;
      const titles = ['Novice', 'Apprentice', 'Scholar', 'Researcher', 'Mastermind', 'Polymath', 'Grandmaster'];
      stats.level = level;
      stats.levelTitle = titles[Math.min(level - 1, titles.length - 1)];
      stats.profileId = targetId;

      await db.userStats.put(stats);
      return stats;
    } catch {
      return stats;
    }
  },

  addXP: async (amount, profileId) => {
    const targetId = profileId || StorageService.getCurrentProfileId();
    const stats = await StorageService.getUserStats(targetId);
    stats.xp = (stats.xp || 0) + amount;
    return await StorageService.saveUserStats(stats, targetId);
  },

  // ==========================================
  // User Settings & Preferences (Strictly Scoped by profileId)
  // ==========================================
  getSettings: async (profileId) => {
    const targetId = profileId || StorageService.getCurrentProfileId();
    try {
      let settings = await db.userSettings.get(targetId);
      if (!settings) {
        settings = {
          profileId: targetId,
          ...INITIAL_SETTINGS
        };
        await db.userSettings.put(settings);
      }
      return settings;
    } catch {
      return { profileId: targetId, ...INITIAL_SETTINGS };
    }
  },

  saveSettings: async (settings, profileId) => {
    const targetId = profileId || StorageService.getCurrentProfileId();
    try {
      const record = { ...settings, profileId: targetId };
      await db.userSettings.put(record);
      return record;
    } catch {
      return settings;
    }
  },

  // ==========================================
  // Full Database Backup & Restore
  // ==========================================
  exportBackupJSON: async () => {
    try {
      const profiles = await db.profiles.toArray();
      const courses = await db.courses.toArray();
      const assignments = await db.assignments.toArray();
      const stats = await db.userStats.toArray();
      const settings = await db.userSettings.toArray();

      const backup = {
        version: '3.0',
        system: 'LinangAI_LocalFirst',
        exportedAt: new Date().toISOString(),
        currentProfileId: StorageService.getCurrentProfileId(),
        profiles,
        courses,
        assignments,
        userStats: stats,
        userSettings: settings
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linang-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('exportBackupJSON error:', e);
    }
  },

  importBackupJSON: async (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profiles) {
        await db.profiles.clear();
        await db.profiles.bulkPut(parsed.profiles);
      }
      if (parsed.courses) {
        await db.courses.clear();
        await db.courses.bulkPut(parsed.courses);
      }
      if (parsed.assignments) {
        await db.assignments.clear();
        await db.assignments.bulkPut(parsed.assignments);
      }
      if (parsed.userStats) {
        await db.userStats.clear();
        await db.userStats.bulkPut(parsed.userStats);
      }
      if (parsed.userSettings) {
        await db.userSettings.clear();
        await db.userSettings.bulkPut(parsed.userSettings);
      }
      if (parsed.currentProfileId) {
        StorageService.setCurrentProfileId(parsed.currentProfileId);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  resetAllData: async () => {
    try {
      await db.profiles.clear();
      await db.courses.clear();
      await db.assignments.clear();
      await db.userStats.clear();
      await db.userSettings.clear();
      await initDatabase();
    } catch (e) {
      console.warn('resetAllData error:', e);
    }
  }
};
