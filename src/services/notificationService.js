// Proactive Reminder & Notification Engine for StudyMind AI

import { audioService } from './audioService';
import { StorageService } from './storage';

class NotificationService {
  constructor() {
    this.intervalId = null;
    this.listeners = new Set();
  }

  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermissionState() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  async requestPermission() {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emit(notification) {
    this.listeners.forEach((cb) => {
      try {
        cb(notification);
      } catch (err) {
        console.error('Notification listener error:', err);
      }
    });
  }

  // Format remaining time nicely
  formatRemainingTime(diffMs) {
    if (diffMs <= 0) return 'overdue';
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);

    if (days > 1) return `in ${days} days`;
    if (days === 1) return `tomorrow (${hours % 24}h remaining)`;
    if (hours >= 1) return `in ${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
    return `in ${minutes} minutes`;
  }

  // Check assignments against reminder thresholds
  checkReminders(onAssignmentUpdate) {
    const settings = StorageService.getSettings();
    if (!settings.enableDesktopNotifications && !settings.enableAudioChimes) {
      return;
    }

    const assignments = StorageService.getAssignments();
    const courses = StorageService.getCourses();
    const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

    const now = Date.now();
    let hasUpdates = false;

    const updatedAssignments = assignments.map((hw) => {
      if (hw.status === 'completed') return hw;

      const dueTime = new Date(hw.dueDate).getTime();
      const diffMs = dueTime - now;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      const reminderOffsets = hw.reminderOffsets || settings.defaultReminderOffsets || [1440, 180, 60, 15];
      const notified = new Set(hw.notifiedOffsets || []);

      for (const offset of reminderOffsets) {
        // Trigger if time remaining is less than or equal to offset, but we haven't notified yet
        // and due date hasn't been overdue by more than 12 hours
        if (diffMinutes <= offset && diffMinutes > -720 && !notified.has(offset)) {
          notified.add(offset);
          hasUpdates = true;

          const course = courseMap[hw.courseId] || { code: 'Course', name: 'Course' };
          const timeText = this.formatRemainingTime(diffMs);
          
          let alertMsg = `Due ${timeText}! ${hw.milestones ? `(${hw.milestones.filter(m => m.completed).length}/${hw.milestones.length} milestones done)` : ''}`;
          if (diffMinutes <= 0) {
            alertMsg = `⚠️ Past due! Make sure to finish and submit your work.`;
          }

          // 1. Play synthesized audio chime
          if (settings.enableAudioChimes) {
            audioService.playReminderSound(settings.alertTone || 'chime');
          }

          // 2. Trigger browser notification if permitted
          if (settings.enableDesktopNotifications && this.getPermissionState() === 'granted') {
            try {
              new Notification(`⏰ [${course.code}] ${hw.title}`, {
                body: alertMsg,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><circle cx="12" cy="12" r="10"/></svg>',
                tag: `studymind-${hw.id}-${offset}`,
                requireInteraction: diffMinutes <= 30
              });
            } catch (e) {
              console.warn('Native notification failed:', e);
            }
          }

          // 3. Emit event for in-app UI toasts
          this.emit({
            id: `notif-${Date.now()}-${Math.random()}`,
            assignmentId: hw.id,
            title: `Reminder: ${hw.title}`,
            courseCode: course.code,
            message: alertMsg,
            urgency: diffMinutes <= 60 ? 'urgent' : 'normal',
            timestamp: new Date()
          });
        }
      }

      return {
        ...hw,
        notifiedOffsets: Array.from(notified)
      };
    });

    if (hasUpdates) {
      StorageService.saveAssignments(updatedAssignments);
      if (onAssignmentUpdate) {
        onAssignmentUpdate(updatedAssignments);
      }
    }
  }

  // Start background periodic checker
  startPeriodicCheck(onAssignmentUpdate, intervalMs = 45000) {
    this.stopPeriodicCheck();
    // Run immediate check
    this.checkReminders(onAssignmentUpdate);
    // Setup interval
    this.intervalId = setInterval(() => {
      this.checkReminders(onAssignmentUpdate);
    }, intervalMs);
  }

  stopPeriodicCheck() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Trigger a test alert to verify notification & sound setup
  testAlert() {
    const settings = StorageService.getSettings();
    if (settings.enableAudioChimes) {
      audioService.playReminderSound(settings.alertTone || 'chime');
    }
    if (settings.enableDesktopNotifications && this.getPermissionState() === 'granted') {
      new Notification('🔔 Linang AI Notification Test', {
        body: 'Proactive reminders are working smoothly! You will be alerted before deadlines.',
        icon: '/mascot.png'
      });
    }
    this.emit({
      id: `test-${Date.now()}`,
      title: 'Sound & Notification Test',
      courseCode: 'TEST',
      message: 'Alert sound and notifications are successfully configured!',
      urgency: 'normal',
      timestamp: new Date()
    });
  }
}

export const notificationService = new NotificationService();
