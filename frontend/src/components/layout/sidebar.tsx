import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  LayoutDashboard, Users, Calendar, Stethoscope, Pill, FlaskConical,
  Receipt, FileText, Settings, UserCog, ChevronLeft, ChevronRight, Activity,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_TECH'] },
  { path: '/patients', label: 'Patients', icon: Users, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { path: '/appointments', label: 'Appointments', icon: Calendar, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { path: '/consultations', label: 'Consultations', icon: Stethoscope, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE'] },
  { path: '/prescriptions', label: 'Prescriptions', icon: Pill, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE'] },
  { path: '/laboratory', label: 'Laboratory', icon: FlaskConical, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECH'] },
  { path: '/billing', label: 'Billing', icon: Receipt, roles: ['SUPER_ADMIN', 'RECEPTIONIST'] },
  { path: '/documents', label: 'Documents', icon: FileText, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE'] },
  { path: '/users', label: 'Staff', icon: UserCog, roles: ['SUPER_ADMIN'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['SUPER_ADMIN'] },
  { path: '/audit-log', label: 'Audit Log', icon: Activity, roles: ['SUPER_ADMIN'] },
];

export function Sidebar() {
  const location = useLocation();
  const { isCollapsed, toggle } = useSidebarStore();
  const user = useAuthStore((s) => s.user);

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-primary">MedPulse</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
        <button
          onClick={toggle}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isCollapsed && 'justify-center px-2',
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
