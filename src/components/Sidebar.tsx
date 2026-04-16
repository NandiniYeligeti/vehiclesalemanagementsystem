import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserCheck, Car, ShoppingCart, CreditCard,
  Landmark, BookOpen, BarChart3, Settings, ChevronLeft, Menu, UserPlus, Gift,
  ChevronDown, Settings2, Mail
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { getCompanySettingsAction } from '@/store/ducks/company.ducks';

const allMenuItems = [
  { id: 'dashboard',   label: 'Dashboard',        icon: LayoutDashboard, roles: ['admin', 'user'] },
  { id: 'customers',   label: 'Customers',         icon: Users,           roles: ['admin', 'user'] },
  { id: 'salespersons',label: 'Salespersons',      icon: UserCheck,       roles: ['admin', 'user'] },
  { id: 'vehicles',    label: 'Vehicles',          icon: Car,             roles: ['admin', 'user'] },
  { id: 'vehicle-inventory', label: 'Vehicle Inventory', icon: ShoppingCart,    roles: ['admin', 'user'] },
  { id: 'sales',       label: 'Sales Orders',      icon: ShoppingCart,    roles: ['admin', 'user'] },
  { id: 'payments',    label: 'Payments',          icon: CreditCard,      roles: ['admin', 'user'] },
  { id: 'loans',       label: 'Loan Management',   icon: Landmark,        roles: ['admin', 'user'] },
  { id: 'ledger',      label: 'Customer Ledger',   icon: BookOpen,        roles: ['admin', 'user'] },
  { id: 'incentives',  label: 'Incentive Management', icon: Gift,      roles: ['admin', 'user'] },
  { id: 'reports',     label: 'Reports',           icon: BarChart3,       roles: ['admin', 'user'] },
  { 
    id: 'setup', 
    label: 'Setup', 
    icon: Settings2, 
    roles: ['admin'],
    children: [
      { id: 'users',       label: 'User Management',   icon: UserPlus,        roles: ['admin'] },
      { id: 'settings',    label: 'Settings',          icon: Settings,        roles: ['admin'] },
      { id: 'email-config',label: 'Email Config',      icon: Mail,            roles: ['admin'] },
    ]
  },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);
  const { settings } = useSelector((state: RootState) => state.company);
  const role = user?.role || 'user';
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  useEffect(() => {
    if (companyCode) {
      // Fetch if settings are missing OR if settings belong to a different company
      if (!settings || settings.company_id !== companyCode) {
        dispatch(getCompanySettingsAction(companyCode));
      }
    }
  }, [dispatch, companyCode, settings?.company_id]);

  // Filter items the current role is allowed to see
  const menuItems = allMenuItems.filter((item) => {
    const isRoleAllowed = item.roles.includes(role) || role === 'super_admin';
    if (!isRoleAllowed) return false;

    if (role === 'user') {
       return (user?.menus || []).includes(item.id);
    }

    return true;
  }).map(item => {
    if (item.children) {
      return {
        ...item,
        children: item.children.filter((child: any) => {
          const isChildAllowed = (child.roles || []).includes(role) || role === 'super_admin';
          if (!isChildAllowed) return false;
          if (role === 'user') {
            return (user?.menus || []).includes(child.id);
          }
          return true;
        })
      };
    }
    return item;
  });

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card ring-1 ring-border"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-foreground/40 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 h-screen flex flex-col
          bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))]
          transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${collapsed ? 'w-[80px]' : 'w-72'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          border-r border-[hsl(var(--sidebar-border))]
        `}
      >
        {/* Logo */}
        <div className="relative h-20 flex items-center px-6 border-b border-[hsl(var(--sidebar-border))] shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] flex items-center justify-center overflow-hidden shrink-0 group hover:rotate-6 transition-transform">
             {settings?.logo_url ? (
               <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
             ) : (
               <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
             )}
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-4 flex flex-col min-w-0"
            >
              <span className="text-base font-black text-[hsl(var(--sidebar-active))] tracking-tight truncate">
                {settings?.company_name || 'DDR AutoPro'}
              </span>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80"></span>
            </motion.div>
          )}

          {/* Collapse toggle (desktop only) mapped to Top Right */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 items-center justify-center bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] hover:text-primary hover:bg-[hsl(var(--sidebar-hover-bg))] rounded-full border border-[hsl(var(--sidebar-border))] shadow-md transition-all hover:scale-110 z-50"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            if (item.children && item.children.length > 0) {
              const isAnyChildActive = item.children.some((child: any) => activeTab === child.id);
              
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (collapsed) setCollapsed(false);
                      setSetupOpen(!setupOpen);
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[13px] font-bold
                      transition-all duration-200
                      ${isAnyChildActive ? 'text-[hsl(var(--sidebar-active))] bg-[hsl(var(--sidebar-active-bg))] shadow-lg shadow-black/20' : 'text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-active))]'}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className={`w-5 h-5 shrink-0 ${isAnyChildActive ? 'text-primary' : 'opacity-60'}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 opacity-40 ${setupOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  <AnimatePresence>
                    {setupOpen && !collapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-1 ml-6 border-l border-[hsl(var(--sidebar-border))] pl-4 mt-1"
                      >
                        {item.children.map((child: any) => {
                          const isChildActive = activeTab === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => {
                                onTabChange(child.id);
                                setMobileOpen(false);
                              }}
                              className={`
                                w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-[12px] font-bold
                                transition-all duration-200
                                ${isChildActive
                                  ? 'text-primary'
                                  : 'text-[hsl(var(--sidebar-fg))] hover:text-primary'
                                }
                              `}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full transition-all ${isChildActive ? 'bg-primary scale-125' : 'bg-muted-foreground/30'}`} />
                              <span>{child.label}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-bold
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-active))]'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-foreground' : 'opacity-60 group-hover:opacity-100 group-hover:text-primary'}`} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
