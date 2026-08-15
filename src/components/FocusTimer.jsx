import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle,
  CloudRain,
  Radio,
  Headphones,
  Coffee,
  Zap
} from 'lucide-react';
import { audioService } from '../services/audioService';
import confetti from 'canvas-confetti';

export const FocusTimer = ({
  assignments,
  courses,
  selectedAssignment = null,
  onSelectAssignment,
  onSessionComplete,
  settings,
  onSaveSettings
}) => {
  // Modes: 'focus_25' (25m), 'deep_50' (50m), 'short_break' (5m), 'long_break' (15m), 'custom'
  const [timerMode, setTimerMode] = useState('focus_25');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(settings?.customTimerMinutes || 25);

  useEffect(() => {
    if (settings?.customTimerMinutes) {
      setCustomMinutes(settings.customTimerMinutes);
    }
  }, [settings?.customTimerMinutes]);

  // Ambient Soundscape state
  const [ambientSound, setAmbientSound] = useState('off'); // 'off' | 'rain' | 'binaural' | 'lofi' | 'brown_noise'
  const [volume, setVolume] = useState(0.7);

  const activeAssignments = assignments.filter((a) => a.status !== 'completed');

  // Interval Ref
  const intervalRef = useRef(null);

  const setDurationForMode = (mode) => {
    setTimerMode(mode);
    setIsRunning(false);
    let seconds = 25 * 60;
    if (mode === 'deep_50') seconds = 50 * 60;
    if (mode === 'short_break') seconds = 5 * 60;
    if (mode === 'long_break') seconds = 15 * 60;
    if (mode === 'custom') seconds = customMinutes * 60;
    setTimeLeft(seconds);
    setTotalDuration(seconds);
  };

  const handleCustomMinutesChange = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 180) val = 180;
    setCustomMinutes(val);
    
    if (timerMode === 'custom') {
      setIsRunning(false);
      setTimeLeft(val * 60);
      setTotalDuration(val * 60);
    }
    
    if (onSaveSettings && settings) {
      onSaveSettings({ ...settings, customTimerMinutes: val });
    }
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timerMode, selectedAssignment]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    audioService.playReminderSound('success');
    audioService.stopAmbient();
    setAmbientSound('off');

    // Confetti celebration
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 }
    });

    const isFocus = timerMode === 'focus_25' || timerMode === 'deep_50';
    const minutesCompleted = Math.round(totalDuration / 60);

    if (onSessionComplete) {
      onSessionComplete({
        assignmentId: selectedAssignment?.id || null,
        minutes: isFocus ? minutesCompleted : 0,
        xpEarned: isFocus ? minutesCompleted * 2 : 5
      });
    }
  };

  const togglePlay = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);

    if (nextRunning && ambientSound !== 'off') {
      audioService.startAmbient(ambientSound);
    } else if (!nextRunning) {
      audioService.stopAmbient();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(totalDuration);
    audioService.stopAmbient();
  };

  const handleAmbientChange = (type) => {
    setAmbientSound(type);
    if (type === 'off' || !isRunning) {
      audioService.stopAmbient();
    } else {
      audioService.startAmbient(type);
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    audioService.setMasterVolume(newVol);
  };

  // Format time mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Circular progress calculation
  const progressPercent = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="focus-widget">
      <div className="widget-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Zap size={18} style={{ color: 'var(--color-warning)' }} />
          <h4 style={{ fontSize: '0.95rem' }}>Pomodoro Focus Studio</h4>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          +2 XP / min
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="nav-tabs" style={{ padding: '0.2rem' }}>
        <button
          type="button"
          className={`tab-btn ${timerMode === 'focus_25' ? 'active' : ''}`}
          onClick={() => setDurationForMode('focus_25')}
          style={{ fontSize: '0.775rem', padding: '0.35rem 0.6rem' }}
        >
          25m Focus
        </button>
        <button
          type="button"
          className={`tab-btn ${timerMode === 'deep_50' ? 'active' : ''}`}
          onClick={() => setDurationForMode('deep_50')}
          style={{ fontSize: '0.775rem', padding: '0.35rem 0.6rem' }}
        >
          50m Deep
        </button>
        <button
          type="button"
          className={`tab-btn ${timerMode === 'short_break' ? 'active' : ''}`}
          onClick={() => setDurationForMode('short_break')}
          style={{ fontSize: '0.775rem', padding: '0.35rem 0.6rem' }}
        >
          5m Break
        </button>
        <button
          type="button"
          className={`tab-btn ${timerMode === 'custom' ? 'active' : ''}`}
          onClick={() => setDurationForMode('custom')}
          style={{ fontSize: '0.775rem', padding: '0.35rem 0.6rem' }}
        >
          Custom
        </button>
      </div>

      {timerMode === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', marginBottom: '0.5rem', padding: '0 0.2rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Minutes (1-180):</label>
          <input
            type="number"
            min="1"
            max="180"
            value={customMinutes}
            onChange={handleCustomMinutesChange}
            className="form-input"
            style={{ width: '60px', padding: '0.2rem', fontSize: '0.8rem' }}
          />
        </div>
      )}

      {/* Task Link Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Linking session to:
        </label>
        <select
          className="form-select"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
          value={selectedAssignment?.id || ''}
          onChange={(e) => {
            const found = assignments.find((a) => a.id === e.target.value);
            onSelectAssignment(found || null);
          }}
        >
          <option value="">(No specific assignment / General study)</option>
          {activeAssignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {/* Radial Timer Dial */}
      <div className="timer-dial-container">
        <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="85"
            cy="85"
            r={radius}
            stroke="var(--border-subtle)"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Animated active circle */}
          <circle
            cx="85"
            cy="85"
            r={radius}
            stroke="var(--accent-primary)"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        {/* Inner Text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span className="timer-time-display">{formatTime(timeLeft)}</span>
          <span className="timer-label">
            {timerMode.includes('break') ? '☕ Rest' : '🎯 Focus'}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
        <button
          onClick={togglePlay}
          className="btn btn-primary"
          style={{ width: '130px', padding: '0.55rem 1rem' }}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
        </button>

        <button onClick={handleReset} className="btn btn-subtle" title="Reset Timer">
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Generative Ambient Soundscapes */}
      <div className="ambient-sound-controls">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Ambient Soundscape
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {ambientSound === 'off' ? 'Off' : ambientSound.toUpperCase()}
          </span>
        </div>

        <div className="ambient-selector">
          <button
            type="button"
            className={`ambient-btn ${ambientSound === 'rain' ? 'active' : ''}`}
            onClick={() => handleAmbientChange(ambientSound === 'rain' ? 'off' : 'rain')}
            title="Soothing Rain"
          >
            🌧️ Rain
          </button>
          <button
            type="button"
            className={`ambient-btn ${ambientSound === 'ocean' ? 'active' : ''}`}
            onClick={() => handleAmbientChange(ambientSound === 'ocean' ? 'off' : 'ocean')}
            title="Ocean Waves"
          >
            🌊 Ocean
          </button>
          <button
            type="button"
            className={`ambient-btn ${ambientSound === 'forest' ? 'active' : ''}`}
            onClick={() => handleAmbientChange(ambientSound === 'forest' ? 'off' : 'forest')}
            title="Forest Ambience"
          >
            🌲 Forest
          </button>
          <button
            type="button"
            className={`ambient-btn ${ambientSound === 'pad' ? 'active' : ''}`}
            onClick={() => handleAmbientChange(ambientSound === 'pad' ? 'off' : 'pad')}
            title="Soft Piano Pad"
          >
            🎹 Pad
          </button>
          <button
            type="button"
            className={`ambient-btn ${ambientSound === 'focus_tone' ? 'active' : ''}`}
            onClick={() => handleAmbientChange(ambientSound === 'focus_tone' ? 'off' : 'focus_tone')}
            title="Calm Focus Tone"
          >
            🧘 Tone
          </button>
        </div>

        {ambientSound !== 'off' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
            <Volume2 size={13} style={{ color: 'var(--text-muted)' }} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-primary)', height: '4px' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
