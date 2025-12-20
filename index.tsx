import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("[System] Initializing application...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("[System] FATAL: Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

console.log("[System] Root element found. Mounting React tree.");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);