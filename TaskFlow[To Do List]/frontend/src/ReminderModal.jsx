import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff, Calendar, Clock, Download, AlarmClock } from 'lucide-react';
import { buildICS, downloadICS, requestNotifPermission } from './useReminders';

const SNOOZE_OPTIONS = [5, 15, 30, 60];

export function ReminderModal({ todo, reminder, onClose, onSetReminder, onClearReminder, onSnooze }) {
  // Default: today at 09:00
  const defaultDate = new Date();
  defaultDate.setHours(9, 0, 0, 0);

  const [date, setDate] = useState(
    reminder?.reminderAt
      ? new Date(reminder.reminderAt).toISOString().slice(0, 10)
      : defaultDate.toISOString().slice(0, 10)
  );
  const [time, setTime] = useState(
    reminder?.reminderAt
      ? new Date(reminder.reminderAt).toTimeString().slice(0, 5)
      : '09:00'
  );
  const [advanceMinutes, setAdvanceMinutes] = useState(reminder?.reminderMinutes ?? 15);
  const [notifStatus, setNotifStatus] = useState(Notification?.permission ?? 'unsupported');
  const [saved, setSaved] = useState(false);
  const [icsSuccess, setIcsSuccess] = useState(false);

  useEffect(() => {
    if (Notification?.permission) setNotifStatus(Notification.permission);
  }, []);

  const reminderDateTime = new Date(`${date}T${time}`);
  // The actual notification fires BEFORE the meeting by advanceMinutes
  const notifyAt = new Date(reminderDateTime.getTime() - advanceMinutes * 60 * 1000);
  const isPast = notifyAt < new Date();
  const notifyLabel = notifyAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  async function handleEnableNotifs() {
    const result = await requestNotifPermission();
    setNotifStatus(result);
  }

  function handleSave() {
    onSetReminder(todo, reminderDateTime.toISOString(), advanceMinutes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDownloadICS() {
    const start = reminderDateTime;
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hr event
    const ics = buildICS({
      title: todo.title,
      description: `Task from TaskFlow. Category: ${todo.category || 'Other'}`,
      start,
      end,
      reminderMinutes: advanceMinutes,
    });
    downloadICS(ics, `${todo.title.replace(/[^a-z0-9]/gi, '_')}.ics`);
    setIcsSuccess(true);
    setTimeout(() => setIcsSuccess(false), 2500);
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content reminder-modal-content">
        
        {/* Header */}
        <div className="reminder-header">
          <div className="reminder-header-info">
            <div className="reminder-icon-box">
              <Bell size={16} color="var(--card-bg)" />
            </div>
            <div>
              <h3 className="reminder-title">Set Reminder</h3>
              <p className="reminder-subtitle">
                {todo.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={18} />
          </button>
        </div>

        {/* Notification permission banner */}
        {notifStatus !== 'granted' && (
          <div className={`notification-banner ${notifStatus === 'denied' ? 'denied' : 'warning'}`}>
            <div>
              <div className="notification-banner-title">
                {notifStatus === 'denied' ? 'Notifications blocked' : 'Enable browser notifications'}
              </div>
              <div className="notification-banner-desc">
                {notifStatus === 'denied'
                  ? 'Allow in browser settings to receive alerts.'
                  : 'Get alerted even when the tab is in the background.'}
              </div>
            </div>
            {notifStatus !== 'denied' && (
              <button onClick={handleEnableNotifs} className="btn-primary btn-sm" style={{ flexShrink: 0 }}>
                Allow
              </button>
            )}
          </div>
        )}

        {/* Date + Time pickers */}
        <div className="reminder-datetime-grid">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">
              <Calendar size={12} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />Date
            </label>
            <input
              type="date"
              className="form-input"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">
              <Clock size={12} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />Time
            </label>
            <input
              type="time"
              className="form-input"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* Advance reminder */}
        <div className="reminder-advance-section">
          <label className="input-label">
            <AlarmClock size={12} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />Notify me before
          </label>
          <div className="reminder-chips">
            {[5, 10, 15, 30, 60].map(m => (
              <button
                key={m}
                onClick={() => setAdvanceMinutes(m)}
                className={`reminder-chip ${advanceMinutes === m ? 'active' : ''}`}
              >
                {m < 60 ? `${m}m` : '1h'}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming reminder info */}
        {reminder && !reminder.fired && (
          <div className="reminder-active-banner">
            <div>
              <div className="reminder-active-title">Reminder Active</div>
              <div className="reminder-active-time">
                {new Date(reminder.reminderAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {SNOOZE_OPTIONS.slice(0, 3).map(m => (
                <button
                  key={m}
                  onClick={() => { onSnooze(todo.id, m); onClose(); }}
                  title={`Snooze ${m}m`}
                  className="snooze-btn"
                >
                  +{m}m
                </button>
              ))}
            </div>
          </div>
        )}

        {isPast && (
          <div className="alert-banner error">
            Alert would fire at <b>{notifyLabel}</b> which is already in the past. Pick a later time.
          </div>
        )}
        {!isPast && (
          <div className="alert-banner success">
            Alert will fire at <b>{notifyLabel}</b>
            {advanceMinutes > 0 && <span className="alert-banner-muted">({advanceMinutes}m before)</span>}
          </div>
        )}

        {/* Actions */}
        <div className="reminder-actions">
          <div className="reminder-action-row">
            <button
              onClick={handleSave}
              disabled={isPast}
              className={`btn-primary ${isPast ? 'disabled' : ''} ${saved ? 'saved' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Bell size={16} />
              {saved ? 'Saved!' : 'Set Reminder'}
            </button>
            <button
              onClick={handleDownloadICS}
              title="Download .ics — open with Google Calendar, Apple Calendar, Outlook"
              className={`btn-ghost btn-ghost-download ${icsSuccess ? 'ics-download-success' : ''}`}
            >
              <Download size={16} />
              {icsSuccess ? 'Downloaded!' : 'Add to Calendar'}
            </button>
          </div>

          {reminder && (
            <button
              onClick={() => { onClearReminder(todo.id); onClose(); }}
              className="btn-ghost-danger-full"
            >
              <BellOff size={16} /> Remove Reminder
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
