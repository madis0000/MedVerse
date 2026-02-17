import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useAuthStore } from '@/stores/auth-store';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  LayoutDashboard, Users, Calendar, Stethoscope, Pill, FlaskConical,
  Receipt, Landmark, FileText, Settings, UserCog, ChevronLeft, ChevronRight,
  Activity, ChevronDown, Clock, TrendingUp, Wallet, FileBarChart, PenLine,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// --- Types ---

interface NavChild {
  path: string;
  labelKey: string;
  icon: LucideIcon;
}

interface NavItemSimple {
  path: string;
  labelKey: string;
  icon: LucideIcon;
  roles: string[];
  children?: undefined;
}

interface NavItemGroup {
  path: string;
  labelKey: string;
  icon: LucideIcon;
  roles: string[];
  children: NavChild[];
}

type NavItem = NavItemSimple | NavItemGroup;

// --- Data ---

const navItems: NavItem[] = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_TECH'] },
  { path: '/patients', labelKey: 'nav.patients', icon: Users, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { path: '/appointments', labelKey: 'nav.appointments', icon: Calendar, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { path: '/consultations', labelKey: 'nav.consultations', icon: Stethoscope, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE'] },
  { path: '/prescriptions', labelKey: 'nav.prescriptions', icon: Pill, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE'] },
  { path: '/laboratory', labelKey: 'nav.laboratory', icon: FlaskConical, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECH'] },
  { path: '/billing', labelKey: 'nav.billing', icon: Receipt, roles: ['SUPER_ADMIN', 'RECEPTIONIST'] },
  {
    path: '/finance',
    labelKey: 'nav.finance',
    icon: Landmark,
    roles: ['SUPER_ADMIN'],
    children: [
      { path: '/finance', labelKey: 'nav.financeOverview', icon: LayoutDashboard },
      { path: '/finance/daily', labelKey: 'nav.financeDaily', icon: Clock },
      { path: '/finance/revenue', labelKey: 'nav.financeRevenue', icon: TrendingUp },
      { path: '/finance/expenses', labelKey: 'nav.financeExpenses', icon: Wallet },
      { path: '/finance/reports', labelKey: 'nav.financeReports', icon: FileBarChart },
      { path: '/finance/data-entry', labelKey: 'nav.financeDataEntry', icon: PenLine },
    ],
  },
  { path: '/documents', labelKey: 'nav.documents', icon: FileText, roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE'] },
  { path: '/users', labelKey: 'nav.staff', icon: UserCog, roles: ['SUPER_ADMIN'] },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings, roles: ['SUPER_ADMIN'] },
  { path: '/audit-log', labelKey: 'nav.auditLog', icon: Activity, roles: ['SUPER_ADMIN'] },
];

// --- NavGroup (submenu with children) ---

function NavGroup({ item, isCollapsed }: { item: NavItemGroup; isCollapsed: boolean }) {
  const location = useLocation();
  const { t } = useTranslation();
  const { openGroups, toggleGroup } = useSidebarStore();
  const [hovered, setHovered] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOpen = openGroups.includes(item.path);
  const isGroupActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setHovered(false), 150);
  };

  // --- Collapsed: popover flyout ---
  if (isCollapsed) {
    const Icon = item.icon;
    return (
      <Popover open={hovered} onOpenChange={setHovered}>
        <PopoverTrigger asChild>
          <button
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-colors',
              isGroupActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            title={t(item.labelKey)}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          sideOffset={8}
          className="w-48 p-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <p className="px-2 pb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t(item.labelKey)}
          </p>
          {item.children.map((child) => {
            const ChildIcon = child.icon;
            const isChildActive = location.pathname === child.path;
            return (
              <Link
                key={child.path}
                to={child.path}
                onClick={() => setHovered(false)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isChildActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <ChildIcon className="w-4 h-4 flex-shrink-0" />
                <span>{t(child.labelKey)}</span>
              </Link>
            );
          })}
        </PopoverContent>
      </Popover>
    );
  }

  // --- Expanded: collapsible submenu ---
  const Icon = item.icon;
  return (
    <div>
      <button
        onClick={() => toggleGroup(item.path)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isGroupActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1 text-left">{t(item.labelKey)}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-300',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-1 space-y-0.5">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const isChildActive = location.pathname === child.path;
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  className={cn(
                    'flex items-center gap-2 rounded-lg pl-9 pr-3 py-2 text-sm transition-colors',
                    isChildActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <ChildIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{t(child.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Sidebar ---

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
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
            <span className="text-lg font-bold text-primary">{t('app.name')}</span>
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
          // Render group with children
          if (item.children) {
            return <NavGroup key={item.path} item={item} isCollapsed={isCollapsed} />;
          }

          // Render simple nav item
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
              title={isCollapsed ? t(item.labelKey) : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
