import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { useSidebarStore } from '@/stores/sidebar-store';
import { cn, getInitials } from '@/lib/utils';
import {
  Sun, Moon, Bell, LogOut, User, ChevronDown, Globe,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-card border-b flex items-center justify-between px-6 transition-all duration-300',
        isCollapsed ? 'left-16' : 'left-64',
      )}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          {user?.role === 'SUPER_ADMIN' ? t('auth.adminPanel') :
           user?.role === 'DOCTOR' ? `Dr. ${user.lastName}` :
           user?.firstName || t('app.name')}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors text-sm"
          title={t('language.switch')}
        >
          <Globe className="w-4 h-4" />
          <span className="font-medium uppercase">{i18n.language}</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors relative"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user ? getInitials(user.firstName, user.lastName) : '?'}
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-card border rounded-lg shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b">
                <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  {user?.role ? t(`roles.${user.role}`) : ''}
                </span>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <User className="w-4 h-4" /> {t('auth.profile')}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="w-4 h-4" /> {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
