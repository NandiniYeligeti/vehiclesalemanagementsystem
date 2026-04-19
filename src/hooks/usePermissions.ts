import { useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';

export const usePermissions = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const hasPermission = (menuId: string, action: 'view' | 'add' | 'edit' | 'delete') => {
    if (!user) return false;
    
    // Admins and Super Admins have all permissions
    if (user.role === 'admin' || user.role === 'super_admin') return true;

    const permission = user.permissions?.find(p => p.menu_id === menuId);
    if (!permission) return false;

    switch (action) {
      case 'view': return permission.can_view;
      case 'add': return permission.can_add;
      case 'edit': return permission.can_edit;
      case 'delete': return permission.can_delete;
      default: return false;
    }
  };

  const getFilteredMasters = <T extends { name: string }>(masters: T[], type: 'Branch' | 'Showroom' | 'Area'): T[] => {
    if (!user || user.role === 'admin' || user.role === 'super_admin') return masters;

    let allowedNames: string[] = [];
    if (type === 'Branch') allowedNames = user.branches || [];
    if (type === 'Showroom') allowedNames = user.showrooms || [];
    if (type === 'Area') allowedNames = user.areas || [];

    if (allowedNames.length === 0) return masters;

    return masters.filter(m => allowedNames.includes(m.name));
  };

  const getFilteredData = <T extends any>(data: T[], type: 'branch_id' | 'branch' | 'showroom' | 'area'): T[] => {
    if (!user || user.role === 'admin' || user.role === 'super_admin') return data;

    let allowedNames: string[] = [];
    if (type === 'branch' || type === 'branch_id') allowedNames = user.branches || [];
    if (type === 'showroom') allowedNames = user.showrooms || [];
    if (type === 'area') allowedNames = user.areas || [];

    if (allowedNames.length === 0) return data;

    return data.filter((item: any) => {
      const val = item[type];
      return !val || allowedNames.includes(val);
    });
  };

  return {
    hasPermission,
    getFilteredMasters,
    getFilteredData,
    user
  };
};
