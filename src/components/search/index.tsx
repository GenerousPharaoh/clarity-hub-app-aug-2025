// Search Components
export { default as AdvancedSearchFilters } from './AdvancedSearchFilters';
export { default as FileList } from './FileList';
export { default as ProjectList } from './ProjectList';

// Enhanced Search Components
export { default as SmartSearchBox } from './components/SmartSearchBox';
export { default as SearchResultsView } from './components/SearchResultsView';
export { default as SavedSearchQueries } from './components/SavedSearchQueries';
export { default as SearchExportDialog } from './components/SearchExportDialog';

// Types and Services
export * from '../../services/advancedSearchService';
export type { SearchFilters } from '../../types';