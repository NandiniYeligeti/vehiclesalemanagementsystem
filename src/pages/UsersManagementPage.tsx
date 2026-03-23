import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Plus, X, User, Mail, KeyRound, Loader2, Trash2, Users, Eye, EyeOff, Shield } from 'lucide-react';
import { RootState } from '@/store/rootReducer';
import { createUserApi, getUsersApi, deleteUserApi } from '@/services/auth/auth';
import { toast } from 'sonner';

interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: string;
  company_code: string;
  company_name: string;
  created_at: string;
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';

const UsersManagementPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const companyCode = user?.CompanyCode || sessionStorage.getItem('companyCode') || '';

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!companyCode) return;
    try {
      setLoading(true);
      const data = await getUsersApi(companyCode);
      setUsers(data || []);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyCode) fetchUsers();
  }, [companyCode]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCode) {
      toast.error('Company code not found');
      return;
    }
    try {
      setSubmitting(true);
      await createUserApi(companyCode, formData);
      toast.success('User created successfully!');
      setShowForm(false);
      setFormData({ username: '', email: '', password: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeletingId(userToDelete);
      await deleteUserApi(companyCode, userToDelete);
      toast.success('User deleted successfully!');
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Failed to delete user');
      setUserToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center font-black text-2xl">Remove User?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground font-medium text-sm mt-2">
              This will revoke all access for this user immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-8">
            <AlertDialogCancel className="rounded-xl border-border/60 hover:bg-muted font-bold transition-all h-12 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20 border-none transition-all h-12 px-8"
              disabled={!!deletingId}
            >
              {deletingId ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1 ml-[52px]">
            Create and manage user accounts for your company.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="erp-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{users.length}</p>
              <p className="text-xs text-muted-foreground font-medium">Total Users</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="erp-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{users.filter(u => u.role === 'user').length}</p>
              <p className="text-xs text-muted-foreground font-medium">Active Users</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="erp-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-bold truncate max-w-[160px]">{companyCode}</p>
              <p className="text-xs text-muted-foreground font-medium">Company Code</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="erp-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Created</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u, index) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-500 font-bold text-xs ring-1 ring-blue-500/10">
                        {(u.username || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-foreground/90 block">{u.username || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold capitalize">
                      <User className="w-3 h-3" />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground tabular-nums text-xs">
                    {u.created_at?.split('T')[0] || '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setUserToDelete(u.id)}
                      disabled={deletingId === u.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                    >
                      {deletingId === u.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Delete
                    </button>
                  </td>
                </motion.tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <Users className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-muted-foreground">No users created yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Click "Add New User" to create the first user account.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-2xl ring-1 ring-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-500" />
                    </div>
                    Create New User
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 ml-10">
                    Assign login credentials to a new user for your company.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateUser} className="overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  {/* Username */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2 block">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-all focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-all focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium"
                        placeholder="user@company.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2 block">
                      Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                        className="w-full h-11 pl-10 pr-12 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-all focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium"
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5 pl-1">
                      The user will use this password to log in to the system.
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-blue-500">User Access Info</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        This user will be able to log in with the assigned email and password.
                        They will be assigned to your company: <span className="font-bold">{companyCode}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      'Create User'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersManagementPage;
