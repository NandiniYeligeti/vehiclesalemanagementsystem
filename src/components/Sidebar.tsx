import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserCheck, Car, ShoppingCart, CreditCard,
  Landmark, BookOpen, BarChart3, Settings, ChevronLeft, Menu
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'salespersons', label: 'Salespersons', icon: UserCheck },
  { id: 'vehicles', label: 'Vehicles', icon: Car },
  { id: 'sales', label: 'Sales Orders', icon: ShoppingCart },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'loans', label: 'Loan Management', icon: Landmark },
  { id: 'ledger', label: 'Customer Ledger', icon: BookOpen },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${collapsed ? 'w-[72px]' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[hsl(var(--sidebar-border))]">
          <Car className="w-7 h-7 text-primary shrink-0" />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-3 text-lg font-bold text-[hsl(var(--sidebar-active))] tracking-tight"
            >
              AutoDesk
            </motion.span>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-100
                  ${isActive
                    ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active))]'
                    : 'hover:bg-[hsl(var(--sidebar-hover-bg))] text-[hsl(var(--sidebar-fg))]'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-12 border-t border-[hsl(var(--sidebar-border))] hover:bg-[hsl(var(--sidebar-hover-bg))] transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
