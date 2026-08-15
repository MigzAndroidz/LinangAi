import React, { useState, useRef } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Key,
  Bell,
  Volume2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Play
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { notificationService } from '../services/notificationService';
import { StorageService } from '../services/storage';

export const SettingsModal = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onReloadData
}) => {
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [enableDesktopNotifications, setEnableDesktopNotifications] = useState(settings.enableDesktopNotifications ?? true);
  const [enableAudioChimes, setEnableAudioChimes] = useState(settings.enableAudioChimes ?? true);
  const [alertTone, setAlertTone] = useState(settings.alertTone || 'chime');
  const [soundVolume, setSoundVolume] = useState(settings.soundVolume ?? 0.75);
  const [defaultReminderOffsets, setDefaultReminderOffsets] = useState(settings.defaultReminderOffsets || [1440, 180, 60, 15]);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleTestSound = (tone) => {
    audioService.setMasterVolume(soundVolume);
    audioService.playReminderSound(tone || alertTone);
  };

  const handleTestNotification = () => {
    notificationService.testAlert();
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updated = {
      ...settings,
      geminiApiKey: geminiApiKey.trim(),
      enableDesktopNotifications,
      enableAudioChimes,
      alertTone,
      soundVolume,
      defaultReminderOffsets
    };
    onSaveSettings(updated);
    audioService.setMasterVolume(soundVolume);
    onClose();
  };

  const handleExportBackup = () => {
    StorageService.exportBackupJSON();
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      const res = StorageService.importBackupJSON(content);
      if (res.success) {
        alert('Backup imported successfully!');
        if (onReloadData) onReloadData();
        onClose();
      } else {
        alert(`Failed to import backup: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all homework and settings to the initial sample state?')) {
      StorageService.resetAllData();
      if (onReloadData) onReloadData();
      onClose();
    }
  };

  const toggleOffset = (offset) => {
    if (defaultReminderOffsets.includes(offset)) {
      setDefaultReminderOffsets(defaultReminderOffsets.filter((o) => o !== offset));
    } else {
      setDefaultReminderOffsets([...defaultReminderOffsets, offset].sort((a, b) => b - a));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <SettingsIcon size={18} />
            </div>
            <h3>Settings & Preferences</h3>
          </div>
          <button onClick={onClose} className="btn btn-icon" style={{ width: '36px', height: '36px' }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form id="settings-form" onSubmit={handleSave} className="modal-body">
          {/* Gemini AI Key */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
              <Key size={16} />
              <span>Google Gemini AI API Key (Optional)</span>
            </div>
            <p style={{ fontSize: '0.8rem' }}>
              Add a Gemini API key for advanced multimodal reasoning and custom tutoring. If left empty, Linang AI operates with full local offline heuristics.
            </p>
            <input
              type="password"
              className="form-input"
              placeholder="AIzaSy..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
          </div>

          {/* Proactive Notification Settings */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                <Bell size={16} style={{ color: 'var(--color-warning)' }} />
                <span>Proactive Reminders & Notifications</span>
              </div>
              <button
                type="button"
                onClick={handleTestNotification}
                className="btn btn-subtle"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
              >
                Test Alert
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enableDesktopNotifications}
                onChange={(e) => setEnableDesktopNotifications(e.target.checked)}
              />
              <span>Enable Browser Desktop Push Notifications</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enableAudioChimes}
                onChange={(e) => setEnableAudioChimes(e.target.checked)}
              />
              <span>Enable Web Audio Synthesizer Chimes</span>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Default Reminder Thresholds before due date:
              </span>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  { offset: 1440, label: '24 Hours Before' },
                  { offset: 180, label: '3 Hours Before' },
                  { offset: 60, label: '1 Hour Before' },
                  { offset: 15, label: '15 Minutes Before' }
                ].map((item) => (
                  <label key={item.offset} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={defaultReminderOffsets.includes(item.offset)}
                      onChange={() => toggleOffset(item.offset)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Sound & Synthesizer Tone */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Volume2 size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>Synthesizer Chime Tone</span>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Alert Tone</label>
                <select
                  className="form-select"
                  value={alertTone}
                  onChange={(e) => {
                    setAlertTone(e.target.value);
                    handleTestSound(e.target.value);
                  }}
                >
                  <option value="chime">🎵 Harmonic Chime (Uplifting)</option>
                  <option value="bell">🔔 Tubular Bell (Resonant)</option>
                  <option value="marimba">🪵 Marimba Hit (Warm Wood)</option>
                  <option value="radar">📡 Modern Radar Pip</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Volume ({Math.round(soundVolume * 100)}%)</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--accent-primary)', marginTop: '0.5rem' }}
                />
              </div>
            </div>
          </div>

          {/* Backup & Local Data */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Data Storage & Portability</span>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportBackup}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                <Download size={14} />
                <span>Export JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                <Upload size={14} />
                <span>Import JSON Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />

              <button
                type="button"
                onClick={handleResetData}
                className="btn btn-danger-outline"
                style={{ fontSize: '0.8rem', marginLeft: 'auto' }}
              >
                <RotateCcw size={13} />
                <span>Reset to Sample Data</span>
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-subtle">
            Cancel
          </button>
          <button type="submit" form="settings-form" className="btn btn-primary">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
