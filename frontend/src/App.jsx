import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckCircle2, Circle, Trash2, Plus, ArrowRight, Tag, BarChart2, X, Activity, 
  Bell, Check, Search, Moon, Sun, Menu, LayoutDashboard, Calendar, Inbox, CheckSquare, Clock
} from 'lucide-react';
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
import { Routes, Route, Link, useLocation } from 'react-router-dom';
const API_URL = '/api/todos';
const CATEGORIES = ['Personal', 'Work', 'Urgent', 'Other'];

import * as chrono from 'chrono-node';

// -----------------------------------------------------------------
// COMPONENTS
// -----------------------------------------------------------------

const Sidebar = ({ setShowAnalytics, showAnalytics, showOverviewPanel, setShowOverviewPanel, sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const path = location.pathname;

  const closeMobile = () => {
    // Only close on mobile (below 768px)
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'sidebar-closed'}`}>
      <div className="sidebar-header-row">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Check size={16} strokeWidth={3} />
          </div>
          <div className="sidebar-logo-text">TaskFlow</div>
        </div>
        <button
          className="sidebar-collapse-btn"
          onClick={() => setShowOverviewPanel(!showOverviewPanel)}
          title={showOverviewPanel ? 'Hide overview panel' : 'Show overview panel'}
        >
          {showOverviewPanel ? <X size={14} /> : <Menu size={14} />}
        </button>
      </div>
      
      <div className="nav-section">
        <div className="nav-section-title">Overview</div>
        <Link to="/" className={`nav-item ${path === '/' && !showAnalytics ? 'active' : ''}`} onClick={() => { setShowAnalytics(false); closeMobile(); }}>
          <LayoutDashboard size={16} /> Dashboard
        </Link>
        <Link to="/today" className={`nav-item ${path === '/today' && !showAnalytics ? 'active' : ''}`} onClick={() => { setShowAnalytics(false); closeMobile(); }}>
          <Calendar size={16} /> Today
        </Link>
        <Link to="/upcoming" className={`nav-item ${path === '/upcoming' && !showAnalytics ? 'active' : ''}`} onClick={() => { setShowAnalytics(false); closeMobile(); }}>
          <Inbox size={16} /> Upcoming
        </Link>
        <Link to="/completed" className={`nav-item ${path === '/completed' && !showAnalytics ? 'active' : ''}`} onClick={() => { setShowAnalytics(false); closeMobile(); }}>
          <CheckSquare size={16} /> Completed
        </Link>
      </div>
      
      <div className="nav-section">
        <div className="nav-section-title">Analytics</div>
        <button className={`nav-item ${showAnalytics ? 'active' : ''}`} onClick={() => { setShowAnalytics(true); closeMobile(); }}>
          <BarChart2 size={16} /> Analytics
        </button>
      </div>
      
    </aside>
  );
};

const DirectedPage = ({ title, subtitle, icon, todos, onToggleComplete, onDelete, reminders, setReminderTodo, onAddClick, sensors, handleDragEnd }) => (
  <div className="directed-page animate-fade-in" style={{ padding: '0 24px' }}>
    <div className="greeting-section" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
      <div style={{ padding: '18px', background: 'var(--card-bg)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <h2 className="greeting-title" style={{ margin: 0 }}>{title}</h2>
        <p className="greeting-subtitle" style={{ margin: '6px 0 0 0' }}>{subtitle}</p>
      </div>
    </div>
    
    <div className="task-list-section">
      {todos.length === 0 ? (
        <EmptyState onAddClick={onAddClick} />
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SortableContext 
              items={todos.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {todos.map(todo => (
                <SortableTodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  reminder={reminders[todo?.id]}
                  onOpenReminder={() => setReminderTodo(todo)}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}
    </div>
  </div>
);

const TopNavbar = ({ onAddClick, searchQuery, setSearchQuery, isDarkMode, setIsDarkMode, onMenuClick }) => (
  <header className="top-navbar">
    {/* Mobile hamburger — only visible on small screens via CSS */}
    <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="Toggle navigation">
      <Menu size={18} />
    </button>

    <div className="search-bar">
      <Search size={15} color="var(--text-tertiary)" />
      <input 
        type="text" 
        className="search-input" 
        placeholder="Search tasks..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
    <div className="top-nav-actions">
      <button className="icon-btn"><Bell size={17} /></button>
      <button className="icon-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
        {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <button className="btn-primary" onClick={onAddClick}>
        <Plus size={17} /> Add Task
      </button>
    </div>
  </header>
);

const StatCard = ({ icon, title, value, color, bgColor }) => (
  <div className="stat-card animate-slide-in">
    <div className="stat-icon-wrapper" style={{ backgroundColor: bgColor, color: color }}>
      {icon}
    </div>
    <div className="stat-info">
      <div className="stat-value stats-font">{value}</div>
      <div className="stat-label">{title}</div>
    </div>
  </div>
);

const EmptyState = ({ onAddClick }) => (
  <div className="empty-state animate-fade-in">
    <div className="empty-icon-wrapper">
      <CheckCircle2 size={24} />
    </div>
    <h3 className="empty-title">You're all caught up</h3>
    <p className="empty-subtitle">Create your first task to begin your productive day.</p>
    <button className="btn-primary" onClick={onAddClick}>
      <Plus size={18} /> Add Task
    </button>
  </div>
);

const AddTaskModal = ({ isOpen, onClose, onSubmit, newTodoTitle, setNewTodoTitle, newCategory, setNewCategory, newDueDate, setNewDueDate }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Task</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={(e) => { onSubmit(e); onClose(); }}>
          <div className="input-group">
            <label className="input-label">Task Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Finish UI design tomorrow at 5pm" 
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              autoFocus
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '5px' }}>
              Tips: use natural dates like <code>tomorrow at 5pm</code>, or priority flags like <code>!urgent</code>, <code>!important</code>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Category</label>
            <select 
              className="form-input" 
              value={newCategory} 
              onChange={(e) => setNewCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Due Date <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional overrides natural text)</span></label>
            <input 
              type="date" 
              className="form-input" 
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------
// MAIN APP COMPONENT
// -----------------------------------------------------------------

function App() {
  const [todos, setTodos] = useState([]);
  const [history, setHistory] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newDueDate, setNewDueDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showOverviewPanel, setShowOverviewPanel] = useState(() => {
    const saved = localStorage.getItem('showOverviewPanel');
    return saved !== null ? JSON.parse(saved) : true;
  });
  // Sidebar toggle — open by default on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('showOverviewPanel', JSON.stringify(showOverviewPanel));
  }, [showOverviewPanel]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  
  const [reminderTodo, setReminderTodo] = useState(null); 
  const [alertToast, setAlertToast] = useState(null);  
  const toastTimer = useRef(null);

  const handleAlert = useCallback(({ title, advanceMinutes }) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setAlertToast({ title, advanceMinutes });
    toastTimer.current = setTimeout(() => setAlertToast(null), 30000);
  }, []);

  const { reminders, setReminder, clearReminder, snooze } = useReminders(handleAlert);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
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

  const parseSmartInput = (input) => {
    let title = input;
    let dueDate = null;
    let urgency = 'low';
    let importance = 'low';

    if (title.includes('!!')) {
      urgency = 'high';
      importance = 'high';
      title = title.replace('!!', '');
    } else {
      if (title.toLowerCase().includes('!urgent')) {
        urgency = 'high';
        title = title.replace(/!urgent/i, '');
      }
      if (title.toLowerCase().includes('!important')) {
        importance = 'high';
        title = title.replace(/!important/i, '');
      }
    }

    const parsedResults = chrono.parse(title);
    if (parsedResults && parsedResults.length > 0) {
      const result = parsedResults[0];
      const parsedDate = result.start.date();
      // Use local timezone instead of UTC so "tomorrow" means tomorrow in local time
      dueDate = new Date(parsedDate.getTime() - (parsedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      title = title.replace(result.text, '');
    }

    title = title.replace(/\s+/g, ' ').trim();
    return { title, dueDate, urgency, importance };
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    const parsed = parseSmartInput(newTodoTitle);
    // Manual date picker overrides smart-parsed date if set
    const finalDueDate = newDueDate || parsed.dueDate;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: parsed.title, 
          category: newCategory,
          dueDate: finalDueDate,
          urgency: parsed.urgency,
          importance: parsed.importance
        }),
      });
      if (!res.ok) throw new Error('Failed to add todo');
      
      await fetchTodos(); // re-fetch so all pages (Today, Upcoming, Completed) update
      setNewTodoTitle('');
      setNewDueDate('');
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
      const res = await fetch(API_URL, { method: 'DELETE' });
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds: newTodos.map(t => t.id) }),
        });
        if (!res.ok) throw new Error('Failed to save order');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const filteredTodosBase = todos.filter(todo => {
    if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const dashboardTodos = filteredTodosBase.filter(todo => {
    if (filterCategory === 'All') return true;
    return todo.category === filterCategory;
  });

  const today = new Date().toISOString().split('T')[0];
  // Today: tasks due today OR tasks with no due date (not completed) — treat undated tasks as due today
  const todayTodos = filteredTodosBase.filter(todo => !todo.completed && (!todo.dueDate || todo.dueDate === today));
  // Upcoming: tasks with a future due date (not completed)
  const upcomingTodos = filteredTodosBase.filter(todo => !todo.completed && todo.dueDate && todo.dueDate > today);
  const completedTodos = filteredTodosBase.filter(todo => todo.completed);

  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const dueToday = todos.filter(t => t.dueDate === todayDateStr && !t.completed).length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const totalFocusTime = todos.reduce((acc, curr) => acc + (curr.focusTime || 0), 0);
  
  const urgentTasks = todos.filter(t => t.urgency === 'high').length;
  const importantTasks = todos.filter(t => t.importance === 'high').length;

  return (
    <>
      {alertToast && (
        <div className="alert-toast">
          <div className="alert-toast-icon">🔔</div>
          <div className="alert-toast-content">
            <div className="alert-toast-title">
              {alertToast.advanceMinutes > 0
                ? `Meeting in ${alertToast.advanceMinutes} minute${alertToast.advanceMinutes !== 1 ? 's' : ''}!`
                : 'Time for your task!'}
            </div>
            <div className="alert-toast-message">{alertToast.title}</div>
          </div>
          <button className="btn-secondary btn-sm" onClick={() => setAlertToast(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="app-container">
        {/* Backdrop — visible only on mobile when sidebar is open */}
        {sidebarOpen && (
          <div 
            className="sidebar-backdrop" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}

        <Sidebar 
          setShowAnalytics={setShowAnalytics}
          showAnalytics={showAnalytics}
          showOverviewPanel={showOverviewPanel}
          setShowOverviewPanel={setShowOverviewPanel}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <div className="main-wrapper">
          <TopNavbar 
            onAddClick={() => setIsAddModalOpen(true)} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            onMenuClick={() => setSidebarOpen(prev => !prev)}
          />
          
          <main className="main-content">
            {showAnalytics ? (
              <div className="analytics-view animate-fade-in">
                <div className="analytics-header">
                  <div>
                    <h2 className="greeting-title">Productivity Analytics</h2>
                    <p className="greeting-subtitle">{totalTasks} total tasks tracked</p>
                  </div>
                  <button className="btn-ghost" onClick={() => setShowAnalytics(false)}>Back to Tasks</button>
                </div>
                
                <div className="analytics-grid">
                  <div className="side-card">
                    <h3 className="side-card-title">Completion Rate</h3>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Done', value: completedTasks || 0 },
                              { name: 'Pending', value: pendingTasks }
                            ]}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                            dataKey="value" stroke="none"
                          >
                            <Cell fill="var(--success)" />
                            <Cell fill="var(--bg)" />
                          </Pie>
                          <Tooltip formatter={(v) => [v + ' tasks']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="stats-font" style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>{completionRate}%</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{completedTasks} of {totalTasks} done</div>
                    </div>
                  </div>

                  <div className="side-card">
                    <h3 className="side-card-title">Priority Breakdown</h3>
                    {(urgentTasks === 0 && importantTasks === 0) ? (
                      <div className="empty-chart-state">
                        No urgent or important tasks.
                      </div>
                    ) : (
                      <div style={{ height: '220px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Urgent', value: urgentTasks },
                              { name: 'Important', value: importantTasks }
                            ]}
                            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                          >
                            <XAxis dataKey="name" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip cursor={{ fill: 'var(--hover)' }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                              <Cell fill="var(--danger)" />
                              <Cell fill="var(--warning)" />
                              <LabelList dataKey="value" position="top" style={{ fill: 'var(--text-primary)', fontWeight: 600 }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Routes>
                <Route path="/" element={
                  <div className="dashboard-view animate-fade-in">
                <div className={`dashboard-overview-section ${!showOverviewPanel ? 'overview-hidden' : ''}`}>
                  <div className="greeting-section">
                    <h2 className="greeting-title">Good Morning 👋</h2>
                    <p className="greeting-subtitle">Here is your productivity summary for today.</p>
                  </div>

                  <div className="stats-grid">
                    <StatCard 
                      icon={<CheckSquare size={20} />} title="Total Tasks" value={totalTasks} 
                      color="var(--text-primary)" bgColor="var(--border-light)" 
                    />
                    <StatCard 
                      icon={<CheckCircle2 size={20} />} title="Completed" value={completedTasks} 
                      color="var(--success)" bgColor="#F0FDF4" 
                    />
                    <StatCard 
                      icon={<Clock size={20} />} title="Pending" value={pendingTasks} 
                      color="var(--warning)" bgColor="#FFFBEB" 
                    />
                    <StatCard 
                      icon={<Calendar size={20} />} title="Due Today" value={dueToday} 
                      color="var(--danger)" bgColor="#FEF2F2" 
                    />
                  </div>

                  <div className="progress-container">
                    <div className="progress-header">
                      <span>Daily Progress</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${completionRate}%` }}></div>
                    </div>
                  </div>

                  <div className="filter-container">
                    {['All', ...CATEGORIES].map(cat => (
                      <button 
                        key={cat} 
                        className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                        onClick={() => setFilterCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="content-grid">
                  <div className="task-list-section">
                    <div className="section-header">
                      <h3 className="section-title">Tasks</h3>
                      <button className="btn-ghost-danger" onClick={handleDeleteAll}>
                        Clear All
                      </button>
                    </div>

                    {loading ? (
                      <div className="loading-state">Loading tasks...</div>
                    ) : dashboardTodos.length === 0 ? (
                      <EmptyState onAddClick={() => setIsAddModalOpen(true)} />
                    ) : (
                      <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <SortableContext 
                            items={dashboardTodos.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {dashboardTodos.map(todo => (
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
                        </div>
                      </DndContext>
                    )}
                  </div>

                  <div className="side-panel">
                    <div className="side-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
                      <h3 className="side-card-title">Recent Activity</h3>
                      {history.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No recent activity.</p>
                      ) : (
                        <ul className="activity-list">
                          {history.slice(-4).reverse().map((item, idx) => (
                            <li key={item.id || idx} className="activity-item">
                              <div className="activity-dot"></div>
                              <div className="activity-content">
                                <div className="activity-title">{item.title}</div>
                                <div className="activity-time">
                                  Deleted {new Date(item.deletedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
                } />
                <Route path="/today" element={
                  <DirectedPage 
                    title="Today's Tasks"
                    subtitle={`${todayTodos.length} tasks scheduled for today.`}
                    icon={<Calendar size={32} />}
                    todos={todayTodos}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDelete}
                    reminders={reminders}
                    setReminderTodo={setReminderTodo}
                    onAddClick={() => setIsAddModalOpen(true)}
                    sensors={sensors}
                    handleDragEnd={handleDragEnd}
                  />
                } />
                <Route path="/upcoming" element={
                  <DirectedPage 
                    title="Upcoming Tasks"
                    subtitle={`${upcomingTodos.length} tasks planned for the future.`}
                    icon={<Inbox size={32} />}
                    todos={upcomingTodos}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDelete}
                    reminders={reminders}
                    setReminderTodo={setReminderTodo}
                    onAddClick={() => setIsAddModalOpen(true)}
                    sensors={sensors}
                    handleDragEnd={handleDragEnd}
                  />
                } />
                <Route path="/completed" element={
                  <DirectedPage 
                    title="Completed Tasks"
                    subtitle={`${completedTodos.length} tasks successfully finished.`}
                    icon={<CheckSquare size={32} />}
                    todos={completedTodos}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDelete}
                    reminders={reminders}
                    setReminderTodo={setReminderTodo}
                    onAddClick={() => setIsAddModalOpen(true)}
                    sensors={sensors}
                    handleDragEnd={handleDragEnd}
                  />
                } />
              </Routes>
            )}
          </main>
        </div>
      </div>

      <AddTaskModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={handleAddTodo}
        newTodoTitle={newTodoTitle}
        setNewTodoTitle={setNewTodoTitle}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        newDueDate={newDueDate}
        setNewDueDate={setNewDueDate}
      />

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
