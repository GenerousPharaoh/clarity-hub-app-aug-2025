import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { useProjects } from '@/hooks/useProjects';
import useAppStore from '@/store';

export function AppShell() {
  // Fetch projects at shell level so they're available on every page (incl. workspace on refresh)
  useProjects();

  const showCommandPalette = useAppStore((s) => s.showCommandPalette);
  const setShowCommandPalette = useAppStore((s) => s.setShowCommandPalette);

  // Global Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setShowCommandPalette(!showCommandPalette);
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [showCommandPalette, setShowCommandPalette]);

  return (
    <div className="flex h-screen flex-col bg-surface-50 dark:bg-surface-950">
      <Header />
      <main id="main-content" className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </div>
  );
}
