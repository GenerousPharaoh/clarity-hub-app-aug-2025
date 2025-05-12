import React from 'react';

/**
 * Minimal test component to verify React rendering
 */
function TestApp() {
  return (
    <div style={{ 
      fontFamily: 'sans-serif', 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto', 
      textAlign: 'center' 
    }}>
      <h1>React Test Component</h1>
      <p>If you can see this, React is rendering correctly.</p>
      <button 
        onClick={() => alert('React event handlers are working!')}
        style={{
          padding: '0.5rem 1rem',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Click me
      </button>
    </div>
  );
}

export default TestApp; 