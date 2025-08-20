import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Badge,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Notes as NotesIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '../../store';
import {
  CaseStatusDashboard,
  CaseTimeline,
  EvidenceManagement,
  ContactManagement,
  TaskManagement,
  CaseNotes,
  DeadlineTracking,
  DocumentTemplates,
} from './index';
import {
  LegalContact,
  LegalTask,
  LegalNote,
  LegalTimeline,
  EvidenceRecord,
  LegalDeadline,
  DocumentTemplate,
  ChainOfCustodyEntry,
} from '../../types';

interface LegalCaseManagerProps {
  projectId: string;
}

const LegalCaseManager: React.FC<LegalCaseManagerProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const {
    user,
    files,
    legalContacts,
    legalTasks,
    legalNotes,
    legalTimeline,
    evidenceRecords,
    legalDeadlines,
    documentTemplates,
    addLegalContact,
    updateLegalContact,
    deleteLegalContact,
    addLegalTask,
    updateLegalTask,
    deleteLegalTask,
    addLegalNote,
    updateLegalNote,
    deleteLegalNote,
    addLegalTimelineEvent,
    updateLegalTimelineEvent,
    deleteLegalTimelineEvent,
    addEvidenceRecord,
    updateEvidenceRecord,
    deleteEvidenceRecord,
    addChainOfCustodyEntry,
    addLegalDeadline,
    updateLegalDeadline,
    deleteLegalDeadline,
    addDocumentTemplate,
    updateDocumentTemplate,
    deleteDocumentTemplate,
  } = useAppStore();

  // Filter data for current project
  const projectContacts = legalContacts.filter(contact => contact.project_id === projectId);
  const projectTasks = legalTasks.filter(task => task.project_id === projectId);
  const projectNotes = legalNotes.filter(note => note.project_id === projectId);
  const projectTimeline = legalTimeline.filter(event => event.project_id === projectId);
  const projectEvidence = evidenceRecords.filter(evidence => evidence.project_id === projectId);
  const projectDeadlines = legalDeadlines.filter(deadline => deadline.project_id === projectId);
  const projectFiles = files.filter(file => file.project_id === projectId);

  // Contact handlers
  const handleCreateContact = (contactData: Omit<LegalContact, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    const contact: LegalContact = {
      ...contactData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: user?.id || '',
    };
    addLegalContact(contact);
  };

  const handleUpdateContact = (id: string, updates: Partial<LegalContact>) => {
    updateLegalContact(id, { ...updates, updated_at: new Date().toISOString() });
  };

  const handleDeleteContact = (id: string) => {
    deleteLegalContact(id);
  };

  // Task handlers
  const handleCreateTask = (taskData: Omit<LegalTask, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    const task: LegalTask = {
      ...taskData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: user?.id || '',
    };
    addLegalTask(task);
  };

  const handleUpdateTask = (id: string, updates: Partial<LegalTask>) => {
    updateLegalTask(id, { ...updates, updated_at: new Date().toISOString() });
  };

  const handleDeleteTask = (id: string) => {
    deleteLegalTask(id);
  };

  // Note handlers
  const handleCreateNote = (noteData: Omit<LegalNote, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    const note: LegalNote = {
      ...noteData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: user?.id || '',
    };
    addLegalNote(note);
  };

  const handleUpdateNote = (id: string, updates: Partial<LegalNote>) => {
    updateLegalNote(id, { ...updates, updated_at: new Date().toISOString() });
  };

  const handleDeleteNote = (id: string) => {
    deleteLegalNote(id);
  };

  // Timeline handlers
  const handleCreateTimelineEvent = (eventData: Omit<LegalTimeline, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    const event: LegalTimeline = {
      ...eventData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: user?.id || '',
    };
    addLegalTimelineEvent(event);
  };

  const handleUpdateTimelineEvent = (id: string, updates: Partial<LegalTimeline>) => {
    updateLegalTimelineEvent(id, { ...updates, updated_at: new Date().toISOString() });
  };

  const handleDeleteTimelineEvent = (id: string) => {
    deleteLegalTimelineEvent(id);
  };

  // Evidence handlers
  const handleCreateEvidence = (evidenceData: Omit<EvidenceRecord, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    const evidence: EvidenceRecord = {
      ...evidenceData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: user?.id || '',
    };
    addEvidenceRecord(evidence);
  };

  const handleUpdateEvidence = (id: string, updates: Partial<EvidenceRecord>) => {
    updateEvidenceRecord(id, { ...updates, updated_at: new Date().toISOString() });
  };

  const handleDeleteEvidence = (id: string) => {
    deleteEvidenceRecord(id);
  };

  const handleAddChainOfCustody = (evidenceId: string, entryData: Omit<ChainOfCustodyEntry, 'id'>) => {
    const entry: ChainOfCustodyEntry = {
      ...entryData,
      id: uuidv4(),
    };
    addChainOfCustodyEntry(evidenceId, entry);
  };

  // Deadline handlers
  const handleCreateDeadline = (deadlineData: Omit<LegalDeadline, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    const deadline: LegalDeadline = {
      ...deadlineData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: user?.id || '',
    };
    addLegalDeadline(deadline);
  };

  const handleUpdateDeadline = (id: string, updates: Partial<LegalDeadline>) => {
    updateLegalDeadline(id, { ...updates, updated_at: new Date().toISOString() });
  };

  const handleDeleteDeadline = (id: string) => {
    deleteLegalDeadline(id);
  };

  // Template handlers
  const handleCreateTemplate = (templateData: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    const template: DocumentTemplate = {
      ...templateData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: user?.id || '',
    };
    addDocumentTemplate(template);
  };

  const handleUpdateTemplate = (id: string, updates: Partial<DocumentTemplate>) => {
    updateDocumentTemplate(id, { ...updates, updated_at: new Date().toISOString() });
  };

  const handleDeleteTemplate = (id: string) => {
    deleteDocumentTemplate(id);
  };

  const handleUseTemplate = (template: DocumentTemplate, variables: Record<string, string>) => {
    // Replace template variables with actual values
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    // Create a new note with the generated content
    handleCreateNote({
      project_id: projectId,
      title: `Generated from ${template.name}`,
      content,
      category: 'other',
    });
  };

  const handleViewFile = (fileId: string) => {
    // This would typically navigate to the file viewer
    console.log('View file:', fileId);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Get counts for badges
  const getOverdueCount = () => {
    const now = new Date();
    return projectDeadlines.filter(deadline => {
      if (deadline.status === 'completed') return false;
      return new Date(deadline.due_date) < now;
    }).length;
  };

  const getHighPriorityTaskCount = () => {
    return projectTasks.filter(task => 
      task.status !== 'completed' && (task.priority === 'high' || task.priority === 'urgent')
    ).length;
  };

  const tabs = [
    { label: 'Dashboard', icon: <DashboardIcon />, badge: 0 },
    { label: 'Timeline', icon: <TimelineIcon />, badge: 0 },
    { label: 'Evidence', icon: <SecurityIcon />, badge: projectEvidence.length },
    { label: 'Contacts', icon: <GroupIcon />, badge: projectContacts.length },
    { label: 'Tasks', icon: <AssignmentIcon />, badge: getHighPriorityTaskCount() },
    { label: 'Notes', icon: <NotesIcon />, badge: projectNotes.length },
    { label: 'Deadlines', icon: <ScheduleIcon />, badge: getOverdueCount() },
    { label: 'Templates', icon: <DescriptionIcon />, badge: 0 },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Legal Case Management
          </Typography>
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>Export Case Data</MenuItem>
            <MenuItem onClick={handleMenuClose}>Import Templates</MenuItem>
            <MenuItem onClick={handleMenuClose}>Generate Report</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Paper sx={{ borderRadius: 0 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={
                tab.badge > 0 ? (
                  <Badge badgeContent={tab.badge} color="error">
                    {tab.icon}
                  </Badge>
                ) : (
                  tab.icon
                )
              }
              label={tab.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {activeTab === 0 && (
          <CaseStatusDashboard
            projectId={projectId}
            tasks={projectTasks}
            deadlines={projectDeadlines}
            contacts={projectContacts}
            notes={projectNotes}
            evidence={projectEvidence}
            timeline={projectTimeline}
            files={projectFiles}
            onNavigateToTasks={() => setActiveTab(4)}
            onNavigateToDeadlines={() => setActiveTab(6)}
            onNavigateToContacts={() => setActiveTab(3)}
            onNavigateToNotes={() => setActiveTab(5)}
            onNavigateToEvidence={() => setActiveTab(2)}
            onNavigateToTimeline={() => setActiveTab(1)}
          />
        )}
        {activeTab === 1 && (
          <CaseTimeline
            projectId={projectId}
            timelineEvents={projectTimeline}
            onCreateEvent={handleCreateTimelineEvent}
            onUpdateEvent={handleUpdateTimelineEvent}
            onDeleteEvent={handleDeleteTimelineEvent}
          />
        )}
        {activeTab === 2 && (
          <EvidenceManagement
            projectId={projectId}
            evidenceRecords={projectEvidence}
            files={projectFiles}
            onCreateEvidence={handleCreateEvidence}
            onUpdateEvidence={handleUpdateEvidence}
            onDeleteEvidence={handleDeleteEvidence}
            onAddChainOfCustody={handleAddChainOfCustody}
            onViewFile={handleViewFile}
          />
        )}
        {activeTab === 3 && (
          <ContactManagement
            projectId={projectId}
            contacts={projectContacts}
            onCreateContact={handleCreateContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
          />
        )}
        {activeTab === 4 && (
          <TaskManagement
            projectId={projectId}
            tasks={projectTasks}
            contacts={projectContacts}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        {activeTab === 5 && (
          <CaseNotes
            projectId={projectId}
            notes={projectNotes}
            contacts={projectContacts}
            tasks={projectTasks}
            files={projectFiles}
            onCreateNote={handleCreateNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        )}
        {activeTab === 6 && (
          <DeadlineTracking
            projectId={projectId}
            deadlines={projectDeadlines}
            tasks={projectTasks}
            onCreateDeadline={handleCreateDeadline}
            onUpdateDeadline={handleUpdateDeadline}
            onDeleteDeadline={handleDeleteDeadline}
          />
        )}
        {activeTab === 7 && (
          <DocumentTemplates
            projectId={projectId}
            templates={documentTemplates}
            onCreateTemplate={handleCreateTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onUseTemplate={handleUseTemplate}
          />
        )}
      </Box>
    </Box>
  );
};

export default LegalCaseManager;