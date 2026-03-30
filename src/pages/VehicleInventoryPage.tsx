import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { 
  getVehicleInventoryAction, addVehicleInventoryAction, deleteVehicleInventoryAction, updateVehicleInventoryAction 
} from '@/store/ducks/vehicle_inventory.ducks';
import { getVehicleModelsAction } from '@/store/ducks/vehicle_models.ducks';
import { getTypesAction, getCategoriesAction, getAccessoriesAction } from '@/store/ducks/vehicle_features.ducks';
import { Plus, Search, Trash2, Edit2, X, AlertTriangle, Loader2, Car, Calendar, DollarSign, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";

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

const VehicleInventoryPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    if (companyCode) {
      dispatch(getVehicleInventoryAction(companyCode));
      dispatch(getVehicleModelsAction(companyCode));
      dispatch(getTypesAction(companyCode));
      dispatch(getCategoriesAction(companyCode));
      dispatch(getAccessoriesAction(companyCode));
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

  const filteredInventory = inventory.filter(item => 
    (item.chassis_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.engine_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.model || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.brand || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Vehicle Inventory</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center h-10 px-3 rounded-xl bg-card border border-border gap-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-64 placeholder:text-muted-foreground" />
          </div>
          <button onClick={() => { setEditingItem(null); setShowForm(true); }} className="erp-button-primary h-10 px-5 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredInventory.map((item) => (
          <motion.div key={item.entity_id || item._id || item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="erp-card group hover:border-primary/50 transition-all">
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{item.brand} {item.model}</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.variant} • {item.fuel_type}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    item.status === 'Available' ? 'bg-emerald-500/10 text-emerald-600' :
                    item.status === 'Sold' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {item.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Fingerprint className="w-3 h-3" /> Chassis/VIN</p>
                    <p className="text-sm font-mono font-bold">{item.chassis_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">Engine Number</p>
                    <p className="text-sm font-mono font-bold">{item.engine_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> Purchase Date</p>
                    <p className="text-sm font-bold">{formatDate(item.purchase_date)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 justify-end"><DollarSign className="w-3 h-3" /> Base Price</p>
                    <p className="text-sm font-bold">₹{(item.base_price || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {Array.isArray(item.accessories) && item.accessories.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Installed Accessories</p>
                    <div className="flex flex-wrap gap-2">
                      {item.accessories.map((accId: string) => {
                        const acc = accessories.find(a => (a.entity_id || a._id || a.id) === accId);
                        return acc ? <span key={accId} className="px-2 py-1 rounded-md bg-muted text-[10px] font-bold ring-1 ring-border">{acc.name}</span> : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:w-48 flex flex-col justify-between border-l border-border/50 md:pl-6 gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Offered Price</p>
                  <p className="text-2xl font-black text-primary">₹{(item.selling_price || item.total_price || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setEditingItem(item); setShowForm(true); }} className="flex-1 py-2 px-3 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold ring-1 ring-primary/20"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => setItemToDelete(item.entity_id || item._id || item.id!)} className="p-2 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all ring-1 ring-destructive/20"><Trash2 className="w-4 h-4" /></button>
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
                <h3 className="text-xl font-black uppercase tracking-tighter">Inventory</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-1 p-4 bg-muted/30 border-b border-border overflow-x-auto">
                <div className="px-4 py-1.5 rounded-md bg-primary text-white text-[10px] font-black tracking-widest uppercase shrink-0">INVENTORY</div>
                <div className="px-4 py-1.5 rounded-md bg-white text-muted-foreground text-[10px] font-black tracking-widest uppercase shrink-0">MODEL</div>
                <div className="px-4 py-1.5 rounded-md bg-white text-muted-foreground text-[10px] font-black tracking-widest uppercase shrink-0">ACCESSORIES</div>
                <div className="px-4 py-1.5 rounded-md bg-white text-muted-foreground text-[10px] font-black tracking-widest uppercase shrink-0">CATEGORY</div>
                <div className="px-4 py-1.5 rounded-md bg-white text-muted-foreground text-[10px] font-black tracking-widest uppercase shrink-0">TYPE</div>
              </div>
              <Formik
                initialValues={{ 
                  vehicle_model_id: editingItem?.vehicle_model_id || '', 
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
                    const payload = {
                      ...values,
                      purchase_date: values.purchase_date ? new Date(values.purchase_date).toISOString() : '',
                      inventory_date: values.inventory_date ? new Date(values.inventory_date).toISOString() : '',
                      total_price: (models.find(m => (m.entity_id || m._id || m.id) === values.vehicle_model_id)?.base_price || 0) + 
                                  values.accessories.reduce((sum: number, id: string) => sum + (accessories.find(a => (a.entity_id || a._id || a.id) === id)?.price || 0), 0)
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
                {({ isSubmitting, values }) => (
                  <Form className="max-h-[80vh] overflow-y-auto">
                    <div className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Category</label>
                          <Field as="select" name="selected_category" className="erp-select h-11 rounded-xl">
                            <option value="">All Categories</option>
                            {categories.map((c: any) => <option key={c.entity_id || c._id || c.id} value={c.entity_id || c._id || c.id}>{c.name}</option>)}
                          </Field>
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Vehicle Type</label>
                          <Field as="select" name="selected_type" className="erp-select h-11 rounded-xl">
                            <option value="">All Types</option>
                            {types.map((t: any) => <option key={t.entity_id || t._id || t.id} value={t.entity_id || t._id || t.id}>{t.name}</option>)}
                          </Field>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Vehicle Model</label>
                          <Field as="select" name="vehicle_model_id" className="erp-select h-11 rounded-xl">
                            <option value="">Select Model</option>
                            {models.filter(m => 
                              (!values.selected_type || m.type_id === values.selected_type) && 
                              (!values.selected_category || m.category_id === values.selected_category)
                            ).map(m => (
                              <option key={m.entity_id || m._id || m.id} value={m.entity_id || m._id || m.id}>{m.brand} {m.model}</option>
                            ))}
                          </Field>
                          <ErrorMessage name="vehicle_model_id" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Variant</label>
                          <div className="erp-input h-11 rounded-xl bg-muted/30 flex items-center px-3 text-muted-foreground text-sm cursor-not-allowed">
                            {models.find(m => (m.entity_id || m._id || m.id) === values.vehicle_model_id)?.variant || 'Select Variant'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Fuel Type</label>
                          <div className="erp-input h-11 rounded-xl bg-muted/30 flex items-center px-3 text-muted-foreground text-sm cursor-not-allowed">
                            {(models.find(m => (m.entity_id || m._id || m.id) === values.vehicle_model_id)?.fuel_type || []).join(', ') || 'Select Model First'}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Vehicle Color</label>
                          <Field name="color" className="erp-input h-11 rounded-xl" placeholder="Enter color" />
                          <ErrorMessage name="color" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">MFG Year</label>
                          <Field as="select" name="mfg_year" className="erp-select h-11 rounded-xl">
                            <option value="">Select Year</option>
                            {Array.from({length: 20}, (_, i) => new Date().getFullYear() - i).map(year => (
                              <option key={year} value={year.toString()}>{year}</option>
                            ))}
                          </Field>
                          <ErrorMessage name="mfg_year" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Inventory Date</label>
                          <Field type="date" name="inventory_date" className="erp-input h-11 rounded-xl" />
                          <ErrorMessage name="inventory_date" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">VIN / Chassis No</label>
                          <Field name="chassis_number" className="erp-input h-11 rounded-xl placeholder:text-muted-foreground" placeholder="Enter VIN" />
                          <ErrorMessage name="chassis_number" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Engine Number</label>
                          <Field name="engine_number" className="erp-input h-11 rounded-xl placeholder:text-muted-foreground" placeholder="Enter Engine No" />
                          <ErrorMessage name="engine_number" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Purchase Date</label>
                          <Field type="date" name="purchase_date" className="erp-input h-11 rounded-xl" />
                          <ErrorMessage name="purchase_date" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Status</label>
                          <Field as="select" name="status" className="erp-select h-11 rounded-xl">
                            <option value="Available">Available</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Sold">Sold</option>
                          </Field>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Purchase Price (₹)</label>
                          <Field type="number" name="purchase_price" className="erp-input h-11 rounded-xl" />
                          <ErrorMessage name="purchase_price" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Selling Price (₹)</label>
                          <Field type="number" name="selling_price" className="erp-input h-11 rounded-xl" />
                          <ErrorMessage name="selling_price" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/10">
                      <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-muted transition-colors">Discard</button>
                      <button type="submit" disabled={isSubmitting} className="erp-button-primary px-8 py-2.5 h-11">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Stock'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6"><AlertTriangle className="w-8 h-8 text-destructive" /></div>
            <AlertDialogTitle className="text-center font-black text-2xl">Remove Vehicle?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-8">
            <AlertDialogCancel className="rounded-xl border-border/60 hover:bg-muted h-12 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="rounded-xl bg-destructive text-white h-12 px-8" disabled={isDeleting}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleInventoryPage;
