import './apiInterceptor';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Dismiss loading splash once React has rendered
function hideSplash() {
  const splash = document.getElementById('loading-splash');
  if (splash) {
    // Small delay so the first paint is visible before fade
    setTimeout(() => {
      splash.classList.add('fade-out');
      // Remove from DOM after transition ends
      splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    }, 1600); // matches the progress bar animation duration
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

hideSplash();
