import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Building, Mail, KeyRound, Loader2, PlaySquare, LogOut } from 'lucide-react';
import { RootState } from '@/store/rootReducer';
import { createCompanyApi, getCompaniesApi } from '@/services/auth/auth';
import { toast } from 'sonner';
import { logout, impersonateCompany } from '@/store/ducks/auth.duck';

const SuperAdminPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_code: '',
    admin_email: '',
    admin_password: ''
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await getCompaniesApi();
      setCompanies(data || []);
    } catch(e) {
       console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'super_admin') {
      navigate('/login');
    } else {
      fetchCompanies();
    }
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createCompanyApi(formData);
      toast.success('Company created successfully!');
      setShowForm(false);
      setFormData({ company_name: '', company_code: '', admin_email: '', admin_password: '' });
      fetchCompanies();
    } catch(error: any) {
      toast.error(error.response?.data?.error || error.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 text-primary">
               <PlaySquare className="w-4 h-4" />
             </div>
             <div className="flex flex-col">
                <span className="font-bold tracking-tight leading-none text-foreground">Super Admin Console</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Permissions & Access</span>
             </div>
          </div>
          <div>
            <button onClick={handleLogout} className="text-sm font-semibold flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-lg hover:bg-destructive/10">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Active Companies</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage global company tenants and their administrator accounts.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Company
          </button>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Company Name</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Tenant Code</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Email</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Created</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {(c.company_name || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground/90">{c.company_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-muted-foreground">{c.company_code}</td>
                    <td className="px-6 py-4 font-medium">{c.email}</td>
                    <td className="px-6 py-4 text-muted-foreground tabular-nums text-xs">{(c.created_at)?.split('T')[0] || '—'}</td>
                    <td className="px-6 py-4 text-right">
                       <span className="status-badge status-delivered">Active</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow hover:scale-105 transition-all"
                        onClick={() => {
                          dispatch(impersonateCompany({ company: c }));
                          navigate('/');
                        }}
                      >
                        Access
                      </button>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 grayscale opacity-40">
                        <Building className="w-8 h-8" />
                        <p className="text-sm font-bold">No companies found</p>
                      </div>
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                       <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>

      {/* Add Company Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl ring-1 ring-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                <div>
                  <h3 className="text-lg font-bold">New Sub-Tenant</h3>
                  <p className="text-xs text-muted-foreground">Provision a new independent company environment.</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateCompany} className="overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2 block">Company Name</label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                                type="text"
                                value={formData.company_name}
                                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                                required
                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-all focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium" 
                                placeholder="Global Motors LLC" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2 block">Company Code</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground opacity-50 px-1 py-0.5 rounded text-[10px]">C-</span>
                            <input 
                                type="text"
                                value={formData.company_code}
                                onChange={(e) => setFormData({...formData, company_code: e.target.value})}
                                required
                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-all focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium uppercase font-mono tracking-wider" 
                                placeholder="GMLtd" 
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 py-2 opacity-50"><div className="flex-1 h-px bg-border"></div><span className="text-xs font-bold leading-none uppercase tracking-widest">Admin Account</span><div className="flex-1 h-px bg-border"></div></div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2 block">Administrator Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                                type="email"
                                value={formData.admin_email}
                                onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                                required
                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-all focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium" 
                                placeholder="admin@gmltd.com" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2 block">Administrator Password</label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                                type="text"
                                value={formData.admin_password}
                                onChange={(e) => setFormData({...formData, admin_password: e.target.value})}
                                required
                                minLength={6}
                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-all focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium" 
                                placeholder="TempPass123" 
                            />
                        </div>
                    </div>
                </div>

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
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : 'Provision Tenant'}
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

export default SuperAdminPage;
