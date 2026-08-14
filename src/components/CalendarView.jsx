import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { exportToICS } from '../services/icsExport';

export const CalendarView = ({
  assignments,
  courses,
  onOpenTutor,
  onOpenAddModal
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const courseMap = useMemo(() => {
    return Object.fromEntries(courses.map((c) => [c.id, c]));
  }, [courses]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDayDate = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDate - i,
        isCurrentMonth: false,
        dateString: new Date(year, month - 1, prevMonthLastDate - i).toISOString().slice(0, 10)
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayDate; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        dateString: new Date(year, month, i).toISOString().slice(0, 10)
      });
    }

    // Next month filler days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        dateString: new Date(year, month + 1, i).toISOString().slice(0, 10)
      });
    }

    return days;
  }, [year, month]);

  // Group assignments by date string YYYY-MM-DD
  const assignmentsByDate = useMemo(() => {
    const map = {};
    assignments.forEach((hw) => {
      const dateKey = new Date(hw.dueDate).toISOString().slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(hw);
    });
    return map;
  }, [assignments]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleExportICS = () => {
    exportToICS(assignments, courses);
  };

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary-subtle)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
              {monthNames[month]} {year}
            </h3>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Interactive Deadline Matrix & Schedule
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn btn-subtle"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            Today
          </button>

          <button onClick={prevMonth} className="btn btn-icon" title="Previous Month">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="btn btn-icon" title="Next Month">
            <ChevronRight size={16} />
          </button>

          <button
            onClick={handleExportICS}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            title="Download .ics file to import directly into Apple, Google, or Outlook Calendar"
          >
            <Download size={14} />
            <span>Export .ICS Calendar</span>
          </button>
        </div>
      </div>

      {/* Days of Week Labels */}
      <div className="calendar-grid">
        {daysOfWeek.map((dayName) => (
          <div key={dayName} className="calendar-day-label">
            {dayName}
          </div>
        ))}

        {/* Calendar Matrix Cells */}
        {calendarDays.map((cell, idx) => {
          const isToday = cell.dateString === todayStr;
          const dayAssignments = assignmentsByDate[cell.dateString] || [];

          return (
            <div
              key={idx}
              className={`calendar-cell ${cell.isCurrentMonth ? 'current-month' : ''} ${isToday ? 'today' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  className="calendar-cell-date"
                  style={{
                    color: isToday ? 'var(--accent-primary)' : cell.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)'
                  }}
                >
                  {cell.day}
                </span>

                {isToday && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      textTransform: 'uppercase'
                    }}
                  >
                    Today
                  </span>
                )}
              </div>

              {/* Assignment Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', maxHeight: '90px' }}>
                {dayAssignments.map((hw) => {
                  const course = courseMap[hw.courseId];
                  const isCompleted = hw.status === 'completed';

                  return (
                    <div
                      key={hw.id}
                      className="calendar-chip"
                      style={{
                        backgroundColor: course ? course.color : 'var(--accent-primary)',
                        opacity: isCompleted ? 0.5 : 1,
                        textDecoration: isCompleted ? 'line-through' : 'none'
                      }}
                      onClick={() => onOpenTutor(hw)}
                      title={`[${course?.code || 'HW'}] ${hw.title} (Click to open AI Tutor)`}
                    >
                      {course ? `[${course.code}] ` : ''}{hw.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
