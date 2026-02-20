import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useSidebarStore } from '@/stores/sidebar-store';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/command-palette/command-palette';
import { SessionExpiredDialog } from '@/components/auth/session-expired-dialog';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';

export function AppLayout() {
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();
  const { isIdle } = useIdleTimeout(30 * 60 * 1000);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          isCollapsed ? 'ml-16' : 'ml-64',
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <SessionExpiredDialog open={isIdle} onClose={() => {}} />
    </div>
  );
}
