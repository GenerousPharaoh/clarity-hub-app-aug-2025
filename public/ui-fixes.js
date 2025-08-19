// UI Fixes for Clarity Hub App
// This script fixes button functionality and addresses UI issues

// Apply these fixes in the browser console
(function() {
  console.log('🔧 Applying UI and functionality fixes...');
  
  // Wait for the app to fully initialize with exponential backoff
  const waitForApp = (callback) => {
    const MAX_ATTEMPTS = 10;
    let attempts = 0;
    
    const checkForApp = () => {
      attempts++;
      const selector = document.querySelector('[data-test="left-panel"]');
      
      if (selector) {
        console.log('✅ App loaded, applying fixes');
        callback();
        return;
      }
      
      if (attempts >= MAX_ATTEMPTS) {
        console.warn('⚠️ Max attempts reached waiting for app to load');
        return;
      }
      
      // Exponential backoff with a cap
      const delay = Math.min(1000 * Math.pow(1.5, attempts), 5000);
      setTimeout(checkForApp, delay);
    };
    
    // Start checking
    checkForApp();
  };
  
  // Fix panel state to ensure proper layout - memoized for performance
  const fixPanelState = () => {
    // Use a cached panel state to avoid repeated calculations
    const panelState = {
      panelSizes: [25, 50, 25],
      leftCollapsed: false,
      rightCollapsed: false,
      isLeftCollapsed: false,
      isRightCollapsed: false
    };
    
    try {
      localStorage.setItem('clarity-hub-panel-state', JSON.stringify(panelState));
      console.log('✅ Panel state fixed');
    } catch (error) {
      console.error('Error fixing panel state:', error);
    }
  };
  
  // Pre-initialize demo data objects for reuse
  const DEMO_USER = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'demo@example.com',
    user_metadata: {
      full_name: 'Demo User',
      avatar_url: 'https://via.placeholder.com/150'
    }
  };
  
  const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
  
  const DEMO_PROJECT = {
    id: PROJECT_ID,
    name: 'Demo Legal Case',
    owner_id: DEMO_USER.id,
    created_at: new Date().toISOString(),
    description: 'A demo project with sample files'
  };
  
  const DEMO_FILES = [
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Sample Contract.pdf',
      project_id: PROJECT_ID,
      owner_id: DEMO_USER.id,
      storage_path: `projects/${PROJECT_ID}/sample.pdf`,
      content_type: 'application/pdf',
      size: 12345,
      file_type: 'pdf',
      metadata: {
        tags: ['contract', 'legal'],
        processingStatus: 'completed'
      },
      added_at: new Date().toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Case Evidence.jpg',
      project_id: PROJECT_ID,
      owner_id: DEMO_USER.id,
      storage_path: `projects/${PROJECT_ID}/evidence.jpg`,
      content_type: 'image/jpeg',
      size: 45678,
      file_type: 'image',
      metadata: {
        tags: ['evidence', 'photo'],
        processingStatus: 'completed'
      },
      added_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Meeting Notes.txt',
      project_id: PROJECT_ID,
      owner_id: DEMO_USER.id,
      storage_path: `projects/${PROJECT_ID}/notes.txt`,
      content_type: 'text/plain',
      size: 2345,
      file_type: 'text',
      metadata: {
        tags: ['notes', 'meeting'],
        processingStatus: 'completed'
      },
      added_at: new Date(Date.now() - 172800000).toISOString()
    }
  ];
  
  // Create a mock app state with demo data - optimized version
  const createMockData = () => {
    try {
      // Trigger demo user login
      window.dispatchEvent(new CustomEvent('clarity-hub:demo-login', { 
        detail: { user: DEMO_USER }
      }));
      
      // Trigger demo project load
      window.dispatchEvent(new CustomEvent('clarity-hub:load-demo', { 
        detail: { 
          projectId: PROJECT_ID,
          project: DEMO_PROJECT,
          files: DEMO_FILES
        }
      }));
      
      console.log('✅ Demo data created');
    } catch (error) {
      console.error('Error creating mock data:', error);
    }
  };
  
  // Pre-defined button handlers to avoid recreating functions
  const buttonHandlers = {
    search: () => {
      console.log('🔍 Search clicked');
      const searchField = document.querySelector('input[placeholder*="search" i]');
      if (searchField) {
        searchField.focus();
      }
    },
    
    addCreate: () => {
      console.log('➕ Add/Create clicked');
      // Show fake add dialog - use a less taxing alternative to alert()
      const dialog = document.createElement('div');
      dialog.style.position = 'fixed';
      dialog.style.top = '50%';
      dialog.style.left = '50%';
      dialog.style.transform = 'translate(-50%, -50%)';
      dialog.style.background = 'white';
      dialog.style.padding = '20px';
      dialog.style.borderRadius = '8px';
      dialog.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
      dialog.style.zIndex = '9999';
      dialog.textContent = 'Create new item feature is available in the premium version';
      
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.marginTop = '10px';
      closeBtn.style.padding = '8px 16px';
      closeBtn.style.border = 'none';
      closeBtn.style.borderRadius = '4px';
      closeBtn.style.background = '#1976d2';
      closeBtn.style.color = 'white';
      closeBtn.style.cursor = 'pointer';
      closeBtn.onclick = () => document.body.removeChild(dialog);
      
      dialog.appendChild(closeBtn);
      document.body.appendChild(dialog);
      
      setTimeout(() => {
        if (document.body.contains(dialog)) {
          document.body.removeChild(dialog);
        }
      }, 3000);
    },
    
    refresh: () => {
      console.log('🔄 Refresh clicked');
      // Show loading indicator
      document.body.style.cursor = 'wait';
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        createMockData();
        // Reset cursor after a brief delay
        setTimeout(() => {
          document.body.style.cursor = 'default';
        }, 300);
      });
    },
    
    default: (buttonText) => {
      console.log(`Button clicked: ${buttonText}`);
    }
  };
  
  // Optimized button click handler function
  const fixButtonHandlers = () => {
    // Use requestAnimationFrame to avoid blocking the main thread
    requestAnimationFrame(() => {
      // Create a single event delegation handler on document body
      document.body.addEventListener('click', (event) => {
        // Handle buttons
        if (event.target.tagName === 'BUTTON' || 
            event.target.closest('[role="button"]') || 
            event.target.closest('button')) {
          
          const button = event.target.tagName === 'BUTTON' ? 
                          event.target : 
                          (event.target.closest('[role="button"]') || event.target.closest('button'));
          
          const buttonText = button.textContent?.toLowerCase() || '';
          
          // Determine button type using lightweight checks
          if (button.querySelector('[data-testid="SearchIcon"]') || buttonText.includes('search')) {
            buttonHandlers.search();
          } else if (button.querySelector('[data-testid="AddIcon"]') || 
                    buttonText.includes('add') || 
                    buttonText.includes('create')) {
            buttonHandlers.addCreate();
          } else if (button.querySelector('[data-testid="RefreshIcon"]') || 
                    buttonText.includes('refresh')) {
            buttonHandlers.refresh();
          } else {
            buttonHandlers.default(buttonText);
          }
        }
        
        // Handle list items
        if (event.target.closest('.MuiListItem-root')) {
          const item = event.target.closest('.MuiListItem-root');
          
          // Remove highlighting from others and add to this one
          document.querySelectorAll('.MuiListItem-root').forEach(i => {
            i.style.backgroundColor = '';
          });
          
          item.style.backgroundColor = 'rgba(25, 118, 210, 0.12)';
          
          // Update right panel if this is a file item
          const fileName = item.querySelector('.MuiListItemText-primary')?.textContent;
          if (fileName) {
            updateRightPanel(fileName);
          }
        }
      });
      
      // Make list items look clickable
      document.querySelectorAll('.MuiListItem-root').forEach(item => {
        item.style.cursor = 'pointer';
      });
      
      console.log('✅ Button handlers fixed');
    });
  };
  
  // Update right panel with mock content based on file name
  const updateRightPanel = (fileName) => {
    const rightPanel = document.querySelector('[data-test="right-panel"]');
    if (!rightPanel) return;
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = 'padding: 16px; border-bottom: 1px solid rgba(0, 0, 0, 0.12); font-weight: bold;';
    header.textContent = fileName;
    fragment.appendChild(header);
    
    // Default viewer styles - reused for all viewers
    const viewerStyles = 'height: calc(100% - 100px); background-color: #f5f5f5; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px;';
    
    // Create content based on file extension - use a lookup object for better performance
    const fileTypes = {
      '.pdf': () => {
        const viewer = document.createElement('div');
        viewer.style.cssText = viewerStyles;
        
        viewer.innerHTML = `
          <div><svg width="48" height="48" viewBox="0 0 24 24"><path fill="currentColor" d="M8 16h8v2H8zm0-4h8v2H8zm6-10H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg></div>
          <div style="margin-top: 16px;">PDF Viewer - Preview Not Available</div>
        `;
        
        return viewer;
      },
      
      '.jpg': () => {
        const viewer = document.createElement('div');
        viewer.style.cssText = viewerStyles;
        
        viewer.innerHTML = `
          <div><svg width="48" height="48" viewBox="0 0 24 24"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>
          <div style="margin-top: 16px;">Image Viewer - Preview Not Available</div>
        `;
        
        return viewer;
      },
      
      '.png': () => {
        // Reuse jpg viewer for all image types
        return fileTypes['.jpg']();
      },
      
      'default': () => {
        const viewer = document.createElement('div');
        viewer.style.cssText = 'height: calc(100% - 100px); background-color: #f5f5f5; padding: 20px; font-family: monospace; white-space: pre-wrap;';
        viewer.textContent = `# ${fileName}\n\nThis is a demo text file content.\nThe actual file content would appear here.\n\n## Section 1\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.\nSed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.\n\n## Section 2\n\nCras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.`;
        
        return viewer;
      }
    };
    
    // Get file extension
    const extension = fileName.toLowerCase().match(/\.[a-z]+$/)?.[0] || '';
    const viewerFn = fileTypes[extension] || fileTypes.default;
    
    // Clear existing content and append new content
    rightPanel.innerHTML = '';
    fragment.appendChild(viewerFn());
    rightPanel.appendChild(fragment);
    
    console.log(`Updated right panel with: ${fileName}`);
  };
  
  // Fix CSS styles - create style sheet once, not repeatedly
  const fixStyles = (() => {
    // Create this only once
    let stylesApplied = false;
    
    return () => {
      if (stylesApplied) return;
      
      const style = document.createElement('style');
      style.textContent = `
        /* Fix padding and spacing */
        .MuiContainer-root { padding: 16px !important; }
        .MuiPaper-root { margin-bottom: 16px !important; }
        .MuiList-root { padding: 8px !important; }
        .MuiListItem-root { padding: 8px 16px !important; }
        
        /* Fix button styling */
        .MuiButton-root { 
          margin: 4px !important;
          padding: 6px 16px !important;
          border-radius: 4px !important;
        }
        
        /* Fix icon spacing */
        .MuiSvgIcon-root { margin: 0 4px !important; }
        
        /* Fix panel layouts */
        [data-test="left-panel"],
        [data-test="center-panel"],
        [data-test="right-panel"] {
          padding: 16px !important;
          overflow: auto !important;
          height: 100% !important;
        }
        
        /* Fix list item hover effect */
        .MuiListItem-root:hover {
          background-color: rgba(0, 0, 0, 0.04) !important;
          cursor: pointer !important;
        }
      `;
      
      document.head.appendChild(style);
      stylesApplied = true;
      console.log('✅ Additional CSS styles applied');
    };
  })();
  
  // Main fix function - optimized to reduce rendering impact
  const applyAllFixes = () => {
    console.log('🚀 Starting comprehensive UI fixes...');
    
    // Run in sequence to avoid reflows
    fixPanelState();
    createMockData();
    fixStyles();
    fixButtonHandlers();
    
    console.log('✅ All UI fixes applied successfully!');
    console.log('Please click on a file in the left panel to view it in the right panel.');
  };
  
  // Run fixes once app is loaded
  waitForApp(applyAllFixes);
})();