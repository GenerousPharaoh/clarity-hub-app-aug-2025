import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-surface-50 dark:bg-surface-900">
      <Header />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
