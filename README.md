# ZipTrrip Todo Application

This is a multi-page Todo application built with React, Vite, and an Express.js Node backend.

## Features

- **Multi-page Architecture**: The application consists of multiple distinct HTML pages (`index.html` and `todo.html`), satisfying the requirement of building a multiple-page application instead of a Single Page Application (SPA).
- **CRUD Operations for Todos**: 
  - Create new todos with a title.
  - Read all todos on the main page.
  - View details of a specific todo item.
  - Update a todo's title, description, and completion status.
  - Delete a todo.
- **REST API Backend**: A Node.js backend using Express that provides RESTful endpoints to manage todo items.
- **File-based Storage**: Data is persistently saved in a `todos.json` file inside the backend folder, removing the need for a complex database setup.
- **Detailed View via Query Parameter**: Navigating to a single todo passes the todo ID as a query parameter (`/todo.html?id=123`), retrieving specific todo details from the API.

## Project Structure

- `frontend/`: Contains the React/Vite multi-page application.
- `backend/`: Contains the Node.js Express server.

## Getting Started

### Backend Setup
1. Navigate to the `backend/` folder.
2. Ensure you have Node.js installed, and run `npm install`.
3. Start the API server using `node server.js`.
4. The backend runs on `http://localhost:5000`.

### Frontend Setup
1. Navigate to the `frontend/` folder.
2. Run `npm install` to install frontend dependencies.
3. Start the dev server using `npm run dev`.
4. Open the provided localhost URL (e.g. `http://localhost:5173`) in your browser.

## API Documentation

- `GET /api/todos`: Fetch the list of all todos.
- `POST /api/todos`: Create a new todo (requires `title` in body).
- `GET /api/todos/:id`: Fetch a single todo by its ID.
- `PUT /api/todos/:id`: Update a single todo (can update `title`, `description`, `completed`).
- `DELETE /api/todos/:id`: Delete a todo item by ID.
