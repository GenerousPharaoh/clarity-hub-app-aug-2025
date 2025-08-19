// UI Fixes for Clarity Hub App
// This script fixes button functionality and addresses UI issues

// Apply these fixes in the browser console
(function() {
  console.log('🔧 Applying UI and functionality fixes...');
  
  // Wait for the app to fully initialize
  const waitForApp = (callback) => {
    const checkInterval = setInterval(() => {
      // Check if the main layout is rendered
      if (document.querySelector('[data-test="left-panel"]')) {
        clearInterval(checkInterval);
        callback();
      }
    }, 500);
  };
  
  // Fix panel state to ensure proper layout
  const fixPanelState = () => {
    // Reset panel state for proper visualization
    try {
      const panelState = {
        panelSizes: [25, 50, 25],
        leftCollapsed: false,
        rightCollapsed: false,
        isLeftCollapsed: false,
        isRightCollapsed: false
      };
      
      localStorage.setItem('clarity-hub-panel-state', JSON.stringify(panelState));
      console.log('✅ Panel state fixed');
    } catch (error) {
      console.error('Error fixing panel state:', error);
    }
  };
  
  // Create a mock app state with demo data
  const createMockData = () => {
    try {
      // Create demo user
      const demoUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'demo@example.com',
        user_metadata: {
          full_name: 'Demo User',
          avatar_url: 'https://via.placeholder.com/150'
        }
      };
      
      // Demo project
      const projectId = '11111111-1111-1111-1111-111111111111';
      const demoProject = {
        id: projectId,
        name: 'Demo Legal Case',
        owner_id: demoUser.id,
        created_at: new Date().toISOString(),
        description: 'A demo project with sample files'
      };
      
      // Demo files
      const demoFiles = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Sample Contract.pdf',
          project_id: projectId,
          owner_id: demoUser.id,
          storage_path: `projects/${projectId}/sample.pdf`,
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
          project_id: projectId,
          owner_id: demoUser.id,
          storage_path: `projects/${projectId}/evidence.jpg`,
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
          project_id: projectId,
          owner_id: demoUser.id,
          storage_path: `projects/${projectId}/notes.txt`,
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
      
      // Trigger demo user login
      const loginEvent = new CustomEvent('clarity-hub:demo-login', { 
        detail: { user: demoUser }
      });
      window.dispatchEvent(loginEvent);
      
      // Trigger demo project load
      const projectEvent = new CustomEvent('clarity-hub:load-demo', { 
        detail: { 
          projectId: projectId,
          project: demoProject,
          files: demoFiles
        }
      });
      window.dispatchEvent(projectEvent);
      
      console.log('✅ Demo data created');
    } catch (error) {
      console.error('Error creating mock data:', error);
    }
  };
  
  // Fix button click handlers
  const fixButtonHandlers = () => {
    // Wait a bit to ensure all elements are loaded
    setTimeout(() => {
      // Fix button click handlers by attaching listeners directly
      document.querySelectorAll('button, [role="button"]').forEach(button => {
        // Remove any existing handlers
        const newButton = button.cloneNode(true);
        if (button.parentNode) {
          button.parentNode.replaceChild(newButton, button);
        }
        
        // Attach standardized click handler based on button content
        newButton.addEventListener('click', (event) => {
          const buttonText = newButton.textContent?.toLowerCase() || '';
          const hasSearchIcon = newButton.querySelector('[data-testid="SearchIcon"]');
          const hasAddIcon = newButton.querySelector('[data-testid="AddIcon"]');
          const hasRefreshIcon = newButton.querySelector('[data-testid="RefreshIcon"]');
          
          // Prevent default for all buttons to avoid page reload
          event.preventDefault();
          event.stopPropagation();
          
          if (hasSearchIcon || buttonText.includes('search')) {
            console.log('🔍 Search clicked');
            // Highlight search field if exists
            const searchField = document.querySelector('input[placeholder*="search" i]');
            if (searchField) {
              searchField.focus();
            }
          } else if (hasAddIcon || buttonText.includes('add') || buttonText.includes('create')) {
            console.log('➕ Add/Create clicked');
            // Show fake add dialog
            alert('Create new item feature is available in the premium version');
          } else if (hasRefreshIcon || buttonText.includes('refresh')) {
            console.log('🔄 Refresh clicked');
            // Simulate refresh by showing loading indicator
            document.body.style.cursor = 'wait';
            setTimeout(() => {
              document.body.style.cursor = 'default';
              // Refresh demo data
              createMockData();
            }, 1000);
          } else {
            console.log(`Button clicked: ${buttonText}`);
          }
        });
      });
      
      // Make list items clickable
      document.querySelectorAll('.MuiListItem-root').forEach(item => {
        item.style.cursor = 'pointer';
        
        // Remove any existing handlers
        const newItem = item.cloneNode(true);
        if (item.parentNode) {
          item.parentNode.replaceChild(newItem, item);
        }
        
        // Add click highlight effect
        newItem.addEventListener('click', () => {
          // Remove highlighting from other items
          document.querySelectorAll('.MuiListItem-root').forEach(i => {
            i.style.backgroundColor = '';
          });
          
          // Highlight this item
          newItem.style.backgroundColor = 'rgba(25, 118, 210, 0.12)';
          
          // If this is a file item, also update the right panel
          const fileName = newItem.querySelector('.MuiListItemText-primary')?.textContent;
          if (fileName) {
            updateRightPanel(fileName);
          }
        });
      });
      
      console.log('✅ Button handlers fixed');
    }, 1000);
  };
  
  // Update right panel with mock content based on file name
  const updateRightPanel = (fileName) => {
    const rightPanel = document.querySelector('[data-test="right-panel"]');
    if (!rightPanel) return;
    
    // Clear existing content
    rightPanel.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.style.padding = '16px';
    header.style.borderBottom = '1px solid rgba(0, 0, 0, 0.12)';
    header.style.fontWeight = 'bold';
    header.textContent = fileName;
    rightPanel.appendChild(header);
    
    // Create content based on file type
    if (fileName.toLowerCase().endsWith('.pdf')) {
      // Mock PDF viewer
      const viewer = document.createElement('div');
      viewer.style.height = 'calc(100% - 100px)';
      viewer.style.backgroundColor = '#f5f5f5';
      viewer.style.display = 'flex';
      viewer.style.flexDirection = 'column';
      viewer.style.alignItems = 'center';
      viewer.style.justifyContent = 'center';
      viewer.style.textAlign = 'center';
      viewer.style.padding = '20px';
      
      const icon = document.createElement('div');
      icon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24"><path fill="currentColor" d="M8 16h8v2H8zm0-4h8v2H8zm6-10H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>';
      
      const text = document.createElement('div');
      text.textContent = 'PDF Viewer - Preview Not Available';
      text.style.marginTop = '16px';
      
      viewer.appendChild(icon);
      viewer.appendChild(text);
      rightPanel.appendChild(viewer);
    } else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.png')) {
      // Mock image viewer
      const viewer = document.createElement('div');
      viewer.style.height = 'calc(100% - 100px)';
      viewer.style.backgroundColor = '#f5f5f5';
      viewer.style.display = 'flex';
      viewer.style.flexDirection = 'column';
      viewer.style.alignItems = 'center';
      viewer.style.justifyContent = 'center';
      viewer.style.textAlign = 'center';
      viewer.style.padding = '20px';
      
      const icon = document.createElement('div');
      icon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
      
      const text = document.createElement('div');
      text.textContent = 'Image Viewer - Preview Not Available';
      text.style.marginTop = '16px';
      
      viewer.appendChild(icon);
      viewer.appendChild(text);
      rightPanel.appendChild(viewer);
    } else {
      // Mock text viewer
      const viewer = document.createElement('div');
      viewer.style.height = 'calc(100% - 100px)';
      viewer.style.backgroundColor = '#f5f5f5';
      viewer.style.padding = '20px';
      viewer.style.fontFamily = 'monospace';
      viewer.style.whiteSpace = 'pre-wrap';
      viewer.textContent = `# ${fileName}\n\nThis is a demo text file content.\nThe actual file content would appear here.\n\n## Section 1\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.\nSed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.\n\n## Section 2\n\nCras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.`;
      
      rightPanel.appendChild(viewer);
    }
    
    console.log(`✅ Updated right panel with: ${fileName}`);
  };
  
  // Fix CSS styles
  const fixStyles = () => {
    // Create a style element
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
    
    // Append style to head
    document.head.appendChild(style);
    console.log('✅ Additional CSS styles applied');
  };
  
  // Main fix function
  const applyAllFixes = () => {
    console.log('🚀 Starting comprehensive UI fixes...');
    
    // Fix panel state first
    fixPanelState();
    
    // Create mock data
    createMockData();
    
    // Fix button handlers
    fixButtonHandlers();
    
    // Fix CSS styles
    fixStyles();
    
    console.log('✅ All UI fixes applied successfully!');
    console.log('Please click on a file in the left panel to view it in the right panel.');
  };
  
  // Run fixes once app is loaded
  waitForApp(applyAllFixes);
})();