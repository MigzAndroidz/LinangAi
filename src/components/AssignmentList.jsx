import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Plus, CheckCircle, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { AssignmentCard } from './AssignmentCard';

export const AssignmentList = ({
  assignments,
  courses,
  onToggleStatus,
  onToggleMilestone,
  onOpenTutor,
  onStartFocus,
  onEdit,
  onDelete,
  onOpenAddModal,
  onPlayChime
}) => {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'urgent' | 'this_week' | 'in_progress' | 'completed' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [sortBy, setSortBy] = useState('due_asc'); // 'due_asc' | 'due_desc' | 'priority' | 'difficulty' | 'duration'

  const courseMap = useMemo(() => {
    return Object.fromEntries(courses.map((c) => [c.id, c]));
  }, [courses]);

  const filteredAssignments = useMemo(() => {
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 3600 * 1000;

    return assignments
      .filter((hw) => {
        // Tab filtering
        if (activeTab === 'active' && hw.status === 'completed') return false;
        if (activeTab === 'completed' && hw.status !== 'completed') return false;
        if (activeTab === 'in_progress' && hw.status !== 'in_progress') return false;
        
        const dueTime = new Date(hw.dueDate).getTime();
        const diffHours = (dueTime - now) / (1000 * 3600);

        if (activeTab === 'urgent') {
          if (hw.status === 'completed') return false;
          if (diffHours > 24) return false;
        }

        if (activeTab === 'this_week') {
          if (hw.status === 'completed') return false;
          if (dueTime - now > oneWeekMs || dueTime < now - 24 * 3600 * 1000) return false;
        }

        // Course filter
        if (selectedCourseId !== 'all' && hw.courseId !== selectedCourseId) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const course = courseMap[hw.courseId];
          const matchTitle = hw.title.toLowerCase().includes(q);
          const matchDesc = (hw.description || '').toLowerCase().includes(q);
          const matchCourse = course ? (course.name.toLowerCase().includes(q) || course.code.toLowerCase().includes(q)) : false;
          if (!matchTitle && !matchDesc && !matchCourse) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'due_asc') {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'due_desc') {
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        if (sortBy === 'priority') {
          const weight = { high: 3, medium: 2, low: 1 };
          return (weight[b.priority] || 0) - (weight[a.priority] || 0);
        }
        if (sortBy === 'difficulty') {
          return (b.difficulty || 0) - (a.difficulty || 0);
        }
        if (sortBy === 'duration') {
          return (b.estimatedMinutes || 0) - (a.estimatedMinutes || 0);
        }
        return 0;
      });
  }, [assignments, activeTab, selectedCourseId, searchQuery, sortBy, courseMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filter Tabs */}
      <div className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Tasks ({assignments.filter((a) => a.status !== 'completed').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'urgent' ? 'active' : ''}`}
          onClick={() => setActiveTab('urgent')}
        >
          🔥 Urgent (&lt;24h)
        </button>
        <button
          className={`tab-btn ${activeTab === 'this_week' ? 'active' : ''}`}
          onClick={() => setActiveTab('this_week')}
        >
          📅 This Week
        </button>
        <button
          className={`tab-btn ${activeTab === 'in_progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('in_progress')}
        >
          ⚡ In Progress
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          ✅ Completed ({assignments.filter((a) => a.status === 'completed').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({assignments.length})
        </button>
      </div>

      {/* Search and Sort Controls Bar */}
      <div className="assignment-controls-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search homework by title, course, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Course filter */}
          <select
            className="select-filter"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            className="select-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="due_asc">⏳ Due Soonest</option>
            <option value="due_desc">📅 Due Latest</option>
            <option value="priority">🚩 Priority (High to Low)</option>
            <option value="difficulty">⭐ Difficulty</option>
            <option value="duration">⏱️ Estimated Time</option>
          </select>
        </div>
      </div>

      {/* Assignment Grid / List */}
      {filteredAssignments.length > 0 ? (
        <div className="assignment-grid">
          {filteredAssignments.map((hw) => (
            <AssignmentCard
              key={hw.id}
              assignment={hw}
              course={courseMap[hw.courseId]}
              onToggleStatus={onToggleStatus}
              onToggleMilestone={onToggleMilestone}
              onOpenTutor={onOpenTutor}
              onStartFocus={onStartFocus}
              onEdit={onEdit}
              onDelete={onDelete}
              onPlayChime={onPlayChime}
            />
          ))}
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <CheckCircle size={28} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>No assignments found</h4>
            <p style={{ fontSize: '0.875rem' }}>
              {searchQuery
                ? `No homework tasks matching "${searchQuery}".`
                : 'You have no homework in this category. Ready to add a new task?'}
            </p>
          </div>
          <button onClick={onOpenAddModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Homework</span>
          </button>
        </div>
      )}
    </div>
  );
};
