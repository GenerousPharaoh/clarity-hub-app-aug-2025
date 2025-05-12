import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

// Import services
import './utils/storageInit';
import './services/performanceMonitor'; // Import performance monitor to initialize it globally
import { checkEnvironmentVariables } from './utils/debugEnv';

// Debug environment variables
console.log('App initializing...');
const envCheckPassed = checkEnvironmentVariables();

// Initialize service worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      // Force update and skip waiting to ensure fresh code
      registration.update();
      registration.waiting?.postMessage('SKIP_WAITING');
      
      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed');
      } else if (registration.active) {
        console.log('Service worker active');
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

// Measure startup performance
const startTime = performance.now();
window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  console.log(`⚡ App bootstrap and load time: ${loadTime.toFixed(0)}ms`);
});

// Register the service worker
registerServiceWorker();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute
    },
  },
})

// Mark application start time for custom metrics
window.APP_START_TIME = performance.now();

// Add error handling for initial render
try {
  console.log('Rendering application root...');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>,
  )
} catch (error) {
  console.error('Error rendering application:', error);
  // Attempt to render a basic error message
  document.body.innerHTML = `
    <div style="font-family: sans-serif; padding: 2rem; text-align: center;">
      <h1>Application Error</h1>
      <p>An error occurred while loading the application. Please refresh the page or contact support.</p>
      <pre style="background: #f5f5f5; padding: 1rem; text-align: left; overflow: auto;">${String(error)}</pre>
    </div>
  `;
}

// Report first contentful paint
if ('performance' in window) {
  const reportFirstContentfulPaint = () => {
    const paintMetrics = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintMetrics.find(
      (entry) => entry.name === 'first-contentful-paint'
    );

    if (firstContentfulPaint) {
      console.log(
        `⚡ First Contentful Paint: ${firstContentfulPaint.startTime.toFixed(0)}ms`
      );
    }
  };
  
  // Either wait for the paint or check after a small delay
  if (document.readyState === 'complete') {
    reportFirstContentfulPaint();
  } else {
    window.addEventListener('load', reportFirstContentfulPaint);
  }
}

// Declare global type augmentation
declare global {
  interface Window {
    APP_START_TIME: number;
  }
}
