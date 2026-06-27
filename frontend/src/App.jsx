import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, Circle, Trash2, Plus, ArrowRight, Tag, BarChart2, X, Activity, Bell } from 'lucide-react';
import { useReminders } from './useReminders';
import { ReminderModal } from './ReminderModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTodoItem } from './SortableTodoItem';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const API_URL = 'http://localhost:5000/api/todos';
const CATEGORIES = ['Personal', 'Work', 'Urgent', 'Other'];

function App() {
  const [todos, setTodos] = useState([]);
  const [history, setHistory] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [filterCategory, setFilterCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [reminderTodo, setReminderTodo] = useState(null); // todo obj whose reminder modal is open
  const [alertToast, setAlertToast] = useState(null);  // { title, advanceMinutes }
  const toastTimer = useRef(null);

  // Called when any reminder fires — shows in-app banner (guaranteed fallback)
  const handleAlert = useCallback(({ title, advanceMinutes }) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setAlertToast({ title, advanceMinutes });
    // Auto-dismiss after 30 s
    toastTimer.current = setTimeout(() => setAlertToast(null), 30000);
  }, []);

  const { reminders, setReminder, clearReminder, snooze } = useReminders(handleAlert);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch todos');
      const data = await res.json();
      setTodos(data);

      try {
        const histRes = await fetch(API_URL.replace('/todos', '/history'));
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData);
        }
      } catch (e) {
        console.error("Failed to fetch history");
      }

      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTodoTitle, category: newCategory }),
      });
      if (!res.ok) throw new Error('Failed to add todo');
      
      const newTodo = await res.json();
      setTodos([...todos, newTodo]);
      setNewTodoTitle('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      const res = await fetch(`${API_URL}/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      
      const updatedTodo = await res.json();
      setTodos(todos.map(t => t.id === updatedTodo.id ? updatedTodo : t));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;
    
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete todo');
      
      setTodos(todos.filter(t => t.id !== id));
      fetchTodos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL tasks? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(API_URL, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete all todos');
      
      setTodos([]);
      fetchTodos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const oldIndex = todos.findIndex(t => t.id === active.id);
      const newIndex = todos.findIndex(t => t.id === over.id);
      
      const newTodos = arrayMove(todos, oldIndex, newIndex);
      setTodos(newTodos);

      try {
        const res = await fetch(`${API_URL}/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderedIds: newTodos.map(t => t.id) }),
        });
        if (!res.ok) throw new Error('Failed to save order');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const filteredTodos = todos.filter(todo => filterCategory === 'All' || todo.category === filterCategory);

  // Analytics Calculations
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const totalFocusTime = todos.reduce((acc, curr) => acc + (curr.focusTime || 0), 0);
  
  const urgentTasks = todos.filter(t => t.urgency === 'high').length;
  const importantTasks = todos.filter(t => t.importance === 'high').length;

  return (
    <>
      {/* ── In-app alert toast ─────────────────────────────────────── */}
      {alertToast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999, width: 'min(480px, calc(100vw - 40px))',
          background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
          color: '#fff', borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 12px 40px rgba(124,58,237,0.45)',
          display: 'flex', alignItems: 'flex-start', gap: '14px',
          animation: 'slideDown 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>🔔</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '3px' }}>
              {alertToast.advanceMinutes > 0
                ? `Meeting in ${alertToast.advanceMinutes} minute${alertToast.advanceMinutes !== 1 ? 's' : ''}!`
                : 'Time for your task!'}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{alertToast.title}</div>
          </div>
          <button
            onClick={() => setAlertToast(null)}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
              color: '#fff', borderRadius: '8px', padding: '4px 8px',
              fontSize: '13px', fontWeight: '700', flexShrink: 0,
            }}
          >Dismiss</button>
        </div>
      )}
    <div className="layout-wrapper">
      <div className="container">
        <div className="header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>My Tasks</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleDeleteAll} style={{ borderRadius: '20px', padding: '8px 16px', fontSize: '13px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171' }}>
              <Trash2 size={16} /> Delete All
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAnalytics(!showAnalytics)} style={{ borderRadius: '20px', padding: '8px 16px', fontSize: '13px' }}>
              <BarChart2 size={16} /> Analytics
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <form className="todo-form" onSubmit={handleAddTodo}>
          <input
            type="text"
            className="todo-input"
            placeholder="What needs to be done?"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
          />
          <select 
            className="todo-select" 
            value={newCategory} 
            onChange={(e) => setNewCategory(e.target.value)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button type="submit" className="btn" aria-label="Add task">
            <Plus size={20} /> Add
          </button>
        </form>

        <div className="filter-bar">
          {['All', ...CATEGORIES].map(cat => (
            <button 
              key={cat} 
              className={`filter-pill ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <ul className="todo-list">
              {filteredTodos.length === 0 ? (
                <div className="loading" style={{ opacity: 0.7 }}>
                  <CheckCircle2 size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
                  <p>No tasks found.</p>
                </div>
              ) : (
                <SortableContext 
                  items={filteredTodos.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredTodos.map(todo => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDelete}
                      reminder={reminders[todo.id]}
                      onOpenReminder={() => setReminderTodo(todo)}
                    />
                  ))}
                </SortableContext>
              )}
            </ul>
          </DndContext>
        )}
      </div>

      <div className={`analytics-panel ${showAnalytics ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Activity size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1e1b4b', letterSpacing: '-0.02em' }}>Productivity Analytics</h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', marginTop: '1px' }}>{totalTasks} total tasks tracked</p>
            </div>
          </div>
          <button
            onClick={() => setShowAnalytics(false)}
            style={{
              background: '#f1f5f9', border: 'none', cursor: 'pointer',
              width: '32px', height: '32px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          {/* Completion Donut */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            padding: '16px', borderRadius: '16px',
            border: '1px solid #bbf7d0', textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '4px' }}>Completion Rate</div>
            <div style={{ height: '90px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Done', value: completedTasks || 0 },
                      { name: 'Left', value: Math.max(totalTasks - completedTasks, 0) }
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={28} outerRadius={38}
                    dataKey="value" stroke="none"
                    startAngle={90} endAngle={-270}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#d1fae5" />
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + ' tasks', n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#059669', lineHeight: 1 }}>{completionRate}%</div>
            <div style={{ fontSize: '0.75rem', color: '#6ee7b7', marginTop: '2px' }}>{completedTasks}/{totalTasks} done</div>
          </div>

          {/* Focus Time */}
          <div style={{
            background: 'linear-gradient(135deg, #faf5ff, #ede9fe)',
            padding: '16px', borderRadius: '16px',
            border: '1px solid #ddd6fe',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '12px' }}>Focus Time</div>
            <div style={{ fontSize: '2.8rem', fontWeight: '800', color: '#7c3aed', lineHeight: 1, letterSpacing: '-0.04em' }}>
              {Math.floor(totalFocusTime / 60)}
              <span style={{ fontSize: '1rem', color: '#a78bfa', fontWeight: '600' }}>m</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a78bfa', marginTop: '6px' }}>Across all tasks</div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
          padding: '16px', borderRadius: '16px',
          border: '1px solid #fed7aa'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '12px' }}>Priority Breakdown</div>
          {(urgentTasks === 0 && importantTasks === 0) ? (
            <div style={{ textAlign: 'center', padding: '16px', color: '#fb923c', fontSize: '0.85rem' }}>
              No urgent or important tasks yet.
            </div>
          ) : (
            <div style={{ height: '90px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: '🔴 Urgent', value: urgentTasks },
                    { name: '🔵 Important', value: importantTasks }
                  ]}
                  layout="vertical"
                  margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
                >
                  <XAxis type="number" hide domain={[0, Math.max(urgentTasks, importantTasks, 1)]} />
                  <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 12, fill: '#92400e', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(251,191,36,0.1)' }} formatter={(v) => [v + ' tasks']} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                    <Cell fill="#ef4444" />
                    <Cell fill="#3b82f6" />
                    <LabelList dataKey="value" position="right" style={{ fontSize: 13, fontWeight: 700, fill: '#92400e' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Task History */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          padding: '16px', borderRadius: '16px',
          border: '1px solid #e2e8f0', marginTop: '12px',
          flex: 1, overflowY: 'auto'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '12px' }}>Task History</div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.85rem' }}>
              No tasks have been deleted yet.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.slice().reverse().map((item, idx) => (
                <li key={item.id || idx} style={{ 
                  background: '#fff', padding: '12px', borderRadius: '12px', 
                  border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>{item.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                      Deleted on: {new Date(item.deletedAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', color: '#64748b' }}>
                    {item.category}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>

      {reminderTodo && (
        <ReminderModal
          todo={reminderTodo}
          reminder={reminders[reminderTodo.id]}
          onClose={() => setReminderTodo(null)}
          onSetReminder={(todo, at, mins) => setReminder(todo, at, mins)}
          onClearReminder={(id) => { clearReminder(id); setReminderTodo(null); }}
          onSnooze={snooze}
        />
      )}
    </>
  );
}

export default App;
