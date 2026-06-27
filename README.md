# Ziptrrip Todo Application

This is a comprehensive, multi-page Todo application built with React, Vite, and an Express.js Node backend. It incorporates modern productivity features including analytics, Pomodoro timers, category filtering, and task history.

## Architecture

- **Frontend:** React with Vite. Designed as a multi-page application utilizing URL query parameters (`?id=`) to navigate between the main dashboard and specific task detail views.
- **Backend:** Node.js with Express. Provides a robust set of RESTful API endpoints.
- **Data Persistence:** JSON file-based storage (`todos.json` and `history.json`), simulating a database while keeping the project lightweight and easily testable.

## Core Features & Functionalities

### 1. Dashboard & Task Management
- **CRUD Operations**: Create, Read, Update, and Delete individual todo tasks.
- **Drag-and-Drop Reordering**: Users can reorder tasks interactively using `@dnd-kit`.
- **Category Filtering**: Tasks can be filtered dynamically (e.g., All, Work, Personal, Shopping, Health).
- **Bulk Operations**: Features a "Delete All" function with user confirmation that securely moves all active tasks into the History log.
- **Sub-tasks**: Within a specific todo's detail page, users can create and manage nested sub-tasks.

### 2. Analytics & Task History
- **Task Analytics**: A slide-out panel that visually displays productivity metrics using charts (`recharts`). Shows completion rates, priority distribution, and total focus time.
- **Task History Tracking**: Whenever a task is deleted (singularly or via "Delete All"), it isn't permanently lost. It is archived with a `deletedAt` timestamp and can be viewed inside the Analytics panel.

### 3. Productivity Tools
- **Pomodoro Timer & Zen Mode**: Individual task detail pages feature a Pomodoro focus timer. Activating "Zen Mode" provides a distraction-free, full-screen overlay for deep work.
- **Eisenhower Matrix Priority Tags**: Tasks can be tagged by Importance and Urgency, allowing for better prioritization and visual sorting.
- **In-App Notifications**: Toast notifications alert users of success states, errors, and task reminders.

### 4. UI/UX Design & Responsiveness
- **Glassmorphism Aesthetic**: Modern UI utilizing CSS backdrops, blurs, and gradient mesh overlays for a premium feel.
- **Fully Responsive Layout**: Comprehensive CSS media queries ensure the app gracefully adapts from large desktop displays down to tablet and mobile dimensions (including stacking layouts for small screens).
- **Smooth Transitions**: Elements utilize dynamic motion transitions, such as the Analytics panel gracefully sliding out while shifting the main task box.

## Project Structure

- `frontend/`: Contains the React application code, styles (`index.css`), and components.
- `backend/`: Contains the Express server (`server.js`), API routes, and JSON data files.
- `challenge.md`: Contains the solutions to the JavaScript coding problems requested in the technical challenge.

## Setup Instructions

### Backend Setup
1. Navigate to the `backend/` directory: `cd backend`
2. Install dependencies: `npm install`
3. Start the server: `node server.js`
   *(The backend API will run on http://localhost:5000)*

### Frontend Setup
1. Navigate to the `frontend/` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open the application in your browser (usually `http://localhost:5173`).

## API Endpoints

- **GET `/api/todos`**: Fetch the list of all active todos.
- **POST `/api/todos`**: Create a new todo item.
- **PUT `/api/todos/reorder`**: Save the new order of todos after a drag-and-drop event.
- **GET `/api/todos/:id`**: Fetch a specific todo by its ID.
- **PUT `/api/todos/:id`**: Update a specific todo (title, description, status, subtasks, priority, etc.).
- **DELETE `/api/todos/:id`**: Delete a specific todo and move it to history.
- **DELETE `/api/todos`**: Bulk delete all active todos and move them to history.
- **POST `/api/todos/:id/focus`**: Add focused time duration to a specific task.
- **GET `/api/history`**: Retrieve the log of deleted/archived tasks.
