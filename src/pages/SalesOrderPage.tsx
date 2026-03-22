import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Printer, Save, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getCustomersAction } from '@/store/ducks/customers.ducks';
import { getSalespersonsAction } from '@/store/ducks/salespersons.ducks';
import { getVehicleInventoryAction } from '@/store/ducks/vehicle_inventory.ducks';
import { addSalesOrderAction } from '@/store/ducks/sales_orders.ducks';
import { useNavigate } from 'react-router-dom';

const salesOrderSchema = Yup.object().shape({
  customer_id: Yup.string().required('Customer is required'),
  vehicle_inventory_id: Yup.string().required('Vehicle is required'),
  salesperson_id: Yup.string().required('Salesperson is required'),
  sale_date: Yup.string().required('Sale date is required'),
  delivery_date: Yup.string().required('Delivery date is required'),
  vehicle_price: Yup.number().min(0).required('Vehicle price is required'),
  registration_charges: Yup.number().min(0),
  insurance: Yup.number().min(0),
  accessories: Yup.number().min(0),
  down_payment: Yup.number().min(0),
  loan_amount: Yup.number().min(0),
});

const SalesOrderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const { data: customers = [] } = useSelector((state: RootState) => state.customers || { data: [] });
  const { data: salespersons = [] } = useSelector((state: RootState) => state.salespersons || { data: [] });
  const { data: inventory = [] } = useSelector((state: RootState) => state.vehicleInventory || { data: [] });

  useEffect(() => {
    if (companyCode) {
      dispatch(getCustomersAction(companyCode));
      dispatch(getSalespersonsAction(companyCode));
      dispatch(getVehicleInventoryAction(companyCode));
    }
  }, [dispatch, companyCode]);

  const availableVehicles = useMemo(() => 
    (inventory || []).filter(v => (v.status || '').toLowerCase() === 'available'), 
    [inventory]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper to get initial values
  const getInitialValues = () => ({
    company_id: companyCode,
    branch_id: 'MAIN_BRANCH',
    customer_id: '',
    vehicle_inventory_id: '',
    salesperson_id: '',
    sale_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    vehicle_price: 0,
    registration_charges: 0,
    insurance: 0,
    accessories: 0,
    total_amount: 0,
    down_payment: 0,
    loan_amount: 0,
    balance_amount: 0,
    status: 'Pending'
  });

  return (
    <Formik
      initialValues={getInitialValues()}
      validationSchema={salesOrderSchema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        const payload = {
          ...values,
          sale_date: new Date(values.sale_date).toISOString(),
          delivery_date: values.delivery_date ? new Date(values.delivery_date).toISOString() : new Date().toISOString()
        };
        dispatch(addSalesOrderAction(
          payload,
          companyCode,
          () => {
            setSubmitting(false);
            alert('Sales Order Created Successfully!');
            resetForm({ values: getInitialValues() });
          },
          () => setSubmitting(false)
        ));
      }}
    >
      {({ values, setFieldValue, isSubmitting, handleSubmit, resetForm }) => {
        // Real-time calculations
        const { vehicle_price, registration_charges, insurance, accessories, down_payment, loan_amount } = values;
        const total = Number(vehicle_price) + Number(registration_charges) + Number(insurance) + Number(accessories);
        const balance = total - Number(down_payment) - Number(loan_amount);

        // Update dependent fields
        useEffect(() => {
          setFieldValue('total_amount', total);
          setFieldValue('balance_amount', balance);
        }, [total, balance, setFieldValue]);

        const selectedCustomer = (customers || []).find(c => (c.entity_id || c._id || c.id) === values.customer_id);
        const selectedVehicle = (inventory || []).find(v => (v.entity_id || v._id || v.id) === values.vehicle_inventory_id);

        const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const vId = e.target.value;
          setFieldValue('vehicle_inventory_id', vId);
          const vehicle = (inventory || []).find(v => (v.entity_id || v._id || v.id) === vId);
          if (vehicle) {
            setFieldValue('vehicle_price', vehicle.base_price || 0);
          }
        };

        // Save & Print Draft handler
        const handleSavePrintDraft = () => {
          const draftPayload = {
            ...values,
            status: 'Draft',
            sale_date: new Date(values.sale_date).toISOString(),
            delivery_date: values.delivery_date ? new Date(values.delivery_date).toISOString() : new Date().toISOString()
          };
          dispatch(addSalesOrderAction(
            draftPayload,
            companyCode,
            () => {
              alert('Draft Saved!');
              window.print();
              resetForm({ values: getInitialValues() });
            },
            () => alert('Failed to save draft!')
          ));
        };

        return (
          <Form className="grid grid-cols-12 gap-6 lg:gap-8">
            {/* Left: Form Sections */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Customer Information */}
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card p-6">
                <h3 className="erp-section-title">Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="erp-label">Select Customer</label>
                    <Field as="select" name="customer_id" className="erp-select">
                      <option value="">Select Customer</option>
                      {customers.map(c => (
                        <option key={c._id || c.id} value={c.entity_id || c._id || c.id}>
                          {c.customer_name || c.name}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="customer_id" component="div" className="text-xs text-destructive mt-1" />
                  </div>
                  <div><label className="erp-label">Mobile Number</label><input className="erp-input bg-muted/30" value={selectedCustomer?.mobile_number || ''} readOnly /></div>
                  <div><label className="erp-label">Email</label><input className="erp-input bg-muted/30" value={selectedCustomer?.email || ''} readOnly /></div>
                  <div className="sm:col-span-2"><label className="erp-label">Address</label><input className="erp-input bg-muted/30" value={selectedCustomer?.address || ''} readOnly /></div>
                </div>
              </motion.section>

              {/* Vehicle Details */}
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="erp-card p-6">
                <h3 className="erp-section-title">Vehicle Selection</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="erp-label">Select Vehicle (Available Only)</label>
                    <select className="erp-select" name="vehicle_inventory_id" value={values.vehicle_inventory_id} onChange={handleVehicleChange}>
                      <option value="">{availableVehicles.length > 0 ? 'Select Vehicle' : 'No available stock found'}</option>
                      {availableVehicles.map(v => (
                        <option key={v.entity_id || v._id || v.id} value={v.entity_id || v._id || v.id}>
                          {v.brand} {v.model} {v.variant} — {v.color} [VIN: {v.chassis_number}]
                        </option>
                      ))}
                    </select>
                    <ErrorMessage name="vehicle_inventory_id" component="div" className="text-xs text-destructive mt-1" />
                  </div>
                  {selectedVehicle && (
                    <>
                      <div><label className="erp-label">Fuel Type</label><input className="erp-input bg-muted/30" value={selectedVehicle.fuel_type} readOnly /></div>
                      <div><label className="erp-label">Color</label><input className="erp-input bg-muted/30" value={selectedVehicle.color} readOnly /></div>
                      <div><label className="erp-label">Chassis Number</label><input className="erp-input bg-muted/30 font-mono" value={selectedVehicle.chassis_number} readOnly /></div>
                      <div><label className="erp-label">Engine Number</label><input className="erp-input bg-muted/30 font-mono" value={selectedVehicle.engine_number} readOnly /></div>
                    </>
                  )}
                </div>
              </motion.section>

              {/* Sales Details */}
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="erp-card p-6">
                <h3 className="erp-section-title">Sales Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="erp-label">Salesperson</label>
                    <Field as="select" name="salesperson_id" className="erp-select">
                      <option value="">Select Salesperson</option>
                      {salespersons.map(s => (
                        <option key={s.entity_id || s._id || s.id} value={s.entity_id || s._id || s.id}>
                          {s.full_name || s.name} — {s.branch_id || s.branch || 'N/A'}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="salesperson_id" component="div" className="text-xs text-destructive mt-1" />
                  </div>
                  <div>
                    <label className="erp-label">Sale Date</label>
                    <Field type="date" name="sale_date" className="erp-input" />
                    <ErrorMessage name="sale_date" component="div" className="text-xs text-destructive mt-1" />
                  </div>
                  <div>
                    <label className="erp-label">Expected Delivery Date</label>
                    <Field type="date" name="delivery_date" className="erp-input" />
                    <ErrorMessage name="delivery_date" component="div" className="text-xs text-destructive mt-1" />
                  </div>
                </div>
              </motion.section>

              {/* Payment Calculation */}
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="erp-card p-6">
                <h3 className="erp-section-title">Payment Calculation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="erp-label">Vehicle Price</label><Field type="number" name="vehicle_price" className="erp-input tabular font-semibold" readOnly /></div>
                  <div><label className="erp-label">Registration Charges</label><Field type="number" name="registration_charges" className="erp-input tabular" /></div>
                  <div><label className="erp-label">Insurance</label><Field type="number" name="insurance" className="erp-input tabular" /></div>
                  <div><label className="erp-label">Accessories</label><Field type="number" name="accessories" className="erp-input tabular" /></div>
                </div>
              </motion.section>

              {/* Payment Section */}
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="erp-card p-6">
                <h3 className="erp-section-title">Down Payment & Loan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="erp-label">Down Payment</label><Field type="number" name="down_payment" className="erp-input tabular" /></div>
                  <div><label className="erp-label">Loan Amount</label><Field type="number" name="loan_amount" className="erp-input tabular" /></div>
                  <div className="sm:col-span-2">
                    <label className="erp-label text-primary font-bold">Balance Amount Due</label>
                    <input className="erp-input tabular font-bold text-lg bg-primary/5 border-primary/20 text-primary" value={formatCurrency(values.balance_amount)} readOnly />
                  </div>
                </div>
              </motion.section>
            </div>

            {/* Right: Financial Summary (Sticky) */}
            <div className="col-span-12 lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:sticky lg:top-8 p-6 bg-foreground text-background rounded-xl shadow-xl overflow-hidden relative"
              >
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  Order Summary
                </h3>
                
                <div className="space-y-4 tabular text-sm relative z-10">
                  <div className="flex justify-between items-center opacity-70">
                    <span>Vehicle Base Price</span>
                    <span className="font-semibold">{formatCurrency(values.vehicle_price)}</span>
                  </div>
                  <div className="flex justify-between items-center opacity-70">
                    <span>Registration & Tax</span>
                    <span className="font-semibold text-green-400">+ {formatCurrency(values.registration_charges)}</span>
                  </div>
                  <div className="flex justify-between items-center opacity-70">
                    <span>Insurance Premium</span>
                    <span className="font-semibold text-green-400">+ {formatCurrency(values.insurance)}</span>
                  </div>
                  <div className="flex justify-between items-center opacity-70">
                    <span>Added Accessories</span>
                    <span className="font-semibold text-green-400">+ {formatCurrency(values.accessories)}</span>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-background/10 flex justify-between items-end">
                    <div>
                      <span className="block text-[10px] uppercase tracking-widest opacity-50 font-black">Grand Total</span>
                      <span className="text-2xl font-black text-primary">{formatCurrency(values.total_amount)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs opacity-60">
                      <span>Total Paid (DP + Loan)</span>
                      <span>- {formatCurrency(Number(values.down_payment) + Number(values.loan_amount))}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-base border-t border-background/10 pt-3 text-white">
                      <span>Amount Receivable</span>
                      <span>{formatCurrency(values.balance_amount)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3 relative z-10">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" /> Confirm & Generate SO
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={handleSavePrintDraft}
                    className="w-full py-4 border border-background/20 hover:bg-background/5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Save & Print Draft
                  </button>
                </div>

                {/* Status Badge */}
                <div className="mt-6 pt-6 border-t border-background/10 text-center">
                  <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 block mb-1">Current Order Status</span>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-yellow-500/30">
                    {values.status}
                  </span>
                </div>
              </motion.div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default SalesOrderPage;
