/**
 * Main entry point for Vite + React application
 *
 * @module main
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// DIANOSTIC: Global error handlers for white-screen debugging
window.onerror = function (message, source, lineno, colno, error) {
  // Ignore harmless ResizeObserver loop errors usually caused by Chart.js/Recharts
  if (
    message &&
    message.includes &&
    message.includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    console.warn('Ignored benign ResizeObserver error:', message);
    return;
  }

  const div = document.createElement('div');
  div.style.cssText =
    'position:fixed;top:0;left:0;width:100%;background:red;color:white;padding:20px;z-index:9999;font-family:sans-serif;';
  div.innerHTML = `<h3>🚀 STARTUP ERROR DETECTED</h3><p>${message}</p><pre>${error?.stack || ''}</pre>`;
  document.body.appendChild(div);
  console.error('DIAGNOSTIC Global Error:', message, error);
};

window.onunhandledrejection = function (event) {
  const div = document.createElement('div');
  div.style.cssText =
    'position:fixed;top:50px;left:0;width:100%;height:200px;background:darkred;color:white;padding:20px;z-index:9999;font-family:sans-serif;overflow:auto;border-bottom:4px solid white;';
  div.innerHTML = `<h3>⚠️ UNHANDLED PROMISE REJECTION</h3><p>${event.reason?.message || event.reason}</p>`;
  document.body.appendChild(div);
  console.error('DIAGNOSTIC Unhandled Promise Rejection:', event.reason);
};

// Visual signal that main.jsx is running
const signal = document.createElement('div');
signal.style.cssText =
  'position:fixed;bottom:0;right:0;width:10px;height:10px;background:lime;z-index:9999;pointer-events:none;';
document.body.appendChild(signal);
console.log('DIAGNOSTIC: main.jsx logic running');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
