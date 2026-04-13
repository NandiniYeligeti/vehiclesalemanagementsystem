import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, AlertTriangle, Loader2, Power } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { toast } from 'sonner';

import {
  getSalespersonsAction,
  addSalespersonAction,
  updateSalespersonAction,
  deleteSalespersonAction,
} from '@/store/ducks/salespersons.ducks';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

import { getMastersAction } from '@/store/ducks/company_masters.ducks';
import { getSalesOrdersAction } from '@/store/ducks/sales_orders.ducks';

const SalespersonsPage = () => {
  const dispatch = useDispatch();
  const { data: salespersons, loading, saving } = useSelector(
    (state: RootState) => state.salespersons || { data: [], loading: false, saving: false }
  );
  const { data: masters } = useSelector((state: RootState) => state.companyMasters);
  const { data: salesOrders = [] } = useSelector((state: RootState) => state.salesOrders || { data: [] });

  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [deleteBlockedMsg, setDeleteBlockedMsg] = useState<string | null>(null);

  const [form, setForm] = useState<any>({
    full_name: '',
    mobile_number: '',
    email: '',
    showroom: '',
    branch: '',
    area: '',
    is_inactive: false,
    inactive_date: '',
  });

  useEffect(() => {
    if (companyCode) {
      dispatch(getSalespersonsAction(companyCode));
      dispatch(getMastersAction(companyCode));
      dispatch(getSalesOrdersAction(companyCode));
    }
  }, [dispatch, companyCode]);

  const showrooms = (masters || []).filter(m => m.type === 'Showroom');
  const branches = (masters || []).filter(m => m.type === 'Branch');
  const areas = (masters || []).filter(m => m.type === 'Area');

  const filtered = (salespersons || []).filter((d: any) =>
    (d.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.full_name?.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!/^\d{10}$/.test(form.mobile_number)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }
    if (!form.showroom) {
      toast.error('Showroom is required');
      return;
    }

    const payload = {
      ...form,
      company_id: companyCode,
      branch_id: form.branch || 'MAIN_BRANCH',
      inactive_date: form.is_inactive && form.inactive_date ? new Date(form.inactive_date).toISOString() : null,
    };

    const id = form.entity_id || form._id || form.id;

    if (isEditing && id) {
      dispatch(
        updateSalespersonAction(id, payload, companyCode, () => {
          setOpen(false);
          setIsEditing(false);
          setForm({});
          toast.success('Salesperson updated successfully');
          dispatch(getSalespersonsAction(companyCode));
        })
      );
    } else {
      dispatch(
        addSalespersonAction(payload, companyCode, () => {
          setOpen(false);
          setForm({});
          toast.success('Salesperson added successfully');
          dispatch(getSalespersonsAction(companyCode));
        })
      );
    }
  };

  const handleDeleteRequest = (item: any) => {
    const id = item.entity_id || item._id || item.id;
    // Check if any sales orders are linked to this salesperson
    const linked = (salesOrders || []).filter(
      (so: any) => so.salesperson_id === id
    );
    if (linked.length > 0) {
      setDeleteBlockedMsg(
        `Cannot delete "${item.full_name}" — ${linked.length} sales order(s) are linked to this salesperson.`
      );
      return;
    }
    setPersonToDelete(id);
  };

  const confirmDelete = () => {
    if (personToDelete) {
      dispatch(deleteSalespersonAction(personToDelete, companyCode, () => {
        toast.success('Salesperson deleted successfully');
        setPersonToDelete(null);
        dispatch(getSalespersonsAction(companyCode));
      }));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Blocked Delete Dialog */}
      <AlertDialog open={!!deleteBlockedMsg} onOpenChange={() => setDeleteBlockedMsg(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-center font-black text-xl">Cannot Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2">
              {deleteBlockedMsg}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-6">
            <AlertDialogCancel className="rounded-xl font-bold px-8">OK</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Custom Deletion Dialog */}
      <AlertDialog open={!!personToDelete} onOpenChange={() => setPersonToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl overflow-hidden p-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center font-black text-2xl">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground font-medium text-sm mt-2">
              Are you sure you want to remove this salesperson from your team? 
              This action is permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-8">
            <AlertDialogCancel className="rounded-xl border-border/60 hover:bg-muted font-bold transition-all h-12 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20 border-none transition-all h-12 px-8"
              disabled={saving}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Remove from Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black">Sales Team</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Personnel Management</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 border rounded-xl px-4 h-11 bg-card w-full sm:w-72 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <Button
            className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
            onClick={() => {
              setForm({
                full_name: '',
                mobile_number: '',
                email: '',
                showroom: '',
                branch: '',
                area: '',
                is_inactive: false,
                inactive_date: '',
              });
              setIsEditing(false);
              setOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Member
          </Button>
        </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item: any) => (
          <Card key={item.entity_id || item._id || item.id} className="rounded-2xl shadow-sm hover:shadow-xl transition-all border-none erp-card overflow-hidden group">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {item.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-none">{item.full_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Badge className="bg-primary/5 text-primary border-none px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter">
                         {item.showroom || 'No Showroom'}
                      </Badge>
                      <Badge className="bg-muted text-muted-foreground border-none px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter">
                         {item.branch || 'No Branch'}
                      </Badge>
                    </div>
                  </div>
                </div>
                {item.is_inactive ? (
                  <Badge className="bg-red-500/10 text-red-600 border-none px-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Power className="w-2.5 h-2.5" /> INACTIVE
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/10 text-green-600 border-none px-2 rounded-lg text-[10px] font-black uppercase tracking-widest">ACTIVE</Badge>
                )}
              </div>

              <div className="space-y-3 bg-muted/30 p-4 rounded-xl text-sm">
                 <div className="grid grid-cols-2 gap-y-2">
                    <div className="space-y-0.5">
                       <p className="text-[9px] font-black text-muted-foreground uppercase opacity-60">Mobile</p>
                       <p className="font-bold text-xs">{item.mobile_number}</p>
                    </div>
                    <div className="space-y-0.5">
                       <p className="text-[9px] font-black text-muted-foreground uppercase opacity-60">Area</p>
                       <p className="font-bold text-xs">{item.area || 'N/A'}</p>
                    </div>
                    {item.is_inactive && item.inactive_date && (
                      <div className="col-span-2 space-y-0.5 pt-1">
                        <p className="text-[9px] font-black text-red-500 uppercase opacity-80">Inactive From</p>
                        <p className="font-bold text-xs text-red-600">{new Date(item.inactive_date).toLocaleDateString('en-IN')}</p>
                      </div>
                    )}
                    <div className="sm:col-span-2 space-y-0.5 pt-1">
                       <p className="text-[9px] font-black text-muted-foreground uppercase opacity-60">Support Email</p>
                       <p className="font-bold text-xs truncate">{item.email || 'N/A'}</p>
                    </div>
                 </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-border/60 hover:bg-primary/5 hover:text-primary transition-all font-bold gap-2 h-10"
                  onClick={() => {
                    setForm({
                      ...item,
                      inactive_date: item.inactive_date ? new Date(item.inactive_date).toISOString().split('T')[0] : '',
                    });
                    setIsEditing(true);
                    setOpen(true);
                  }}
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-border/60 hover:bg-destructive/5 hover:text-destructive transition-all font-bold h-10 px-3"
                  onClick={() => handleDeleteRequest(item)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && filtered.length === 0 && (
        <div className="flex items-center justify-center h-48 opacity-40 italic">
          Fetching team members...
        </div>
      )}

      {/* ADD / EDIT DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-8 rounded-3xl border-none shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-black">
              {isEditing ? 'Edit Team Member' : 'New Salesperson'}
            </DialogTitle>
            <p className="text-muted-foreground text-xs mt-1">
              Name, Mobile & Showroom are required.
            </p>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="John Doe"
                className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20"
                value={form.full_name || ''}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Mobile <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="10 digit number"
                  className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={form.mobile_number || ''}
                  onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                <Input
                  placeholder="john@example.com"
                  className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Showroom <span className="text-destructive">*</span>
                  </label>
                  <select 
                    className="w-full rounded-xl h-12 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-3 text-xs font-bold"
                    value={form.showroom || ''}
                    onChange={(e) => setForm({ ...form, showroom: e.target.value })}
                  >
                    <option value="">Select</option>
                    {showrooms.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Branch</label>
                  <select 
                    className="w-full rounded-xl h-12 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-3 text-xs font-bold"
                    value={form.branch || ''}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  >
                    <option value="">Select</option>
                    {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Area</label>
                  <select 
                    className="w-full rounded-xl h-12 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-3 text-xs font-bold"
                    value={form.area || ''}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                  >
                    <option value="">Select</option>
                    {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
               </div>
            </div>

            {/* Inactive Section */}
            <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-muted/10">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  className={`w-10 h-5 rounded-full transition-all duration-300 relative ${form.is_inactive ? 'bg-red-500' : 'bg-muted'}`}
                  onClick={() => setForm({ ...form, is_inactive: !form.is_inactive })}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${form.is_inactive ? 'translate-x-5' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-bold">Mark as Inactive</p>
                  <p className="text-[10px] text-muted-foreground">Inactive salespersons won't appear in new orders</p>
                </div>
              </label>
              {form.is_inactive && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date of Effect</label>
                  <Input
                    type="date"
                    className="rounded-xl h-11 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    value={form.inactive_date || ''}
                    onChange={(e) => setForm({ ...form, inactive_date: e.target.value })}
                  />
                </div>
              )}
            </div>

            <Button className="w-full h-12 mt-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isEditing ? 'Update Profile' : 'Confirm Registration')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalespersonsPage;
