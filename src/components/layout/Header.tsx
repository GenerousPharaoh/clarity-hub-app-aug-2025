import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useAppStore from '@/store';
import {
  Scale,
  Sun,
  Moon,
  Monitor,
  Settings,
  LogOut,
  LayoutDashboard,
  Keyboard,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, signOut, isDemoMode } = useAuth();
  const themeMode = useAppStore((s) => s.themeMode);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ projectId: string }>();
  const projects = useAppStore((s) => s.projects);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isWorkspace = location.pathname.startsWith('/project/');
  const projectName = isWorkspace
    ? projects.find((p) => p.id === params.projectId)?.name
    : null;

  return (
    <header
      className={cn(
        'glass surface-grain flex h-12 shrink-0 items-center justify-between gap-2 px-2 sm:px-4',
        'border-b border-translucent',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]',
        'dark:shadow-[0_1px_3px_0_rgb(0_0_0/0.3)]'
      )}
    >
      {/* Left */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 shadow-sm transition-all group-hover:shadow-md group-hover:shadow-accent-500/25">
            <Scale className="h-3.5 w-3.5 text-white" />
          </div>
          {!isWorkspace && (
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100">
                Clarity Hub
              </span>
              {isDemoMode && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
                  Demo
                </span>
              )}
            </div>
          )}
        </Link>

        {isWorkspace && (
          <nav className="flex min-w-0 items-center gap-1 overflow-hidden text-xs" aria-label="Breadcrumb">
            <Link
              to="/"
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-md px-2 py-2 sm:px-1.5 sm:py-1',
                'font-medium text-surface-500',
                'transition-all hover:bg-surface-100 hover:text-surface-600',
                'dark:hover:bg-surface-800 dark:hover:text-surface-300'
              )}
            >
              <LayoutDashboard className="h-3 w-3" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            {projectName && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 text-surface-300 transition-colors dark:text-surface-600" />
                {isDemoMode && (
                  <>
                    <span className="hidden shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300 sm:inline-flex">
                      Demo
                    </span>
                    <ChevronRight className="hidden h-3 w-3 shrink-0 text-surface-300 transition-colors dark:text-surface-600 sm:block" />
                  </>
                )}
                <span className="min-w-0 max-w-[7.5rem] truncate font-medium text-surface-700 sm:max-w-[180px] dark:text-surface-200">
                  {projectName}
                </span>
              </>
            )}
          </nav>
        )}
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-0.5">
        {isWorkspace && (
          <HeaderButton
            onClick={() => useAppStore.getState().setShowKeyboardShortcuts(true)}
            title="Keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </HeaderButton>
        )}

        <HeaderButton
          onClick={toggleTheme}
          title={
            themeMode === 'light'
              ? 'Switch to dark mode'
              : themeMode === 'dark'
                ? 'Switch to system mode'
                : 'Switch to light mode'
          }
        >
          {themeMode === 'light' ? (
            <Sun className="h-4 w-4" />
          ) : themeMode === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
        </HeaderButton>

        <Link
          to="/settings"
          className={cn(
            'flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-lg',
            'text-surface-400 transition-all',
            'hover:bg-surface-100 hover:text-surface-600',
            'dark:hover:bg-surface-800 dark:hover:text-surface-300'
          )}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>

        <HeaderButton onClick={handleSignOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </HeaderButton>

        {user?.user_metadata?.avatar_url && (
          <img
            src={user.user_metadata.avatar_url}
            alt=""
            className="ml-1.5 h-7 w-7 rounded-full ring-2 ring-surface-200 dark:ring-surface-700"
          />
        )}
      </div>
    </header>
  );
}

function HeaderButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-lg',
        'text-surface-400 transition-all',
        'hover:bg-surface-100 hover:text-surface-600',
        'dark:hover:bg-surface-800 dark:hover:text-surface-300',
        'focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-1'
      )}
      title={title}
    >
      {children}
    </button>
  );
}
