import { Link, useLocation, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, signOut } = useAuth();
  const { themeMode, toggleTheme } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isWorkspace = location.pathname.startsWith('/project/');

  return (
    <header
      className={cn(
        'glass flex h-12 shrink-0 items-center justify-between px-4',
        'border-b border-surface-200/60 dark:border-surface-800/60',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]',
        'dark:shadow-[0_1px_3px_0_rgb(0_0_0/0.3)]'
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm transition-all group-hover:shadow-md group-hover:shadow-primary-500/25">
            <Scale className="h-3.5 w-3.5 text-white" />
          </div>
          {!isWorkspace && (
            <span className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100">
              Clarity Hub
            </span>
          )}
        </Link>

        {isWorkspace && (
          <Link
            to="/"
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1',
              'text-xs font-medium text-surface-500',
              'transition-all hover:bg-surface-100 hover:text-surface-700',
              'dark:hover:bg-surface-800 dark:hover:text-surface-300'
            )}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-0.5">
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
            'flex h-8 w-8 items-center justify-center rounded-lg',
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
        'flex h-8 w-8 items-center justify-center rounded-lg',
        'text-surface-400 transition-all',
        'hover:bg-surface-100 hover:text-surface-600',
        'dark:hover:bg-surface-800 dark:hover:text-surface-300'
      )}
      title={title}
    >
      {children}
    </button>
  );
}
