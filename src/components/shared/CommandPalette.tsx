import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FolderOpen,
  FileText,
  Settings,
  LayoutDashboard,
  PanelLeft,
  PanelRight,
  Keyboard,
  Sun,
  Moon,
  Monitor,
  PenLine,
  Sparkles,
  Layers3,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppStore from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { readWorkspaceSession } from '@/lib/workspaceSession';

interface CommandItem {
  id: string;
  label: string;
  group: string;
  icon: React.ReactNode;
  keywords?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDemoMode, resetDemoWorkspace } = useAuth();

  const projects = useAppStore((s) => s.projects);
  const files = useAppStore((s) => s.files);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const toggleLeft = useAppStore((s) => s.toggleLeftPanel);
  const toggleRight = useAppStore((s) => s.toggleRightPanel);
  const setCenterTab = useAppStore((s) => s.setCenterTab);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const setRightTab = useAppStore((s) => s.setRightTab);
  const setMobileTab = useAppStore((s) => s.setMobileTab);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const themeMode = useAppStore((s) => s.themeMode);
  const setShowKeyboardShortcuts = useAppStore((s) => s.setShowKeyboardShortcuts);
  const requestNewNote = useAppStore((s) => s.requestNewNote);

  const isInWorkspace = location.pathname.startsWith('/project/');
  const lastSession = readWorkspaceSession();

  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Navigation
    items.push({
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      group: 'Navigation',
      icon: <LayoutDashboard className="h-4 w-4" />,
      keywords: 'home projects',
      action: () => { navigate('/'); onClose(); },
    });
    items.push({
      id: 'nav-settings',
      label: 'Go to Settings',
      group: 'Navigation',
      icon: <Settings className="h-4 w-4" />,
      keywords: 'preferences account theme',
      action: () => { navigate('/settings'); onClose(); },
    });
    if (lastSession?.projectId) {
      items.push({
        id: 'nav-resume-workspace',
        label: `Resume ${lastSession.projectName ?? 'last workspace'}`,
        group: 'Navigation',
        icon: <Layers3 className="h-4 w-4" />,
        keywords: `${lastSession.fileName ?? ''} ${lastSession.noteTitle ?? ''} continue recent`,
        action: () => {
          navigate(`/project/${lastSession.projectId}`);
          onClose();
        },
      });
    }

    // Projects
    for (const project of projects) {
      items.push({
        id: `project-${project.id}`,
        label: project.name,
        group: 'Projects',
        icon: <FolderOpen className="h-4 w-4" />,
        keywords: project.description ?? '',
        action: () => { navigate(`/project/${project.id}`); onClose(); },
      });
    }

    // Files (only if in a workspace)
    if (isInWorkspace && selectedProjectId) {
      const projectFiles = files.filter(
        (f) => f.project_id === selectedProjectId && !f.is_deleted
      );
      for (const file of projectFiles.slice(0, 20)) {
        items.push({
          id: `file-${file.id}`,
          label: file.name,
          group: 'Files',
          icon: <FileText className="h-4 w-4" />,
          keywords: file.file_type ?? '',
          action: () => { setSelectedFile(file.id); setRightPanel(true); setRightTab('viewer'); setMobileTab('viewer'); onClose(); },
        });
      }
    }

    // Workspace actions (only if in workspace)
    if (isInWorkspace) {
      items.push({
        id: 'action-overview-tab',
        label: 'Open Overview',
        group: 'Workspace',
        icon: <Layers3 className="h-4 w-4" />,
        keywords: 'summary overview project',
        action: () => { setCenterTab('overview'); setMobileTab('content'); onClose(); },
      });
      items.push({
        id: 'action-documents-tab',
        label: 'Open Documents',
        group: 'Workspace',
        icon: <PenLine className="h-4 w-4" />,
        keywords: 'notes documents editor draft',
        action: () => { setCenterTab('editor'); setMobileTab('content'); onClose(); },
      });
      items.push({
        id: 'action-exhibits-tab',
        label: 'Open Exhibits',
        group: 'Workspace',
        icon: <FolderOpen className="h-4 w-4" />,
        keywords: 'evidence exhibits markers',
        action: () => { setCenterTab('exhibits'); setMobileTab('content'); onClose(); },
      });
      items.push({
        id: 'action-new-document',
        label: 'Create Document',
        group: 'Workspace',
        icon: <PenLine className="h-4 w-4" />,
        keywords: 'new note document draft',
        action: () => {
          setCenterTab('editor');
          setMobileTab('content');
          requestNewNote();
          onClose();
        },
      });
      items.push({
        id: 'action-toggle-left',
        label: 'Toggle File Browser',
        group: 'Actions',
        icon: <PanelLeft className="h-4 w-4" />,
        keywords: 'panel sidebar left files',
        action: () => { toggleLeft(); onClose(); },
      });
      items.push({
        id: 'action-toggle-right',
        label: 'Toggle Viewer Panel',
        group: 'Actions',
        icon: <PanelRight className="h-4 w-4" />,
        keywords: 'panel sidebar right ai',
        action: () => { toggleRight(); onClose(); },
      });
      items.push({
        id: 'action-shortcuts',
        label: 'Keyboard Shortcuts',
        group: 'Actions',
        icon: <Keyboard className="h-4 w-4" />,
        keywords: 'help hotkeys',
        action: () => { setShowKeyboardShortcuts(true); onClose(); },
      });
      items.push({
        id: 'action-open-ai',
        label: 'Open AI Chat',
        group: 'Workspace',
        icon: <Sparkles className="h-4 w-4" />,
        keywords: 'assistant ai reasoning chat',
        action: () => { setRightPanel(true); setRightTab('ai'); setMobileTab('viewer'); onClose(); },
      });
    }

    // Theme
    const themeLabel =
      themeMode === 'light' ? 'Switch to Dark Mode' :
      themeMode === 'dark' ? 'Switch to System Mode' :
      'Switch to Light Mode';
    const ThemeIcon = themeMode === 'light' ? Moon : themeMode === 'dark' ? Monitor : Sun;
    items.push({
      id: 'action-theme',
      label: themeLabel,
      group: 'Actions',
      icon: <ThemeIcon className="h-4 w-4" />,
      keywords: 'dark light system appearance',
      action: () => { toggleTheme(); onClose(); },
    });

    if (isDemoMode) {
      items.push({
        id: 'action-reset-demo',
        label: 'Reset Demo Workspace',
        group: 'Actions',
        icon: <RotateCcw className="h-4 w-4" />,
        keywords: 'demo restore sample data reset',
        action: () => {
          void resetDemoWorkspace();
          onClose();
        },
      });
    }

    return items;
  }, [
    files,
    isDemoMode,
    isInWorkspace,
    lastSession,
    navigate,
    onClose,
    projects,
    requestNewNote,
    resetDemoWorkspace,
    selectedProjectId,
    setCenterTab,
    setMobileTab,
    setRightPanel,
    setRightTab,
    setSelectedFile,
    setShowKeyboardShortcuts,
    themeMode,
    toggleLeft,
    toggleRight,
    toggleTheme,
  ]);

  // Filter commands
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        (c.keywords && c.keywords.toLowerCase().includes(q))
    );
  }, [commands, query]);

  // Group filtered results
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    return groups;
  }, [filtered]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filtered[selectedIndex]) {
            filtered[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filtered, selectedIndex, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative z-10 w-full max-w-lg overflow-hidden',
              'rounded-xl border border-surface-200 bg-white shadow-2xl',
              'dark:border-surface-700 dark:bg-surface-800'
            )}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-surface-100 px-4 dark:border-surface-700">
              <Search className="h-4 w-4 shrink-0 text-surface-400 dark:text-surface-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, projects, files..."
                className="h-12 w-full bg-transparent text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-surface-100 dark:placeholder:text-surface-500"
              />
              <kbd className="hidden shrink-0 rounded border border-surface-200 bg-surface-50 px-1.5 py-0.5 font-mono text-xs text-surface-400 sm:inline dark:border-surface-700 dark:bg-surface-700 dark:text-surface-500">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    No results found
                  </p>
                </div>
              ) : (
                Object.entries(grouped).map(([group, items]) => (
                  <div key={group}>
                    <div className="px-4 pb-1 pt-2">
                      <span className="bg-surface-50/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:bg-surface-800/50 dark:text-surface-500">
                        {group}
                      </span>
                    </div>
                    {items.map((item) => {
                      const globalIndex = filtered.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          data-index={globalIndex}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                            globalIndex === selectedIndex
                              ? 'border-l-2 border-l-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                              : 'border-l-2 border-l-transparent text-surface-600 dark:text-surface-300'
                          )}
                        >
                          <span className={cn(
                            'shrink-0',
                            globalIndex === selectedIndex
                              ? 'text-primary-500 dark:text-primary-400'
                              : 'text-surface-400 dark:text-surface-500'
                          )}>
                            {item.icon}
                          </span>
                          <span className="truncate" title={item.label}>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-surface-100 px-4 py-2 dark:border-surface-700">
              <span className="text-xs text-surface-400 dark:text-surface-500">
                <kbd className="rounded border border-surface-200 px-1 py-px font-mono text-[9px] dark:border-surface-700">↑↓</kbd>
                {' '}navigate
              </span>
              <span className="text-xs text-surface-400 dark:text-surface-500">
                <kbd className="rounded border border-surface-200 px-1 py-px font-mono text-[9px] dark:border-surface-700">↵</kbd>
                {' '}select
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
