import { Bell, Search, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { logout } from '@/store/ducks/auth.duck';

interface TopNavProps {
  title: string;
}

const TopNav = ({ title }: TopNavProps) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

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

        {/* User */}
        <button onClick={() => {
          if (window.confirm('Are you sure you want to log out?')) {
             dispatch(logout());
             window.location.href = '/login';
          }
        }} className="flex items-center gap-2 pl-2 border-l border-border hover:bg-muted/50 p-1.5 rounded-xl transition-colors text-left">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:flex flex-col">
             <span className="text-sm font-bold leading-none">{user?.company_name || 'Admin'}</span>
             <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">Tenant: {user?.CompanyCode || 'DEF'}</span>
          </div>
        </button>
      </div>
    </header>
  );
};

export default TopNav;
