// Clarity Hub Reset Script
// Run this in your browser console to reset the application state
(function() {
  console.log('🔄 Clarity Hub Reset Script');
  console.log('Resetting application state...');

  // Reset panel state
  const defaultPanelState = {
    panelSizes: [25, 50, 25],
    leftCollapsed: false,
    rightCollapsed: false,
    isLeftCollapsed: false,
    isRightCollapsed: false,
    leftPanelPercentage: 25,
    centerPanelPercentage: 50,
    rightPanelPercentage: 25
  };
  localStorage.setItem('clarity-hub-panel-state', JSON.stringify(defaultPanelState));
  console.log('✅ Panel state reset');

  // Reset application state
  const defaultAppState = {
    selectedProjectId: null,
    selectedFileId: null,
    themeMode: 'light',
    isLeftPanelOpen: true,
    isRightPanelOpen: true,
    isSuggestionPanelOpen: false
  };
  localStorage.setItem('clarity-hub-storage', JSON.stringify({
    state: defaultAppState,
    version: 0
  }));
  console.log('✅ App state reset');

  // Create demo user
  const demoUser = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'demo@example.com',
    avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff',
    full_name: 'Demo User',
  };

  // Create demo projects
  const projectId = '11111111-1111-1111-1111-111111111111';
  const projectId2 = '22222222-2222-2222-2222-222222222222';
  
  const demoProjects = [
    {
      id: projectId,
      name: 'Acme Corp. v. Widget Industries',
      owner_id: demoUser.id,
      created_at: new Date().toISOString(),
      description: 'Contract dispute regarding manufacturing components',
      status: 'active'
    },
    {
      id: projectId2,
      name: 'Smith Estate Planning',
      owner_id: demoUser.id,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Trust and estate planning documents',
      status: 'active'
    }
  ];

  // Create demo files
  const demoFiles = [
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Client Contract.pdf',
      project_id: projectId,
      owner_id: demoUser.id,
      storage_path: `projects/${projectId}/contract.pdf`,
      content_type: 'application/pdf',
      size: 12345,
      file_type: 'pdf',
      exhibit_id: '1-A',
      metadata: {
        tags: ['contract', 'client', 'agreement'],
        processingStatus: 'completed',
        pageCount: 12
      },
      added_at: new Date().toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Photo Evidence.jpg',
      project_id: projectId,
      owner_id: demoUser.id,
      storage_path: `projects/${projectId}/evidence.jpg`,
      content_type: 'image/jpeg',
      size: 45678,
      file_type: 'image',
      exhibit_id: '1-B',
      metadata: {
        tags: ['evidence', 'photo', 'scene'],
        processingStatus: 'completed',
        dimensions: '1920x1080'
      },
      added_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Witness Statement.docx',
      project_id: projectId,
      owner_id: demoUser.id,
      storage_path: `projects/${projectId}/statement.docx`,
      content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 23456,
      file_type: 'document',
      exhibit_id: '1-C',
      metadata: {
        tags: ['witness', 'statement', 'testimony'],
        processingStatus: 'completed',
        wordCount: 1243
      },
      added_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Interview Recording.mp3',
      project_id: projectId,
      owner_id: demoUser.id,
      storage_path: `projects/${projectId}/interview.mp3`,
      content_type: 'audio/mpeg',
      size: 98765,
      file_type: 'audio',
      exhibit_id: '1-D',
      metadata: {
        tags: ['interview', 'audio', 'recording'],
        processingStatus: 'completed',
        duration: '34:21'
      },
      added_at: new Date(Date.now() - 259200000).toISOString()
    }
  ];

  // Set up demo user login event
  console.log('Setting up demo user...');
  const loginEvent = new CustomEvent('clarity-hub:demo-login', { 
    detail: { user: demoUser }
  });
  window.dispatchEvent(loginEvent);
  console.log('✅ Demo user created');

  // Set up demo project load event
  console.log('Loading demo projects...');
  const loadEvent = new CustomEvent('clarity-hub:load-demo', { 
    detail: { 
      projectId, 
      projects: demoProjects,
      files: demoFiles
    }
  });
  window.dispatchEvent(loadEvent);
  console.log('✅ Demo project loaded');

  // Add style fixes
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

    /* Make scrollbars nicer */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    ::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `;

  // Append style to head
  document.head.appendChild(style);
  console.log('✅ UI style fixes applied');
  
  console.log('🎉 Reset completed successfully!');
  console.log('✨ Clarity Hub is now ready with:');
  console.log('   - 2 sample projects');
  console.log('   - 4 demo files with different formats');
  console.log('   - Fully functional demo UI');
  console.log('Refreshing in 2 seconds...');
  
  // Refresh the page after 2 seconds
  setTimeout(() => {
    window.location.reload();
  }, 2000);
})();