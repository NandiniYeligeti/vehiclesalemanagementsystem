import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { 
  getVehicleInventoryAction, addVehicleInventoryAction, deleteVehicleInventoryAction, updateVehicleInventoryAction 
} from '@/store/ducks/vehicle_inventory.ducks';
import { getVehicleModelsAction } from '@/store/ducks/vehicle_models.ducks';
import { getTypesAction, getCategoriesAction, getAccessoriesAction } from '@/store/ducks/vehicle_features.ducks';
import { Plus, Search, Trash2, Edit2, X, AlertTriangle, Loader2, Car, Calendar, Fingerprint, Eye, LayoutGrid, List, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const inventoryValidationSchema = Yup.object().shape({
  vehicle_model_id: Yup.string().required('Model is required'),
  chassis_number: Yup.string().required('Chassis number is required'),
  engine_number: Yup.string().required('Engine number is required'),
  purchase_date: Yup.string().required('Purchase date is required'),
  color: Yup.string().required('Color is required'),
  selling_price: Yup.number().min(0, 'Cannot be negative').required('Required'),
  mfg_year: Yup.string().required('Required'),
  inventory_date: Yup.string().required('Required'),
  purchase_price: Yup.number().min(0, 'Cannot be negative').required('Required'),
});

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) { return dateString; }
};

import { getMastersAction } from '@/store/ducks/company_masters.ducks';

const VehicleInventoryPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // DEFENSIVE SELECTORS
  const rawInventoryState = useSelector((state: RootState) => state.vehicleInventory);
  const inventory = Array.isArray(rawInventoryState?.data) ? rawInventoryState.data : [];
  const inventoryLoading = !!rawInventoryState?.loading;

  const rawModelsState = useSelector((state: RootState) => state.vehicleModels);
  const models = Array.isArray(rawModelsState?.data) ? rawModelsState.data : [];

  const rawFeaturesState = useSelector((state: RootState) => state.vehicleFeatures);
  const types = Array.isArray(rawFeaturesState?.types) ? rawFeaturesState.types : [];
  const categories = Array.isArray(rawFeaturesState?.categories) ? rawFeaturesState.categories : [];
  const accessories = Array.isArray(rawFeaturesState?.accessories) ? rawFeaturesState.accessories : [];

  const { data: masters } = useSelector((state: RootState) => state.companyMasters);
  const showrooms = (masters || []).filter(m => m.type === 'Showroom');

  useEffect(() => {
    if (companyCode) {
      dispatch(getVehicleInventoryAction(companyCode));
      dispatch(getVehicleModelsAction(companyCode));
      dispatch(getTypesAction(companyCode));
      dispatch(getCategoriesAction(companyCode));
      dispatch(getAccessoriesAction(companyCode));
      dispatch(getMastersAction(companyCode));
    }
  }, [dispatch, companyCode]);

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      setIsDeleting(true);
      dispatch(deleteVehicleInventoryAction(itemToDelete, companyCode, () => {
        setIsDeleting(false);
        setItemToDelete(null);
        toast.success('Vehicle removed from inventory');
      }, (err: any) => {
        setIsDeleting(false);
        toast.error(err.message || 'Failed to remove vehicle');
      }));
    }
  };

  const availableCount = inventory.filter(i => (i.status || '').toLowerCase() === 'available').length;
  const soldCount = inventory.filter(i => (i.status || '').toLowerCase() === 'sold').length;
  const totalCount = inventory.length;

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      (item.chassis_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.engine_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.model || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || (item.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-black">Vehicle Inventory</h2>
           <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Stock Management • {inventory.length} Units</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center h-11 px-4 rounded-xl bg-card border border-border gap-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all w-full sm:w-auto">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search chassis, engine or model..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full sm:w-64 placeholder:text-muted-foreground/60" />
          </div>
          {/* View Toggle */}
          <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/60 gap-1">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`} title="List View"><List className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode('card')} className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`} title="Card View"><LayoutGrid className="w-3.5 h-3.5" /></button>
          </div>
          <button onClick={() => { setEditingItem(null); setIsViewOnly(false); setShowForm(true); }} className="erp-button-primary h-11 px-6 flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter(statusFilter === 'Available' ? null : 'Available')}
          className={`erp-card p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border-2 ${
            availableCount < 5 
              ? 'border-red-500/40 bg-red-500/5 hover:border-red-500/60'
              : statusFilter === 'Available' ? 'border-primary' : 'border-transparent'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              availableCount < 5 ? 'bg-red-500/10' : 'bg-emerald-500/10'
            }`}>
              <CheckCircle2 className={`w-4 h-4 ${availableCount < 5 ? 'text-red-500' : 'text-emerald-500'}`} />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Available</span>
            {availableCount < 5 && (
              <span className="ml-auto text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">Low Stock</span>
            )}
          </div>
          <p className={`text-3xl font-black ${availableCount < 5 ? 'text-red-500' : 'text-emerald-600'}`}>{availableCount}</p>
          <p className="text-xs text-muted-foreground mt-1">units ready to sell</p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'Sold' ? null : 'Sold')}
          className={`erp-card p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border-2 ${
            statusFilter === 'Sold' ? 'border-primary' : 'border-transparent'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sold</span>
          </div>
          <p className="text-3xl font-black text-blue-600">{soldCount}</p>
          <p className="text-xs text-muted-foreground mt-1">vehicles delivered</p>
        </button>

        <button
          onClick={() => setStatusFilter(null)}
          className={`erp-card p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border-2 ${
            !statusFilter ? 'border-primary' : 'border-transparent'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total</span>
          </div>
          <p className="text-3xl font-black text-primary">{totalCount}</p>
          <p className="text-xs text-muted-foreground mt-1">all vehicles</p>
        </button>
      </div>

      <div className={`grid gap-6 ${viewMode === 'card' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
        {filteredInventory.map((item) => (
          <motion.div key={item.entity_id || item._id || item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="erp-card group hover:border-primary/50 transition-all overflow-hidden border-none shadow-sm hover:shadow-xl">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
            <div className={`p-6 flex gap-6 ${viewMode === 'card' ? 'flex-col' : 'flex-col md:flex-row'}`}>
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="text-xl font-black tracking-tight">{item.brand} {item.model}</h3>
                       <Badge className="bg-primary/5 text-primary border-none px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none">
                         {item.showroom || 'No Showroom'}
                       </Badge>
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-80">{item.variant} • {item.fuel_type}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    (item.status || '').toLowerCase() === 'available' ? 'bg-emerald-500/10 text-emerald-600' :
                    (item.status || '').toLowerCase() === 'sold' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {item.status}
                  </div>
                </div>

                <div className={`grid gap-4 ${viewMode === 'card' ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1"><Fingerprint className="w-2.5 h-2.5" /> Chassis/VIN</p>
                    <p className="text-xs font-mono font-bold tracking-tight text-[#0f172a]">{item.chassis_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1">Engine Number</p>
                    <p className="text-xs font-mono font-bold tracking-tight text-[#0f172a]">{item.engine_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Purchase Date</p>
                    <p className="text-xs font-bold text-[#0f172a]">{formatDate(item.purchase_date)}</p>
                  </div>
                  <div className={`space-y-1 ${viewMode === 'card' ? '' : 'text-right'}`}>
                    <p className={`text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1 ${viewMode === 'card' ? '' : 'justify-end'}`}> Base Price</p>
                    <p className="text-sm font-black text-[#0f172a]">₹{(item.base_price || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {Array.isArray(item.accessories) && item.accessories.length > 0 && (
                  <div className="pt-3 border-t border-border/40">
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 tracking-widest opacity-60">Installed Accessories</p>
                    <div className="flex flex-wrap gap-2">
                      {item.accessories.map((accId: string) => {
                        const acc = accessories.find(a => (a.entity_id || a._id || a.id) === accId);
                        return acc ? <span key={accId} className="px-2 py-1 rounded-md bg-muted/60 text-[9px] font-black uppercase tracking-tighter text-muted-foreground ring-1 ring-border/50">{acc.name}</span> : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className={`flex flex-col justify-between border-border/40 gap-4 ${viewMode === 'card' ? 'w-full pt-4 border-t' : 'md:w-52 md:border-l md:pl-6'}`}>
                <div className={`${viewMode === 'card' ? 'flex justify-between items-end' : 'text-right'}`}>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Offered Price</p>
                  <p className="text-2xl font-black text-primary">₹{(item.selling_price || item.total_price || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => { 
                      setEditingItem(item); 
                      setIsViewOnly((item.status || '').toLowerCase() !== 'available');
                      setShowForm(true); 
                    }} 
                    className={`flex-1 h-10 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ring-1 ${
                      (item.status || '').toLowerCase() === 'available' ? 'bg-primary/5 text-primary hover:bg-primary hover:text-white ring-primary/20' : 'bg-muted/40 text-muted-foreground ring-border hover:bg-muted'
                    }`}
                  >
                    {(item.status || '').toLowerCase() === 'available' ? <><Edit2 className="w-3.5 h-3.5" /> Edit</> : <><Eye className="w-3.5 h-3.5" /> View</>}
                  </button>
                  {(item.status || '').toLowerCase() === 'available' && (
                    <button onClick={() => setItemToDelete(item.entity_id || item._id || item.id!)} className="h-10 w-10 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all ring-1 ring-destructive/20 flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {!inventoryLoading && inventory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-muted/5 rounded-3xl border-2 border-dashed border-border/50">
            <div className="p-6 rounded-full bg-muted/10 mb-6"><Car className="w-12 h-12 opacity-20" /></div>
            <p className="text-lg font-medium italic">No vehicles match your search.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-2xl ring-1 ring-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border">
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                <h3 className="text-xl font-black uppercase tracking-tighter">{isViewOnly ? 'Vehicle Details' : 'Inventory Management'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <Formik
                initialValues={{ 
                  vehicle_model_id: editingItem?.vehicle_model_id || '', 
                  showroom: editingItem?.showroom || '',
                  color: editingItem?.color || '', 
                  chassis_number: editingItem?.chassis_number || '', 
                  engine_number: editingItem?.engine_number || '', 
                  purchase_date: editingItem?.purchase_date ? new Date(editingItem.purchase_date).toISOString().split('T')[0] : '',
                  mfg_year: editingItem?.mfg_year || '',
                  inventory_date: editingItem?.inventory_date ? new Date(editingItem.inventory_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                  purchase_price: editingItem?.purchase_price || 0,
                  status: editingItem?.status || 'Available',
                  accessories: editingItem?.accessories || [],
                  selling_price: editingItem?.selling_price || 0,
                  selected_type: '',
                  selected_category: '',
                  company_id: editingItem?.company_id || companyCode, 
                  branch_id: editingItem?.branch_id || 'MAIN_BRANCH' 
                }}
                validationSchema={inventoryValidationSchema}
                onSubmit={(values, { setSubmitting }) => {
                    const currentModel = models.find(m => (m.entity_id || m._id || m.id) === values.vehicle_model_id);
                    const calculatedTotal = (currentModel?.base_price || 0) + 
                                   values.accessories.reduce((sum: number, id: string) => sum + (accessories.find(a => (a.entity_id || a._id || a.id) === id)?.price || 0), 0);

                    const payload = {
                      ...values,
                      purchase_date: values.purchase_date ? new Date(values.purchase_date).toISOString() : '',
                      inventory_date: values.inventory_date ? new Date(values.inventory_date).toISOString() : '',
                      total_price: calculatedTotal,
                      selling_price: values.selling_price || calculatedTotal
                    };
                  if (editingItem) {
                    dispatch(updateVehicleInventoryAction(editingItem.entity_id || editingItem._id || editingItem.id, payload, companyCode, () => {
                      setShowForm(false);
                      setSubmitting(false);
                      toast.success('Record updated');
                    }, (err: any) => { setSubmitting(false); toast.error(err.message); }));
                  } else {
                    dispatch(addVehicleInventoryAction(payload, companyCode, () => {
                      setShowForm(false);
                      setSubmitting(false);
                      toast.success('Vehicle added');
                    }, (err: any) => { setSubmitting(false); toast.error(err.message); }));
                  }
                }}
              >
                {({ isSubmitting, values, setFieldValue }) => {
                  useEffect(() => {
                    const currentModel = models.find(m => (m.entity_id || m._id || m.id) === values.vehicle_model_id);
                    if (currentModel && !editingItem && values.selling_price === 0) {
                      setFieldValue('selling_price', currentModel.base_price || 0);
                    }
                  }, [values.vehicle_model_id, models, editingItem, setFieldValue]);

                  return (
                  <Form className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Category</label>
                          <Field as="select" name="selected_category" disabled={isViewOnly} className="erp-select h-12 rounded-xl text-xs font-bold bg-muted/40 border-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70">
                            <option value="">All Categories</option>
                            {categories.map((c: any) => <option key={c.entity_id || c._id || c.id} value={c.entity_id || c._id || c.id}>{c.name}</option>)}
                          </Field>
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Vehicle Type</label>
                          <Field as="select" name="selected_type" disabled={isViewOnly} className="erp-select h-12 rounded-xl text-xs font-bold bg-muted/40 border-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70">
                            <option value="">All Types</option>
                            {types.map((t: any) => <option key={t.entity_id || t._id || t.id} value={t.entity_id || t._id || t.id}>{t.name}</option>)}
                          </Field>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Selected Model & Showroom</label>
                        <div className="grid grid-cols-2 gap-4">
                          <Field as="select" name="vehicle_model_id" disabled={isViewOnly} className="erp-select h-12 rounded-xl text-xs font-black bg-muted/40 border-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70">
                            <option value="">Select Model</option>
                            {models.filter(m => 
                              (!values.selected_type || m.type_id === values.selected_type) && 
                              (!values.selected_category || m.category_id === values.selected_category)
                            ).map(m => (
                              <option key={m.entity_id || m._id || m.id} value={m.entity_id || m._id || m.id}>{m.brand} {m.model}</option>
                            ))}
                          </Field>
                          <Field as="select" name="showroom" disabled={isViewOnly} className="erp-select h-12 rounded-xl text-xs font-black bg-muted/40 border-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70">
                            <option value="">Select Showroom</option>
                            {showrooms.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </Field>
                        </div>
                        <ErrorMessage name="vehicle_model_id" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Fuel Type</label>
                          <div className="erp-input h-12 rounded-xl bg-muted/20 border-border/50 flex items-center px-4 text-muted-foreground text-xs font-black uppercase tracking-tighter cursor-not-allowed">
                            {(models.find(m => (m.entity_id || m._id || m.id) === values.vehicle_model_id)?.fuel_type || []).join(', ') || 'Select Model First'}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Vehicle Color</label>
                          <Field name="color" disabled={isViewOnly} className="erp-input h-12 rounded-xl text-xs font-bold px-4 disabled:opacity-70" placeholder="Enter color" />
                          <ErrorMessage name="color" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">MFG Year</label>
                          <Field as="select" name="mfg_year" disabled={isViewOnly} className="erp-select h-12 rounded-xl text-xs font-bold disabled:opacity-70">
                            <option value="">Select Year</option>
                            {Array.from({length: 20}, (_, i) => new Date().getFullYear() - i).map(year => (
                              <option key={year} value={year.toString()}>{year}</option>
                            ))}
                          </Field>
                          <ErrorMessage name="mfg_year" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Inventory Date</label>
                          <Field type="date" name="inventory_date" disabled={isViewOnly} className="erp-input h-12 rounded-xl text-xs font-bold px-4 disabled:opacity-70" />
                          <ErrorMessage name="inventory_date" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">VIN / Chassis No</label>
                          <Field name="chassis_number" disabled={isViewOnly} className="erp-input h-12 rounded-xl placeholder:text-muted-foreground font-mono text-xs font-bold px-4 disabled:opacity-70" placeholder="Enter VIN" />
                          <ErrorMessage name="chassis_number" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Engine Number</label>
                          <Field name="engine_number" disabled={isViewOnly} className="erp-input h-12 rounded-xl placeholder:text-muted-foreground font-mono text-xs font-bold px-4 disabled:opacity-70" placeholder="Enter Engine No" />
                          <ErrorMessage name="engine_number" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Purchase Date</label>
                          <Field type="date" name="purchase_date" disabled={isViewOnly} className="erp-input h-12 rounded-xl text-xs font-bold px-4 disabled:opacity-70" />
                          <ErrorMessage name="purchase_date" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Status</label>
                          <Field as="select" name="status" disabled={isViewOnly} className="erp-select h-12 rounded-xl text-xs font-bold disabled:opacity-70">
                            <option value="Available">Available</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Sold">Sold</option>
                          </Field>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Purchase Price (₹)</label>
                          <Field type="number" name="purchase_price" disabled={isViewOnly} className="erp-input h-12 rounded-xl text-xs font-bold px-4 disabled:opacity-70" />
                          <ErrorMessage name="purchase_price" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Selling Price (₹)</label>
                          <Field type="number" name="selling_price" disabled={isViewOnly} className="erp-input h-12 rounded-xl text-xs font-bold px-4 disabled:opacity-70" />
                          <ErrorMessage name="selling_price" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/10">
                      <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors">{isViewOnly ? 'Close' : 'Discard'}</button>
                      {!isViewOnly && (
                        <button type="submit" disabled={isSubmitting} className="erp-button-primary px-8 py-3 h-12 shadow-lg shadow-primary/20">
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Stock'}
                        </button>
                      )}
                    </div>
                  </Form>
                );
              }}
              </Formik>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-sm overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6"><AlertTriangle className="w-8 h-8 text-destructive" /></div>
            <AlertDialogTitle className="text-center font-black text-2xl">Remove Vehicle?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground text-xs font-medium mt-2">This will permanently remove the vehicle from your inventory ledger.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-8">
            <AlertDialogCancel className="rounded-xl border-border/60 hover:bg-muted h-12 px-6 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="rounded-xl bg-destructive text-white h-12 px-8 font-black uppercase tracking-widest text-[10px]" disabled={isDeleting}>Confirm Deletion</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default VehicleInventoryPage;
