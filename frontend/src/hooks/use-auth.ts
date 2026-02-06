import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const { user, isAuthenticated, logout } = useAuthStore();

  const hasRole = (...roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isDoctor = user?.role === 'DOCTOR';
  const isNurse = user?.role === 'NURSE';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const isLabTech = user?.role === 'LAB_TECH';

  return {
    user,
    isAuthenticated,
    hasRole,
    isAdmin,
    isDoctor,
    isNurse,
    isReceptionist,
    isLabTech,
    logout,
  };
}
