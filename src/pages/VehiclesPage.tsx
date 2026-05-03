import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { 
  getVehicleModelsAction, addVehicleModelAction, batchAddVehicleModelAction,
  deleteVehicleModelAction, updateVehicleModelAction 
} from '@/store/ducks/vehicle_models.ducks';
import { 
  getTypesAction, addTypeAction, deleteTypeAction,
  getCategoriesAction, addCategoryAction, deleteCategoryAction,
  getAccessoriesAction, addAccessoryAction, deleteAccessoryAction
} from '@/store/ducks/vehicle_features.ducks';
import { Plus, Search, Trash2, Edit2, X, AlertTriangle, Loader2, Car, Eye, List, LayoutGrid } from 'lucide-react';
import { getVehicleInventoryAction } from '@/store/ducks/vehicle_inventory.ducks';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { usePermissions } from '@/hooks/usePermissions';

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
  const { user } = useSelector((state: RootState) => state.auth);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';
  const { hasPermission } = usePermissions();

  const [tab, setTab] = useState<'models' | 'accessories' | 'categories' | 'types'>(initialTab || 'models');
  const [search, setSearch] = useState('');
  const [showModelForm, setShowModelForm] = useState(false);
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [featureType, setFeatureType] = useState<'type' | 'category' | 'accessory'>('type');

  const [editingModel, setEditingModel] = useState<any>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
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

  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');

  // ---- Two-step wizard state (Add New Model) ----
  const [wizardStep, setWizardStep] = useState<'setup' | 'variants'>('setup');
  const [wizardHeader, setWizardHeader] = useState({
    brand: '', modelName: '', categoryId: '', typeId: '',
  });
  const [wizardFuels, setWizardFuels] = useState<string[]>([]);
  type WizardVariant = {
    name: string; fuel: string; transmission: string;
    engineCC: string; batteryKWh: string; chargingTime: string;
    tankCapacity: string; avgMileage: string;
    basePrice: string; incentiveType: string; incentiveValue: string;
  };
  const [wizardVariants, setWizardVariants] = useState<WizardVariant[]>([]);

  const toggleWizardFuel = (f: string) =>
    setWizardFuels(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const getTransmissionOpts = (catId: string, fuel: string) => {
    const cat = categories.find((c: any) => (c.entity_id || c._id || c.id) === catId);
    const catName = (cat?.name || '').toLowerCase();
    if (fuel === 'Electric') return ['Automatic'];
    if (catName.includes('2 wheel') || catName.includes('2wheel')) return ['Manual', 'Automatic'];
    if (catName.includes('4 wheel') || catName.includes('4wheel') || catName.includes('car')) return ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'];
    return ['Manual', 'Automatic'];
  };

  const generateWizardVariants = () => {
    if (!wizardHeader.brand || !wizardHeader.modelName || wizardFuels.length === 0) return;
    setWizardVariants(wizardFuels.map(f => ({
      name: `${wizardHeader.brand} ${wizardHeader.modelName} ${f}`,
      fuel: f, transmission: '', engineCC: '', batteryKWh: '',
      chargingTime: '', tankCapacity: '', avgMileage: '',
      basePrice: '', incentiveType: 'fixed', incentiveValue: '',
    })));
    setWizardStep('variants');
  };

  const updateWizardVariant = (i: number, field: keyof WizardVariant, val: string) => {
    setWizardVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
  };

  const handleWizardSave = () => {
    const payload = wizardVariants.map(v => ({
      company_id: companyCode,
      branch_id: 'MAIN_BRANCH',
      brand: wizardHeader.brand,
      model: wizardHeader.modelName,
      variant: v.name,
      model_code: `${wizardHeader.brand.slice(0,3).toUpperCase()}-${Date.now()}`,
      category_id: wizardHeader.categoryId,
      type_id: wizardHeader.typeId,
      fuel_type: [v.fuel],
      base_price: parseFloat(v.basePrice) || 0,
      incentive_type: v.incentiveType,
      incentive_value: parseFloat(v.incentiveValue) || 0,
      transmission: v.transmission,
      engine_cc: parseFloat(v.engineCC) || 0,
      battery_kwh: parseFloat(v.batteryKWh) || 0,
      charging_time: v.chargingTime,
      tank_capacity: parseFloat(v.tankCapacity) || 0,
      average_mileage: parseFloat(v.avgMileage) || 0,
      colors: [], color_count: 0,
    }));
    dispatch(batchAddVehicleModelAction(payload, companyCode, () => {
      handleCloseForms();
      toast.success(`${payload.length} variant(s) saved`);
    }, (err: any) => toast.error(err?.message || 'Failed to save')));
  };

  const resetWizard = () => {
    setWizardStep('setup');
    setWizardHeader({ brand: '', modelName: '', categoryId: '', typeId: '' });
    setWizardFuels([]);
    setWizardVariants([]);
  };

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
    setIsViewOnly(false);
    resetWizard();
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
            <div className="flex items-center gap-3">
              <div className="flex items-center h-10 px-3 rounded-xl bg-card border border-border gap-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search models..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none w-64 placeholder:text-muted-foreground" />
              </div>
              
              <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/60 gap-1 h-10">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`} title="List View"><List className="w-3.5 h-3.5" /></button>
                <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`} title="Card View"><LayoutGrid className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {hasPermission('vehicles', 'add') && (
              <button onClick={() => setShowModelForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all tracking-tight font-bold">
                <Plus className="w-4 h-4" /> Add Model
              </button>
            )}
          </div>

          {viewMode === 'card' ? (
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
                        {hasPermission('vehicles', 'view') && (
                          <button 
                            onClick={() => {
                              setEditingModel(m);
                              setIsViewOnly(true);
                              setShowModelForm(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold">View</span>
                          </button>
                        )}
                        {hasPermission('vehicles', 'edit') && (
                          <button onClick={() => { setEditingModel(m); setIsViewOnly(false); setShowModelForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold">Edit</span>
                          </button>
                        )}
                        {hasPermission('vehicles', 'delete') && (
                          <button onClick={() => setModelToDelete(m.entity_id || m._id || m.id!)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold">Delete</span>
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground opacity-60 font-medium hidden sm:block">Actions</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="erp-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Model & Brand</th>
                    <th className="text-left py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Variant</th>
                    <th className="text-left py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Fuel Types</th>
                    <th className="text-right py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Base Price</th>
                    <th className="text-right py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((m) => (
                    <tr key={m.entity_id || m._id || m.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Car className="w-4 h-4 text-primary opacity-60" />
                          <div>
                            <p className="font-bold text-foreground">{m.brand} {m.model}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{m.model_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-muted-foreground text-xs">{m.variant}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {(m.fuel_type || []).map((f: string) => (
                            <span key={f} className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[10px] font-bold border border-primary/10">{f}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-foreground">₹{(m.base_price || 0).toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission('vehicles', 'view') && (
                            <button onClick={() => { setEditingModel(m); setIsViewOnly(true); setShowModelForm(true); }} className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-600 transition-colors" title="View Detail"><Eye className="w-4 h-4" /></button>
                          )}
                          {hasPermission('vehicles', 'edit') && (
                            <button onClick={() => { setEditingModel(m); setIsViewOnly(false); setShowModelForm(true); }} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Edit Model"><Edit2 className="w-4 h-4" /></button>
                          )}
                          {hasPermission('vehicles', 'delete') && (
                            <button onClick={() => setModelToDelete(m.entity_id || m._id || m.id!)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-600 transition-colors" title="Delete Model"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'accessories' && (
        <div className="space-y-6">
            <h3 className="text-lg font-bold">Manage {tab === 'accessories' ? 'Accessories' : tab === 'types' ? 'Types' : 'Categories'}</h3>
            {hasPermission('vehicles', 'add') && (
              <button 
                onClick={() => { setFeatureType(tab === 'accessories' ? 'accessory' : tab === 'types' ? 'type' : 'category'); setShowFeatureForm(true); }} 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 font-bold"
              >
                <Plus className="w-4 h-4" /> New {tab.slice(0,-1)}
              </button>
            )}
          <div className="erp-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border"><tr><th className="text-left py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Name</th><th className="text-right py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Price (₹)</th><th className="text-right py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground w-20">Actions</th></tr></thead>
              <tbody>
                {accessories.map((a: any) => (
                  <tr key={a.entity_id || a._id || a.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-bold">{a.name}</td>
                    <td className="py-4 px-6 text-right font-black">₹{(a.price || 0).toLocaleString()}</td>
                    <td className="py-4 px-6 text-right">
                      {hasPermission('vehicles', 'delete') && (
                        <button onClick={() => setFeatureToDelete({id: a.entity_id || a._id || a.id!, type: 'accessory'})} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
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
            {hasPermission('vehicles', 'add') && (
              <button 
                onClick={() => { setFeatureType(tab === 'categories' ? 'category' : 'type'); setShowFeatureForm(true); }} 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 font-bold"
              >
                <Plus className="w-4 h-4" /> New {tab.slice(0,-1)}
              </button>
            )}
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
                    <td className="py-4 px-6 text-right">
                      {hasPermission('vehicles', 'delete') && (
                        <button onClick={() => setFeatureToDelete({id: item.entity_id || item._id || item.id!, type: tab === 'categories' ? 'category' : 'type'})} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl ring-1 ring-border shadow-2xl w-full mx-4 overflow-hidden border border-border"
              style={{ maxWidth: editingModel ? '32rem' : '56rem' }}
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold">
                    {isViewOnly ? 'Vehicle Model Details' : editingModel ? 'Edit Vehicle Model' : 'New Vehicle Model'}
                  </h3>
                  {!editingModel && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full ${wizardStep === 'setup' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1 Setup</span>
                      <span>›</span>
                      <span className={`px-2 py-0.5 rounded-full ${wizardStep === 'variants' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2 Variants</span>
                    </div>
                  )}
                </div>
                <button onClick={handleCloseForms} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* ══════════════ NEW MODEL: STEP 1 — Setup ══════════════ */}
              {!editingModel && wizardStep === 'setup' && (
                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Brand</label>
                      <input value={wizardHeader.brand} onChange={e => setWizardHeader(h => ({ ...h, brand: e.target.value }))}
                        className="erp-input h-10 rounded-xl w-full" placeholder="e.g. Tata" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Model Name</label>
                      <input value={wizardHeader.modelName} onChange={e => setWizardHeader(h => ({ ...h, modelName: e.target.value }))}
                        className="erp-input h-10 rounded-xl w-full" placeholder="e.g. Nexon" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Category</label>
                      <select value={wizardHeader.categoryId}
                        onChange={e => setWizardHeader(h => ({ ...h, categoryId: e.target.value, typeId: '' }))}
                        className="erp-select h-10 rounded-xl w-full">
                        <option value="">Select Category</option>
                        {categories.map((c: any) => <option key={c.entity_id || c._id || c.id} value={c.entity_id || c._id || c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Type</label>
                      <select value={wizardHeader.typeId}
                        onChange={e => setWizardHeader(h => ({ ...h, typeId: e.target.value }))}
                        className="erp-select h-10 rounded-xl w-full" disabled={!wizardHeader.categoryId}>
                        <option value="">Select Type</option>
                        {types.filter((t: any) => t.category_id === wizardHeader.categoryId)
                          .map((t: any) => <option key={t.entity_id || t._id || t.id} value={t.entity_id || t._id || t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Fuel Types</label>
                    <div className="flex flex-wrap gap-2">
                      {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG'].map(f => (
                        <button key={f} type="button" onClick={() => toggleWizardFuel(f)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${wizardFuels.includes(f) ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                    {wizardFuels.length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {wizardFuels.length} fuel type(s) selected → will generate {wizardFuels.length} variant(s)
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={handleCloseForms} className="px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
                    <button type="button" onClick={generateWizardVariants}
                      disabled={!wizardHeader.brand || !wizardHeader.modelName || !wizardHeader.categoryId || !wizardHeader.typeId || wizardFuels.length === 0}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-lg shadow-primary/20 disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-95">
                      Generate Variants →
                    </button>
                  </div>
                </div>
              )}

              {/* ══════════════ NEW MODEL: STEP 2 — Variants ══════════════ */}
              {!editingModel && wizardStep === 'variants' && (
                <div className="max-h-[75vh] overflow-y-auto">
                  <div className="p-4 bg-primary/5 border-b border-primary/10">
                    <p className="text-xs font-bold text-primary">
                      {wizardHeader.brand} {wizardHeader.modelName} — {wizardVariants.length} variant(s)
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Fill in specs for each fuel variant below</p>
                  </div>
                  <div className="p-4 space-y-4">
                    {wizardVariants.map((v, i) => (
                      <div key={i} className="bg-muted/30 rounded-2xl border border-border p-4 space-y-3">
                        {/* Variant header chip */}
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-wide">{v.fuel}</span>
                          <input value={v.name} onChange={e => updateWizardVariant(i, 'name', e.target.value)}
                            className="erp-input h-8 rounded-lg flex-1 text-sm font-semibold" placeholder="Variant name" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {/* Transmission */}
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Transmission</label>
                            <select value={v.transmission} onChange={e => updateWizardVariant(i, 'transmission', e.target.value)}
                              className="erp-select h-9 rounded-lg w-full text-sm">
                              <option value="">Select</option>
                              {getTransmissionOpts(wizardHeader.categoryId, v.fuel).map(t => <option key={t}>{t}</option>)}
                            </select>
                          </div>

                          {/* Engine CC — non-Electric */}
                          {v.fuel !== 'Electric' && (
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Engine (CC)</label>
                              <input type="number" value={v.engineCC} onChange={e => updateWizardVariant(i, 'engineCC', e.target.value)}
                                className="erp-input h-9 rounded-lg w-full text-sm" placeholder="e.g. 1199" />
                            </div>
                          )}

                          {/* Battery + Charging — Electric */}
                          {v.fuel === 'Electric' && (
                            <>
                              <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Battery (kWh)</label>
                                <input type="number" value={v.batteryKWh} onChange={e => updateWizardVariant(i, 'batteryKWh', e.target.value)}
                                  className="erp-input h-9 rounded-lg w-full text-sm" placeholder="e.g. 40.5" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Charging Time</label>
                                <input value={v.chargingTime} onChange={e => updateWizardVariant(i, 'chargingTime', e.target.value)}
                                  className="erp-input h-9 rounded-lg w-full text-sm" placeholder="e.g. 8h / DC Fast" />
                              </div>
                            </>
                          )}

                          {/* CNG Tank */}
                          {v.fuel === 'CNG' && (
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Tank (kg)</label>
                              <input type="number" value={v.tankCapacity} onChange={e => updateWizardVariant(i, 'tankCapacity', e.target.value)}
                                className="erp-input h-9 rounded-lg w-full text-sm" placeholder="e.g. 9" />
                            </div>
                          )}

                          {/* Average */}
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">{v.fuel === 'Electric' ? 'Range (km)' : 'Avg (km/l)'}</label>
                            <input type="number" value={v.avgMileage} onChange={e => updateWizardVariant(i, 'avgMileage', e.target.value)}
                              className="erp-input h-9 rounded-lg w-full text-sm" placeholder="e.g. 18" />
                          </div>
                        </div>

                        {/* Pricing row */}
                        <div className="grid grid-cols-3 gap-3 pt-1 border-t border-border/50">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Base Price (₹)</label>
                            <input type="number" value={v.basePrice} onChange={e => updateWizardVariant(i, 'basePrice', e.target.value)}
                              className="erp-input h-9 rounded-lg w-full text-sm" placeholder="0" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Incentive Type</label>
                            <select value={v.incentiveType} onChange={e => updateWizardVariant(i, 'incentiveType', e.target.value)}
                              className="erp-select h-9 rounded-lg w-full text-sm">
                              <option value="fixed">Fixed (₹)</option>
                              <option value="percentage">Percentage (%)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Incentive Value</label>
                            <input type="number" value={v.incentiveValue} onChange={e => updateWizardVariant(i, 'incentiveValue', e.target.value)}
                              className="erp-input h-9 rounded-lg w-full text-sm" placeholder="0" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-4 border-t border-border bg-muted/10">
                    <button type="button" onClick={() => setWizardStep('setup')}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-muted transition-colors">← Back</button>
                    <button type="button" onClick={handleWizardSave}
                      className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                      Save {wizardVariants.length} Variant(s)
                    </button>
                  </div>
                </div>
              )}

              {/* ══════════════ EDIT / VIEW — Formik form ══════════════ */}
              {editingModel && (
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
                    transmission: editingModel?.transmission || '',
                    engine_cc: editingModel?.engine_cc || 0,
                    battery_kwh: editingModel?.battery_kwh || 0,
                    charging_time: editingModel?.charging_time || '',
                    tank_capacity: editingModel?.tank_capacity || 0,
                    average_mileage: editingModel?.average_mileage || 0,
                    company_id: editingModel?.company_id || companyCode,
                    branch_id: editingModel?.branch_id || 'MAIN_BRANCH',
                  }}
                  validationSchema={modelValidationSchema}
                  onSubmit={(values, { setSubmitting }) => {
                    const payload = { ...values, colors: values.colors.split(',').map((s: string) => s.trim()).filter(Boolean) };
                    dispatch(updateVehicleModelAction(editingModel.entity_id || editingModel._id || editingModel.id, payload, companyCode, () => {
                      handleCloseForms(); setSubmitting(false); toast.success('Model updated');
                    }, (err: any) => { setSubmitting(false); toast.error(err.message); }));
                  }}
                >
                  {({ isSubmitting, values, setFieldValue }) => (
                    <Form className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Brand</label>
                          <Field name="brand" disabled={isViewOnly} className="erp-input h-11 rounded-xl disabled:opacity-70" placeholder="e.g., Tata" />
                          <ErrorMessage name="brand" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Model Name</label>
                          <Field name="model" disabled={isViewOnly} className="erp-input h-11 rounded-xl disabled:opacity-70" placeholder="e.g., Nexon" />
                          <ErrorMessage name="model" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Variant Name</label>
                          <Field name="variant" disabled={isViewOnly} className="erp-input h-11 rounded-xl disabled:opacity-70" placeholder="e.g., XZ+ Petrol" />
                          <ErrorMessage name="variant" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Model Code</label>
                          <Field name="model_code" disabled={isViewOnly} className="erp-input h-11 rounded-xl disabled:opacity-70" placeholder="e.g. NXN-001" />
                          <ErrorMessage name="model_code" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Category</label>
                          <Field as="select" name="category_id" disabled={isViewOnly} className="erp-select h-11 rounded-xl disabled:opacity-70"
                            onChange={(e: any) => { setFieldValue('category_id', e.target.value); setFieldValue('type_id', ''); }}>
                            <option value="">Select Category</option>
                            {categories.map((c: any) => <option key={c.entity_id || c._id || c.id} value={c.entity_id || c._id || c.id}>{c.name}</option>)}
                          </Field>
                          <ErrorMessage name="category_id" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Type</label>
                          <Field as="select" name="type_id" disabled={isViewOnly || !values.category_id} className="erp-select h-11 rounded-xl disabled:opacity-70">
                            <option value="">Select Type</option>
                            {types.filter((t: any) => t.category_id === values.category_id).map((t: any) => <option key={t.entity_id || t._id || t.id} value={t.entity_id || t._id || t.id}>{t.name}</option>)}
                          </Field>
                          <ErrorMessage name="type_id" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Fuel Type</label>
                        <div className="flex flex-wrap gap-2 border border-border/40 p-3 rounded-xl bg-muted/10">
                          {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG'].map(f => (
                            <label key={f} className={`flex items-center gap-2 text-[11px] font-medium ${isViewOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                              <Field type="checkbox" name="fuel_type" value={f} disabled={isViewOnly} className="w-4 h-4 rounded border-border disabled:opacity-70" />{f}
                            </label>
                          ))}
                        </div>
                        <ErrorMessage name="fuel_type" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Transmission</label>
                          <Field as="select" name="transmission" disabled={isViewOnly} className="erp-select h-11 rounded-xl disabled:opacity-70">
                            <option value="">Select</option>
                            {['Manual','Automatic','AMT','CVT','DCT'].map(t => <option key={t}>{t}</option>)}
                          </Field>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Engine (CC)</label>
                          <Field type="number" name="engine_cc" disabled={isViewOnly} className="erp-input h-11 rounded-xl disabled:opacity-70" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Battery (kWh)</label>
                          <Field type="number" name="battery_kwh" disabled={isViewOnly} className="erp-input h-11 rounded-xl disabled:opacity-70" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Avg / Range</label>
                          <Field type="number" name="average_mileage" disabled={isViewOnly} className="erp-input h-11 rounded-xl disabled:opacity-70" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Base Price (₹)</label>
                          <Field type="number" name="base_price" disabled={isViewOnly} className="erp-input h-11 rounded-xl disabled:opacity-70" />
                          <ErrorMessage name="base_price" component="div" className="text-[10px] text-destructive mt-1 font-bold pl-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Incentive Value</label>
                          <Field type="number" name="incentive_value" disabled={isViewOnly} className="erp-input h-11 rounded-xl disabled:opacity-70" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={handleCloseForms} className="px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-muted transition-colors">{isViewOnly ? 'Close' : 'Discard'}</button>
                        {!isViewOnly && (
                          <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-xl shadow-primary/30 active:scale-95 disabled:opacity-50 transition-all">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Model'}
                          </button>
                        )}
                      </div>
                    </Form>
                  )}
                </Formik>
              )}
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
