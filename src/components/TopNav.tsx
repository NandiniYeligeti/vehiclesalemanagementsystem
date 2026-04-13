import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, ChevronDown, Shield, Sun, Moon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/rootReducer';
import { logout } from '@/store/ducks/auth.duck';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

interface TopNavProps {
  title: string;
}

const TopNav = ({ title }: TopNavProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme, setTheme } = useTheme();
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
    <header className="h-20 bg-card/70 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 z-40">
      <div className="flex flex-col">
        <h1 className="text-xl font-black text-foreground pl-12 lg:pl-0 tracking-tight">{title}</h1>
        <div className="hidden lg:flex items-center gap-1 pl-0">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Workspace</span>
          <span className="text-[10px] text-muted-foreground/40">/</span>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-all text-muted-foreground hover:text-primary active:scale-90 border border-border/40 shadow-sm"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 shadow-inner" />}
        </button>

        {/* Search */}
        <div className="hidden lg:flex items-center h-10 px-4 rounded-xl bg-muted/30 border border-border/40 gap-3 group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Search documents..."
            className="bg-transparent text-sm outline-none w-64 placeholder:text-muted-foreground/60 font-medium"
          />
          <kbd className="hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        <div className="w-px h-6 bg-border/60 mx-1 hidden sm:block"></div>

        {/* Notifications */}
        <button className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-all active:scale-90 group">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="user-menu-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1 rounded-2xl hover:bg-muted/50 transition-all"
          >
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 text-primary-foreground font-black text-xs ring-2 ring-white/10">
              {initials}
            </div>
            {/* Name & Role */}
            <div className="hidden sm:flex flex-col items-start pr-1">
              <span className="text-[13px] font-black leading-none text-foreground">
                {user?.username || user?.company_name || 'Admin'}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-bold mt-1 opacity-70">
                {user?.role || 'admin'}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground ml-1 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 mt-3 w-64 bg-card/90 backdrop-blur-2xl rounded-2xl ring-1 ring-border shadow-2xl overflow-hidden z-50 border border-white/5"
              >
                {/* User Info Header */}
                <div className="px-5 py-5 bg-gradient-to-br from-muted/50 to-transparent border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 text-primary-foreground font-black text-lg">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate text-foreground">
                        {user?.username || user?.company_name || 'Admin'}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tighter opacity-70">{user?.email || 'System Administrator'}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2 space-y-1">
                  <button
                    id="profile-menu-item"
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all group"
                  >
                    <User className="w-4 h-4 transition-transform group-hover:scale-110" />
                    Account Settings
                  </button>
                </div>

                {/* Logout */}
                <div className="p-2 border-t border-border/50 bg-muted/20">
                  <button
                    id="logout-button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all group"
                  >
                    <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Terminate Session
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
