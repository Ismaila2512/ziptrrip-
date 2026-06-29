import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, MoreHorizontal, Calendar, Bell, BellRing, Clock } from 'lucide-react';

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
  };

  const hasActiveReminder = reminder && !reminder.fired;
  const isFired = reminder?.fired;

  const reminderLabel = reminder?.reminderAt
    ? new Date(reminder.reminderAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${todo.completed ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </div>

      <div 
        className={`task-checkbox ${todo.completed ? 'checked' : ''}`} 
        onClick={() => onToggleComplete(todo)}
      >
        {todo.completed && <Check size={12} strokeWidth={3} />}
      </div>

      <div className="task-content">
        <span className="task-title">{todo.title}</span>
        <div className="task-meta">
          <span className={`badge badge-category-${(todo.category || 'other').toLowerCase()}`}>
            {todo.category || 'Other'}
          </span>
          {todo.urgency === 'high' && <span className="badge badge-urgent">Urgent</span>}
          {todo.importance === 'high' && <span className="badge badge-important">Important</span>}
          
          {todo.dueDate && (
            <span className={`badge badge-date ${(!todo.completed && new Date(todo.dueDate) < new Date()) ? 'overdue' : ''}`}>
              <Calendar size={12} /> {new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
          
          {hasActiveReminder && (
            <span className="badge badge-reminder">
              <BellRing size={12} /> {reminderLabel}
            </span>
          )}
          
          {todo.focusTime > 0 && (
            <span className="badge badge-focus">
              <Clock size={12} /> {Math.floor(todo.focusTime / 60)}m
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <button
          className={`task-action-btn ${hasActiveReminder ? 'active-reminder' : ''}`}
          onClick={(e) => { e.stopPropagation(); onOpenReminder(); }}
          title="Reminder"
        >
          {hasActiveReminder ? <BellRing size={16} /> : <Bell size={16} />}
        </button>
        <button
          className="task-action-btn delete"
          onClick={(e) => { e.stopPropagation(); onDelete(todo.id); }}
          title="Delete"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
