import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/rootReducer';
import { logout } from '@/store/ducks/auth.duck';
import { motion, AnimatePresence } from 'framer-motion';

interface TopNavProps {
  title: string;
}

const TopNav = ({ title }: TopNavProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const initials = (user?.username || user?.company_name || 'A')[0].toUpperCase();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 lg:px-8 shrink-0">
      <h1 className="text-lg font-bold text-foreground pl-10 lg:pl-0">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center h-9 px-3 rounded-lg bg-background border border-input gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search (Cmd+K)"
            className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="user-menu-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-3 border-l border-border hover:bg-muted/50 pr-2 py-1.5 rounded-xl transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 text-primary font-bold text-sm">
              {initials}
            </div>
            {/* Name & Role */}
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-bold leading-none">
                {user?.username || user?.company_name || 'Admin'}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1 capitalize">
                {user?.role || 'admin'}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground ml-1 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 mt-2 w-60 bg-card rounded-xl ring-1 ring-border shadow-xl overflow-hidden z-50"
              >
                {/* User Info Header */}
                <div className="px-4 py-3 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 text-primary font-bold">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">
                        {user?.username || user?.company_name || 'Admin'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest capitalize">
                      {user?.role || 'admin'}
                    </span>
                    <span className="text-[10px] text-muted-foreground mx-1">·</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {user?.CompanyCode || '—'}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1.5">
                  <button
                    id="profile-menu-item"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    Profile
                  </button>
                </div>

                {/* Logout */}
                <div className="p-1.5 border-t border-border">
                  <button
                    id="logout-button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
