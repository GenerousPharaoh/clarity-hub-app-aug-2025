import React from 'react'
import ReactDOM from 'react-dom/client'
import TestApp from './TestApp'
import './index.css'

console.log('Test app initializing...');

try {
  console.log('Rendering test application...');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <TestApp />
    </React.StrictMode>,
  )
  console.log('Test application rendered successfully');
} catch (error) {
  console.error('Error rendering test application:', error);
  // Attempt to render a basic error message
  document.body.innerHTML = `
    <div style="font-family: sans-serif; padding: 2rem; text-align: center;">
      <h1>Test Application Error</h1>
      <p>An error occurred while loading the test application.</p>
      <pre style="background: #f5f5f5; padding: 1rem; text-align: left; overflow: auto;">${String(error)}</pre>
    </div>
  `;
} 