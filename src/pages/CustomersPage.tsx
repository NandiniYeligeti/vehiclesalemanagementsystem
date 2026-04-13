import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, X, Upload, AlertTriangle, Loader2, LayoutGrid, List, Store } from 'lucide-react';
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
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';
  const { data: masters } = useSelector((state: RootState) => state.companyMasters);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [profileMode, setProfileMode] = useState<'view' | 'edit' | 'add' | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  
  // Custom Delete Confirmation state
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const showrooms = (masters || []).filter(m => m.type === 'Showroom');

  useEffect(() => {
    if (companyCode) {
      dispatch(getCustomersAction(companyCode));
      dispatch(getMastersAction(companyCode));
    }
  }, [dispatch, companyCode]);

  // Sort newest first then filter
  const filtered = [...customers]
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

  const confirmDelete = () => {
    if (customerToDelete) {
      dispatch(deleteCustomerAction(
        customerToDelete, 
        companyCode,
        () => {
          toast.success("Customer deleted successfully");
          setCustomerToDelete(null);
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
      {/* Custom Alert Dialog for Deletion */}
      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center font-black text-xl text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm font-medium">
              This action cannot be undone. This will permanently delete the customer profile 
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl font-bold border-border/60 hover:bg-muted transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20 transition-all border-none"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center h-10 px-4 rounded-xl bg-card border border-border/60 shadow-sm gap-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground font-medium"
            />
          </div>
          {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium bg-muted/50 px-3 py-1 rounded-full border border-border animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            Syncing...
          </div>}
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/60 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setProfileMode('add');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
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
                        <button onClick={() => { setSelectedCustomer(c); setProfileMode('view'); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setSelectedCustomer(c); setProfileMode('edit'); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setCustomerToDelete(c._id || c.id!)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((c) => (
            <motion.div 
              key={c._id || c.id} 
              initial={{ opacity: 0, scale: 0.97 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="erp-card p-5 group hover:shadow-xl transition-all border-none"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                    {(c.customer_name || c.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-foreground/90 leading-none">{c.customer_name || c.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.mobile_number || c.mobile}</p>
                  </div>
                </div>
                {(c as any).showroom && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[9px] font-bold uppercase tracking-wide">
                    <Store className="w-2.5 h-2.5" />{(c as any).showroom}
                  </span>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/30 rounded-xl p-3 mb-4">
                <div className="flex justify-between">
                  <span className="font-medium">Email</span>
                  <span className="text-foreground/70 truncate ml-4 max-w-[140px]">{c.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">City</span>
                  <span className="text-foreground/70">{c.city || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Added</span>
                  <span className="text-foreground/70">{(c.createdDate || c.created_at)?.split('T')[0] || '—'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedCustomer(c); setProfileMode('view'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border/60 text-xs font-bold hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button 
                  onClick={() => { setSelectedCustomer(c); setProfileMode('edit'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border/60 text-xs font-bold hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button 
                  onClick={() => setCustomerToDelete(c._id || c.id!)}
                  className="flex items-center justify-center px-3 py-2 rounded-xl border border-border/60 text-xs font-bold hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="col-span-3 flex flex-col items-center gap-2 py-20 grayscale opacity-40">
              <Search className="w-8 h-8" />
              <p className="text-sm font-bold">No customers found</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl ring-1 ring-border shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                <div>
                  <h3 className="text-lg font-bold">Add New Customer</h3>
                  <p className="text-xs text-muted-foreground">Name & Mobile are required. Other fields are optional.</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>

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
                    },
                    () => {
                      setSubmitting(false);
                    }
                  ));
                }}
              >
                {({ setFieldValue, values, isSubmitting }) => (
                  <Form className="overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Photo Upload */}
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Profile Photo <span className="text-muted-foreground/50 normal-case font-normal">(optional)</span></label>
                        <div className="flex items-center gap-6">
                          <label className="relative group w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-muted/30 cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:bg-primary/5">
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
                                <Upload className="w-5 h-5" />
                                <span className="text-[10px] font-bold">Upload</span>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Required Fields */}
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2 block">
                          Customer Name <span className="text-destructive">*</span>
                        </label>
                        <Field 
                          name="customer_name"
                          className="erp-input h-11 px-4 text-sm bg-muted/20 border-border/60 hover:border-border transition-all focus:ring-2 focus:ring-primary/10" 
                          placeholder="e.g. John Doe" 
                        />
                        <ErrorMessage name="customer_name" component="div" className="text-[10px] font-bold text-destructive pl-1 mt-1" />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2 block">
                          Mobile Number <span className="text-destructive">*</span>
                        </label>
                        <Field 
                          name="mobile_number"
                          className="erp-input h-11 px-4 text-sm bg-muted/20 border-border/60 hover:border-border transition-all focus:ring-2 focus:ring-primary/10" 
                          placeholder="10-digit mobile" 
                        />
                        <ErrorMessage name="mobile_number" component="div" className="text-[10px] font-bold text-destructive pl-1 mt-1" />
                      </div>

                      {/* Showroom */}
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2 block">
                          Showroom
                        </label>
                        <Field as="select" name="showroom" className="erp-select h-11 text-sm bg-muted/20 border-border/60">
                          <option value="">Select Showroom (optional)</option>
                          {showrooms.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </Field>
                      </div>

                      {/* Optional Fields */}
                      {[
                        { label: 'Email Address', name: 'email', placeholder: 'john@example.com' },
                        { label: 'Address', name: 'address', placeholder: 'Street, House no.' },
                        { label: 'City', name: 'city', placeholder: 'City' },
                        { label: 'State', name: 'state', placeholder: 'State' },
                        { label: 'Pincode', name: 'pincode', placeholder: '6-digit code' },
                        { label: 'Aadhaar Card No', name: 'aadhaar_card_no', placeholder: 'XXXX-XXXX-XXXX' },
                        { label: 'PAN Card No', name: 'pan_card_no', placeholder: 'ABCDE1234F' }
                      ].map((field) => (
                        <div key={field.name} className={field.name === 'address' ? 'md:col-span-2' : ''}>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2 block">{field.label}</label>
                          <Field 
                            name={field.name}
                            className="erp-input h-11 px-4 text-sm bg-muted/20 border-border/60 hover:border-border transition-all focus:ring-2 focus:ring-primary/10" 
                            placeholder={field.placeholder} 
                          />
                          <ErrorMessage name={field.name} component="div" className="text-[10px] font-bold text-destructive pl-1 mt-1 animate-in fade-in slide-in-from-top-1" />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                      <button 
                        type="button"
                        onClick={() => setShowForm(false)} 
                        className="px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-muted transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </div>
                        ) : 'Save Customer'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
