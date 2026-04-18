import { useState, useRef, useEffect } from 'react';
import { Settings2, UserPlus, Settings, Mail, Search, User, LogOut, ChevronDown, Shield, Sun, Moon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/rootReducer';
import { logout } from '@/store/ducks/auth.duck';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

interface TopNavProps {
  title: string;
  onTabChange?: (tab: string) => void;
}

const TopNav = ({ title, onTabChange }: TopNavProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
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

  const [showSettings, setShowSettings] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      setIsUpdating(true);
      const { updatePasswordApi } = await import('@/services/auth/auth');
      const userId = user?.id;
      if (!userId) {
        throw new Error("Unable to identify user ID.");
      }
      await updatePasswordApi(userId, newPassword);
      const { toast } = await import('sonner');
      toast.success('Password updated successfully!');
      setShowSettings(false);
      setNewPassword('');
    } catch (e: any) {
      const { toast } = await import('sonner');
      toast.error(e.response?.data?.error || e.message || 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
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

          {/* Settings / Setup Dropdown */}
          {user?.role === 'admin' && (
            <div className="relative" ref={settingsRef}>
              <button 
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 group ${settingsOpen ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <Settings2 className={`w-5 h-5 transition-transform duration-300 ${settingsOpen ? 'rotate-90 text-primary' : 'group-hover:text-primary'}`} />
              </button>

              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-card/90 backdrop-blur-2xl rounded-2xl ring-1 ring-border shadow-2xl overflow-hidden z-50 border border-white/5 p-1.5 space-y-0.5"
                  >
                    <div className="px-3 py-2 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">System Setup</p>
                    </div>
                    
                    {[
                      { id: 'users', label: 'User Management', icon: UserPlus },
                      { id: 'settings', label: 'Company Settings', icon: Settings },
                      { id: 'email-config', label: 'Email Configuration', icon: Mail },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange?.(item.id);
                          setSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all group text-left"
                      >
                        <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

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
                      onClick={() => { setShowSettings(true); setDropdownOpen(false); }}
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

      {/* Account Settings / Reset Password Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-sm rounded-3xl ring-1 ring-border shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 text-center bg-muted/30 border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Account Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">Change your password.</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoFocus
                    required
                    className="w-full h-12 bg-muted/50 border border-border rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="flex-1 h-12 rounded-xl border border-border/60 hover:bg-muted font-bold transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !newPassword}
                    className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-bold shadow-lg shadow-primary/20 transition-all text-sm disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TopNav;
