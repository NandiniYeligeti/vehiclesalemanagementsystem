import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, X, Upload, AlertTriangle, Loader2, LayoutGrid, List, Store, Phone, MapPin, Mail } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import { 
  getCustomersAction, 
  addCustomerAction, 
  deleteCustomerAction,
  Customer 
} from '@/store/ducks/customers.ducks';
import { getSalesOrdersAction } from '@/store/ducks/sales_orders.ducks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { formatCurrency, saleOrders, payments, ledgerEntries } from '@/data/mockData';
import CustomerProfile from '@/components/CustomerProfile';
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
import { Button } from "@/components/ui/button";
import { getMastersAction } from '@/store/ducks/company_masters.ducks';
import { usePermissions } from '@/hooks/usePermissions';

// Only name & mobile are required; everything else optional
const validationSchema = Yup.object().shape({
  customer_name: Yup.string()
    .min(2, 'Name too short')
    .max(50, 'Name too long')
    .required('Customer name is required'),
  mobile_number: Yup.string()
    .matches(/^\d{10}$/, 'Mobile number must be exactly 10 digits')
    .required('Mobile number is required'),
  email: Yup.string().email('Invalid email address'),
  address: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  pincode: Yup.string().matches(/^\d{6}$/, 'Pincode must be 6 digits').nullable(),
  aadhaar_card_no: Yup.string()
    .matches(/^(\d{12}|\d{4}-\d{4}-\d{4})$/, 'Invalid Aadhaar format')
    .nullable(),
  pan_card_no: Yup.string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .nullable(),
  showroom: Yup.string(),
});

const CustomersPage = () => {
  const dispatch = useDispatch();
  const { data: customers, loading, saving } = useSelector((state: RootState) => state.customers);
  const { data: salesOrders = [] } = useSelector((state: RootState) => state.salesOrders || { data: [] });
  const { user } = useSelector((state: RootState) => state.auth);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';
  const { data: masters } = useSelector((state: RootState) => state.companyMasters);
  const { hasPermission, getFilteredMasters, getFilteredData } = usePermissions();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [profileMode, setProfileMode] = useState<'view' | 'edit' | 'add' | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  
  // Custom Delete Confirmation state
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [deleteBlockedMsg, setDeleteBlockedMsg] = useState<string | null>(null);

  const showrooms = getFilteredMasters((masters || []).filter(m => m.type === 'Showroom'), 'Showroom');

  useEffect(() => {
    if (companyCode) {
      dispatch(getCustomersAction(companyCode));
      dispatch(getMastersAction(companyCode));
      dispatch(getSalesOrdersAction(companyCode));
    }
  }, [dispatch, companyCode]);

  // Sort newest first then filter
  const rawData = useMemo(() => getFilteredData(customers || [], 'showroom'), [customers, getFilteredData]);
  const filtered = [...rawData]
    .sort((a, b) => {
      const dateA = new Date(a.createdDate || a.created_at || 0).getTime();
      const dateB = new Date(b.createdDate || b.created_at || 0).getTime();
      return dateB - dateA;
    })
    .filter(c =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.mobile || '').includes(search) ||
      (c.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.mobile_number || '').includes(search)
    );

  const handleDeleteRequest = (item: any) => {
    const id = item._id || item.id;
    // Check if any sales orders are linked to this customer
    const linked = (salesOrders || []).filter(
      (so: any) => so.customer_id === id
    );
    if (linked.length > 0) {
      setDeleteBlockedMsg(
        `Cannot delete "${item.customer_name || item.name}" — ${linked.length} sales order(s) are linked to this customer.`
      );
      return;
    }
    setCustomerToDelete(id);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      dispatch(deleteCustomerAction(
        customerToDelete, 
        companyCode,
        () => {
          toast.success("Customer deleted successfully");
          setCustomerToDelete(null);
          dispatch(getCustomersAction(companyCode));
        },
        (err) => {
          toast.error(err || "Failed to delete customer");
          setCustomerToDelete(null);
        }
      ));
    }
  };

  const initialValues = {
    customer_name: '',
    mobile_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    aadhaar_card_no: '',
    pan_card_no: '',
    showroom: '',
    photo: null as File | null,
    company_id: companyCode,
    branch_id: 'MAIN_BRANCH'
  };

  return (
    <div className="space-y-6">
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
      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl overflow-hidden p-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center font-black text-2xl">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground font-medium text-sm mt-2">
              Are you sure you want to remove this customer? 
              This action is permanent and will remove all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-8">
            <AlertDialogCancel className="rounded-xl border-border/60 hover:bg-muted font-bold transition-all h-12 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20 border-none transition-all h-12 px-8"
              disabled={saving}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black">Customers</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Client Management</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 border rounded-xl px-4 h-11 bg-card w-full sm:w-72 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/60 gap-1 h-11">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 h-full rounded-lg transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-card shadow-sm text-primary font-bold' : 'text-muted-foreground hover:text-foreground font-medium'}`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-xs"></span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 h-full rounded-lg transition-all flex items-center gap-2 ${viewMode === 'card' ? 'bg-card shadow-sm text-primary font-bold' : 'text-muted-foreground hover:text-foreground font-medium'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-xs"></span>
            </button>
          </div>

          {hasPermission('customers', 'add') && (
            <Button
              className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
              onClick={() => {
                setShowForm(true);
                setProfileMode('add');
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Customer
            </Button>
          )}
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">City</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Showroom</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Created</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c._id || c.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground/60">{(c._id || c.id)?.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {(c.customer_name || c.name || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground/90">{c.customer_name || c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium tabular-nums">{c.mobile_number || c.mobile}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">{c.email || 'No email'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-muted-foreground font-medium">{c.city || '—'}</td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {(c as any).showroom ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wide">
                          <Store className="w-2.5 h-2.5" />{(c as any).showroom}
                        </span>
                      ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground tabular-nums text-xs">{(c.createdDate || c.created_at)?.split('T')[0] || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {hasPermission('customers', 'view') && (
                          <button onClick={() => { setSelectedCustomer(c); setProfileMode('view'); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('customers', 'edit') && (
                          <button onClick={() => { setSelectedCustomer(c); setProfileMode('edit'); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('customers', 'delete') && (
                          <button 
                            onClick={() => handleDeleteRequest(c)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 grayscale opacity-40">
                        <Search className="w-8 h-8" />
                        <p className="text-sm font-bold">No customers found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((c) => (
            <div key={c._id || c.id} className="bg-card rounded-2xl shadow-sm hover:shadow-md transition-all border border-border/50 overflow-hidden relative group">
              {/* Top primary bar */}
              <div className="h-1 w-full bg-primary" />
              
              <div className="p-4 space-y-3.5">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center border border-primary/10 shrink-0">
                       <span className="font-bold text-[15px] text-primary">{(c.customer_name || c.name || '?')[0].toUpperCase()}</span>
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-[15px] leading-none text-foreground">{c.customer_name || c.name}</h3>
                      <p className="text-[12px] font-semibold text-primary leading-none">{(c as any).showroom || 'No Showroom'}</p>
                      <div className="inline-block bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-medium leading-none">
                        {c.city || 'No City'}
                      </div>
                    </div>
                  </div>
                  {/* Active Tag - Assuming all customers are active for now or use a property if exists */}
                  <div className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Active
                  </div>
                </div>

                {/* Info Rows */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-2.5 bg-muted/30 px-3 py-2 rounded-[10px]">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[12px] font-medium text-muted-foreground">{c.mobile_number || c.mobile || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-muted/30 px-3 py-2 rounded-[10px]">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[12px] font-medium text-muted-foreground">{c.state ? `${c.city}, ${c.state}` : (c.city || 'N/A')}</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-muted/30 px-3 py-2 rounded-[10px]">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[12px] font-medium text-muted-foreground truncate">{c.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hasPermission('customers', 'view') && (
                      <button 
                        onClick={() => { setSelectedCustomer(c); setProfileMode('view'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">View</span>
                      </button>
                    )}
                    {hasPermission('customers', 'edit') && (
                      <button
                        onClick={() => { setSelectedCustomer(c); setProfileMode('edit'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Edit</span>
                      </button>
                    )}
                    {hasPermission('customers', 'delete') && (
                      <button
                        onClick={() => handleDeleteRequest(c)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Delete</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground opacity-60 font-medium hidden sm:block">Actions</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl p-8 rounded-3xl border-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-black">
              {profileMode === 'add' ? 'New Customer' : 'Edit Customer'}
            </DialogTitle>
            <p className="text-muted-foreground text-xs mt-1">
              Name & Mobile are required. Other fields are optional.
            </p>
          </DialogHeader>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values, { setSubmitting }) => {
              dispatch(addCustomerAction(
                values,
                companyCode,
                () => {
                  setShowForm(false);
                  setSubmitting(false);
                  toast.success('Customer added successfully');
                  dispatch(getCustomersAction(companyCode));
                },
                () => {
                  setSubmitting(false);
                }
              ));
            }}
          >
            {({ setFieldValue, values, isSubmitting }) => (
              <Form className="overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Photo Upload */}
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black font-black uppercase tracking-widest text-muted-foreground ml-1 mb-3 block">Profile Photo</label>
                    <div className="flex items-center gap-6">
                      <label className="relative group w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-muted/30 cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:bg-primary/5">
                        <input 
                          type="file" 
                          name="photo"
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setFieldValue('photo', e.target.files[0]);
                            }
                          }} 
                        />
                        {values.photo ? (
                           <img src={URL.createObjectURL(values.photo)} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase">Upload</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Required Fields */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Customer Name <span className="text-destructive">*</span>
                    </label>
                    <Field 
                      name="customer_name"
                      className="w-full rounded-xl h-11 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-4 text-sm font-medium" 
                      placeholder="e.g. John Doe" 
                    />
                    <ErrorMessage name="customer_name" component="div" className="text-[10px] font-bold text-destructive ml-1" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Mobile Number <span className="text-destructive">*</span>
                    </label>
                    <Field 
                      name="mobile_number"
                      className="w-full rounded-xl h-11 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-4 text-sm font-medium" 
                      placeholder="10-digit mobile" 
                    />
                    <ErrorMessage name="mobile_number" component="div" className="text-[10px] font-bold text-destructive ml-1" />
                  </div>

                  {/* Showroom */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Showroom</label>
                    <Field as="select" name="showroom" className="w-full rounded-xl h-11 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-4 text-sm font-bold">
                      <option value="">Select Showroom (optional)</option>
                      {showrooms.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </Field>
                  </div>

                  {/* Optional Fields */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                    <Field 
                      name="email"
                      className="w-full rounded-xl h-11 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-4 text-sm font-medium" 
                      placeholder="john@example.com" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">City</label>
                    <Field 
                      name="city"
                      className="w-full rounded-xl h-11 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-4 text-sm font-medium" 
                      placeholder="City" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">State</label>
                    <Field 
                      name="state"
                      className="w-full rounded-xl h-11 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-4 text-sm font-medium" 
                      placeholder="State" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pincode</label>
                    <Field 
                      name="pincode"
                      className="w-full rounded-xl h-11 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-4 text-sm font-medium" 
                      placeholder="6-digit code" 
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Address</label>
                    <Field 
                      name="address"
                      as="textarea"
                      className="w-full rounded-xl min-h-[80px] py-3 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-4 text-sm font-medium resize-none" 
                      placeholder="Street, House no." 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Aadhaar Card No</label>
                    <Field 
                      name="aadhaar_card_no"
                      className="w-full rounded-xl h-11 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-4 text-sm font-medium" 
                      placeholder="XXXX-XXXX-XXXX" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PAN Card No</label>
                    <Field 
                      name="pan_card_no"
                      className="w-full rounded-xl h-11 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 px-4 text-sm font-medium" 
                      placeholder="ABCDE1234F" 
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 mt-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (profileMode === 'edit' ? 'Update Profile' : 'Confirm Registration')}
                </Button>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Customer Profile Modal (View/Edit) */}
      {selectedCustomer && profileMode && (
        <CustomerProfile
          customer={selectedCustomer}
          mode={profileMode === 'edit' ? 'edit' : 'view'}
          onClose={() => { setSelectedCustomer(null); setProfileMode(null); }}
        />
      )}
    </div>
  );
};

export default CustomersPage;
