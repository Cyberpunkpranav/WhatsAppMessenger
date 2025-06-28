import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import './styles/global.css';
import App from './App';

/**
 * Main entry point for the React application
 * Renders the App component into the root DOM element
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);