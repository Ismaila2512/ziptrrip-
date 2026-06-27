import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckCircle2, Circle, Trash2, ArrowRight,
  Tag, GripVertical, Calendar, BarChart2, Bell, BellRing
} from 'lucide-react';

export function SortableTodoItem({ todo, onToggleComplete, onDelete, reminder, onOpenReminder }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  // Determine reminder state
  const hasActiveReminder = reminder && !reminder.fired;
  const isFired = reminder?.fired;

  // Format reminder time short
  const reminderLabel = reminder?.reminderAt
    ? new Date(reminder.reminderAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`todo-item ${todo.completed ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      {/* Drag handle */}
      <div className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={20} />
      </div>

      {/* Main content — toggle on click */}
      <div
        className="todo-content"
        onClick={() => onToggleComplete(todo)}
      >
        {todo.completed
          ? <CheckCircle2 size={24} style={{ color: '#7c3aed', flexShrink: 0 }} />
          : <Circle size={24} style={{ color: '#c4b5fd', flexShrink: 0 }} />
        }
        <div className="todo-info">
          <span className="todo-title">{todo.title}</span>
          {/* Pill row */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`category-pill cat-${(todo.category || 'Other').toLowerCase()}`}>
              <Tag size={11} /> {todo.category || 'Other'}
            </span>
            {todo.urgency === 'high' && <span className="category-pill cat-urgent">Urgent</span>}
            {todo.importance === 'high' && <span className="category-pill cat-work">Important</span>}
            {todo.focusTime > 0 && (
              <span className="category-pill cat-other">
                <BarChart2 size={11} /> {Math.floor(todo.focusTime / 60)}m Focus
              </span>
            )}
            {todo.dueDate && (
              <span className="category-pill" style={{
                background: (!todo.completed && new Date(todo.dueDate) < new Date())
                  ? '#fee2e2' : '#f3f4f6',
                color: (!todo.completed && new Date(todo.dueDate) < new Date())
                  ? '#ef4444' : '#6b7280',
              }}>
                <Calendar size={11} /> {new Date(todo.dueDate).toLocaleDateString()}
              </span>
            )}
            {/* Reminder badge */}
            {hasActiveReminder && (
              <span className="category-pill" style={{
                background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                color: '#6d28d9', gap: '4px',
              }}>
                <BellRing size={11} /> {reminderLabel}
              </span>
            )}
            {isFired && (
              <span className="category-pill" style={{
                background: '#fef3c7', color: '#92400e',
              }}>
                🔔 Reminded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="todo-actions">
        {/* Bell button */}
        <button
          className="btn btn-secondary"
          style={{
            padding: '8px 10px',
            position: 'relative',
            borderColor: hasActiveReminder ? '#c4b5fd' : undefined,
            background: hasActiveReminder
              ? 'linear-gradient(135deg, #ede9fe, #ddd6fe)' : undefined,
            color: hasActiveReminder ? '#7c3aed' : undefined,
          }}
          onClick={(e) => { e.stopPropagation(); onOpenReminder(); }}
          aria-label="Set reminder"
          title={hasActiveReminder ? `Reminder: ${reminderLabel}` : 'Set reminder / Add to calendar'}
        >
          {hasActiveReminder
            ? <BellRing size={16} />
            : <Bell size={16} />
          }
          {hasActiveReminder && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#7c3aed', border: '2px solid #fff',
            }} />
          )}
        </button>

        {/* Detail view */}
        <a
          href={`/todo.html?id=${todo.id}`}
          className="btn btn-secondary"
          style={{ padding: '8px 12px' }}
          aria-label="View details"
        >
          <ArrowRight size={18} />
        </a>

        {/* Delete */}
        <button
          className="btn btn-danger"
          style={{ padding: '8px 12px' }}
          onClick={(e) => { e.stopPropagation(); onDelete(todo.id); }}
          aria-label="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  );
}
