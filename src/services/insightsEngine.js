// src/services/insightsEngine.js
// Algorithmic Cognitive Insights Engine for Linang AI
// Analyzes real user assignment and skill metadata — strictly data-driven with no invented stats.

/**
 * Compute cognitive insights from a student's real assignment history.
 *
 * @param {Array} assignments List of assignment objects from Dexie / storage
 * @param {Array} courses List of course objects
 * @returns {Object} { strengths, growthAreas, frictionPoints, insufficientData, overallAvgConfidence, allSkillStats }
 */
export function computeCognitiveInsights(assignments = [], courses = []) {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return {
      strengths: [],
      growthAreas: [],
      frictionPoints: [],
      insufficientData: true,
      overallAvgConfidence: 0,
      allSkillStats: []
    };
  }

  // Only consider assignments with status 'completed' or with confidence/skills data present
  const validAssignments = assignments.filter((a) => {
    if (!a) return false;
    const hasSkills = Array.isArray(a.skills) && a.skills.length > 0;
    const hasConfidence = typeof a.confidence === 'number' && !isNaN(a.confidence);
    const isCompleted = a.status === 'completed';
    return isCompleted || (hasSkills && hasConfidence);
  });

  if (validAssignments.length === 0) {
    return {
      strengths: [],
      growthAreas: [],
      frictionPoints: [],
      insufficientData: true,
      overallAvgConfidence: 0,
      allSkillStats: []
    };
  }

  // Group by each tag in assignment.skills[]
  const skillGroups = {};
  let totalConfidenceSum = 0;
  let totalConfidenceCount = 0;

  validAssignments.forEach((hw) => {
    const skills = Array.isArray(hw.skills) && hw.skills.length > 0 ? hw.skills : ['general'];
    const conf = typeof hw.confidence === 'number' ? hw.confidence : 3;
    const isChallenge = Boolean(hw.isChallengeArea || conf <= 2);
    const focusMins = typeof hw.focusMinutesSpent === 'number' ? hw.focusMinutesSpent : 0;

    // Optional on-time checking if completedDate exists in future schemas
    let onTime = null;
    if (hw.completedDate && hw.dueDate) {
      onTime = new Date(hw.completedDate).getTime() <= new Date(hw.dueDate).getTime();
    }

    skills.forEach((skill) => {
      if (!skillGroups[skill]) {
        skillGroups[skill] = {
          skill,
          confidences: [],
          challengeFlags: 0,
          focusMinutes: [],
          onTimeCounts: 0,
          onTimeTotal: 0,
          sampleSize: 0
        };
      }
      skillGroups[skill].confidences.push(conf);
      if (isChallenge) skillGroups[skill].challengeFlags += 1;
      skillGroups[skill].focusMinutes.push(focusMins);
      if (onTime !== null) {
        skillGroups[skill].onTimeTotal += 1;
        if (onTime) skillGroups[skill].onTimeCounts += 1;
      }
      skillGroups[skill].sampleSize += 1;

      totalConfidenceSum += conf;
      totalConfidenceCount += 1;
    });
  });

  const overallAvgConfidence = totalConfidenceCount > 0 ? totalConfidenceSum / totalConfidenceCount : 3;

  // Compute metrics for each skill group
  const skillStatsList = Object.values(skillGroups).map((g) => {
    const avgConfidence = g.confidences.reduce((a, b) => a + b, 0) / (g.sampleSize || 1);
    const challengeFlagRate = g.challengeFlags / (g.sampleSize || 1);
    const avgFocusMinutes = g.focusMinutes.reduce((a, b) => a + b, 0) / (g.sampleSize || 1);
    const onTimeRate = g.onTimeTotal > 0 ? g.onTimeCounts / g.onTimeTotal : null;

    return {
      skill: g.skill,
      avgConfidence: Number(avgConfidence.toFixed(2)),
      challengeFlagRate: Number(challengeFlagRate.toFixed(2)),
      avgFocusMinutes: Number(avgFocusMinutes.toFixed(1)),
      onTimeRate: onTimeRate !== null ? Number(onTimeRate.toFixed(2)) : null,
      sampleSize: g.sampleSize
    };
  });

  // Calculate 75th percentile threshold of avgFocusMinutes across all skills
  const allFocusMinutes = skillStatsList.map((s) => s.avgFocusMinutes).sort((a, b) => a - b);
  let focusP75 = 0;
  if (allFocusMinutes.length > 0) {
    const p75Index = Math.floor(allFocusMinutes.length * 0.75);
    focusP75 = allFocusMinutes[Math.min(p75Index, allFocusMinutes.length - 1)];
  }

  // Filter skills with sampleSize >= 2 to avoid single-datapoint overconfidence
  const qualifiedSkills = skillStatsList.filter((s) => s.sampleSize >= 2);
  const insufficientData = qualifiedSkills.length < 3;

  const strengths = [];
  const growthAreas = [];
  const frictionPoints = [];

  qualifiedSkills.forEach((s) => {
    // STRENGTH: avgConfidence >= 4 AND challengeFlagRate <= 0.2
    const isStrength = s.avgConfidence >= 4.0 && s.challengeFlagRate <= 0.2;
    // GROWTH_AREA: avgConfidence <= 2.5 OR challengeFlagRate >= 0.5
    const isGrowthArea = s.avgConfidence <= 2.5 || s.challengeFlagRate >= 0.5;
    // FRICTION_POINT: avgFocusMinutes in top 25% AND avgConfidence < overallAvgConfidence
    const isFrictionPoint = (s.avgFocusMinutes >= focusP75 && s.avgFocusMinutes > 0) && s.avgConfidence < overallAvgConfidence;

    if (isStrength) strengths.push(s);
    if (isGrowthArea) growthAreas.push(s);
    if (isFrictionPoint) frictionPoints.push(s);
  });

  return {
    strengths,
    growthAreas,
    frictionPoints,
    insufficientData,
    overallAvgConfidence: Number(overallAvgConfidence.toFixed(2)),
    allSkillStats: skillStatsList
  };
}
