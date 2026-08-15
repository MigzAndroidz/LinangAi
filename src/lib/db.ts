// Dexie.js (IndexedDB) Schema & Types for Linang AI

import Dexie, { Table } from 'dexie';
import {
  INITIAL_PROFILES,
  INITIAL_COURSES,
  INITIAL_ASSIGNMENTS,
  INITIAL_USER_STATS,
  INITIAL_SETTINGS
} from '../data/initialData';

// --- TypeScript / JavaScript Schema Models ---
export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  color: string;
  year: string;
  major: string;
  targetGoal: string;
  bio: string;
  createdAt: string;
}

export interface Course {
  id: string;
  profileId: string;
  code: string;
  name: string;
  color: string;
  instructor: string;
  schedule: string;
}

export interface Assignment {
  id: string;
  profileId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  estimatedMinutes: number;
  difficulty: number;
  confidence: number;
  skills: string[];
  isChallengeArea: boolean;
  reflection: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed';
  notes: string;
  milestones: Array<{ id: string; title: string; completed: boolean }>;
  reminderOffsets: number[];
  notifiedOffsets: number[];
  focusMinutesSpent: number;
  createdAt: string;
}

export interface UserStats {
  profileId: string;
  xp: number;
  level: number;
  levelTitle: string;
  streak: number;
  totalFocusMinutes: number;
  completedHomeworkCount: number;
  lastActiveDate: string;
}

export interface UserSettings {
  profileId: string;
  theme: 'light' | 'dark';
  geminiApiKey: string;
  aiModel: string;
  enableDesktopNotifications: boolean;
  enableAudioChimes: boolean;
  alertTone: string;
  soundVolume: number;
  defaultReminderOffsets: number[];
  studyHoursStart: string;
  studyHoursEnd: string;
  customTimerMinutes?: number;
}

export interface DailyStatsSnapshot {
  id: string; // `${profileId}_${date}` e.g. "prof-abc_2026-08-15"
  profileId: string;
  date: string; // YYYY-MM-DD
  cumulativeXP: number;
  cumulativeFocusMinutes: number;
  cumulativeCompletedCount: number;
}

// --- Dexie Database Class ---
export class LinangDexieDB extends Dexie {
  profiles!: Table<UserProfile, string>;
  courses!: Table<Course, string>;
  assignments!: Table<Assignment, string>;
  userStats!: Table<UserStats, string>;
  userSettings!: Table<UserSettings, string>;
  dailySnapshots!: Table<DailyStatsSnapshot, string>;

  constructor() {
    super('LinangAI_IndexedDB');

    this.version(1).stores({
      profiles: '&id, name, handle, createdAt',
      courses: '&id, profileId, code, name',
      assignments: '&id, profileId, courseId, dueDate, status, priority, *skills',
      userStats: '&profileId',
      userSettings: '&profileId'
    });

    this.version(2).stores({
      profiles: '&id, name, handle, createdAt',
      courses: '&id, profileId, code, name',
      assignments: '&id, profileId, courseId, dueDate, status, priority, *skills',
      userStats: '&profileId',
      userSettings: '&profileId'
    });

    this.version(3).stores({
      profiles: '&id, name, handle, createdAt',
      courses: '&id, profileId, code, name',
      assignments: '&id, profileId, courseId, dueDate, status, priority, *skills',
      userStats: '&profileId',
      userSettings: '&profileId',
      dailySnapshots: '&id, profileId, date'
    });
  }
}

export const db = new LinangDexieDB();

// ---------------------------------------------------------------------------
// Seed demo data ONLY in local dev when VITE_SEED_DEMO_DATA=true.
// In production (Vercel) an empty DB is intentional — the onboarding modal
// guides the real user to create their first profile.
// ---------------------------------------------------------------------------
export async function initDatabase() {
  try {
    const profileCount = await db.profiles.count();

    const shouldSeedDemo =
      import.meta.env.DEV && import.meta.env.VITE_SEED_DEMO_DATA === 'true';

    if (profileCount === 0 && shouldSeedDemo) {
      // 1. Profiles
      await db.profiles.bulkPut(INITIAL_PROFILES);

      // 2. Courses — Alex Rivera (Profile 1)
      const alexCourses: Course[] = INITIAL_COURSES.map((c) => ({
        ...c,
        profileId: INITIAL_PROFILES[0].id
      }));

      // 3. Courses — Elena Rostova (Profile 2, Pre-Med / Bio)
      const elenaCourses: Course[] = [
        {
          id: 'elena-c1',
          profileId: INITIAL_PROFILES[1].id,
          name: 'Organic Chemistry II',
          code: 'CHEM 240',
          color: '#059669',
          instructor: 'Dr. Franklin',
          schedule: 'Mon, Wed 9:00 AM'
        },
        {
          id: 'elena-c2',
          profileId: INITIAL_PROFILES[1].id,
          name: 'Molecular Biology & Genetics',
          code: 'BIO 210',
          color: '#2563eb',
          instructor: 'Dr. Watson',
          schedule: 'Tue, Thu 11:00 AM'
        },
        {
          id: 'elena-c3',
          profileId: INITIAL_PROFILES[1].id,
          name: 'Biostatistics & Probability',
          code: 'STAT 150',
          color: '#d97706',
          instructor: 'Prof. Bayes',
          schedule: 'Mon, Wed, Fri 2:00 PM'
        }
      ];

      await db.courses.bulkPut([...alexCourses, ...elenaCourses]);

      // 4. Assignments — Alex Rivera
      const alexAssignments: Assignment[] = INITIAL_ASSIGNMENTS.map((hw) => ({
        ...hw,
        profileId: INITIAL_PROFILES[0].id,
        createdAt: new Date().toISOString()
      }));

      // 5. Assignments — Elena Rostova
      const now = Date.now();
      const elenaAssignments: Assignment[] = [
        {
          id: 'elena-hw1',
          profileId: INITIAL_PROFILES[1].id,
          courseId: 'elena-c1',
          title: 'Electrophilic Aromatic Substitution Reaction Mechanisms',
          description: 'Draw 6 resonance structures for benzene nitration and halogenation intermediate carbocations.',
          dueDate: new Date(now + 6 * 3600 * 1000).toISOString(),
          estimatedMinutes: 75,
          difficulty: 4,
          confidence: 3,
          skills: ['calculations', 'memorization'],
          isChallengeArea: true,
          reflection: 'Resonance structures require careful electron arrow-pushing notation.',
          priority: 'high',
          status: 'in_progress',
          notes: 'Review textbook chapter 14 figures.',
          milestones: [
            { id: 'el-m1', title: 'Draw bromination sigma complex', completed: true },
            { id: 'el-m2', title: 'Complete Friedel-Crafts alkylation problems', completed: false }
          ],
          reminderOffsets: [1440, 180, 60, 15],
          notifiedOffsets: [1440],
          focusMinutesSpent: 30,
          createdAt: new Date().toISOString()
        },
        {
          id: 'elena-hw2',
          profileId: INITIAL_PROFILES[1].id,
          courseId: 'elena-c2',
          title: 'Genetics Lab Report: CRISPR Cas9 Plasmid Transformation',
          description: 'Write up gel electrophoresis results and calculate transformation efficiency CFU/ug.',
          dueDate: new Date(now + 48 * 3600 * 1000).toISOString(),
          estimatedMinutes: 120,
          difficulty: 3,
          confidence: 5,
          skills: ['essay_synthesis', 'calculations'],
          isChallengeArea: false,
          reflection: 'Transformation efficiency calculations went very smoothly.',
          priority: 'medium',
          status: 'todo',
          notes: 'Include annotated gel image and control plate count.',
          milestones: [
            { id: 'el-m3', title: 'Calculate colony counts on LB/Amp plates', completed: false },
            { id: 'el-m4', title: 'Draft discussion and error analysis', completed: false }
          ],
          reminderOffsets: [1440, 180, 60],
          notifiedOffsets: [],
          focusMinutesSpent: 0,
          createdAt: new Date().toISOString()
        }
      ];

      await db.assignments.bulkPut([...alexAssignments, ...elenaAssignments]);

      // 6. User Stats
      await db.userStats.bulkPut([
        {
          profileId: INITIAL_PROFILES[0].id,
          xp: INITIAL_USER_STATS.xp,
          level: INITIAL_USER_STATS.level,
          levelTitle: INITIAL_USER_STATS.levelTitle,
          streak: INITIAL_USER_STATS.streak,
          totalFocusMinutes: INITIAL_USER_STATS.totalFocusMinutes,
          completedHomeworkCount: INITIAL_USER_STATS.completedHomeworkCount,
          lastActiveDate: new Date().toISOString().slice(0, 10)
        },
        {
          profileId: INITIAL_PROFILES[1].id,
          xp: 680,
          level: 4,
          levelTitle: 'Researcher',
          streak: 9,
          totalFocusMinutes: 380,
          completedHomeworkCount: 22,
          lastActiveDate: new Date().toISOString().slice(0, 10)
        }
      ]);

      // 7. Settings
      await db.userSettings.bulkPut([
        { profileId: INITIAL_PROFILES[0].id, ...INITIAL_SETTINGS },
        {
          profileId: INITIAL_PROFILES[1].id,
          ...INITIAL_SETTINGS,
          theme: 'light',
          alertTone: 'bell',
          soundVolume: 0.8
        }
      ]);
    }
  } catch (err) {
    console.warn('initDatabase encountered non-fatal initialization warning:', err);
  }
}
