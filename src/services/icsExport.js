// RFC-5545 iCalendar (.ics) export generator for StudyMind AI

export const exportToICS = (assignments, courses = []) => {
  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));

  const formatDateToICS = (dateObj) => {
    const pad = (n) => (n < 10 ? '0' + n : n);
    return (
      dateObj.getUTCFullYear().toString() +
      pad(dateObj.getUTCMonth() + 1) +
      pad(dateObj.getUTCDate()) +
      'T' +
      pad(dateObj.getUTCHours()) +
      pad(dateObj.getUTCMinutes()) +
      pad(dateObj.getUTCSeconds()) +
      'Z'
    );
  };

  const escapeICS = (str) => {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const nowStr = formatDateToICS(new Date());

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Linang AI//Academic Companion//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Linang AI Homework Schedule'
  ];

  assignments.forEach((hw) => {
    const course = courseMap[hw.courseId] || { code: 'Homework', name: 'General' };
    const dueDate = new Date(hw.dueDate);
    
    // Set event start to 1 hour before due date
    const startDate = new Date(dueDate.getTime() - (hw.estimatedMinutes || 60) * 60 * 1000);

    const summary = `[${course.code}] ${hw.title}`;
    const description = `Course: ${course.name}\\nEstimated Time: ${hw.estimatedMinutes || 60}m\\nDifficulty: ${hw.difficulty}/5\\nStatus: ${hw.status}\\n\\nNotes: ${hw.notes || 'None'}`;

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:studymind-${hw.id}@studymind.ai`);
    icsContent.push(`DTSTAMP:${nowStr}`);
    icsContent.push(`DTSTART:${formatDateToICS(startDate)}`);
    icsContent.push(`DTEND:${formatDateToICS(dueDate)}`);
    icsContent.push(`SUMMARY:${escapeICS(summary)}`);
    icsContent.push(`DESCRIPTION:${escapeICS(description)}`);
    icsContent.push(`STATUS:${hw.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`);
    
    // Add Valarm (Reminder 3 hours before)
    icsContent.push('BEGIN:VALARM');
    icsContent.push('TRIGGER:-PT3H');
    icsContent.push('ACTION:DISPLAY');
    icsContent.push(`DESCRIPTION:Reminder: ${escapeICS(summary)} is due in 3 hours!`);
    icsContent.push('END:VALARM');

    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `linang-ai-homework-schedule-${new Date().toISOString().slice(0, 10)}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};
