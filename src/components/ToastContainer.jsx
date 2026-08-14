import React from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-live="polite">
      {toasts.map((toast) => {
        let Icon = Info;
        let iconColor = '#3b82f6';
        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconColor = '#10b981';
        } else if (toast.type === 'error' || toast.urgency === 'urgent') {
          Icon = AlertCircle;
          iconColor = '#ef4444';
        } else if (toast.type === 'reminder') {
          Icon = Bell;
          iconColor = '#f59e0b';
        }

        return (
          <div key={toast.id} className="toast-item">
            <Icon size={18} style={{ color: iconColor, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{toast.title}</span>
              {toast.message && (
                <span style={{ fontSize: '0.775rem', opacity: 0.85 }}>{toast.message}</span>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{ color: 'inherit', opacity: 0.6, padding: '2px', background: 'none' }}
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
