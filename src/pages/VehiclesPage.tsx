import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { 
  getVehicleModelsAction, addVehicleModelAction, deleteVehicleModelAction, updateVehicleModelAction 
} from '@/store/ducks/vehicle_models.ducks';
import { 
  getTypesAction, addTypeAction, deleteTypeAction,
  getCategoriesAction, addCategoryAction, deleteCategoryAction,
  getAccessoriesAction, addAccessoryAction, deleteAccessoryAction
} from '@/store/ducks/vehicle_features.ducks';
import { Plus, Search, Trash2, Edit2, X, AlertTriangle, Loader2, Car, Eye } from 'lucide-react';
import { getVehicleInventoryAction } from '@/store/ducks/vehicle_inventory.ducks';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const categoryValidationSchema = Yup.object().shape({
  code: Yup.string().required('Category code is required'),
  name: Yup.string().required('Category name is required'),
});

const typeValidationSchema = Yup.object().shape({
  category_id: Yup.string().required('Category is required'),
  code: Yup.string().required('Type code is required'),
  name: Yup.string().required('Type name is required'),
});

const modelValidationSchema = Yup.object().shape({
  category_id: Yup.string().required('Category is required'),
  type_id: Yup.string().required('Type is required'),
  model_code: Yup.string().required('Model code is required'),
  brand: Yup.string().required('Brand is required'),
  model: Yup.string().required('Model name is required'),
  variant: Yup.string().required('Variant is required'),
  fuel_type: Yup.array().min(1, 'At least one fuel type is required').required('Required'),
  base_price: Yup.number().min(0, 'Price cannot be negative').required('Required'),
});

const accessoryValidationSchema = Yup.object().shape({
  category_id: Yup.string().required('Category is required'),
  type_id: Yup.string().required('Type is required'),
  model_id: Yup.string().required('Model is required'),
  name: Yup.string().required('Name is required'),
  price: Yup.number().min(0).required('Price is required'),
});

const featureValidationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
});

const VehiclesPage = ({ initialTab = 'models' }: { initialTab?: 'models' | 'accessories' | 'categories' | 'types' }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const [tab, setTab] = useState<'models' | 'accessories' | 'categories' | 'types'>(initialTab || 'models');
  const [search, setSearch] = useState('');
  const [showModelForm, setShowModelForm] = useState(false);
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [featureType, setFeatureType] = useState<'type' | 'category' | 'accessory'>('type');

  const [editingModel, setEditingModel] = useState<any>(null);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<{id: string, type: 'type' | 'category' | 'accessory'} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blockDeleteMsg, setBlockDeleteMsg] = useState<string | null>(null);

  // Also load inventory for usage checks
  const rawInventoryState = useSelector((state: RootState) => state.vehicleInventory);
  const inventory = Array.isArray(rawInventoryState?.data) ? rawInventoryState.data : [];

  // DEFENSIVE SELECTORS
  const rawModelsState = useSelector((state: RootState) => state.vehicleModels);
  const models = Array.isArray(rawModelsState?.data) ? rawModelsState.data : [];
  const modelsLoading = !!rawModelsState?.loading;

  const rawFeaturesState = useSelector((state: RootState) => state.vehicleFeatures);
  const types = Array.isArray(rawFeaturesState?.types) ? rawFeaturesState.types : [];
  const categories = Array.isArray(rawFeaturesState?.categories) ? rawFeaturesState.categories : [];
  const accessories = Array.isArray(rawFeaturesState?.accessories) ? rawFeaturesState.accessories : [];
  const featuresLoading = !!rawFeaturesState?.loading;

  useEffect(() => {
    if (companyCode) {
      dispatch(getVehicleModelsAction(companyCode));
      dispatch(getTypesAction(companyCode));
      dispatch(getCategoriesAction(companyCode));
      dispatch(getAccessoriesAction(companyCode));
      dispatch(getVehicleInventoryAction(companyCode));
    }
  }, [dispatch, companyCode]);

  console.log('DEBUG: VehiclesPage data:', { types, categories, accessories, models });

  const filteredModels = models.filter(m =>
    (m.brand || '').toLowerCase().includes(search.toLowerCase()) || 
    (m.model || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleEditModel = (v: any) => {
    setEditingModel(v);
    setShowModelForm(true);
  };

  const handleConfirmDeleteModel = () => {
    if (modelToDelete) {
      // Block if inventory has vehicles with this model_id
      const usedInInventory = inventory.filter((v: any) => v.model_id === modelToDelete || v.vehicle_model_id === modelToDelete);
      if (usedInInventory.length > 0) {
        setModelToDelete(null);
        setBlockDeleteMsg(`Cannot delete this model — ${usedInInventory.length} vehicle(s) in inventory are linked to it.`);
        return;
      }
      setIsDeleting(true);
      dispatch(deleteVehicleModelAction(modelToDelete, companyCode, () => {
        setIsDeleting(false);
        setModelToDelete(null);
        toast.success('Vehicle model deleted');
      }, (err: any) => {
        setIsDeleting(false);
        toast.error(err.message || 'Failed to delete');
      }));
    }
  };

  const handleConfirmDeleteFeature = () => {
    if (featureToDelete) {
      const { id, type } = featureToDelete;

      // Block-delete checks
      if (type === 'category') {
        const linkedTypes = types.filter((t: any) => t.category_id === id);
        const linkedModels = models.filter((m: any) => m.category_id === id);
        if (linkedTypes.length > 0 || linkedModels.length > 0) {
          setFeatureToDelete(null);
          setBlockDeleteMsg(`Cannot delete this category — it has ${linkedTypes.length} type(s) and ${linkedModels.length} model(s) linked to it. Remove those first.`);
          return;
        }
      }
      if (type === 'type') {
        const linkedModels = models.filter((m: any) => m.type_id === id);
        const linkedAccessories = accessories.filter((a: any) => a.type_id === id);
        if (linkedModels.length > 0 || linkedAccessories.length > 0) {
          setFeatureToDelete(null);
          setBlockDeleteMsg(`Cannot delete this type — it has ${linkedModels.length} model(s) and ${linkedAccessories.length} accessory(s) linked to it. Remove those first.`);
          return;
        }
      }

      setIsDeleting(true);
      const callback = (err?: any) => {
        setIsDeleting(false);
        setFeatureToDelete(null);
        if (err) toast.error(err.message || `Failed to delete ${type}`);
        else toast.success(`${type} deleted`);
      }
      if (type === 'type') dispatch(deleteTypeAction(companyCode, id, callback, callback));
      else if (type === 'category') dispatch(deleteCategoryAction(companyCode, id, callback, callback));
      else if (type === 'accessory') dispatch(deleteAccessoryAction(companyCode, id, callback, callback));
    }
  };

  const handleCloseForms = () => {
    setShowModelForm(false);
    setShowFeatureForm(false);
    setEditingModel(null);
  };

  return (
    <div className="space-y-6">
      {/* Block-Delete Dialog */}
      <AlertDialog open={!!blockDeleteMsg} onOpenChange={() => setBlockDeleteMsg(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-center font-black text-xl">Cannot Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2">
              {blockDeleteMsg}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-6">
            <AlertDialogCancel className="rounded-xl font-bold px-8">OK, Got It</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        <button onClick={() => setTab('accessories')} className={`px-4 py-2 rounded-md text-xs font-black tracking-widest transition-all ${tab === 'accessories' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>ACCESSORIES</button>
        <button onClick={() => setTab('models')} className={`px-4 py-2 rounded-md text-xs font-black tracking-widest transition-all ${tab === 'models' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>MODEL</button>
        <button onClick={() => setTab('types')} className={`px-4 py-2 rounded-md text-xs font-black tracking-widest transition-all ${tab === 'types' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>TYPE</button>
        <button onClick={() => setTab('categories')} className={`px-4 py-2 rounded-md text-xs font-black tracking-widest transition-all ${tab === 'categories' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>CATEGORY</button>
      </div>

      {tab === 'models' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center h-10 px-3 rounded-xl bg-card border border-border gap-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search models..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-64 placeholder:text-muted-foreground" />
            </div>
            <button onClick={() => setShowModelForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all tracking-tight">
              <Plus className="w-4 h-4" /> Add Model
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((m) => (
              <motion.div key={m.entity_id || m._id || m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="erp-card group overflow-hidden border-t-[3px] border-t-primary">
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-foreground">{m.brand} {m.model}</h3>
                      <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{m.variant} • {(m.fuel_type || []).join(', ')}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-2xl font-bold text-primary tracking-tight">₹{(m.base_price || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Base Price</p>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">View</span>
                      </button>
                      <button onClick={() => handleEditModel(m)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Edit</span>
                      </button>
                      <button onClick={() => setModelToDelete(m.entity_id || m._id || m.id!)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Delete</span>
                      </button>
                    </div>
                    <span className="text-[11px] text-muted-foreground opacity-60 font-medium hidden sm:block">Actions</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {tab === 'accessories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Manage Accessories</h3>
            <button onClick={() => { setFeatureType('accessory'); setShowFeatureForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20"><Plus className="w-4 h-4" /> New Accessory</button>
          </div>
          <div className="erp-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border"><tr><th className="text-left py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Name</th><th className="text-right py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Price (₹)</th><th className="text-right py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground w-20">Actions</th></tr></thead>
              <tbody>
                {accessories.map((a: any) => (
                  <tr key={a.entity_id || a._id || a.id} className="border-b border-border hover:bg-muted/30 transition-colors"><td className="py-4 px-6 font-bold">{a.name}</td><td className="py-4 px-6 text-right font-black">₹{(a.price || 0).toLocaleString()}</td><td className="py-4 px-6 text-right"><button onClick={() => setFeatureToDelete({id: a.entity_id || a._id || a.id!, type: 'accessory'})} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(tab === 'categories' || tab === 'types') && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold capitalize">Manage {tab}</h3>
            <button onClick={() => { setFeatureType(tab === 'categories' ? 'category' : 'type'); setShowFeatureForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20"><Plus className="w-4 h-4" /> New {tab.slice(0,-1)}</button>
          </div>
          <div className="erp-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {tab === 'categories' && <th className="text-left py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground w-32">Code</th>}
                  <th className="text-left py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Name</th>
                  <th className="text-right py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(tab === 'categories' ? categories : types).map((item: any) => (
                  <tr key={item.entity_id || item._id || item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    {tab === 'categories' && <td className="py-4 px-6 font-mono text-xs text-primary">{item.code}</td>}
                    <td className="py-4 px-6 font-bold">{item.name}</td>
                    <td className="py-4 px-6 text-right"><button onClick={() => setFeatureToDelete({id: item.entity_id || item._id || item.id!, type: tab === 'categories' ? 'category' : 'type'})} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModelForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-2xl ring-1 ring-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border">
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                <h3 className="text-lg font-bold">{editingModel ? 'Edit Vehicle Model' : 'New Vehicle Model'}</h3>
                <button onClick={handleCloseForms} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <Formik
                initialValues={{ 
                  brand: editingModel?.brand || '', 
                  model: editingModel?.model || '', 
                  model_code: editingModel?.model_code || '',
                  variant: editingModel?.variant || '', 
                  fuel_type: editingModel?.fuel_type || [], 
                  base_price: editingModel?.base_price || 0,
                  type_id: editingModel?.type_id || '',
                  category_id: editingModel?.category_id || '',
                  colors: Array.isArray(editingModel?.colors) ? editingModel.colors.join(', ') : '',
                  incentive_type: editingModel?.incentive_type || 'fixed',
                  incentive_value: editingModel?.incentive_value || 0,
                  color_count: editingModel?.color_count || 0,
                  company_id: editingModel?.company_id || companyCode, 
                  branch_id: editingModel?.branch_id || 'MAIN_BRANCH' 
                }}
                validationSchema={modelValidationSchema}
                onSubmit={(values, { setSubmitting }) => {
                  const payload = {
                    ...values,
                    colors: values.colors.split(',').map((s: string) => s.trim()).filter(Boolean)
                  };
                  if (editingModel) {
                    dispatch(updateVehicleModelAction(editingModel.entity_id || editingModel._id || editingModel.id, payload, companyCode, () => {
                      handleCloseForms();
                      setSubmitting(false);
                      toast.success('Model updated');
                    }, (err: any) => { setSubmitting(false); toast.error(err.message); }));
                  } else {
                    dispatch(addVehicleModelAction(payload, companyCode, () => {
                      handleCloseForms();
                      setSubmitting(false);
                      toast.success('Model added');
                    }, (err: any) => { setSubmitting(false); toast.error(err.message); }));
                  }
                }}
              >
                {({ isSubmitting, values, setFieldValue }) => (
                  <Form className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Brand Name</label>
                        <Field name="brand" className="erp-input h-11 rounded-xl" placeholder="e.g., Tata" />
                        <ErrorMessage name="brand" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Model Name</label>
                        <Field name="model" className="erp-input h-11 rounded-xl" placeholder="e.g., Nexon" />
                        <ErrorMessage name="model" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Variant</label>
                        <Field name="variant" className="erp-input h-11 rounded-xl" placeholder="e.g., XZ+" />
                        <ErrorMessage name="variant" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Fuel Type (Multi Select)</label>
                        <div className="grid grid-cols-3 gap-2 border border-border/40 p-3 rounded-xl bg-muted/10">
                          {['Petrol', 'Diesel', 'Cng', 'Electric', 'Hybrid', 'Lpg'].map(f => (
                            <label key={f} className="flex items-center gap-2 text-[11px] font-medium cursor-pointer">
                              <Field type="checkbox" name="fuel_type" value={f} className="w-4 h-4 rounded border-border" />
                              {f}
                            </label>
                          ))}
                        </div>
                        <ErrorMessage name="fuel_type" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Category</label>
                        <Field as="select" name="category_id" className="erp-select h-11 rounded-xl" onChange={(e: any) => {
                          setFieldValue('category_id', e.target.value);
                          setFieldValue('type_id', '');
                        }}>
                          <option value="">Select Category</option>
                          {categories.map((c: any) => <option key={c.entity_id || c._id || c.id} value={c.entity_id || c._id || c.id}>{c.name}</option>)}
                        </Field>
                        <ErrorMessage name="category_id" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Type</label>
                        <Field as="select" name="type_id" className="erp-select h-11 rounded-xl" disabled={!values.category_id}>
                          <option value="">Select Type</option>
                          {types.filter((t: any) => t.category_id === values.category_id).map((t: any) => <option key={t.entity_id || t._id || t.id} value={t.entity_id || t._id || t.id}>{t.name}</option>)}
                        </Field>
                        <ErrorMessage name="type_id" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Model Code (Unique)</label>
                      <Field name="model_code" className="erp-input h-11 rounded-xl" placeholder="e.g. NXN-001" />
                      <ErrorMessage name="model_code" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Base Price (₹)</label>
                      <Field type="number" name="base_price" className="erp-input h-11 rounded-xl" />
                      <ErrorMessage name="base_price" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                    </div>

                    <div className="bg-muted/20 p-4 rounded-2xl border border-border/40 space-y-4">
                      <div className="flex items-center gap-6">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block px-1">Incentive Type</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                            <Field type="radio" name="incentive_type" value="fixed" className="w-4 h-4" /> Fixed
                          </label>
                          <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                            <Field type="radio" name="incentive_type" value="percentage" className="w-4 h-4" /> Percentage
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Incentive Value (₹)</label>
                        <Field type="number" name="incentive_value" className="erp-input h-11 rounded-xl" placeholder="Enter amount" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Color Catalog</label>
                        <Field name="colors" className="erp-input h-11 rounded-xl" placeholder="Enter colors (e.g. Red, White, Black)" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Color Count</label>
                        <Field type="number" name="color_count" className="erp-input h-11 rounded-xl" placeholder="Enter total colors" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={handleCloseForms} className="px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-muted transition-colors">Discard</button>
                      <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-xl shadow-primary/30 active:scale-95 disabled:opacity-50 transition-all tracking-tight">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingModel ? 'Update Model' : 'Save Model')}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </motion.div>
          </div>
        )}

        {showFeatureForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-2xl ring-1 ring-border shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-border">
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                <h3 className="text-lg font-bold uppercase tracking-widest">Add {featureType}</h3>
                <button onClick={handleCloseForms} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <Formik
                initialValues={{ 
                  name: '', 
                  code: '', 
                  price: 0, 
                  category_id: '',
                  type_id: '',
                  model_id: '',
                  company_id: companyCode, 
                  branch_id: 'MAIN_BRANCH' 
                }}
                validationSchema={
                  featureType === 'accessory' ? accessoryValidationSchema : 
                  featureType === 'category' ? categoryValidationSchema : 
                  featureType === 'type' ? typeValidationSchema :
                  featureValidationSchema
                }
                onSubmit={(values, { setSubmitting }) => {
                  const callback = (err?: any) => {
                    setSubmitting(false);
                    if (err) toast.error(err.message || 'Failed to add');
                    else {
                      toast.success(`${featureType} added`);
                      handleCloseForms();
                    }
                  }
                  if (featureType === 'type') dispatch(addTypeAction(companyCode, values, callback, callback));
                  else if (featureType === 'category') dispatch(addCategoryAction(companyCode, values, callback, callback));
                  else if (featureType === 'accessory') dispatch(addAccessoryAction(companyCode, values, callback, callback));
                }}
              >
                {({ isSubmitting, values, setFieldValue }) => (
                  <Form className="p-8 space-y-6">
                    {featureType === 'type' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Category</label>
                          <Field as="select" name="category_id" className="erp-select h-11 rounded-xl">
                            <option value="">Select Category</option>
                            {categories.map((c: any) => <option key={c.entity_id || c._id || c.id} value={c.entity_id || c._id || c.id}>{c.name}</option>)}
                          </Field>
                          <ErrorMessage name="category_id" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Type Code</label>
                          <Field name="code" className="erp-input h-11 rounded-xl" placeholder={`e.g. COMPCT`} />
                          <ErrorMessage name="code" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>
                    )}

                    {featureType === 'accessory' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Category</label>
                          <Field as="select" name="category_id" className="erp-select h-11 rounded-xl" onChange={(e: any) => {
                            setFieldValue('category_id', e.target.value);
                            setFieldValue('type_id', '');
                            setFieldValue('model_id', '');
                          }}>
                            <option value="">Select Category</option>
                            {categories.map((c: any) => <option key={c.entity_id || c._id || c.id} value={c.entity_id || c._id || c.id}>{c.name}</option>)}
                          </Field>
                          <ErrorMessage name="category_id" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Type</label>
                          <Field as="select" name="type_id" className="erp-select h-11 rounded-xl" disabled={!values.category_id} onChange={(e: any) => {
                            setFieldValue('type_id', e.target.value);
                            setFieldValue('model_id', '');
                          }}>
                            <option value="">Select Type</option>
                            {types.filter((t: any) => t.category_id === values.category_id).map((t: any) => <option key={t.entity_id || t._id || t.id} value={t.entity_id || t._id || t.id}>{t.name}</option>)}
                          </Field>
                          <ErrorMessage name="type_id" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Model</label>
                          <Field as="select" name="model_id" className="erp-select h-11 rounded-xl" disabled={!values.type_id}>
                            <option value="">Select Model</option>
                            {models.filter((m: any) => m.type_id === values.type_id).map((m: any) => <option key={m.entity_id || m._id || m.id} value={m.entity_id || m._id || m.id}>{m.brand} {m.model}</option>)}
                          </Field>
                          <ErrorMessage name="model_id" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Accessory Code (Optional)</label>
                          <Field name="code" className="erp-input h-11 rounded-xl" placeholder="e.g. MATS-01" />
                        </div>
                      </div>
                    )}

                    {featureType === 'category' && (
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Category Code</label>
                        <Field name="code" className="erp-input h-11 rounded-xl" placeholder={`e.g. SUV, SEDAN`} />
                        <ErrorMessage name="code" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Name</label>
                      <Field name="name" className="erp-input h-11 rounded-xl" placeholder={`Enter ${featureType} name`} />
                      <ErrorMessage name="name" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                    </div>
                    {featureType === 'accessory' && (
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Price (₹)</label>
                        <Field type="number" name="price" className="erp-input h-11 rounded-xl" />
                        <ErrorMessage name="price" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>
                    )}
                    <button type="submit" disabled={isSubmitting || (featureType === 'accessory' && !values.model_id)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all tracking-widest uppercase">
                       {isSubmitting ? 'Processing...' : `Confirm ${featureType}`}
                    </button>
                  </Form>
                )}
              </Formik>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!modelToDelete} onOpenChange={() => setModelToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6"><AlertTriangle className="w-8 h-8 text-destructive" /></div>
            <AlertDialogTitle className="text-center font-black text-2xl">Delete Model?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-8">
            <AlertDialogCancel className="rounded-xl border-border/60 hover:bg-muted font-bold transition-all h-12 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteModel} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20 border-none transition-all h-12 px-8" disabled={isDeleting}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!featureToDelete} onOpenChange={() => setFeatureToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6"><AlertTriangle className="w-8 h-8 text-destructive" /></div>
            <AlertDialogTitle className="text-center font-black text-2xl uppercase">Delete {featureToDelete?.type}?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-8">
            <AlertDialogCancel className="rounded-xl border-border/60 hover:bg-muted font-bold transition-all h-12 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteFeature} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20 border-none transition-all h-12 px-8" disabled={isDeleting}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehiclesPage;
