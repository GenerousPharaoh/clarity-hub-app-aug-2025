import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { 
  File, 
  Project, 
  User, 
  LinkActivation, 
  SearchFilters,
  LegalCase,
  LegalContact,
  LegalTask,
  LegalNote,
  LegalTimeline,
  EvidenceRecord,
  LegalDeadline,
  DocumentTemplate,
  ChainOfCustodyEntry,
  Exhibit,
  ExhibitFile,
  CitationHistory,
  ExhibitLinkActivation
} from '../types';
import { createPanelSlice, PanelState } from './panelSlice';
import { demoService, DEMO_PROJECT_ID, DEMO_USER_ID } from '../services/demoService';

export interface AppState extends PanelState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Theme state
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Project state
  selectedProjectId: string | null;
  projects: Project[];
  setSelectedProject: (projectId: string | null) => void;
  setProjects: (projects: Project[]) => void;
  initializeDemoProject: () => Promise<void>;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  
  // File state
  selectedFileId: string | null;
  files: File[];
  setSelectedFile: (fileId: string | null) => void;
  setFiles: (files: File[]) => void;
  addFile: (file: File) => void;
  addFileToProject: (projectId: string, file: File) => void;
  updateFile: (fileId: string, updates: Partial<File>) => void;
  deleteFile: (fileId: string) => void;
  
  // Link activation state
  linkActivation: LinkActivation | null;
  setLinkActivation: (linkActivation: LinkActivation | null) => void;
  
  // Search state
  searchFilters: SearchFilters;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  resetSearchFilters: () => void;
  
  // UI state
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  isSuggestionPanelOpen: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleSuggestionPanel: () => void;
  
  // Legal Case Management state
  legalCases: LegalCase[];
  selectedLegalCaseId: string | null;
  legalContacts: LegalContact[];
  legalTasks: LegalTask[];
  legalNotes: LegalNote[];
  legalTimeline: LegalTimeline[];
  evidenceRecords: EvidenceRecord[];
  legalDeadlines: LegalDeadline[];
  documentTemplates: DocumentTemplate[];
  
  // Legal Case Management actions
  setLegalCases: (cases: LegalCase[]) => void;
  addLegalCase: (legalCase: LegalCase) => void;
  updateLegalCase: (id: string, updates: Partial<LegalCase>) => void;
  deleteLegalCase: (id: string) => void;
  setSelectedLegalCase: (id: string | null) => void;
  
  setLegalContacts: (contacts: LegalContact[]) => void;
  addLegalContact: (contact: LegalContact) => void;
  updateLegalContact: (id: string, updates: Partial<LegalContact>) => void;
  deleteLegalContact: (id: string) => void;
  
  setLegalTasks: (tasks: LegalTask[]) => void;
  addLegalTask: (task: LegalTask) => void;
  updateLegalTask: (id: string, updates: Partial<LegalTask>) => void;
  deleteLegalTask: (id: string) => void;
  
  setLegalNotes: (notes: LegalNote[]) => void;
  addLegalNote: (note: LegalNote) => void;
  updateLegalNote: (id: string, updates: Partial<LegalNote>) => void;
  deleteLegalNote: (id: string) => void;
  
  setLegalTimeline: (timeline: LegalTimeline[]) => void;
  addLegalTimelineEvent: (event: LegalTimeline) => void;
  updateLegalTimelineEvent: (id: string, updates: Partial<LegalTimeline>) => void;
  deleteLegalTimelineEvent: (id: string) => void;
  
  setEvidenceRecords: (evidence: EvidenceRecord[]) => void;
  addEvidenceRecord: (evidence: EvidenceRecord) => void;
  updateEvidenceRecord: (id: string, updates: Partial<EvidenceRecord>) => void;
  deleteEvidenceRecord: (id: string) => void;
  addChainOfCustodyEntry: (evidenceId: string, entry: ChainOfCustodyEntry) => void;
  
  setLegalDeadlines: (deadlines: LegalDeadline[]) => void;
  addLegalDeadline: (deadline: LegalDeadline) => void;
  updateLegalDeadline: (id: string, updates: Partial<LegalDeadline>) => void;
  deleteLegalDeadline: (id: string) => void;
  
  setDocumentTemplates: (templates: DocumentTemplate[]) => void;
  addDocumentTemplate: (template: DocumentTemplate) => void;
  updateDocumentTemplate: (id: string, updates: Partial<DocumentTemplate>) => void;
  deleteDocumentTemplate: (id: string) => void;

  // Exhibit Management state
  exhibits: Exhibit[];
  citationHistory: CitationHistory[];
  selectedExhibitId: string | null;
  exhibitLinkActivation: ExhibitLinkActivation | null;

  // Exhibit Management actions
  setExhibits: (exhibits: Exhibit[]) => void;
  addExhibit: (exhibit: Exhibit) => void;
  updateExhibit: (id: string, updates: Partial<Exhibit>) => void;
  deleteExhibit: (id: string) => void;
  setSelectedExhibit: (id: string | null) => void;
  
  // File-to-Exhibit mapping
  assignFileToExhibit: (fileId: string, exhibitId: string, isPrimary?: boolean) => void;
  removeFileFromExhibit: (fileId: string, exhibitId: string) => void;
  createExhibitFromFile: (fileId: string, exhibitId: string, title?: string) => void;
  
  // Auto-detection utilities
  detectExhibitIdFromFilename: (filename: string) => string | null;
  getNextExhibitId: () => string;
  
  // Citation Navigation
  setCitationHistory: (history: CitationHistory[]) => void;
  addCitationToHistory: (citation: CitationHistory) => void;
  setExhibitLinkActivation: (linkActivation: ExhibitLinkActivation | null) => void;
  navigateToExhibit: (exhibitReference: string, sourceContext?: string) => void;
  
  // Exhibit Utilities
  getExhibitByReference: (reference: string) => Exhibit | null;
  getFilesByExhibit: (exhibitId: string) => File[];
  getExhibitFiles: (exhibitId: string) => ExhibitFile[];
  generateCitationReference: (exhibitId: string, page?: number) => string;
}

const defaultSearchFilters: SearchFilters = {
  searchTerm: '',
  fileTypes: [],
  tags: [],
  entities: [],
  authors: [],
  evidenceStatus: [],
  dateFrom: null,
  dateTo: null,
  searchType: 'combined',
  includePrivileged: false,
  includeWorkProduct: false,
  exactMatch: false,
  caseSensitive: false,
};

// Create store with shallow equality comparison to avoid unnecessary re-renders
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        // Include panel state slice with updated default sizes
        ...createPanelSlice(...a),
        
        // User state
        user: null,
        setUser: (user) => a[0]({ user }),
        
        // Theme state
        themeMode: 'light',
        toggleTheme: () => a[0]((state) => ({ 
          themeMode: state.themeMode === 'light' ? 'dark' : 'light' 
        })),
        
        // Project state
        selectedProjectId: null,
        projects: [],
        setSelectedProject: (projectId) => a[0]((state) => {
          // Auto-select first file when switching projects
          if (projectId && projectId !== state.selectedProjectId) {
            const projectFiles = state.files.filter(file => file.project_id === projectId);
            const firstFileId = projectFiles.length > 0 ? projectFiles[0].id : null;
            return { 
              selectedProjectId: projectId, 
              selectedFileId: firstFileId 
            };
          }
          return { selectedProjectId: projectId };
        }),
        setProjects: (projects) => a[0]({ projects }),
        
        initializeDemoProject: async () => {
          if (window.DEMO_MODE) {
            try {
              const { project } = await demoService.initializeDemoAccount();
              a[0]((state) => ({
                projects: [project, ...state.projects.filter(p => p.id !== DEMO_PROJECT_ID)],
                selectedProjectId: DEMO_PROJECT_ID
              }));
            } catch (error) {
              console.error('Failed to initialize demo project:', error);
            }
          }
        },
        
        addProject: (project) => a[0]((state) => ({ 
          projects: [...state.projects, project] 
        })),
        updateProject: (projectId, updates) => a[0]((state) => ({
          projects: state.projects.map((project) => 
            project.id === projectId ? { ...project, ...updates } : project
          ),
        })),
        deleteProject: (projectId) => a[0]((state) => ({
          projects: state.projects.filter((project) => project.id !== projectId),
          selectedProjectId: state.selectedProjectId === projectId ? null : state.selectedProjectId,
        })),
        
        // File state
        selectedFileId: null,
        files: [],
        setSelectedFile: (fileId) => a[0]({ selectedFileId: fileId }),
        setFiles: (files) => a[0]({ files }),
        addFile: (file) => a[0]((state) => ({ 
          files: [...state.files, file] 
        })),
        addFileToProject: (projectId, file) => a[0]((state) => ({ 
          files: [...state.files, { ...file, project_id: projectId }] 
        })),
        updateFile: (fileId, updates) => a[0]((state) => ({
          files: state.files.map((file) => 
            file.id === fileId ? { ...file, ...updates } : file
          ),
        })),
        deleteFile: (fileId) => a[0]((state) => ({
          files: state.files.filter((file) => file.id !== fileId),
          selectedFileId: state.selectedFileId === fileId ? null : state.selectedFileId,
          linkActivation: state.linkActivation?.fileId === fileId ? null : state.linkActivation,
        })),
        
        // Link activation state
        linkActivation: null,
        setLinkActivation: (linkActivation) => a[0]({ linkActivation }),
        
        // Search state
        searchFilters: defaultSearchFilters,
        setSearchFilters: (filters) => a[0]((state) => ({ 
          searchFilters: { ...state.searchFilters, ...filters } 
        })),
        resetSearchFilters: () => a[0]({ searchFilters: defaultSearchFilters }),
        
        // UI state
        isLeftPanelOpen: true,
        isRightPanelOpen: true,
        isSuggestionPanelOpen: false,
        toggleLeftPanel: () => a[0]((state) => ({ 
          isLeftPanelOpen: !state.isLeftPanelOpen 
        })),
        toggleRightPanel: () => a[0]((state) => ({ 
          isRightPanelOpen: !state.isRightPanelOpen 
        })),
        toggleSuggestionPanel: () => a[0]((state) => ({ 
          isSuggestionPanelOpen: !state.isSuggestionPanelOpen 
        })),
        
        // Legal Case Management state
        legalCases: [],
        selectedLegalCaseId: null,
        legalContacts: [],
        legalTasks: [],
        legalNotes: [],
        legalTimeline: [],
        evidenceRecords: [],
        legalDeadlines: [],
        documentTemplates: [],
        
        // Exhibit Management state
        exhibits: [],
        citationHistory: [],
        selectedExhibitId: null,
        exhibitLinkActivation: null,
        
        // Legal Case Management actions
        setLegalCases: (cases) => a[0]({ legalCases: cases }),
        addLegalCase: (legalCase) => a[0]((state) => ({ 
          legalCases: [...state.legalCases, legalCase] 
        })),
        updateLegalCase: (id, updates) => a[0]((state) => ({
          legalCases: state.legalCases.map((legalCase) => 
            legalCase.id === id ? { ...legalCase, ...updates } : legalCase
          ),
        })),
        deleteLegalCase: (id) => a[0]((state) => ({
          legalCases: state.legalCases.filter((legalCase) => legalCase.id !== id),
          selectedLegalCaseId: state.selectedLegalCaseId === id ? null : state.selectedLegalCaseId,
        })),
        setSelectedLegalCase: (id) => a[0]({ selectedLegalCaseId: id }),
        
        setLegalContacts: (contacts) => a[0]({ legalContacts: contacts }),
        addLegalContact: (contact) => a[0]((state) => ({ 
          legalContacts: [...state.legalContacts, contact] 
        })),
        updateLegalContact: (id, updates) => a[0]((state) => ({
          legalContacts: state.legalContacts.map((contact) => 
            contact.id === id ? { ...contact, ...updates } : contact
          ),
        })),
        deleteLegalContact: (id) => a[0]((state) => ({
          legalContacts: state.legalContacts.filter((contact) => contact.id !== id),
        })),
        
        setLegalTasks: (tasks) => a[0]({ legalTasks: tasks }),
        addLegalTask: (task) => a[0]((state) => ({ 
          legalTasks: [...state.legalTasks, task] 
        })),
        updateLegalTask: (id, updates) => a[0]((state) => ({
          legalTasks: state.legalTasks.map((task) => 
            task.id === id ? { ...task, ...updates } : task
          ),
        })),
        deleteLegalTask: (id) => a[0]((state) => ({
          legalTasks: state.legalTasks.filter((task) => task.id !== id),
        })),
        
        setLegalNotes: (notes) => a[0]({ legalNotes: notes }),
        addLegalNote: (note) => a[0]((state) => ({ 
          legalNotes: [...state.legalNotes, note] 
        })),
        updateLegalNote: (id, updates) => a[0]((state) => ({
          legalNotes: state.legalNotes.map((note) => 
            note.id === id ? { ...note, ...updates } : note
          ),
        })),
        deleteLegalNote: (id) => a[0]((state) => ({
          legalNotes: state.legalNotes.filter((note) => note.id !== id),
        })),
        
        setLegalTimeline: (timeline) => a[0]({ legalTimeline: timeline }),
        addLegalTimelineEvent: (event) => a[0]((state) => ({ 
          legalTimeline: [...state.legalTimeline, event] 
        })),
        updateLegalTimelineEvent: (id, updates) => a[0]((state) => ({
          legalTimeline: state.legalTimeline.map((event) => 
            event.id === id ? { ...event, ...updates } : event
          ),
        })),
        deleteLegalTimelineEvent: (id) => a[0]((state) => ({
          legalTimeline: state.legalTimeline.filter((event) => event.id !== id),
        })),
        
        setEvidenceRecords: (evidence) => a[0]({ evidenceRecords: evidence }),
        addEvidenceRecord: (evidence) => a[0]((state) => ({ 
          evidenceRecords: [...state.evidenceRecords, evidence] 
        })),
        updateEvidenceRecord: (id, updates) => a[0]((state) => ({
          evidenceRecords: state.evidenceRecords.map((evidence) => 
            evidence.id === id ? { ...evidence, ...updates } : evidence
          ),
        })),
        deleteEvidenceRecord: (id) => a[0]((state) => ({
          evidenceRecords: state.evidenceRecords.filter((evidence) => evidence.id !== id),
        })),
        addChainOfCustodyEntry: (evidenceId, entry) => a[0]((state) => ({
          evidenceRecords: state.evidenceRecords.map((evidence) => 
            evidence.id === evidenceId 
              ? { ...evidence, chain_of_custody: [...evidence.chain_of_custody, entry] }
              : evidence
          ),
        })),
        
        setLegalDeadlines: (deadlines) => a[0]({ legalDeadlines: deadlines }),
        addLegalDeadline: (deadline) => a[0]((state) => ({ 
          legalDeadlines: [...state.legalDeadlines, deadline] 
        })),
        updateLegalDeadline: (id, updates) => a[0]((state) => ({
          legalDeadlines: state.legalDeadlines.map((deadline) => 
            deadline.id === id ? { ...deadline, ...updates } : deadline
          ),
        })),
        deleteLegalDeadline: (id) => a[0]((state) => ({
          legalDeadlines: state.legalDeadlines.filter((deadline) => deadline.id !== id),
        })),
        
        setDocumentTemplates: (templates) => a[0]({ documentTemplates: templates }),
        addDocumentTemplate: (template) => a[0]((state) => ({ 
          documentTemplates: [...state.documentTemplates, template] 
        })),
        updateDocumentTemplate: (id, updates) => a[0]((state) => ({
          documentTemplates: state.documentTemplates.map((template) => 
            template.id === id ? { ...template, ...updates } : template
          ),
        })),
        deleteDocumentTemplate: (id) => a[0]((state) => ({
          documentTemplates: state.documentTemplates.filter((template) => template.id !== id),
        })),
        
        // Exhibit Management actions
        setExhibits: (exhibits) => a[0]({ exhibits }),
        addExhibit: (exhibit) => a[0]((state) => ({
          exhibits: [...state.exhibits, exhibit]
        })),
        updateExhibit: (id, updates) => a[0]((state) => ({
          exhibits: state.exhibits.map((exhibit) => 
            exhibit.id === id ? { ...exhibit, ...updates } : exhibit
          ),
        })),
        deleteExhibit: (id) => a[0]((state) => ({
          exhibits: state.exhibits.filter((exhibit) => exhibit.id !== id),
          selectedExhibitId: state.selectedExhibitId === id ? null : state.selectedExhibitId,
        })),
        setSelectedExhibit: (id) => a[0]({ selectedExhibitId: id }),
        
        // File-to-Exhibit mapping
        assignFileToExhibit: (fileId, exhibitId, isPrimary = false) => a[0]((state) => {
          const exhibit = state.exhibits.find(e => e.exhibit_id === exhibitId);
          if (exhibit) {
            const existingFile = exhibit.files.find(f => f.file_id === fileId);
            if (!existingFile) {
              const newExhibitFile: ExhibitFile = {
                id: crypto.randomUUID(),
                file_id: fileId,
                exhibit_id: exhibitId,
                is_primary: isPrimary,
                created_at: new Date().toISOString(),
              };
              
              return {
                exhibits: state.exhibits.map(e => 
                  e.id === exhibit.id 
                    ? { ...e, files: [...e.files, newExhibitFile] }
                    : e
                )
              };
            }
          }
          return {};
        }),
        
        removeFileFromExhibit: (fileId, exhibitId) => a[0]((state) => ({
          exhibits: state.exhibits.map(exhibit => 
            exhibit.exhibit_id === exhibitId
              ? { ...exhibit, files: exhibit.files.filter(f => f.file_id !== fileId) }
              : exhibit
          )
        })),
        
        createExhibitFromFile: (fileId, exhibitId, title) => a[0]((state) => {
          const file = state.files.find(f => f.id === fileId);
          if (file && !state.exhibits.find(e => e.exhibit_id === exhibitId)) {
            const newExhibit: Exhibit = {
              id: crypto.randomUUID(),
              exhibit_id: exhibitId,
              project_id: file.project_id,
              title: title || `Exhibit ${exhibitId}`,
              exhibit_type: file.file_type.includes('image') ? 'photo' : 
                           file.file_type.includes('video') ? 'video' :
                           file.file_type.includes('audio') ? 'audio' : 'document',
              is_key_evidence: false,
              files: [{
                id: crypto.randomUUID(),
                file_id: fileId,
                exhibit_id: exhibitId,
                is_primary: true,
                created_at: new Date().toISOString(),
              }],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              owner_id: file.owner_id,
            };
            
            return {
              exhibits: [...state.exhibits, newExhibit],
              // Also update the file's exhibit_id
              files: state.files.map(f => 
                f.id === fileId ? { ...f, exhibit_id: exhibitId } : f
              )
            };
          }
          return {};
        }),
        
        // Auto-detection utilities
        detectExhibitIdFromFilename: (filename: string) => {
          // Patterns to match: "1-A:", "2B:", "15-C:", etc.
          const patterns = [
            /^(\d+[A-Z])/i,           // "1A", "2B", "15C"
            /^(\d+-[A-Z])/i,          // "1-A", "2-B", "15-C" 
            /^(\d+\s*[A-Z])/i,        // "1 A", "2 B", "15 C"
          ];
          
          for (const pattern of patterns) {
            const match = filename.match(pattern);
            if (match) {
              return match[1].replace(/[-\s]/g, '').toUpperCase();
            }
          }
          return null;
        },
        
        getNextExhibitId: () => {
          const state = a[0]();
          const existingIds = state.exhibits.map(e => e.exhibit_id);
          
          // Generate next sequential ID: 1A, 2A, 3A, etc.
          let nextNumber = 1;
          let nextLetter = 'A';
          
          while (existingIds.includes(`${nextNumber}${nextLetter}`)) {
            if (nextLetter === 'Z') {
              nextNumber++;
              nextLetter = 'A';
            } else {
              nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
            }
          }
          
          return `${nextNumber}${nextLetter}`;
        },
        
        // Citation Navigation
        setCitationHistory: (history) => a[0]({ citationHistory: history }),
        addCitationToHistory: (citation) => a[0]((state) => {
          const existingIndex = state.citationHistory.findIndex(
            c => c.exhibit_reference === citation.exhibit_reference
          );
          
          if (existingIndex >= 0) {
            // Update existing citation with new access time and count
            return {
              citationHistory: state.citationHistory.map((c, i) => 
                i === existingIndex 
                  ? { ...c, last_accessed: new Date().toISOString(), access_count: c.access_count + 1 }
                  : c
              )
            };
          } else {
            // Add new citation to history
            return {
              citationHistory: [...state.citationHistory, citation]
            };
          }
        }),
        
        setExhibitLinkActivation: (linkActivation) => a[0]({ exhibitLinkActivation: linkActivation }),
        
        navigateToExhibit: (exhibitReference, sourceContext = 'general') => a[0]((state) => {
          const exhibit = state.exhibits.find(e => e.exhibit_id === exhibitReference);
          if (exhibit && exhibit.files.length > 0) {
            const primaryFile = exhibit.files.find(f => f.is_primary) || exhibit.files[0];
            const targetFile = state.files.find(f => f.id === primaryFile.file_id);
            
            if (targetFile) {
              // Parse page number from reference if it exists (e.g., "2B:15")
              const [exhibitId, pageStr] = exhibitReference.split(':');
              const targetPage = pageStr ? parseInt(pageStr, 10) : undefined;
              
              // Create exhibit link activation
              const linkActivation: ExhibitLinkActivation = {
                type: 'citation',
                fileId: targetFile.id,
                exhibitId: exhibit.exhibit_id,
                exhibitReference,
                targetPage,
                timestamp: Date.now(),
                navigationType: sourceContext === 'editor' ? 'citation_click' : 'exhibit_click',
                sourceContext: sourceContext as any,
              };
              
              // Add to citation history
              const historyEntry: CitationHistory = {
                id: crypto.randomUUID(),
                exhibit_id: exhibit.exhibit_id,
                exhibit_reference: exhibitReference,
                target_file_id: targetFile.id,
                target_page: targetPage,
                last_accessed: new Date().toISOString(),
                access_count: 1,
              };
              
              return {
                selectedFileId: targetFile.id,
                exhibitLinkActivation: linkActivation,
                linkActivation, // Also set the general linkActivation
                citationHistory: [...state.citationHistory.filter(c => c.exhibit_reference !== exhibitReference), historyEntry],
              };
            }
          }
          return {};
        }),
        
        // Exhibit Utilities
        getExhibitByReference: (reference: string) => {
          const state = a[0]();
          const [exhibitId] = reference.split(':');
          return state.exhibits.find(e => e.exhibit_id === exhibitId) || null;
        },
        
        getFilesByExhibit: (exhibitId: string) => {
          const state = a[0]();
          const exhibit = state.exhibits.find(e => e.exhibit_id === exhibitId);
          if (exhibit) {
            return exhibit.files
              .map(ef => state.files.find(f => f.id === ef.file_id))
              .filter(Boolean) as File[];
          }
          return [];
        },
        
        getExhibitFiles: (exhibitId: string) => {
          const state = a[0]();
          const exhibit = state.exhibits.find(e => e.exhibit_id === exhibitId);
          return exhibit?.files || [];
        },
        
        generateCitationReference: (exhibitId: string, page?: number) => {
          return page ? `${exhibitId}:${page}` : exhibitId;
        },
      }),
      {
        name: 'clarity-hub-storage',
        partialize: (state) => ({
          themeMode: state.themeMode,
          selectedProjectId: state.selectedProjectId,
          isLeftPanelOpen: state.isLeftPanelOpen,
          isRightPanelOpen: state.isRightPanelOpen,
          // Don't persist panel state here as it's handled separately in the panel slice
        }),
      }
    )
  )
);

// Helper for using Zustand with shallow comparison
export function useShallowAppStore<U>(selector: (state: AppState) => U) {
  return useAppStore(selector, shallow);
}

export default useAppStore; 