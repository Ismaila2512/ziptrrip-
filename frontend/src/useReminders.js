/**
 * useReminders — Calendar Alert System
 * Fixed: scheduleNotif now subtracts advanceMinutes from reminderAt
 * Added: in-app polling fallback (fires even if browser notifs are blocked)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const LS_KEY = 'taskflow_reminders';

// ── helpers ──────────────────────────────────────────────────────────────────

export function loadReminders() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveReminders(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

/** Format date as ICS timestamp: 20240627T143000Z */
function toICS(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/** Build an RFC-5545 .ics string for a single event */
export function buildICS({ title, description = '', start, end, reminderMinutes = 15 }) {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@taskflow`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskFlow//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICS(new Date())}`,
    `DTSTART:${toICS(start)}`,
    `DTEND:${toICS(end)}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description}` : '',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${title}`,
    `TRIGGER:-PT${reminderMinutes}M`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

/** Trigger download of an .ics file */
export function downloadICS(icsContent, filename = 'task.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Request browser notification permission */
export async function requestNotifPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result;
}

/** Fire a browser notification */
function fireBrowserNotif(title, body) {
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  new Notification(`🔔 ${title}`, {
    body,
    icon: '/favicon.ico',
    requireInteraction: true, // stays until dismissed
  });
  return true;
}

// ── hook ─────────────────────────────────────────────────────────────────────

export function useReminders(onAlert) {
  // onAlert(reminder) — called when a reminder fires (for in-app toast fallback)
  const [reminders, setReminders] = useState(loadReminders);
  const timers = useRef({});

  /**
   * KEY FIX: fireAt = reminderAt (meeting time) − advanceMinutes
   * e.g. meeting at 10:53, advance 5m → fires at 10:48
   */
  const scheduleNotif = useCallback((todoId, title, reminderAt, advanceMinutes = 0) => {
    // Clear any existing timer
    if (timers.current[todoId]) clearTimeout(timers.current[todoId]);

    const meetingTime = new Date(reminderAt).getTime();
    const fireAt = meetingTime - advanceMinutes * 60 * 1000;
    const delay = fireAt - Date.now();

    console.log(
      `[TaskFlow] Scheduling reminder for "${title}"`,
      `| Meeting: ${new Date(meetingTime).toLocaleTimeString()}`,
      `| Notify at: ${new Date(fireAt).toLocaleTimeString()}`,
      `| Delay: ${Math.round(delay / 1000)}s`
    );

    if (delay <= 0) {
      console.warn('[TaskFlow] Reminder time already passed, skipping.');
      return;
    }

    timers.current[todoId] = setTimeout(() => {
      // 1. Try browser notification
      const sent = fireBrowserNotif(
        'Meeting Reminder',
        `Don't forget: "${title}" starts in ${advanceMinutes} minute${advanceMinutes !== 1 ? 's' : ''}!`
      );

      // 2. Always fire in-app alert (guaranteed fallback)
      if (onAlert) onAlert({ todoId, title, advanceMinutes });

      // 3. Play a beep sound via AudioContext (no file needed)
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.25, 0.5].forEach(t => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
          osc.start(ctx.currentTime + t);
          osc.stop(ctx.currentTime + t + 0.3);
        });
      } catch (e) {/* AudioContext blocked */ }

      // 4. Mark as fired in storage
      setReminders(prev => {
        const next = { ...prev, [todoId]: { ...prev[todoId], fired: true } };
        saveReminders(next);
        return next;
      });
    }, delay);
  }, [onAlert]);

  // On mount: reschedule any pending reminders from localStorage
  useEffect(() => {
    const stored = loadReminders();
    Object.entries(stored).forEach(([id, rem]) => {
      if (!rem.fired && rem.reminderAt) {
        scheduleNotif(id, rem.title, rem.reminderAt, rem.reminderMinutes ?? 0);
      }
    });
    return () => Object.values(timers.current).forEach(clearTimeout);
  }, [scheduleNotif]);

  const setReminder = useCallback((todo, reminderAt, reminderMinutes = 15) => {
    const next = {
      ...loadReminders(),
      [todo.id]: {
        todoId: todo.id,
        title: todo.title,
        reminderAt,          // ISO — the meeting/event time
        reminderMinutes,     // how many minutes BEFORE to fire the alert
        fired: false,
        createdAt: new Date().toISOString(),
      },
    };
    saveReminders(next);
    setReminders(next);
    scheduleNotif(todo.id, todo.title, reminderAt, reminderMinutes);
  }, [scheduleNotif]);

  const clearReminder = useCallback((todoId) => {
    if (timers.current[todoId]) clearTimeout(timers.current[todoId]);
    const next = { ...loadReminders() };
    delete next[todoId];
    saveReminders(next);
    setReminders(next);
  }, []);

  const snooze = useCallback((todoId, minutes = 15) => {
    setReminders(prev => {
      const rem = prev[todoId];
      if (!rem) return prev;
      // Snooze = fire again in N minutes from NOW (ignore advance offset)
      const newMeetingTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      const next = { ...prev, [todoId]: { ...rem, reminderAt: newMeetingTime, reminderMinutes: 0, fired: false } };
      saveReminders(next);
      scheduleNotif(todoId, rem.title, newMeetingTime, 0);
      return next;
    });
  }, [scheduleNotif]);

  return { reminders, setReminder, clearReminder, snooze };
}
