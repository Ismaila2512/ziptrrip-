const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = process.env.VERCEL ? path.join('/tmp', 'todos.json') : path.join(__dirname, 'todos.json');
const HISTORY_FILE = process.env.VERCEL ? path.join('/tmp', 'history.json') : path.join(__dirname, 'history.json');

app.use(cors());
app.use(express.json());

// Initialize data files if they don't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
}

const getTodos = () => {
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
};

const saveTodos = (todos) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
};

const getHistory = () => {
  const data = fs.readFileSync(HISTORY_FILE);
  return JSON.parse(data);
};

const saveHistory = (history) => {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
};

// Helper to get userId from headers
const getUserId = (req) => req.headers['x-user-id'] || 'anonymous';

// CREATE
app.post('/api/todos', (req, res) => {
  const { title, description, category, dueDate, urgency, importance } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const userId = getUserId(req);
  const newTodo = {
    id: uuidv4(),
    userId,
    title,
    description: description || '',
    category: category || 'Other',
    dueDate: dueDate || null,
    urgency: urgency || 'normal',
    importance: importance || 'normal',
    completed: false,
    createdAt: new Date().toISOString()
  };

  const todos = getTodos();
  todos.push(newTodo);
  saveTodos(todos);

  res.status(201).json(newTodo);
});

// READ ALL
app.get('/api/todos', (req, res) => {
  const userId = getUserId(req);
  const todos = getTodos().filter(t => t.userId === userId || (!t.userId && userId === 'anonymous'));
  res.json(todos);
});

// READ ONE
app.get('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  const todos = getTodos();
  const todo = todos.find(t => t.id === id && (t.userId === userId || (!t.userId && userId === 'anonymous')));

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json(todo);
});

// UPDATE
app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  const { title, description, completed, category, subtasks, dueDate, urgency, importance, focusTime } = req.body;
  
  const todos = getTodos();
  const todoIndex = todos.findIndex(t => t.id === id && (t.userId === userId || (!t.userId && userId === 'anonymous')));

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const updatedTodo = {
    ...todos[todoIndex],
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(completed !== undefined && { completed }),
    ...(category !== undefined && { category }),
    ...(subtasks !== undefined && { subtasks }),
    ...(dueDate !== undefined && { dueDate }),
    ...(urgency !== undefined && { urgency }),
    ...(importance !== undefined && { importance }),
    ...(focusTime !== undefined && { focusTime })
  };

  todos[todoIndex] = updatedTodo;
  saveTodos(todos);

  res.json(updatedTodo);
});

// REORDER
app.put('/api/todos/reorder', (req, res) => {
  const { orderedIds } = req.body;
  const userId = getUserId(req);
  if (!orderedIds || !Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds array is required' });
  }

  const todos = getTodos();
  const userTodos = [];
  const otherTodos = [];
  
  todos.forEach(todo => {
    if (todo.userId === userId || (!todo.userId && userId === 'anonymous')) {
      userTodos.push(todo);
    } else {
      otherTodos.push(todo);
    }
  });

  const newTodos = [];
  // Rebuild the array according to orderedIds
  orderedIds.forEach(id => {
    const todo = userTodos.find(t => t.id === id);
    if (todo) newTodos.push(todo);
  });
  
  // Add any user's todos that weren't in orderedIds at the end
  userTodos.forEach(todo => {
    if (!orderedIds.includes(todo.id)) {
      newTodos.push(todo);
    }
  });

  // Combine with other users' todos
  saveTodos([...newTodos, ...otherTodos]);
  res.json(newTodos);
});

// DELETE
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  
  let todos = getTodos();
  const todoToDelete = todos.find(t => t.id === id && (t.userId === userId || (!t.userId && userId === 'anonymous')));

  if (!todoToDelete) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos = todos.filter(t => t.id !== id);
  saveTodos(todos);

  // Save to history
  const history = getHistory();
  history.push({ ...todoToDelete, deletedAt: new Date().toISOString() });
  saveHistory(history);

  res.json({ message: 'Todo deleted successfully' });
});

// DELETE ALL
app.delete('/api/todos', (req, res) => {
  const userId = getUserId(req);
  const todos = getTodos();
  const history = getHistory();

  const userTodos = todos.filter(t => t.userId === userId || (!t.userId && userId === 'anonymous'));
  const otherTodos = todos.filter(t => t.userId !== userId && !(!t.userId && userId === 'anonymous'));

  // Add all current user todos to history
  const newHistoryEntries = userTodos.map(t => ({ ...t, deletedAt: new Date().toISOString() }));
  saveHistory([...history, ...newHistoryEntries]);

  saveTodos(otherTodos);
  res.json({ message: 'All user todos deleted successfully' });
});

// GET HISTORY
app.get('/api/history', (req, res) => {
  const userId = getUserId(req);
  const history = getHistory().filter(t => t.userId === userId || (!t.userId && userId === 'anonymous'));
  res.json(history);
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;
