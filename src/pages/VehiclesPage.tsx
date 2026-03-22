import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { 
  getVehicleModelsAction, 
  addVehicleModelAction, 
  updateVehicleModelAction,
  deleteVehicleModelAction 
} from '@/store/ducks/vehicle_models.ducks';
import { 
  getVehicleInventoryAction, 
  addVehicleInventoryAction, 
  updateVehicleInventoryAction,
  deleteVehicleInventoryAction 
} from '@/store/ducks/vehicle_inventory.ducks';

const modelValidationSchema = Yup.object().shape({
  brand: Yup.string().required('Brand is required'),
  model: Yup.string().required('Model is required'),
  variant: Yup.string().required('Variant is required'),
  fuel_type: Yup.string().required('Fuel type is required'),
  base_price: Yup.number().min(0, 'Price cannot be negative').required('Base price is required'),
});

const inventoryValidationSchema = Yup.object().shape({
  vehicle_model_id: Yup.string().required('Vehicle model is required'),
  color: Yup.string().required('Color is required'),
  chassis_number: Yup.string().required('Chassis number is required'),
  engine_number: Yup.string().required('Engine number is required'),
  purchase_date: Yup.string().required('Purchase date is required'),
});

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

const VehiclesPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const [tab, setTab] = useState<'models' | 'inventory'>('inventory');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModelForm, setShowModelForm] = useState(false);
  const [showInventoryForm, setShowInventoryForm] = useState(false);

  const [editingModel, setEditingModel] = useState<any>(null);
  const [editingInventory, setEditingInventory] = useState<any>(null);

  // Redux state with fallback safety
  const { data: models = [], loading: modelsLoading } = useSelector((state: RootState) => state.vehicleModels || { data: [], loading: false });
  const { data: inventory = [], loading: inventoryLoading } = useSelector((state: RootState) => state.vehicleInventory || { data: [], loading: false });

  useEffect(() => {
    if (companyCode) {
      dispatch(getVehicleModelsAction(companyCode));
      dispatch(getVehicleInventoryAction(companyCode));
    }
  }, [dispatch, companyCode]);

  const filteredInventory = (inventory || []).filter(v => {
    const matchSearch = (v.chassis_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.brand || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.model || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredModels = (models || []).filter(m =>
    (m.brand || '').toLowerCase().includes(search.toLowerCase()) || 
    (m.model || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = {
    All: (inventory || []).length,
    Available: (inventory || []).filter(v => v.status === 'Available').length,
    Reserved: (inventory || []).filter(v => v.status === 'Reserved').length,
    Sold: (inventory || []).filter(v => v.status === 'Sold').length,
    Delivered: (inventory || []).filter(v => v.status === 'Delivered').length,
  };

  const handleDeleteModel = (id: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle model?')) {
      dispatch(deleteVehicleModelAction(id));
    }
  };

  const handleDeleteInventory = (id: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle from inventory?')) {
      dispatch(deleteVehicleInventoryAction(id));
    }
  };

  const handleEditModel = (model: any) => {
    setEditingModel(model);
    setShowModelForm(true);
  };

  const handleEditInventory = (inv: any) => {
    setEditingInventory(inv);
    setShowInventoryForm(true);
  };

  const handleCloseForms = () => {
    setShowModelForm(false);
    setShowInventoryForm(false);
    setEditingModel(null);
    setEditingInventory(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab Toggle */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
        <button onClick={() => setTab('inventory')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'inventory' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
          Inventory
        </button>
        <button onClick={() => setTab('models')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'models' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
          Vehicle Models
        </button>
      </div>

      {tab === 'inventory' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center h-9 px-3 rounded-lg bg-card border border-input gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search chassis, model..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground" 
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${statusFilter === status ? 'bg-primary text-primary-foreground' : 'bg-card border border-input text-muted-foreground hover:text-foreground'}`}
                  >
                    {status} ({count})
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowInventoryForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          </div>

          {/* Inventory Table */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chassis Number</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Engine Number</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Purchase Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((v) => (
                    <tr key={v._id || v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{v.brand} {v.model}</div>
                        <div className="text-xs text-muted-foreground">{v.variant} • {v.fuel_type}</div>
                      </td>
                      <td className="px-4 py-3">{v.color}</td>
                      <td className="px-4 py-3 font-mono text-xs">{v.chassis_number}</td>
                      <td className="px-4 py-3 font-mono text-xs hidden md:table-cell">{v.engine_number}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(v.purchase_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${v.status === 'Available' ? 'status-available' : v.status === 'Sold' ? 'status-sold' : v.status === 'Reserved' ? 'status-reserved' : 'status-delivered'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleEditInventory(v)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteInventory(v._id || v.id!)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!inventoryLoading && filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground italic">No vehicles found in inventory.</td>
                    </tr>
                  )}
                  {inventoryLoading && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground font-semibold animate-pulse">Syncing fleet data...</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      ) : (
        <>
          {/* Models */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center h-9 px-3 rounded-lg bg-card border border-input gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search catalog..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground" />
            </div>
            <button onClick={() => setShowModelForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Add Model
            </button>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Model</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fuel</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base Price</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((m) => (
                    <tr key={m._id || m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold">{m.brand}</td>
                      <td className="px-4 py-3">{m.model}</td>
                      <td className="px-4 py-3">{m.variant}</td>
                      <td className="px-4 py-3"><span className="status-badge status-available">{m.fuel_type}</span></td>
                      <td className="px-4 py-3 text-right tabular font-semibold">₹{(m.base_price || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleEditModel(m)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteModel(m._id || m.id!)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!modelsLoading && filteredModels.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground italic">No models found in catalog.</td>
                    </tr>
                  )}
                  {modelsLoading && <tr><td colSpan={6} className="text-center py-12 text-muted-foreground font-semibold animate-pulse">Syncing catalog data...</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}

      {/* Add/Edit Model Modal */}
      <AnimatePresence>
        {showModelForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-xl ring-1 ring-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
                <h3 className="text-base font-bold">{editingModel ? 'Edit Vehicle Model' : 'Add Vehicle Model'}</h3>
                <button onClick={handleCloseForms} className="p-2 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <Formik
                initialValues={{ 
                  brand: editingModel?.brand || '', 
                  model: editingModel?.model || '', 
                  variant: editingModel?.variant || '', 
                  fuel_type: editingModel?.fuel_type || '', 
                  base_price: editingModel?.base_price || 0, 
                  company_id: editingModel?.company_id || 'DEFAULT_COMPANY', 
                  branch_id: editingModel?.branch_id || 'MAIN_BRANCH' 
                }}
                validationSchema={modelValidationSchema}
                onSubmit={(values, { setSubmitting }) => {
                  if (editingModel) {
                    dispatch(updateVehicleModelAction(editingModel.entity_id || editingModel._id || editingModel.id, values, () => {
                      handleCloseForms();
                      setSubmitting(false);
                    }, () => setSubmitting(false)));
                  } else {
                    dispatch(addVehicleModelAction(
                      values,
                      companyCode,
                      () => {
                        handleCloseForms();
                        setSubmitting(false);
                      },
                      (err: any) => {
                        setSubmitting(false);
                        alert(err?.response?.data?.error || err.message || 'Failed to add model');
                      }
                    ));
                  }
                }}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="erp-label">Brand</label>
                          <Field name="brand" className="erp-input h-10" placeholder="e.g. Maruti Suzuki" />
                          <ErrorMessage name="brand" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                        <div className="col-span-2">
                          <label className="erp-label">Model</label>
                          <Field name="model" className="erp-input h-10" placeholder="e.g. Swift" />
                          <ErrorMessage name="model" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                        <div>
                          <label className="erp-label">Variant</label>
                          <Field name="variant" className="erp-input h-10" placeholder="e.g. VXI" />
                          <ErrorMessage name="variant" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                        <div>
                          <label className="erp-label">Fuel Type</label>
                          <Field as="select" name="fuel_type" className="erp-select h-10">
                            <option value="">Select</option>
                            <option value="Petrol">Petrol</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Electric">Electric</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="CNG">CNG</option>
                          </Field>
                          <ErrorMessage name="fuel_type" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                        <div className="col-span-2">
                          <label className="erp-label">Base Price (₹)</label>
                          <Field type="number" name="base_price" className="erp-input h-10" />
                          <ErrorMessage name="base_price" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 p-5 border-t border-border bg-muted/10">
                      <button type="button" onClick={handleCloseForms} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all">
                        {isSubmitting ? 'Saving...' : (editingModel ? 'Update Model' : 'Save Model')}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Inventory Modal */}
      <AnimatePresence>
        {showInventoryForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-xl ring-1 ring-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
                <h3 className="text-base font-bold">{editingInventory ? 'Edit Inventory Vehicle' : 'Add Vehicle to Inventory'}</h3>
                <button onClick={handleCloseForms} className="p-2 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <Formik
                initialValues={{ 
                  vehicle_model_id: editingInventory?.vehicle_model_id || '', 
                  color: editingInventory?.color || '', 
                  chassis_number: editingInventory?.chassis_number || '', 
                  engine_number: editingInventory?.engine_number || '', 
                  purchase_date: editingInventory?.purchase_date ? new Date(editingInventory.purchase_date).toISOString().split('T')[0] : '', 
                  company_id: editingInventory?.company_id || 'DEFAULT_COMPANY', 
                  branch_id: editingInventory?.branch_id || 'MAIN_BRANCH' 
                }}
                validationSchema={inventoryValidationSchema}
                onSubmit={(values, { setSubmitting }) => {
                  const payload = {
                    ...values,
                    purchase_date: values.purchase_date ? new Date(values.purchase_date).toISOString() : ''
                  };
                  if (editingInventory) {
                    dispatch(updateVehicleInventoryAction(editingInventory.entity_id || editingInventory._id || editingInventory.id, payload, () => {
                      handleCloseForms();
                      setSubmitting(false);
                    }, () => setSubmitting(false)));
                  } else {
                    dispatch(addVehicleInventoryAction(
                      payload,
                      companyCode,
                      () => {
                        handleCloseForms();
                        setSubmitting(false);
                      },
                      (err: any) => {
                        setSubmitting(false);
                        alert(err?.response?.data?.error || err.message || 'Failed to add vehicle');
                      }
                    ));
                  }
                }}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="erp-label">Vehicle Model</label>
                        <Field as="select" name="vehicle_model_id" className="erp-select h-10">
                          <option value="">Select Model</option>
                          {models.map(m => (
                            <option key={m._id || m.id} value={m.entity_id || m._id || m.id}>
                              {m.brand} {m.model} ({m.variant})
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage name="vehicle_model_id" component="div" className="text-xs text-destructive mt-1 font-medium" />
                      </div>
                      <div>
                        <label className="erp-label">Body Color</label>
                        <Field name="color" className="erp-input h-10" placeholder="e.g. Arctic White" />
                        <ErrorMessage name="color" component="div" className="text-xs text-destructive mt-1 font-medium" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="erp-label">Chassis/VIN</label>
                          <Field name="chassis_number" className="erp-input h-10 font-mono" placeholder="Enter VIN" />
                          <ErrorMessage name="chassis_number" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                        <div>
                          <label className="erp-label">Engine Number</label>
                          <Field name="engine_number" className="erp-input h-10 font-mono" placeholder="Enter Engine #" />
                          <ErrorMessage name="engine_number" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                      </div>
                      <div>
                        <label className="erp-label">Purchase Date</label>
                        <Field type="date" name="purchase_date" className="erp-input h-10" />
                        <ErrorMessage name="purchase_date" component="div" className="text-xs text-destructive mt-1 font-medium" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 p-5 border-t border-border bg-muted/10">
                      <button type="button" onClick={handleCloseForms} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all">
                        {isSubmitting ? 'Processing...' : (editingInventory ? 'Update Vehicle' : 'Add Vehicle')}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VehiclesPage;
