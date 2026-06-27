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
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(79, 70, 229, 0.08)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '460px',
        background: 'rgba(255,255,255,0.97)',
        borderRadius: '24px',
        padding: '28px',
        border: '1.5px solid rgba(199,210,254,0.8)',
        boxShadow: '0 20px 60px rgba(99,102,241,0.15), 0 4px 16px rgba(0,0,0,0.06)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Bell size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e1b4b' }}>Set Reminder</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', marginTop: '1px', maxWidth: '250px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {todo.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', cursor: 'pointer',
            width: '32px', height: '32px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Notification permission banner */}
        {notifStatus !== 'granted' && (
          <div style={{
            background: notifStatus === 'denied'
              ? 'linear-gradient(135deg, #fff1f1, #fee2e2)'
              : 'linear-gradient(135deg, #fef9c3, #fef08a)',
            border: `1px solid ${notifStatus === 'denied' ? '#fecaca' : '#fde68a'}`,
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700',
                color: notifStatus === 'denied' ? '#b91c1c' : '#92400e' }}>
                {notifStatus === 'denied' ? '🚫 Notifications blocked' : '🔔 Enable browser notifications'}
              </div>
              <div style={{ fontSize: '0.72rem', color: notifStatus === 'denied' ? '#dc2626' : '#a16207', marginTop: '2px' }}>
                {notifStatus === 'denied'
                  ? 'Allow in browser settings to receive alerts.'
                  : 'Get alerted even when the tab is in the background.'}
              </div>
            </div>
            {notifStatus !== 'denied' && (
              <button onClick={handleEnableNotifs} style={{
                padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: '#f59e0b', color: '#fff', fontSize: '0.78rem', fontWeight: '700', flexShrink: 0,
              }}>
                Allow
              </button>
            )}
          </div>
        )}

        {/* Date + Time pickers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase',
              letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              <Calendar size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />Date
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setDate(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                border: '1.5px solid rgba(199,210,254,0.8)',
                background: '#f8faff', color: '#1e1b4b', fontSize: '14px',
                fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase',
              letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              <Clock size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />Time
            </label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                border: '1.5px solid rgba(199,210,254,0.8)',
                background: '#f8faff', color: '#1e1b4b', fontSize: '14px',
                fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
              }}
            />
          </div>
        </div>

        {/* Advance reminder */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase',
            letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
            <AlarmClock size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />Notify me before
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[5, 10, 15, 30, 60].map(m => (
              <button
                key={m}
                onClick={() => setAdvanceMinutes(m)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', border: '1.5px solid',
                  borderColor: advanceMinutes === m ? '#7c3aed' : 'rgba(199,210,254,0.8)',
                  background: advanceMinutes === m ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#f8faff',
                  color: advanceMinutes === m ? '#fff' : '#64748b',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                {m < 60 ? `${m}m` : '1h'}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming reminder info */}
        {reminder && !reminder.fired && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            border: '1px solid #bbf7d0',
            borderRadius: '12px', padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#15803d' }}>✅ Reminder Active</div>
              <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '2px' }}>
                {new Date(reminder.reminderAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {SNOOZE_OPTIONS.slice(0, 3).map(m => (
                <button
                  key={m}
                  onClick={() => { onSnooze(todo.id, m); onClose(); }}
                  title={`Snooze ${m}m`}
                  style={{
                    padding: '5px 10px', borderRadius: '8px', border: 'none',
                    background: '#dcfce7', color: '#15803d', fontSize: '11px',
                    fontWeight: '700', cursor: 'pointer',
                  }}
                >
                  +{m}m
                </button>
              ))}
            </div>
          </div>
        )}

        {isPast && (
          <div style={{ color: '#ef4444', fontSize: '0.78rem', marginBottom: '12px', fontWeight: '600',
            background: '#fff1f1', padding: '10px 14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
            ⚠️ Alert would fire at <b>{notifyLabel}</b> which is already in the past. Pick a later time.
          </div>
        )}
        {!isPast && (
          <div style={{ color: '#059669', fontSize: '0.78rem', marginBottom: '12px', fontWeight: '600',
            background: '#f0fdf4', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bbf7d0',
            display: 'flex', alignItems: 'center', gap: '6px' }}>
            ✅ Alert will fire at <b>{notifyLabel}</b>
            {advanceMinutes > 0 && <span style={{color:'#16a34a'}}>({advanceMinutes}m before meeting)</span>}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Save reminder */}
          <button
            onClick={handleSave}
            disabled={isPast}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: '12px', border: 'none',
              background: saved
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #7c3aed, #2563eb)',
              color: '#fff', fontWeight: '700', fontSize: '14px', cursor: isPast ? 'not-allowed' : 'pointer',
              opacity: isPast ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
            }}
          >
            <Bell size={15} />
            {saved ? '✓ Reminder Saved!' : 'Set Reminder'}
          </button>

          {/* Export to .ics */}
          <button
            onClick={handleDownloadICS}
            title="Download .ics — open with Google Calendar, Apple Calendar, Outlook"
            style={{
              flex: 1, padding: '11px 16px', borderRadius: '12px',
              border: '1.5px solid rgba(199,210,254,0.8)',
              background: icsSuccess ? '#dcfce7' : '#f8faff',
              color: icsSuccess ? '#15803d' : '#4f46e5',
              fontWeight: '700', fontSize: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Download size={15} />
            {icsSuccess ? '✓ Downloaded!' : 'Add to Calendar (.ics)'}
          </button>
        </div>

        {reminder && (
          <button
            onClick={() => { onClearReminder(todo.id); onClose(); }}
            style={{
              width: '100%', marginTop: '10px', padding: '9px',
              background: 'none', border: '1.5px solid #fecaca',
              borderRadius: '10px', color: '#ef4444', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <BellOff size={14} /> Remove Reminder
          </button>
        )}

        {/* Help text */}
        <p style={{ margin: '14px 0 0', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', lineHeight: '1.5' }}>
          💡 <b>.ics</b> files open directly in Google Calendar, Apple Calendar &amp; Outlook — no account needed.
        </p>
      </div>
    </div>
  );
}
