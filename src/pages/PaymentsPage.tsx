import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Printer, X, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getCustomersAction } from '@/store/ducks/customers.ducks';
import { getSalespersonsAction } from '@/store/ducks/salespersons.ducks';
import { getSalesOrdersAction } from '@/store/ducks/sales_orders.ducks';
import { getPaymentsAction, addPaymentAction } from '@/store/ducks/payments.ducks';

const paymentSchema = Yup.object().shape({
  customer_id: Yup.string().required('Customer is required'),
  sales_order_id: Yup.string().required('Sales order is required'),
  invoice_number: Yup.string().required('Invoice number is required'),
  payment_date: Yup.string().required('Payment date is required'),
  payment_amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  payment_mode: Yup.string().required('Payment mode is required'),
  payment_type: Yup.string().required('Payment type is required'),
  collected_by: Yup.string().required('Collector is required'),
});

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

const PaymentsPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: payments = [], loading: paymentsLoading } = useSelector((state: RootState) => state.payments);
  const { data: customers = [] } = useSelector((state: RootState) => state.customers);
  const { data: salespersons = [] } = useSelector((state: RootState) => state.salespersons);
  const { data: salesOrders = [] } = useSelector((state: RootState) => state.salesOrders);

  useEffect(() => {
    if (companyCode) {
      dispatch(getPaymentsAction(companyCode));
      dispatch(getCustomersAction(companyCode));
      dispatch(getSalespersonsAction(companyCode));
      dispatch(getSalesOrdersAction(companyCode));
    }
  }, [dispatch, companyCode]);

  const filtered = useMemo(() => {
    return (payments || []).filter(p =>
      (p.payment_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.remarks || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [payments, search]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center h-10 px-4 rounded-xl bg-card border border-border gap-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search receipts, invoices..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground font-medium" 
          />
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Receipt</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Invoice / SO</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Mode</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p._id || p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-primary">{p.payment_code}</td>
                  <td className="px-6 py-4 font-mono text-xs">{p.invoice_number}</td>
                  <td className="px-6 py-4 text-right tabular font-bold text-foreground">{formatCurrency(p.payment_amount)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(p.payment_date)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase">{p.payment_mode}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{p.payment_type}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
              {!paymentsLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-muted-foreground italic font-medium">No payment records found.</td>
                </tr>
              )}
              {paymentsLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-20 animate-pulse text-primary font-bold">Synchronizing financial ledger...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl ring-1 ring-border shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                <h3 className="text-lg font-bold">Record New Payment</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <Formik
                initialValues={{
                  company_id: companyCode,
                  branch_id: 'MAIN_BRANCH',
                  customer_id: '',
                  sales_order_id: '',
                  invoice_number: '',
                  payment_date: new Date().toISOString().split('T')[0],
                  payment_amount: 0,
                  payment_mode: 'UPI',
                  payment_type: 'Down Payment',
                  reference_number: '',
                  bank_name: '',
                  collected_by: '',
                  remarks: ''
                }}
                validationSchema={paymentSchema}
                onSubmit={(values, { setSubmitting }) => {
                  const payload = {
                    ...values,
                    payment_date: new Date(values.payment_date).toISOString()
                  };
                  dispatch(addPaymentAction(
                    payload,
                    companyCode,
                    () => {
                      setSubmitting(false);
                      setShowForm(false);
                      alert('Payment recorded successfully!');
                    },
                    () => setSubmitting(false)
                  ));
                }}
              >
                {({ values, setFieldValue, isSubmitting }) => {
                  const customerOrders = (salesOrders || []).filter(so => so.customer_id === values.customer_id);

                  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const cId = e.target.value;
                    setFieldValue('customer_id', cId);
                    setFieldValue('sales_order_id', '');
                    setFieldValue('invoice_number', '');
                  };

                  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const soId = e.target.value;
                    setFieldValue('sales_order_id', soId);
                    const order = salesOrders.find(so => (so.entity_id || so._id || so.id) === soId);
                    if (order) {
                      setFieldValue('invoice_number', order.sales_order_code || order.orderNumber || '');
                    }
                  };

                  return (
                    <Form className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="erp-label">Select Customer</label>
                          <select className="erp-select" name="customer_id" value={values.customer_id} onChange={handleCustomerChange}>
                            <option value="">Select Customer</option>
                            {customers.map(c => <option key={c._id || c.id} value={c.entity_id || c._id || c.id}>{c.customer_name || c.name}</option>)}
                          </select>
                          <ErrorMessage name="customer_id" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                        <div>
                          <label className="erp-label">Sales Order / Invoice</label>
                          <select className="erp-select" name="sales_order_id" value={values.sales_order_id} onChange={handleOrderChange} disabled={!values.customer_id}>
                            <option value="">Select Order</option>
                            {customerOrders.map(so => (
                              <option key={so._id || so.id} value={so.entity_id || so._id || so.id}>
                                {so.sales_order_code || so.orderNumber} ({formatCurrency(so.balance_amount)} Due)
                              </option>
                            ))}
                          </select>
                          <ErrorMessage name="sales_order_id" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                        <div>
                          <label className="erp-label">Payment Date</label>
                          <Field type="date" name="payment_date" className="erp-input h-10" />
                          <ErrorMessage name="payment_date" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                        <div>
                          <label className="erp-label">Amount Paid (₹)</label>
                          <Field type="number" name="payment_amount" className="erp-input h-10 font-bold tabular" />
                          <ErrorMessage name="payment_amount" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                        <div>
                          <label className="erp-label">Payment Mode</label>
                          <Field as="select" name="payment_mode" className="erp-select h-10">
                            {['UPI', 'Cash', 'Bank Transfer', 'Cheque', 'Card'].map(m => <option key={m} value={m}>{m}</option>)}
                          </Field>
                        </div>
                        <div>
                          <label className="erp-label">Payment Type</label>
                          <Field as="select" name="payment_type" className="erp-select h-10">
                            {['Down Payment', 'Balance Payment', 'Accessories', 'Full Payment'].map(t => <option key={t} value={t}>{t}</option>)}
                          </Field>
                        </div>
                        <div>
                          <label className="erp-label">Reference Number</label>
                          <Field name="reference_number" className="erp-input h-10 font-mono" placeholder="UTR / Check No" />
                        </div>
                        <div>
                          <label className="erp-label">Collected By</label>
                          <Field as="select" name="collected_by" className="erp-select h-10">
                            <option value="">Select Salesperson</option>
                            {salespersons.map(s => <option key={s._id || s.id} value={s.entity_id || s._id || s.id}>{s.full_name || s.name}</option>)}
                          </Field>
                          <ErrorMessage name="collected_by" component="div" className="text-xs text-destructive mt-1 font-medium" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="erp-label">Remarks</label>
                          <Field as="textarea" name="remarks" className="erp-input h-20 resize-none py-2" placeholder="Note on payment..." />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
                        <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-xl text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
                        <button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4" /> Save Receipt
                            </>
                          )}
                        </button>
                      </div>
                    </Form>
                  );
                }}
              </Formik>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentsPage;
