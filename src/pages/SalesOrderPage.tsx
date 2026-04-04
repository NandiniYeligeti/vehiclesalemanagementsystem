import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Save, Loader2, Eye, FileText, Search, Plus, List, X, Mail } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getCustomersAction } from '@/store/ducks/customers.ducks';
import { getSalespersonsAction } from '@/store/ducks/salespersons.ducks';
import { getVehicleInventoryAction } from '@/store/ducks/vehicle_inventory.ducks';
import { addSalesOrderAction, getSalesOrdersAction } from '@/store/ducks/sales_orders.ducks';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  discount_type: Yup.string(),
  discount_value: Yup.number().min(0),
  discount_reason: Yup.string(),
  down_payment: Yup.number().min(0),
  loan_amount: Yup.number().min(0),
});

const SalesOrderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: customers = [] } = useSelector((state: RootState) => state.customers || { data: [] });
  const { data: salespersons = [] } = useSelector((state: RootState) => state.salespersons || { data: [] });
  const { data: inventory = [] } = useSelector((state: RootState) => state.vehicleInventory || { data: [] });
  const { data: salesOrders = [], loading: ordersLoading } = useSelector((state: RootState) => state.salesOrders || { data: [], loading: false });

  useEffect(() => {
    if (companyCode) {
      dispatch(getCustomersAction(companyCode));
      dispatch(getSalespersonsAction(companyCode));
      dispatch(getVehicleInventoryAction(companyCode));
      dispatch(getSalesOrdersAction(companyCode));
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
    discount_type: 'Percentage',
    discount_value: 0,
    discount_reason: '',
    discount_amount: 0,
    total_amount: 0,
    down_payment: 0,
    loan_amount: 0,
    balance_amount: 0,
    payment_type: 'Full Payment',
    payment_mode: '',
    status: 'Confirmed'
  });

  const filteredOrders = useMemo(() => {
    return salesOrders.filter(order => {
      const customer = customers.find(c => (c.entity_id || c._id || c.id) === order.customer_id);
      const vehicle = inventory.find(v => (v.entity_id || v._id || v.id) === order.vehicle_inventory_id);
      const searchStr = `${customer?.customer_name || ''} ${vehicle?.model || ''} ${order.sales_order_code || ''}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [salesOrders, customers, inventory, searchTerm]);

  const handlePrint = (order: any) => {
    const customer = customers.find(c => (c.entity_id || c._id || c.id) === order.customer_id);
    const vehicle = inventory.find(v => (v.entity_id || v._id || v.id) === order.vehicle_inventory_id);
    const salesperson = salespersons.find(s => (s.entity_id || s._id || s.id) === order.salesperson_id);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Sales Order - ${order.sales_order_code || 'Draft'}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #2563eb; }
            .order-info { text-align: right; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 12px; color: #666; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 12px; border-bottom: 2px solid #eee; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .totals { margin-top: 30px; margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { font-size: 20px; font-weight: bold; color: #2563eb; border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${user?.company_name || 'VEHICLE ERP'}</h1>
              <p>${companyCode} | Main Branch</p>
            </div>
            <div class="order-info">
              <h2>SALES ORDER</h2>
              <p><strong>Order #:</strong> ${order.sales_order_code || 'DRAFT'}</p>
              <p><strong>Date:</strong> ${new Date(order.sale_date).toLocaleDateString()}</p>
            </div>
          </div>

          <div class="grid">
            <div>
              <div class="section-title">Customer Details</div>
              <p><strong>${order.customer_name || 'N/A'}</strong></p>
              <p>${order.mobile_number || ''}</p>
              <p>${order.address || ''}</p>
              <p>${order.email || ''}</p>
            </div>
            <div>
              <div class="section-title">Vehicle Details</div>
              <p><strong>${order.brand || ''} ${order.model || ''}</strong></p>
              <p>Variant: ${order.variant || ''}</p>
              <p>Color: ${order.color || ''}</p>
              <p>VIN: ${order.chassis_number || ''}</p>
              <p>Engine: ${order.engine_number || ''}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Vehicle Price</td>
                <td style="text-align: right;">${formatCurrency(order.vehicle_price)}</td>
              </tr>
              <tr>
                <td>Registration & Road Tax</td>
                <td style="text-align: right;">${formatCurrency(order.registration_charges)}</td>
              </tr>
              <tr>
                <td>Insurance Premium</td>
                <td style="text-align: right;">${formatCurrency(order.insurance)}</td>
              </tr>
              <tr>
                <td>Accessories</td>
                <td style="text-align: right;">${formatCurrency(order.accessories)}</td>
              </tr>
              ${order.discount_amount > 0 ? `
              <tr>
                <td style="color: green; font-weight: bold;">Discount (${order.discount_type})</td>
                <td style="text-align: right; color: green; font-weight: bold;">- ${formatCurrency(order.discount_amount)}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row"><span>Sub Total:</span><span>${formatCurrency(order.total_amount)}</span></div>
            <div class="total-row"><span>Down Payment:</span><span>- ${formatCurrency(order.down_payment)}</span></div>
            <div class="total-row"><span>Loan Amount:</span><span>- ${formatCurrency(order.loan_amount)}</span></div>
            <div class="total-row grand-total"><span>Net Payable:</span><span>${formatCurrency(order.balance_amount)}</span></div>
          </div>

          <div style="margin-top: 100px; display: flex; justify-content: space-between;">
            <div style="text-align: center; border-top: 1px solid #333; width: 200px; padding-top: 10px;">Customer Signature</div>
            <div style="text-align: center; border-top: 1px solid #333; width: 200px; padding-top: 10px;">Authorized Signatory</div>
          </div>

          <script>window.print(); window.close();</script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-2xl w-fit border border-border">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:bg-card/50'}`}
        >
          <List className="w-4 h-4" /> Order History
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'create' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:bg-card/50'}`}
        >
          <Plus className="w-4 h-4" /> Create New Order
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by order code, customer or vehicle..."
                className="erp-input pl-10 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {ordersLoading && <div className="animate-spin text-primary"><Loader2 className="w-5 h-5" /></div>}
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Details</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Amount</th>
                    <th className="text-center px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                    const customer = customers.find(c => (c.entity_id || c._id || c.id) === order.customer_id);
                    const vehicle = inventory.find(v => (v.entity_id || v._id || v.id) === order.vehicle_inventory_id);
                    
                    return (
                      <tr key={order.entity_id || order._id || order.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-primary">{order.sales_order_code || 'DRAFT'}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{new Date(order.sale_date).toLocaleDateString()}</span>
                            <span className="text-[9px] uppercase font-bold text-orange-500">{order.payment_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground/90">{customer?.customer_name || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">{customer?.mobile_number || ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{vehicle?.brand} {vehicle?.model}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{vehicle?.chassis_number || ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right tabular font-bold text-foreground">
                          {formatCurrency(order.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            order.status === 'Confirmed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                            order.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => { setSelectedOrder(order); setShowViewModal(true); }}
                              className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all group/btn hover:scale-110 active:scale-95" title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handlePrint(order)}
                              className="p-2 rounded-lg hover:bg-orange-500/10 text-orange-500 transition-all hover:scale-110 active:scale-95" title="Print Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-all hover:scale-110 active:scale-95" title="Email Order"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                        No sales orders found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      ) : (
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
                toast.success('Sales Order Created Successfully!');
                resetForm();
                setActiveTab('list');
              },
              () => setSubmitting(false)
            ));
          }}
        >
          {({ values, setFieldValue, isSubmitting, resetForm }) => {
            const { vehicle_price, registration_charges, insurance, accessories, down_payment, loan_amount, discount_type, discount_value, payment_type } = values;
            
            const discount_amount = useMemo(() => {
              if (discount_type === 'Percentage') {
                return (Number(vehicle_price) * Number(discount_value)) / 100;
              }
              return Number(discount_value);
            }, [vehicle_price, discount_type, discount_value]);

            const subtotal = Number(vehicle_price) + Number(registration_charges) + Number(insurance) + Number(accessories);
            const total = subtotal - discount_amount;

            useEffect(() => {
              if (payment_type === 'Full Payment') {
                setFieldValue('down_payment', total);
                setFieldValue('loan_amount', 0);
              }
            }, [payment_type, total, setFieldValue]);

            const balance = total - Number(down_payment) - Number(loan_amount);

            useEffect(() => {
              setFieldValue('discount_amount', discount_amount);
              setFieldValue('total_amount', total);
              setFieldValue('balance_amount', balance);
            }, [discount_amount, total, balance, setFieldValue]);

            const selectedCustomer = (customers || []).find(c => (c.entity_id || c._id || c.id) === values.customer_id);
            const selectedVehicle = (inventory || []).find(v => (v.entity_id || v._id || v.id) === values.vehicle_inventory_id);

            const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
              const vId = e.target.value;
              setFieldValue('vehicle_inventory_id', vId);
              const vehicle = (inventory || []).find(v => (v.entity_id || v._id || v.id) === vId);
              if (vehicle) {
                setFieldValue('vehicle_price', vehicle.selling_price || vehicle.base_price || 0);
              }
            };

            return (
              <Form className="grid grid-cols-12 gap-6 lg:gap-8">
                <div className="col-span-12 lg:col-span-8 space-y-6">
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
                      </div>
                      <div>
                        <label className="erp-label">Expected Delivery Date</label>
                        <Field type="date" name="delivery_date" className="erp-input" />
                      </div>
                    </div>
                  </motion.section>

                  <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="erp-card p-6">
                    <h3 className="erp-section-title">Payment Calculation</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="erp-label">Vehicle Price</label><Field type="number" name="vehicle_price" className="erp-input tabular font-semibold" readOnly /></div>
                      <div><label className="erp-label">Registration Charges</label><Field type="number" name="registration_charges" className="erp-input tabular" /></div>
                      <div><label className="erp-label">Insurance</label><Field type="number" name="insurance" className="erp-input tabular" /></div>
                      <div><label className="erp-label">Accessories</label><Field type="number" name="accessories" className="erp-input tabular" /></div>
                    </div>
                  </motion.section>

                  <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="erp-card p-6">
                    <h3 className="erp-section-title">Discount Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="erp-label">Discount Type</label>
                          <Field as="select" name="discount_type" className="erp-select">
                            <option value="Percentage">Percentage (%)</option>
                            <option value="Fixed">Fixed Amount (₹)</option>
                          </Field>
                        </div>
                        <div className="flex-1">
                          <label className="erp-label">Value</label>
                          <Field type="number" name="discount_value" className="erp-input tabular" />
                        </div>
                      </div>
                      <div>
                        <label className="erp-label">Select Reason</label>
                        <Field as="select" name="discount_reason" className="erp-select">
                          <option value="">Select Reason</option>
                          <option value="Festival Offer">Festival Offer</option>
                          <option value="Corporate Discount">Corporate Discount</option>
                          <option value="Loyalty Reward">Loyalty Reward</option>
                          <option value="Employee Referral">Employee Referral</option>
                          <option value="Manager Approval">Manager Approval</option>
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        {values.discount_amount > 0 && (
                          <div className="text-sm font-bold text-green-500 animate-pulse">
                            You saved {formatCurrency(values.discount_amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.section>

                  <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="erp-card p-6">
                    <h3 className="erp-section-title">Vehicle Payment</h3>
                    <div className="space-y-6">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="payment_type"
                            value="Full Payment"
                            checked={values.payment_type === 'Full Payment'}
                            onChange={() => setFieldValue('payment_type', 'Full Payment')}
                            className="w-4 h-4 text-primary bg-muted border-border focus:ring-primary focus:ring-offset-0"
                          />
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">Full Payment</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="payment_type"
                            value="Down Payment + Loan"
                            checked={values.payment_type === 'Down Payment + Loan'}
                            onChange={() => setFieldValue('payment_type', 'Down Payment + Loan')}
                            className="w-4 h-4 text-primary bg-muted border-border focus:ring-primary focus:ring-offset-0"
                          />
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">Down Payment + Loan</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {values.payment_type === 'Full Payment' ? (
                          <>
                            <div>
                              <label className="erp-label">Total Vehicle Cost</label>
                              <input className="erp-input bg-muted/30 tabular font-bold" value={total} readOnly />
                            </div>
                            <div>
                              <label className="erp-label">Mode of Payment</label>
                              <Field as="select" name="payment_mode" className="erp-select">
                                <option value="">Select payment mode</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="UPI">UPI / Digital</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                              </Field>
                            </div>
                          </>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="erp-label">Down Payment</label><Field type="number" name="down_payment" className="erp-input tabular" /></div>
                            <div><label className="erp-label">Loan Amount/Finance</label><Field type="number" name="loan_amount" className="erp-input tabular" /></div>
                            <div>
                              <label className="erp-label">Down Payment Mode</label>
                              <Field as="select" name="payment_mode" className="erp-select">
                                <option value="">Select payment mode</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="UPI">UPI / Digital</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                              </Field>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-muted/20 rounded-xl p-4 space-y-2 border border-border/50">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-bold">{formatCurrency(total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{values.payment_type === 'Full Payment' ? 'Paid Fully:' : 'Total Amount (DP + Loan):'}</span>
                          <span className="font-bold text-primary">{formatCurrency(Number(values.down_payment) + Number(values.loan_amount))}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Payment Mode:</span>
                          <span className="font-bold">{values.payment_mode || '-'}</span>
                        </div>
                      </div>

                      {values.payment_type === 'Down Payment + Loan' && (
                        <div>
                          <label className="erp-label text-primary font-bold">Balance Amount Due</label>
                          <input className="erp-input tabular font-bold text-lg bg-primary/5 border-primary/20 text-primary" value={formatCurrency(values.balance_amount)} readOnly />
                        </div>
                      )}
                    </div>
                  </motion.section>
                </div>

                <div className="col-span-12 lg:col-span-4">
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:sticky lg:top-8 p-6 bg-foreground text-background rounded-xl shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><div className="w-1.5 h-6 bg-primary rounded-full" />Order Summary</h3>
                    
                    <div className="space-y-4 tabular text-sm relative z-10">
                      <div className="flex justify-between items-center opacity-70"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                      {values.discount_amount > 0 && (
                        <div className="flex justify-between items-center text-green-400 font-bold">
                          <span>Discount</span>
                          <span>- {formatCurrency(values.discount_amount)}</span>
                        </div>
                      )}
                      
                      <div className="pt-4 mt-2 border-t border-background/10">
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="block text-[10px] uppercase tracking-widest opacity-50 font-black mb-1">Final Total</span>
                            <span className="text-2xl font-black text-primary">{formatCurrency(values.total_amount)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center text-xs opacity-60"><span>Total Paid (DP + Loan)</span><span>- {formatCurrency(Number(values.down_payment) + Number(values.loan_amount))}</span></div>
                        <div className="flex justify-between items-center font-bold text-base border-t border-background/10 pt-3 text-white"><span>Balance Due</span><span>{formatCurrency(values.balance_amount)}</span></div>
                      </div>
                    </div>

                    <div className="mt-8 space-y-3 relative z-10">
                      <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Confirm & Generate SO</>}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </Form>
            );
          }}
        </Formik>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                <div>
                  <h3 className="text-xl font-bold">Order Details: {selectedOrder.sales_order_code || 'Draft'}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(selectedOrder.sale_date).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Customer</h4>
                    <p className="font-bold">{selectedOrder.customer_name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.mobile_number || ''}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.email || ''}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Vehicle</h4>
                    <p className="font-bold">{selectedOrder.brand} {selectedOrder.model}</p>
                    <p className="text-sm text-muted-foreground">Variant: {selectedOrder.variant}</p>
                    <p className="text-sm text-muted-foreground">VIN: {selectedOrder.chassis_number}</p>
                  </div>
                </div>

                <div className="bg-muted/10 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between border-b border-border pb-2"><span className="text-sm">Vehicle Price</span><span className="font-bold">{formatCurrency(selectedOrder.vehicle_price)}</span></div>
                  <div className="flex justify-between border-b border-border pb-2"><span className="text-sm">Reg. Charges</span><span className="font-bold">+ {formatCurrency(selectedOrder.registration_charges)}</span></div>
                  <div className="flex justify-between border-b border-border pb-2"><span className="text-sm">Insurance</span><span className="font-bold">+ {formatCurrency(selectedOrder.insurance)}</span></div>
                  <div className="flex justify-between border-b border-border pb-2"><span className="text-sm">Accessories</span><span className="font-bold">+ {formatCurrency(selectedOrder.accessories)}</span></div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between border-b border-border pb-2 text-green-500 font-bold">
                      <span className="text-sm">Discount ({selectedOrder.discount_type})</span>
                      <span>- {formatCurrency(selectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2"><span className="text-lg font-black uppercase text-primary">Grand Total</span><span className="text-xl font-black text-primary">{formatCurrency(selectedOrder.total_amount)}</span></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg text-center"><span className="block text-[10px] uppercase text-muted-foreground mb-1">Down Payment</span><span className="font-bold">{formatCurrency(selectedOrder.down_payment)}</span></div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center"><span className="block text-[10px] uppercase text-muted-foreground mb-1">Loan Amount</span><span className="font-bold">{formatCurrency(selectedOrder.loan_amount)}</span></div>
                  <div className="p-3 bg-primary/10 rounded-lg text-center"><span className="block text-[10px] uppercase text-primary mb-1">Receivable</span><span className="font-bold text-primary">{formatCurrency(selectedOrder.balance_amount)}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg"><span className="block text-[10px] uppercase text-muted-foreground mb-1">Payment Type</span><span className="font-bold">{selectedOrder.payment_type}</span></div>
                  <div className="p-3 bg-muted/30 rounded-lg"><span className="block text-[10px] uppercase text-muted-foreground mb-1">Payment Mode</span><span className="font-bold">{selectedOrder.payment_mode || 'N/A'}</span></div>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-muted/20 flex gap-3">
                <button onClick={() => handlePrint(selectedOrder)} className="flex-1 erp-btn-secondary flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print Document</button>
                <button onClick={() => setShowViewModal(false)} className="px-6 py-2.5 bg-card hover:bg-muted font-bold rounded-xl transition-colors">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesOrderPage;

