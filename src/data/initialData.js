// Initial mock data & configurations for StudyMind AI

export const COGNITIVE_SKILLS = [
  { id: 'math_proofs', name: 'Theoretical Proofs & Logic', category: 'Math & Theory', icon: '📐' },
  { id: 'calculations', name: 'Multi-Step Calculations', category: 'Math & Science', icon: '🔢' },
  { id: 'code_logic', name: 'Algorithm & Data Structure Logic', category: 'Computer Science', icon: '💻' },
  { id: 'debugging', name: 'Code Debugging & Edge Cases', category: 'Computer Science', icon: '🐛' },
  { id: 'essay_synthesis', name: 'Essay Synthesis & Primary Citations', category: 'Humanities', icon: '📝' },
  { id: 'time_estimation', name: 'Project Time Estimation & Planning', category: 'Meta-Cognitive', icon: '⏱️' },
  { id: 'memorization', name: 'Concept & Terminology Retention', category: 'Science & Bio', icon: '🧠' },
  { id: 'problem_decomp', name: 'Complex Problem Decomposition', category: 'General', icon: '🧩' }
];

export const INITIAL_PROFILES = [
  {
    id: 'prof-1',
    name: 'Alex Rivera',
    handle: '@arivera_cs',
    avatar: '🦉',
    color: '#2563eb',
    year: 'Sophomore',
    major: 'Computer Science & Applied Math',
    targetGoal: '3.90 Target GPA • Dean\'s Honor List',
    bio: 'Balancing rigorous CS algorithm labs with calculus problem sets. Passionate about machine learning and distributed systems.',
    createdAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'prof-2',
    name: 'Elena Rostova',
    handle: '@elena_bio',
    avatar: '🦊',
    color: '#059669',
    year: 'Junior',
    major: 'Biochemistry & Pre-Med',
    targetGoal: 'MCAT Preparation • Lab Research Fellowship',
    bio: 'Pre-med student focusing on organic synthesis and molecular biology. Aiming for consistent daily study habits.',
    createdAt: '2026-08-05T09:30:00.000Z'
  }
];

export const INITIAL_COURSES = [
  {
    id: 'course-1',
    name: 'Computer Science II: Data Structures',
    code: 'CS 250',
    color: '#2563eb', // Indigo Blue
    instructor: 'Dr. Turing',
    schedule: 'Mon, Wed 10:00 AM'
  },
  {
    id: 'course-2',
    name: 'Calculus & Linear Algebra',
    code: 'MATH 201',
    color: '#d97706', // Warm Amber
    instructor: 'Prof. Gauss',
    schedule: 'Tue, Thu 1:30 PM'
  },
  {
    id: 'course-3',
    name: 'Organic Chemistry & Molecular Biology',
    code: 'CHEM 140',
    color: '#059669', // Emerald
    instructor: 'Dr. Franklin',
    schedule: 'Mon, Wed, Fri 9:00 AM'
  },
  {
    id: 'course-4',
    name: 'World History & Modern Civilizations',
    code: 'HIST 110',
    color: '#9333ea', // Royal Purple
    instructor: 'Prof. Toynbee',
    schedule: 'Tue, Thu 3:00 PM'
  }
];

// Helper to create dates relative to now
const now = new Date();
const addHours = (h) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();
const addDays = (d, hour = 17, min = 0) => {
  const target = new Date(now);
  target.setDate(target.getDate() + d);
  target.setHours(hour, min, 0, 0);
  return target.toISOString();
};

export const INITIAL_ASSIGNMENTS = [
  {
    id: 'hw-1',
    courseId: 'course-1',
    title: 'Implement Red-Black Tree Balancing Algorithm',
    description: 'Implement insertion and rotation methods for self-balancing binary search trees with unit tests.',
    dueDate: addHours(4), // Due in 4 hours! Urgent
    estimatedMinutes: 90,
    difficulty: 4, // 1 to 5
    confidence: 4, // 1 to 5 self-assessed confidence
    skills: ['code_logic', 'debugging'],
    isChallengeArea: false,
    reflection: 'Felt very confident with left/right rotation pointers. Edge cases in 3-way color flips took extra testing.',
    priority: 'high',
    status: 'in_progress',
    notes: 'Remember to check color flipping conditions in case 2 and 3.',
    milestones: [
      { id: 'm-1-1', title: 'Write node class & left/right rotation helpers', completed: true },
      { id: 'm-1-2', title: 'Implement insert and rebalance fixup loop', completed: true },
      { id: 'm-1-3', title: 'Run JUnit test suite with 1000 random keys', completed: false },
      { id: 'm-1-4', title: 'Submit code archive to portal', completed: false }
    ],
    reminderOffsets: [24 * 60, 3 * 60, 60, 15],
    notifiedOffsets: [24 * 60, 3 * 60],
    focusMinutesSpent: 45
  },
  {
    id: 'hw-2',
    courseId: 'course-2',
    title: 'Problem Set 5: Eigenvalues & Vector Projections',
    description: 'Complete problems 12 through 28 on textbook pages 142-145.',
    dueDate: addDays(1, 16, 0), // Tomorrow at 4 PM
    estimatedMinutes: 60,
    difficulty: 4,
    confidence: 2, // Low confidence -> Known Growth Area!
    skills: ['math_proofs', 'calculations'],
    isChallengeArea: true,
    reflection: 'Struggling with multi-dimensional null-spaces and characteristic determinant algebra. Need step-by-step review.',
    priority: 'medium',
    status: 'todo',
    notes: 'Use determinant method for characteristic polynomials.',
    milestones: [
      { id: 'm-2-1', title: 'Solve problems 12-18 (Eigenvalues)', completed: false },
      { id: 'm-2-2', title: 'Solve problems 19-24 (Gram-Schmidt process)', completed: false },
      { id: 'm-2-3', title: 'Review answers and scan worksheets', completed: false }
    ],
    reminderOffsets: [24 * 60, 3 * 60, 60],
    notifiedOffsets: [],
    focusMinutesSpent: 0
  },
  {
    id: 'hw-3',
    courseId: 'course-4',
    title: 'Research Essay: The Industrial Revolution Impact on Urbanization',
    description: 'Draft a 1500-word comparative essay analyzing primary demographic sources in 19th century Manchester and Lyon.',
    dueDate: addDays(3, 23, 59),
    estimatedMinutes: 180,
    difficulty: 3,
    confidence: 3,
    skills: ['essay_synthesis', 'time_estimation'],
    isChallengeArea: true,
    reflection: 'Tendency to spend too long researching before writing the first draft. Need stricter time-boxing.',
    priority: 'medium',
    status: 'in_progress',
    notes: 'Cite at least 4 primary source documents from the online syllabus archive.',
    milestones: [
      { id: 'm-3-1', title: 'Formulate thesis statement & outline 4 key arguments', completed: true },
      { id: 'm-3-2', title: 'Gather primary source citations and statistics', completed: true },
      { id: 'm-3-3', title: 'Draft introduction and body paragraphs 1-3', completed: false },
      { id: 'm-3-4', title: 'Write conclusion and proofread bibliography', completed: false }
    ],
    reminderOffsets: [24 * 60, 60],
    notifiedOffsets: [],
    focusMinutesSpent: 60
  },
  {
    id: 'hw-4',
    courseId: 'course-3',
    title: 'Pre-Lab Synthesis Reaction Flowchart',
    description: 'Prepare safety hazards sheet and draw the electrophilic aromatic substitution reaction mechanism.',
    dueDate: addDays(4, 8, 30),
    estimatedMinutes: 45,
    difficulty: 2,
    confidence: 5,
    skills: ['memorization', 'calculations'],
    isChallengeArea: false,
    reflection: 'Mastered the reaction mechanism. Easy 100% pre-lab score expected.',
    priority: 'low',
    status: 'todo',
    notes: 'Lab coat and safety goggles mandatory.',
    milestones: [
      { id: 'm-4-1', title: 'Draw arrow-pushing mechanism for bromination', completed: false },
      { id: 'm-4-2', title: 'Fill out chemical hazard sheet table', completed: false }
    ],
    reminderOffsets: [24 * 60, 60],
    notifiedOffsets: [],
    focusMinutesSpent: 0
  },
  {
    id: 'hw-5',
    courseId: 'course-1',
    title: 'Quiz 2: Asymptotic Analysis & Recurrences',
    description: 'Review Master Theorem cases 1, 2, and 3.',
    dueDate: addDays(-1, 10, 0),
    estimatedMinutes: 30,
    difficulty: 3,
    confidence: 5,
    skills: ['math_proofs', 'code_logic'],
    isChallengeArea: false,
    reflection: 'Master Theorem tree method worked flawlessly. Strong intuitive grasp of big-O asymptotics.',
    priority: 'medium',
    status: 'completed',
    notes: 'Scored 96%!',
    milestones: [
      { id: 'm-5-1', title: 'Review lecture 4 slides', completed: true },
      { id: 'm-5-2', title: 'Solve 3 sample recurrence relations', completed: true }
    ],
    reminderOffsets: [24 * 60],
    notifiedOffsets: [24 * 60],
    focusMinutesSpent: 35
  }
];

export const INITIAL_USER_STATS = {
  xp: 420,
  level: 3,
  levelTitle: 'Scholar',
  streak: 5,
  totalFocusMinutes: 240,
  completedHomeworkCount: 14,
  lastActiveDate: new Date().toISOString().slice(0, 10)
};

export const INITIAL_SETTINGS = {
  theme: 'light',
  geminiApiKey: '',
  aiModel: 'gemini-1.5-flash',
  enableDesktopNotifications: true,
  enableAudioChimes: true,
  alertTone: 'chime',
  soundVolume: 0.75,
  defaultReminderOffsets: [1440, 180, 60, 15],
  studyHoursStart: '16:00',
  studyHoursEnd: '21:30'
};
