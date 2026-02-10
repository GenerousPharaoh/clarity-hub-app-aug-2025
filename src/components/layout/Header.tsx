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
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-surface-200 bg-white px-4 dark:border-surface-700 dark:bg-surface-800">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 transition-colors group-hover:bg-primary-700">
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
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-700 dark:hover:text-surface-300"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-md text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-700 dark:hover:text-surface-300"
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
        </button>

        <Link
          to="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-md text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-700 dark:hover:text-surface-300"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>

        <button
          onClick={handleSignOut}
          className="flex h-8 w-8 items-center justify-center rounded-md text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-700 dark:hover:text-surface-300"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>

        {user?.user_metadata?.avatar_url && (
          <img
            src={user.user_metadata.avatar_url}
            alt=""
            className="ml-1 h-7 w-7 rounded-full ring-2 ring-surface-200 dark:ring-surface-600"
          />
        )}
      </div>
    </header>
  );
}
