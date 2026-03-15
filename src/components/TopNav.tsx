import { Bell, Search, User } from 'lucide-react';

interface TopNavProps {
  title: string;
}

const TopNav = ({ title }: TopNavProps) => {
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
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="hidden sm:block text-sm font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
