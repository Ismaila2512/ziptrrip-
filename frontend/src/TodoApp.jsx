import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api/todos';

function TodoApp() {
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  useEffect(() => {
    // Get the ID from the URL query parameters
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (id) {
      fetchTodo(id);
    } else {
      setError('No Todo ID provided in the URL');
      setLoading(false);
    }
  }, []);

  const fetchTodo = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Todo not found');
        throw new Error('Failed to fetch todo details');
      }
      const data = await res.json();
      setTodo(data);
      setEditForm({
        title: data.title,
        description: data.description || ''
      });
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
          description: editForm.description
        }),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      
      const updatedTodo = await res.json();
      setTodo(updatedTodo);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading todo details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <a href="/" className="btn btn-secondary">Back to List</a>
      </div>
    );
  }

  if (!todo) return null;

  return (
    <div className="container">
      <div className="header">
        <h1>Todo Details</h1>
        <a href="/" className="btn btn-secondary">Back to List</a>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className="todo-detail">
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Title</label>
            <input
              type="text"
              className="todo-input"
              style={{width: '100%'}}
              value={editForm.title}
              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Description</label>
            <textarea
              className="todo-input"
              style={{width: '100%', minHeight: '100px'}}
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              placeholder="Add some details..."
            />
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button type="submit" className="btn">Save Changes</button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="todo-detail">
          <div>
            <h2>{todo.title}</h2>
            <div className={`status-badge ${todo.completed ? 'status-completed' : 'status-pending'}`}>
              {todo.completed ? 'Completed' : 'Pending'}
            </div>
          </div>
          
          <div>
            <h3>Description</h3>
            <p>{todo.description || <em style={{color: '#888'}}>No description provided.</em>}</p>
          </div>

          <div>
            <h3>Created At</h3>
            <p>{new Date(todo.createdAt).toLocaleString()}</p>
          </div>

          <div style={{marginTop: '20px'}}>
            <button className="btn" onClick={() => setIsEditing(true)}>Edit Details</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodoApp;
