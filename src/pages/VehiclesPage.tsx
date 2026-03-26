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
import { Plus, Search, Trash2, Edit2, X, AlertTriangle, Loader2, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const modelValidationSchema = Yup.object().shape({
  brand: Yup.string().required('Brand is required'),
  model: Yup.string().required('Model name is required'),
  variant: Yup.string().required('Variant is required'),
  fuel_type: Yup.string().required('Fuel type is required'),
  base_price: Yup.number().min(0, 'Price cannot be negative').required('Required'),
  type_id: Yup.string().required('Type is required'),
  category_id: Yup.string().required('Category is required'),
});

const featureValidationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
});

const accessoryValidationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  price: Yup.number().min(0).required('Price is required'),
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
      setIsDeleting(true);
      const { id, type } = featureToDelete;
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
      <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        <button onClick={() => setTab('models')} className={`px-4 py-2 rounded-md text-xs font-black tracking-widest transition-all ${tab === 'models' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>MODEL</button>
        <button onClick={() => setTab('accessories')} className={`px-4 py-2 rounded-md text-xs font-black tracking-widest transition-all ${tab === 'accessories' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>ACCESSORIES</button>
        <button onClick={() => setTab('categories')} className={`px-4 py-2 rounded-md text-xs font-black tracking-widest transition-all ${tab === 'categories' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>CATEGORY</button>
        <button onClick={() => setTab('types')} className={`px-4 py-2 rounded-md text-xs font-black tracking-widest transition-all ${tab === 'types' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>TYPE</button>
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
              <motion.div key={m.entity_id || m._id || m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="erp-card group">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-black tracking-tight">{m.brand} {m.model}</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{m.variant} • {m.fuel_type}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-primary/5 text-primary">
                      <Car className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Base Price</p>
                      <p className="text-lg font-black text-primary">₹{(m.base_price || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditModel(m)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setModelToDelete(m.entity_id || m._id || m.id!)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
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
              <thead className="bg-muted/50 border-b border-border"><tr><th className="text-left py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Name</th><th className="text-right py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground w-20">Actions</th></tr></thead>
              <tbody>
                {(tab === 'categories' ? categories : types).map((item: any) => (
                  <tr key={item.entity_id || item._id || item.id} className="border-b border-border hover:bg-muted/30 transition-colors"><td className="py-4 px-6 font-bold">{item.name}</td><td className="py-4 px-6 text-right"><button onClick={() => setFeatureToDelete({id: item.entity_id || item._id || item.id!, type: tab === 'categories' ? 'category' : 'type'})} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button></td></tr>
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
                  variant: editingModel?.variant || '', 
                  fuel_type: editingModel?.fuel_type || '', 
                  base_price: editingModel?.base_price || 0,
                  type_id: editingModel?.type_id || '',
                  category_id: editingModel?.category_id || '',
                  colors: editingModel?.colors || [],
                  company_id: editingModel?.company_id || companyCode, 
                  branch_id: editingModel?.branch_id || 'MAIN_BRANCH' 
                }}
                validationSchema={modelValidationSchema}
                onSubmit={(values, { setSubmitting }) => {
                  if (editingModel) {
                    dispatch(updateVehicleModelAction(editingModel.entity_id || editingModel._id || editingModel.id, values, companyCode, () => {
                      handleCloseForms();
                      setSubmitting(false);
                      toast.success('Model updated');
                    }, (err: any) => { setSubmitting(false); toast.error(err.message); }));
                  } else {
                    dispatch(addVehicleModelAction(values, companyCode, () => {
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
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Fuel Type</label>
                        <Field as="select" name="fuel_type" className="erp-select h-11 rounded-xl">
                          <option value="">Select...</option>
                          <option value="Petrol">Petrol</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Electric">Electric</option>
                        </Field>
                        <ErrorMessage name="fuel_type" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Type</label>
                        <Field as="select" name="type_id" className="erp-select h-11 rounded-xl">
                          <option value="">Select Type</option>
                          {types.map((t: any) => <option key={t.entity_id || t._id || t.id} value={t.entity_id || t._id || t.id}>{t.name}</option>)}
                        </Field>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Category</label>
                        <Field as="select" name="category_id" className="erp-select h-11 rounded-xl">
                          <option value="">Select Category</option>
                          {categories.map((c: any) => <option key={c.entity_id || c._id || c.id} value={c.entity_id || c._id || c.id}>{c.name}</option>)}
                        </Field>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Base Price (₹)</label>
                      <Field type="number" name="base_price" className="erp-input h-11 rounded-xl" />
                      <ErrorMessage name="base_price" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Color Catalog</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {values.colors.map((color: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-md flex items-center gap-1 group ring-1 ring-primary/20">
                            {color}
                            <button type="button" onClick={() => setFieldValue('colors', values.colors.filter((_: any, i: number) => i !== index))} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Type color and press Enter..." 
                        className="erp-input h-11 rounded-xl w-full"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val && !values.colors.includes(val)) {
                              setFieldValue('colors', [...values.colors, val]);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
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
                initialValues={{ name: '', price: 0, company_id: companyCode, branch_id: 'MAIN_BRANCH' }}
                validationSchema={featureType === 'accessory' ? accessoryValidationSchema : featureValidationSchema}
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
                {({ isSubmitting }) => (
                  <Form className="p-8 space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Name</label>
                      <Field name="name" className="erp-input h-11 rounded-xl" placeholder={`Enter name`} />
                      <ErrorMessage name="name" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                    </div>
                    {featureType === 'accessory' && (
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Price (₹)</label>
                        <Field type="number" name="price" className="erp-input h-11 rounded-xl" />
                        <ErrorMessage name="price" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>
                    )}
                    <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all tracking-widest uppercase">
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
