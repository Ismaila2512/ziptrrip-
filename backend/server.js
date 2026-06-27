const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'todos.json');

app.use(cors());
app.use(express.json());

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

const getTodos = () => {
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
};

const saveTodos = (todos) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
};

// CREATE
app.post('/api/todos', (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTodo = {
    id: uuidv4(),
    title,
    description: description || '',
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
  const todos = getTodos();
  res.json(todos);
});

// READ ONE
app.get('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json(todo);
});

// UPDATE
app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;
  
  const todos = getTodos();
  const todoIndex = todos.findIndex(t => t.id === id);

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const updatedTodo = {
    ...todos[todoIndex],
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(completed !== undefined && { completed })
  };

  todos[todoIndex] = updatedTodo;
  saveTodos(todos);

  res.json(updatedTodo);
});

// DELETE
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  
  let todos = getTodos();
  const initialLength = todos.length;
  todos = todos.filter(t => t.id !== id);

  if (todos.length === initialLength) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  saveTodos(todos);
  res.json({ message: 'Todo deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
