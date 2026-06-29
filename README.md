<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=00c6ff&height=200&section=header&text=TaskFlow%20|%20To-Do%20List&fontSize=50&fontColor=ffffff" width="100%" alt="TaskFlow Banner" />
  
  <p align="center">
    <b>A modern, glassmorphic productivity application built to help you get things done.</b>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS" />
  </p>
</div>

<br />

## Live Demo
Check out the live application on Vercel: **[https://ziptrrip-chi.vercel.app/](https://ziptrrip-chi.vercel.app/)**

<br />
## Features Showcase

**Interactive Drag-and-Drop**
> Seamlessly reorder your tasks on the fly using `@dnd-kit`.

**Productivity Analytics**
> Slide-out dashboard visualizing your focus time, completion rates, and priority distribution using dynamic charts.

**Zen Mode & Pomodoro**
> Dive into deep work with a full-screen, distraction-free Pomodoro timer dedicated to individual tasks.

**Eisenhower Matrix Priority**
> Categorize tasks logically by sorting them based on Importance and Urgency.

**Task History Logging**
> Never lose a task by accident! Deleted tasks and bulk "Delete All" wipes are securely archived with timestamps.

## Architecture & Storage

- **Multi-page Approach:** Engineered utilizing URL query parameters (`?id=`) to navigate fluidly between the main dashboard and specific task detail views.
- **RESTful API Backend:** Node.js/Express backend provides full CRUD capability endpoints.
- **File-based Persistence:** Utilizes a lightweight, database-free JSON architecture (`todos.json` and `history.json`) for seamless local testing and data retention.

## Project Structure

```text
ziptrrip/
├── frontend/         # React, Vite, and Glassmorphic CSS UI
├── backend/          # Node.js, Express, and JSON storage
├── challenge.md      # JavaScript challenge problem solutions
├── README.md         # Project documentation
└── .gitignore        # Git tracking exclusions
```

## Quick Start Guide

### 1. Initialize the Backend
```bash
cd backend
npm install
node server.js
```
*The API will start running on `http://localhost:5000`.*

### 2. Initialize the Frontend
*In a new terminal window:*
```bash
cd frontend
npm install
npm run dev
```
*Open the provided localhost URL (e.g., `http://localhost:5173`) in your browser to view the app!*

## API Reference Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/todos` | Fetch all active todos |
| `POST` | `/api/todos` | Create a new todo |
| `PUT` | `/api/todos/reorder`| Save drag-and-drop order states |
| `GET` | `/api/todos/:id` | Fetch specific todo details |
| `PUT` | `/api/todos/:id` | Update specific todo attributes |
| `DELETE` | `/api/todos/:id` | Archive a specific todo |
| `DELETE` | `/api/todos` | Bulk archive all active todos |
| `POST` | `/api/todos/:id/focus`| Add Pomodoro focus time to a task |
| `GET` | `/api/history` | Retrieve deleted/archived tasks log |

<br />

<div align="center">
  <i>Built for the Ziptrrip Tech Challenge.</i>
</div>
