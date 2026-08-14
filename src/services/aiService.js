// AI Service: Gemini API Integration + Offline Heuristic Intelligence Engine

import { StorageService } from './storage';
import { COGNITIVE_SKILLS } from '../data/initialData';

export const AIService = {
  // Check if API key is present
  getApiKey: () => {
    const settings = StorageService.getSettings();
    return settings.geminiApiKey?.trim() || '';
  },

  // Call Gemini API
  callGemini: async (systemPrompt, userPrompt) => {
    const apiKey = AIService.getApiKey();
    if (!apiKey) {
      throw new Error('NO_API_KEY');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nTask:\n${userPrompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1000
      }
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  // =========================================================================
  // 1. Natural Language Assignment & Syllabus Extractor
  // =========================================================================
  parseAssignmentText: async (rawText, courses) => {
    const apiKey = AIService.getApiKey();
    
    if (apiKey) {
      try {
        const systemPrompt = `You are an AI homework parser. Analyze the student's raw text and extract structured homework data in JSON format ONLY.
Return a valid JSON object with:
{
  "title": "Clean, concise title",
  "courseCode": "matched or suggested course code like CS 250 or MATH 201",
  "dueDate": "ISO 8601 string (e.g. 2026-08-16T17:00:00.000Z)",
  "estimatedMinutes": number (e.g. 60),
  "difficulty": number (1 to 5),
  "confidence": number (1 to 5),
  "skills": ["code_logic", "math_proofs", "essay_synthesis"],
  "isChallengeArea": boolean,
  "priority": "high" | "medium" | "low",
  "notes": "Any special instructions or constraints",
  "milestones": [
    { "title": "Milestone 1 title", "completed": false },
    { "title": "Milestone 2 title", "completed": false }
  ]
}
Current local time reference: ${new Date().toISOString()}.
Available student courses: ${courses.map(c => `${c.code} (${c.name})`).join(', ')}.
Available skills: ${COGNITIVE_SKILLS.map(s => s.id).join(', ')}.
Output strictly valid JSON with no markdown backticks.`;

        const responseText = await AIService.callGemini(systemPrompt, rawText);
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        let matchedCourse = courses.find(c => 
          c.code.toLowerCase() === (parsed.courseCode || '').toLowerCase() ||
          rawText.toLowerCase().includes(c.code.toLowerCase()) ||
          rawText.toLowerCase().includes(c.name.toLowerCase())
        );

        return {
          title: parsed.title || 'New Homework Task',
          courseId: matchedCourse?.id || courses[0]?.id || 'course-1',
          dueDate: parsed.dueDate || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          estimatedMinutes: parsed.estimatedMinutes || 60,
          difficulty: parsed.difficulty || 3,
          confidence: parsed.confidence || 3,
          skills: parsed.skills || ['problem_decomp'],
          isChallengeArea: parsed.isChallengeArea ?? (parsed.confidence <= 2),
          reflection: '',
          priority: parsed.priority || 'medium',
          notes: parsed.notes || '',
          milestones: parsed.milestones || [
            { id: `m-${Date.now()}-1`, title: 'Review material and requirements', completed: false },
            { id: `m-${Date.now()}-2`, title: 'Work through core problems/draft', completed: false },
            { id: `m-${Date.now()}-3`, title: 'Verify and submit', completed: false }
          ]
        };
      } catch (err) {
        console.warn('Gemini parser failed or no key, falling back to offline heuristics:', err);
      }
    }

    // Offline Heuristic Engine
    return AIService.offlineParseAssignment(rawText, courses);
  },

  offlineParseAssignment: (text, courses) => {
    const lower = text.toLowerCase();
    
    // 1. Detect Course
    let matchedCourse = courses.find(c => 
      lower.includes(c.code.toLowerCase()) || 
      lower.includes(c.name.toLowerCase()) ||
      (c.name.includes('Math') && (lower.includes('math') || lower.includes('calc') || lower.includes('algebra'))) ||
      (c.name.includes('Computer') && (lower.includes('code') || lower.includes('programming') || lower.includes('java') || lower.includes('python') || lower.includes('tree') || lower.includes('algorithm'))) ||
      (c.name.includes('Chemistry') && (lower.includes('chem') || lower.includes('lab') || lower.includes('reaction'))) ||
      (c.name.includes('History') && (lower.includes('history') || lower.includes('essay') || lower.includes('revolution')))
    );
    const courseId = matchedCourse ? matchedCourse.id : (courses[0]?.id || 'course-1');

    // 2. Detect Due Date & Time
    const targetDate = new Date();
    targetDate.setSeconds(0, 0);
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let dayFound = false;

    if (lower.includes('today')) {
      dayFound = true;
    } else if (lower.includes('tomorrow')) {
      targetDate.setDate(targetDate.getDate() + 1);
      dayFound = true;
    } else {
      for (let i = 0; i < 7; i++) {
        if (lower.includes(daysOfWeek[i])) {
          const currentDay = targetDate.getDay();
          let diff = i - currentDay;
          if (diff <= 0) diff += 7;
          targetDate.setDate(targetDate.getDate() + diff);
          dayFound = true;
          break;
        }
      }
    }

    if (!dayFound) {
      targetDate.setDate(targetDate.getDate() + 2);
    }

    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const isPm = timeMatch[3] === 'pm';
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;
      targetDate.setHours(hours, minutes, 0, 0);
    } else if (lower.includes('midnight') || lower.includes('11:59')) {
      targetDate.setHours(23, 59, 0, 0);
    } else {
      targetDate.setHours(17, 0, 0, 0);
    }

    // 3. Estimated Duration
    let estimatedMinutes = 60;
    const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|hrs)/);
    const minMatch = lower.match(/(\d+)\s*(?:min|minute|mins)/);
    if (hourMatch) {
      estimatedMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
    } else if (minMatch) {
      estimatedMinutes = parseInt(minMatch[1], 10);
    } else if (lower.includes('essay') || lower.includes('project')) {
      estimatedMinutes = 120;
    }

    // 4. Skills & Challenge detection
    const detectedSkills = [];
    if (lower.includes('proof') || lower.includes('eigen') || lower.includes('theorem')) detectedSkills.push('math_proofs');
    if (lower.includes('problem') || lower.includes('calc') || lower.includes('matrix')) detectedSkills.push('calculations');
    if (lower.includes('tree') || lower.includes('code') || lower.includes('algorithm')) detectedSkills.push('code_logic');
    if (lower.includes('debug') || lower.includes('test') || lower.includes('fix')) detectedSkills.push('debugging');
    if (lower.includes('essay') || lower.includes('write') || lower.includes('cite')) detectedSkills.push('essay_synthesis');
    if (detectedSkills.length === 0) detectedSkills.push('problem_decomp');

    const isChallenge = lower.includes('hard') || lower.includes('stuck') || lower.includes('struggle') || lower.includes('exam');

    let title = text.split('\n')[0].replace(/due\s+.*$/i, '').trim();
    if (title.length > 75) title = title.substring(0, 72) + '...';
    if (!title || title.length < 5) title = `Homework: ${matchedCourse ? matchedCourse.code : 'Assignment'}`;

    return {
      title,
      courseId,
      dueDate: targetDate.toISOString(),
      estimatedMinutes,
      difficulty: isChallenge ? 4 : 3,
      confidence: isChallenge ? 2 : 4,
      skills: detectedSkills,
      isChallengeArea: isChallenge,
      reflection: '',
      priority: isChallenge ? 'high' : 'medium',
      notes: text.length > 80 ? text : 'Parsed via Linang AI Assistant',
      milestones: [
        { id: `m-${Date.now()}-1`, title: 'Review instructions & requirements', completed: false },
        { id: `m-${Date.now()}-2`, title: 'Complete primary draft / problem set', completed: false },
        { id: `m-${Date.now()}-3`, title: 'Verify and submit to portal', completed: false }
      ]
    };
  },

  // =========================================================================
  // 2. Socratic AI Homework Tutor (Personalized with Weakness/Strength Data)
  // =========================================================================
  askTutor: async (assignment, course, userMessage, chatHistory = [], profile = null) => {
    const apiKey = AIService.getApiKey();

    if (apiKey) {
      try {
        const isChallenge = assignment.isChallengeArea || (assignment.confidence && assignment.confidence <= 2);
        const systemPrompt = `You are the Linang AI Academic Companion for student "${profile?.name || 'Student'}".
Student Major: ${profile?.major || 'General'}
Target Goal: ${profile?.targetGoal || 'Academic Success'}

Assignment Context:
- Title: ${assignment.title}
- Course: ${course?.code || 'General'} (${course?.name || ''})
- Skills: ${assignment.skills?.join(', ') || 'General'}
- Is Known Growth/Challenge Area: ${isChallenge ? 'YES (Provide extra supportive scaffolding)' : 'NO'}
- Student Reflection: ${assignment.reflection || 'None'}
- Notes: ${assignment.notes || 'None'}
- Milestones: ${assignment.milestones?.map(m => m.title).join(' | ')}

Pedagogical Rules:
1. Socratic method: provide structured hints, guiding analogies, and foundational questions.
2. If this is a tagged growth area (${isChallenge ? 'YES' : 'NO'}), acknowledge that this topic is challenging, validate their effort, and offer a simplified initial step.
3. Keep responses concise, supportive, and formatted in clean markdown.`;

        const historyContext = chatHistory.slice(-4).map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
        const prompt = `${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}Student: ${userMessage}`;

        const reply = await AIService.callGemini(systemPrompt, prompt);
        return reply;
      } catch (err) {
        console.warn('Gemini tutor error, using offline response generator:', err);
      }
    }

    // Offline Socratic Tutor Heuristic
    return AIService.offlineTutorResponse(assignment, course, userMessage, profile);
  },

  offlineTutorResponse: (assignment, course, userMessage, profile) => {
    const lower = userMessage.toLowerCase();
    const isChallenge = assignment.isChallengeArea || (assignment.confidence && assignment.confidence <= 2);
    
    if (lower.includes('start') || lower.includes('hint') || lower.includes('stuck')) {
      return `💡 **Where to Start for ${assignment.title}:**\n\n${isChallenge ? `> 🌟 *Note: Since this is marked as a Growth Area (${assignment.skills?.join(', ') || 'focus topic'}), let's build the solution step-by-step without rushing!*\n\n` : ''}1. **Identify the Core Inputs**: Write down the primary constants and boundaries from the problem statement.\n2. **Break into Milestones**: Tackle milestone 1 first: *${assignment.milestones?.[0]?.title || 'Review initial setup'}*.\n3. **Sanity Check Principle**: What is the expected behavior for the simplest test case?\n\n*What is your current intuition for step 1?*`;
    }

    if (lower.includes('explain') || lower.includes('concept') || lower.includes('why')) {
      return `📚 **Conceptual Breakdown (${course?.code}):**\n\nFor **${assignment.title}**, the central idea is transformation under constraints:\n- **Foundational Idea**: Isolate the variable states before and after applying the main rule.\n- **Common Trap**: Jumping straight to calculation before verifying initial boundary conditions.\n\nHow would you summarize the goal in your own words?`;
    }

    if (lower.includes('formula') || lower.includes('cheat')) {
      return `📐 **Key Reference & Framework (${course?.code}):**\n\n- **Formula Structure**: Base Case + Inductive Step / Direct Matrix Determinant\n- **Verification Step**: Substitute trivial values (0, 1, Identity) to guarantee correctness.\n\nWhich specific step in the derivation would you like to verify?`;
    }

    return `🎯 **Great question, ${profile?.name?.split(' ')[0] || 'there'}!**\n\n${isChallenge ? `Because this assignment covers a key growth area, let's break it down into bite-sized pieces.\n\n` : ''}1. What is the very first equation or logic condition you feel confident about?\n2. Where does the problem start feeling ambiguous?\n\nShare what you have so far, and we'll tackle the next milestone together!`;
  },

  // =========================================================================
  // 3. AI Cognitive Diagnosis & Mastery Summary Generator
  // =========================================================================
  generateCognitiveDiagnosis: (profile, assignments, courses) => {
    const completed = assignments.filter(a => a.status === 'completed');
    const active = assignments.filter(a => a.status !== 'completed');
    const totalCount = assignments.length;

    // Calculate skill stats
    const skillStats = {};
    COGNITIVE_SKILLS.forEach(skill => {
      skillStats[skill.id] = {
        ...skill,
        totalTasks: 0,
        completedTasks: 0,
        confidenceSum: 0,
        challengeCount: 0
      };
    });

    assignments.forEach(hw => {
      const skills = hw.skills || ['problem_decomp'];
      skills.forEach(skId => {
        if (skillStats[skId]) {
          skillStats[skId].totalTasks += 1;
          skillStats[skId].confidenceSum += (hw.confidence || 3);
          if (hw.status === 'completed') skillStats[skId].completedTasks += 1;
          if (hw.isChallengeArea || (hw.confidence && hw.confidence <= 2)) {
            skillStats[skId].challengeCount += 1;
          }
        }
      });
    });

    // Evaluate Strengths (Confidence >= 4, Low friction, High completion)
    const strengths = [];
    const weaknesses = [];

    Object.values(skillStats).forEach(s => {
      if (s.totalTasks > 0) {
        const avgConfidence = s.confidenceSum / s.totalTasks;
        const masteryScore = Math.round((s.completedTasks / s.totalTasks) * 50 + (avgConfidence / 5) * 50);
        s.masteryScore = masteryScore;
        s.avgConfidence = Number(avgConfidence.toFixed(1));

        if (avgConfidence >= 3.8 && s.challengeCount === 0) {
          strengths.push({
            skillId: s.id,
            name: s.name,
            icon: s.icon,
            category: s.category,
            masteryScore,
            avgConfidence: s.avgConfidence,
            evidence: `High confidence across ${s.totalTasks} tasks with rapid completion.`
          });
        } else if (s.challengeCount > 0 || avgConfidence <= 2.8) {
          weaknesses.push({
            skillId: s.id,
            name: s.name,
            icon: s.icon,
            category: s.category,
            masteryScore,
            avgConfidence: s.avgConfidence,
            triggerCount: s.challengeCount,
            evidence: `${s.challengeCount} tasks marked with lower confidence or estimation friction.`
          });
        }
      } else {
        s.masteryScore = 70;
        s.avgConfidence = 3.5;
      }
    });

    // Fallbacks if limited data
    if (strengths.length === 0) {
      strengths.push({
        skillId: 'code_logic',
        name: 'Algorithm & Data Structure Logic',
        icon: '💻',
        category: 'Computer Science',
        masteryScore: 92,
        avgConfidence: 4.5,
        evidence: 'Consistent milestone completions in CS 250 with strong unit test coverage.'
      });
    }

    if (weaknesses.length === 0) {
      weaknesses.push({
        skillId: 'math_proofs',
        name: 'Theoretical Proofs & Calculations',
        icon: '📐',
        category: 'Math & Theory',
        masteryScore: 64,
        avgConfidence: 2.5,
        triggerCount: 2,
        evidence: 'Reported friction in eigenvalue null-spaces and multi-dimensional characteristic equations.'
      });
    }

    // Actionable AI Prescriptions
    const prescriptions = [
      {
        id: 'rx-1',
        type: 'growth',
        title: 'Socratic Scaffold for Theoretical Proofs',
        desc: 'Before diving into multi-step matrix derivations, spend 5 minutes drawing the 2D geometric projection or testing with the 2x2 Identity matrix.',
        targetCourse: 'MATH 201'
      },
      {
        id: 'rx-2',
        type: 'time',
        title: 'Time-Boxing Essay Research Sessions',
        desc: 'Cap primary source gathering at 45 minutes in Pomodoro mode before writing the first 300-word draft chunk.',
        targetCourse: 'HIST 110'
      },
      {
        id: 'rx-3',
        type: 'strength',
        title: 'Leverage Strong CS Logic for Peer Tutoring',
        desc: 'Your mastery in balanced tree algorithms and asymptotic analysis is outstanding. Consider leading a study session to reinforce recall.',
        targetCourse: 'CS 250'
      }
    ];

    // Compute Overall Mastery Index (0-100)
    const overallScore = Math.round(
      (completed.length / (totalCount || 1)) * 40 +
      (strengths.length / (strengths.length + weaknesses.length || 1)) * 40 +
      20
    );

    return {
      profileName: profile?.name || 'Student',
      targetGoal: profile?.targetGoal || 'Academic Excellence',
      overallScore: Math.min(98, Math.max(65, overallScore)),
      strengths,
      weaknesses,
      prescriptions,
      skillStats: Object.values(skillStats)
    };
  },

  // =========================================================================
  // 4. Practice Flashcard Quiz Generator
  // =========================================================================
  generateQuiz: async (assignment, course) => {
    const apiKey = AIService.getApiKey();

    if (apiKey) {
      try {
        const systemPrompt = `You are an AI study coach. Generate 3 multiple choice practice quiz questions to test the student's mastery on the homework topic: "${assignment.title}" (${course?.code}).
Return JSON ONLY with format:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation why this is correct."
  }
]`;
        const responseText = await AIService.callGemini(systemPrompt, `Generate quiz for ${assignment.title}`);
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (err) {
        console.warn('Gemini quiz failed, using offline generator:', err);
      }
    }

    // Offline Quiz Generator
    return [
      {
        question: `What is the primary objective when completing "${assignment.title}"?`,
        options: [
          'Mastering the core principles and verifying edge-case correctness',
          'Memorizing raw answers without conceptual understanding',
          'Skimming through without reviewing the rubric',
          'Postponing verification until after final submission'
        ],
        correctIndex: 0,
        explanation: 'Deep conceptual understanding combined with systematic verification ensures high retention and top grades.'
      },
      {
        question: `In ${course?.code || 'this subject'}, what is the most effective workflow strategy?`,
        options: [
          'Cramming all problems in one sitting without breaks',
          'Breaking the assignment into sequential milestones and validating each stage',
          'Skipping preliminary documentation and notes',
          'Only checking answers after the due date'
        ],
        correctIndex: 1,
        explanation: 'Decomposing tasks into bite-sized milestones minimizes cognitive overload and catches errors early.'
      },
      {
        question: `Before finalizing your submission for ${course?.code}, what final step should you always take?`,
        options: [
          'Delete all scratch notes immediately',
          'Run a sanity check against the assignment constraints and requirements',
          'Change random answers at the last minute',
          'Ignore the grading rubric'
        ],
        correctIndex: 1,
        explanation: 'A quick 5-minute sanity check against the prompt requirements prevents simple unforced point deductions.'
      }
    ];
  },

  // =========================================================================
  // 5. Daily AI Study Plan & Time Blocker
  // =========================================================================
  generateDailyStudyPlan: (assignments, courses, studyStart = '16:00', studyEnd = '21:00') => {
    const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));
    const activeTasks = assignments.filter(a => a.status !== 'completed');

    const now = Date.now();
    const scoredTasks = activeTasks.map(t => {
      const dueHours = (new Date(t.dueDate).getTime() - now) / (1000 * 3600);
      let urgencyScore = 100 - dueHours;
      if (t.priority === 'high') urgencyScore += 50;
      if (t.priority === 'medium') urgencyScore += 25;
      if (t.isChallengeArea) urgencyScore += 20; // Prioritize challenge areas earlier in the evening
      return { ...t, urgencyScore, course: courseMap[t.courseId] };
    }).sort((a, b) => b.urgencyScore - a.urgencyScore);

    const [startH, startM] = studyStart.split(':').map(Number);
    let currentMinuteOffset = startH * 60 + startM;

    const formatTime = (mins) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH}:${m < 10 ? '0' : ''}${m} ${ampm}`;
    };

    const blocks = [];

    scoredTasks.slice(0, 4).forEach((task, index) => {
      const taskDuration = Math.min(task.estimatedMinutes || 60, 90);
      const startTimeStr = formatTime(currentMinuteOffset);
      currentMinuteOffset += taskDuration;
      const endTimeStr = formatTime(currentMinuteOffset);

      blocks.push({
        id: `block-${task.id}`,
        taskId: task.id,
        type: 'task',
        courseCode: task.course?.code || 'Task',
        courseColor: task.course?.color || '#2563eb',
        title: task.title,
        timeWindow: `${startTimeStr} - ${endTimeStr}`,
        durationMins: taskDuration,
        milestoneGoal: task.milestones?.find(m => !m.completed)?.title || 'Complete active section'
      });

      if (index < scoredTasks.length - 1) {
        const breakStart = formatTime(currentMinuteOffset);
        currentMinuteOffset += 10;
        const breakEnd = formatTime(currentMinuteOffset);
        blocks.push({
          id: `break-${index}`,
          type: 'break',
          title: '☕ Mindful Refresh & Hydration Break',
          timeWindow: `${breakStart} - ${breakEnd}`,
          durationMins: 10
        });
      }
    });

    return blocks;
  }
};
