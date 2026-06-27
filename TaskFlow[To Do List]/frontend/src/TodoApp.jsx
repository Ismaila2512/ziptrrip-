import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Edit3, Trash2, Clock, Play, Pause, RotateCcw, Maximize2, Minimize2, BarChart2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/todos';

function TodoApp() {
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', dueDate: '', urgency: 'low', importance: 'low' });
  const [newSubtask, setNewSubtask] = useState('');
  
  // Eisenhower & Analytics
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [zenMode, setZenMode] = useState(false);

  // Pomodoro state
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState('work'); // 'work', 'short', 'long'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (id) {
      fetchTodo(id);
    } else {
      setError('No Todo ID provided in the URL');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
        if (timerMode === 'work') {
          setTotalFocusTime(prev => {
            const newTotal = prev + 1;
            // Sync to backend every 60 seconds of focus
            if (newTotal % 60 === 0 && todo?.id) {
              fetch(`${API_URL}/${todo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ focusTime: newTotal })
              }).catch(err => console.error("Failed to sync focus time", err));
            }
            return newTotal;
          });
        }
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, timerMode, todo?.id]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const setMode = (mode) => {
    setTimerMode(mode);
    setTimerActive(false);
    if (mode === 'work') setTimeLeft(25 * 60);
    if (mode === 'short') setTimeLeft(5 * 60);
    if (mode === 'long') setTimeLeft(15 * 60);
  };

  const fetchTodo = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Todo not found');
        throw new Error('Failed to fetch todo details');
      }
      const data = await res.json();
      setTodo({ ...data, subtasks: data.subtasks || [] });
      setEditForm({
        title: data.title,
        description: data.description || '',
        dueDate: data.dueDate || '',
        urgency: data.urgency || 'low',
        importance: data.importance || 'low'
      });
      setTotalFocusTime(data.focusTime || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;

    try {
      const res = await fetch(`${API_URL}/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          dueDate: editForm.dueDate,
          urgency: editForm.urgency,
          importance: editForm.importance
        }),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      
      const updatedTodo = await res.json();
      setTodo({ ...updatedTodo, subtasks: updatedTodo.subtasks || [] });
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveSubtasks = async (updatedSubtasks) => {
    try {
      const res = await fetch(`${API_URL}/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtasks: updatedSubtasks }),
      });
      if (!res.ok) throw new Error('Failed to save subtasks');
      const updatedTodo = await res.json();
      setTodo({ ...updatedTodo, subtasks: updatedTodo.subtasks || [] });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const updatedSubtasks = [...(todo.subtasks || []), { id: crypto.randomUUID(), title: newSubtask, completed: false }];
    saveSubtasks(updatedSubtasks);
    setNewSubtask('');
  };

  const handleToggleSubtask = (subId) => {
    const updatedSubtasks = (todo.subtasks || []).map(st => 
      st.id === subId ? { ...st, completed: !st.completed } : st
    );
    saveSubtasks(updatedSubtasks);
  };

  const handleDeleteSubtask = (subId) => {
    const updatedSubtasks = (todo.subtasks || []).filter(st => st.id !== subId);
    saveSubtasks(updatedSubtasks);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading task details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <a href="/" className="btn btn-secondary">
          <ArrowLeft size={18} /> Back to List
        </a>
      </div>
    );
  }

  if (!todo) return null;

  return (
    <>
      {zenMode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#030305', zIndex: 9999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: '#fff'
        }}>
          <button 
            onClick={() => setZenMode(false)}
            style={{ position: 'absolute', top: '30px', right: '30px', background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            <Minimize2 size={18} /> Exit Zen Mode
          </button>
          
          <h2 style={{ fontSize: '1.5rem', color: '#a1a1aa', fontWeight: '400', marginBottom: '20px' }}>Deep Focus</h2>
          <h1 style={{ fontSize: '3rem', fontWeight: '600', marginBottom: '40px', maxWidth: '80%', textAlign: 'center' }}>{todo.title}</h1>
          
          <div style={{ fontSize: '8rem', fontWeight: '700', letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 40px rgba(139, 92, 246, 0.4)', marginBottom: '40px' }}>
            {formatTime(timeLeft)}
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => setTimerActive(!timerActive)} 
              className="glow-button" 
              style={{ padding: '16px 40px', borderRadius: '30px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              {timerActive ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start</>}
            </button>
          </div>
          
          <div style={{ position: 'absolute', bottom: '40px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={16} /> Total Focus Time: {Math.floor(totalFocusTime / 60)}m {totalFocusTime % 60}s
          </div>
        </div>
      )}

    <div className="container" style={{ display: zenMode ? 'none' : 'block' }}>
      <div className="header">
        <h1>Task Details</h1>
        <a href="/" className="btn btn-secondary">
          <ArrowLeft size={18} /> Back
        </a>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className="todo-detail">
          <div>
            <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#4b5563'}}>Task Title</label>
            <input
              type="text"
              className="todo-input"
              style={{width: '100%'}}
              value={editForm.title}
              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#4b5563'}}>Description</label>
            <textarea
              className="todo-input"
              style={{width: '100%', minHeight: '120px', resize: 'vertical'}}
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              placeholder="Add some details about this task..."
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#4b5563'}}>Due Date</label>
            <input
              type="date"
              className="todo-input"
              style={{width: '100%'}}
              value={editForm.dueDate}
              onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#4b5563'}}>Urgency</label>
              <select className="todo-select" style={{width: '100%'}} value={editForm.urgency} onChange={e => setEditForm({...editForm, urgency: e.target.value})}>
                <option value="low">Low</option>
                <option value="high">High (Urgent)</option>
              </select>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#4b5563'}}>Importance</label>
              <select className="todo-select" style={{width: '100%'}} value={editForm.importance} onChange={e => setEditForm({...editForm, importance: e.target.value})}>
                <option value="low">Low</option>
                <option value="high">High (Important)</option>
              </select>
            </div>
          </div>
          <div style={{display: 'flex', gap: '12px', marginTop: '10px'}}>
            <button type="submit" className="btn">
              <Save size={18} /> Save Changes
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              <X size={18} /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="todo-detail">
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h2 style={{ fontSize: '1.75rem', color: '#1f2937', margin: 0 }}>{todo.title}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {todo.urgency === 'high' && <span className="category-pill cat-urgent">Urgent</span>}
                  {todo.importance === 'high' && <span className="category-pill cat-work">Important</span>}
                  <span className="category-pill cat-other"><BarChart2 size={12}/> {Math.floor(totalFocusTime / 60)}m Focus</span>
                </div>
              </div>
              <div className={`status-badge ${todo.completed ? 'status-completed' : 'status-pending'}`}>
                {todo.completed ? '✓ Completed' : 'Pending'}
              </div>
            </div>
          </div>
          
          <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '12px' }}>Description</h3>
            <p style={{ color: '#374151', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
              {todo.description || <em style={{color: '#9ca3af'}}>No description provided.</em>}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '8px' }}>Created At</h3>
              <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>{new Date(todo.createdAt).toLocaleString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}</p>
            </div>
            {todo.dueDate && (
              <div>
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '8px' }}>Due Date</h3>
                <p style={{ 
                  color: (!todo.completed && new Date(todo.dueDate) < new Date(new Date().setHours(0,0,0,0))) ? '#ef4444' : '#4b5563', 
                  fontSize: '0.95rem',
                  fontWeight: (!todo.completed && new Date(todo.dueDate) < new Date(new Date().setHours(0,0,0,0))) ? '600' : 'normal'
                }}>
                  {new Date(todo.dueDate).toLocaleString(undefined, {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                  {!todo.completed && new Date(todo.dueDate) < new Date(new Date().setHours(0,0,0,0)) && ' (Overdue)'}
                </p>
              </div>
            )}
          </div>

          <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '10px' }}>
            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '12px' }}>Sub-tasks</h3>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(todo.subtasks || []).map(st => (
                <li key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                    <input type="checkbox" checked={st.completed} onChange={() => handleToggleSubtask(st.id)} style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#2563EB' }} />
                    <span style={{ textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? '#9ca3af' : '#1f2937' }}>{st.title}</span>
                  </label>
                  <button onClick={() => handleDeleteSubtask(st.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
              {(todo.subtasks || []).length === 0 && (
                <div style={{ color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic' }}>No sub-tasks added yet.</div>
              )}
            </ul>

            <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="todo-input" 
                placeholder="Add new sub-task..." 
                value={newSubtask} 
                onChange={e => setNewSubtask(e.target.value)}
                style={{ flex: 1, padding: '10px 14px' }}
              />
              <button type="submit" className="btn" style={{ padding: '10px 16px' }}>Add</button>
            </form>
          </div>

          <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '10px' }}>
            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} /> Pomodoro Timer
              </div>
              <button 
                onClick={() => setZenMode(true)}
                style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}
              >
                <Maximize2 size={14} /> Enter Zen Mode
              </button>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setMode('work')} 
                  style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #e5e7eb', background: timerMode === 'work' ? '#2563EB' : '#fff', color: timerMode === 'work' ? '#fff' : '#4b5563', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                >Focus (25m)</button>
                <button 
                  onClick={() => setMode('short')} 
                  style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #e5e7eb', background: timerMode === 'short' ? '#10b981' : '#fff', color: timerMode === 'short' ? '#fff' : '#4b5563', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                >Short Break (5m)</button>
                <button 
                  onClick={() => setMode('long')} 
                  style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #e5e7eb', background: timerMode === 'long' ? '#8b5cf6' : '#fff', color: timerMode === 'long' ? '#fff' : '#4b5563', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                >Long Break (15m)</button>
              </div>
              <div style={{ fontSize: '3.5rem', fontWeight: '700', color: '#1f2937', letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(timeLeft)}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setTimerActive(!timerActive)} 
                  className="btn" 
                  style={{ background: timerActive ? '#ef4444' : '#2563eb', padding: '10px 24px', borderRadius: '24px' }}
                >
                  {timerActive ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
                </button>
                <button 
                  onClick={() => setMode(timerMode)} 
                  className="btn btn-secondary" 
                  style={{ padding: '10px 24px', borderRadius: '24px' }}
                >
                  <RotateCcw size={18} /> Reset
                </button>
              </div>
            </div>
          </div>

          <div style={{marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '24px'}}>
            <button className="btn" onClick={() => setIsEditing(true)}>
              <Edit3 size={18} /> Edit Details
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default TodoApp;
