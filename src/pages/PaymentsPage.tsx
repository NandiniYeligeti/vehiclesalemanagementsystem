import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Printer, X, Loader2, Eye, Download, Mail, Trash2, AlertTriangle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { getCustomersAction } from '@/store/ducks/customers.ducks';
import { getSalespersonsAction } from '@/store/ducks/salespersons.ducks';
import { getSalesOrdersAction } from '@/store/ducks/sales_orders.ducks';
import { getPaymentsAction, addPaymentAction, deletePaymentAction, resendPaymentEmailAction, previewPaymentEmailAction } from '@/store/ducks/payments.ducks';
import EmailPreviewModal from '@/components/EmailPreviewModal';
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
  const [emailPreview, setEmailPreview] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [currentEmailId, setCurrentEmailId] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const { data: payments = [], loading: paymentsLoading, saving } = useSelector((state: RootState) => state.payments);
  const { data: customers = [] } = useSelector((state: RootState) => state.customers);
  const { data: salespersons = [] } = useSelector((state: RootState) => state.salespersons);
  const { data: salesOrders = [] } = useSelector((state: RootState) => state.salesOrders);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => (c.entity_id || c._id || c.id) === customerId);
    return customer?.customer_name || customer?.name || 'Unknown';
  };

  useEffect(() => {
    if (companyCode) {
      dispatch(getPaymentsAction(companyCode));
      dispatch(getCustomersAction(companyCode));
      dispatch(getSalespersonsAction(companyCode));
      dispatch(getSalesOrdersAction(companyCode));
    }
  }, [dispatch, companyCode]);

  const handleOpenEmailPreview = (payment: any) => {
    const id = payment.entity_id || payment._id || payment.id;
    setCurrentEmailId(id);
    dispatch(previewPaymentEmailAction(companyCode, id, (preview: any) => {
      setEmailPreview(preview);
      setShowEmailModal(true);
    }));
  };

  const handleConfirmSendEmail = () => {
    if (!currentEmailId) return;
    setIsEmailSending(true);
    dispatch(resendPaymentEmailAction(companyCode, currentEmailId, () => {
      setIsEmailSending(false);
      setShowEmailModal(false);
      toast.success('Payment receipt email sent to customer!');
      dispatch(getPaymentsAction(companyCode));
    }));
  };

  const handlePrint = (p: any) => {
    const customer = customers.find(c => (c.entity_id || c._id || c.id) === p.customer_id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = `
      <html><head><title>Payment Receipt - ${p.payment_code}</title>
      <style>body{font-family:sans-serif;padding:40px;color:#333}h1{color:#2563eb}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}.total{font-size:20px;font-weight:bold;color:#2563eb}@media print{.no-print{display:none}}</style>
      </head><body>
      <h1>Payment Receipt</h1><p>${p.payment_code}</p>
      <div class="row"><span>Customer</span><span>${customer?.customer_name || 'N/A'}</span></div>
      <div class="row"><span>Invoice</span><span>${p.invoice_number}</span></div>
      <div class="row"><span>Date</span><span>${formatDate(p.payment_date)}</span></div>
      <div class="row"><span>Mode</span><span>${p.payment_mode}</span></div>
      <div class="row"><span>Type</span><span>${p.payment_type}</span></div>
      <div class="row total"><span>Amount Paid</span><span>₹${(p.payment_amount || 0).toLocaleString('en-IN')}</span></div>
      <script>window.print();window.close();</script></body></html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleConfirmDelete = () => {
    if (!paymentToDelete) return;
    dispatch(deletePaymentAction(
      paymentToDelete,
      companyCode,
      () => {
        toast.success('Payment record deleted successfully');
        setPaymentToDelete(null);
      },
      () => {
        toast.error('Failed to delete payment');
        setPaymentToDelete(null);
      }
    ));
  };

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
      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center font-black text-xl">Delete Payment Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm font-medium">
              This will permanently remove this payment entry. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90 font-bold shadow-lg border-none"
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Invoice / SO</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Mode</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p._id || p.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4 font-bold text-primary">{p.payment_code}</td>
                  <td className="px-6 py-4 font-medium text-foreground">{getCustomerName(p.customer_id)}</td>
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
                  <td className="px-6 py-4 text-center">
                    {p.email_status ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          p.email_status === 'Sent' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
                          p.email_status === 'Failed' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
                          'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'}`} 
                        />
                        <span className={`text-[10px] font-bold ${
                          p.email_status === 'Sent' ? 'text-green-500' : 
                          p.email_status === 'Failed' ? 'text-red-500' : 
                          'text-yellow-600'}`}>
                          {p.email_status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50 italic px-2">Ready</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* Same action buttons as Sales Order */}
                    <div className="flex justify-end items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button title="View" className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors hover:scale-110 active:scale-95">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        title="Print"
                        onClick={() => handlePrint(p)}
                        className="p-1.5 hover:bg-orange-500/10 rounded-lg text-orange-500 transition-colors hover:scale-110 active:scale-95"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        title="Send Email"
                        onClick={() => handleOpenEmailPreview(p)}
                        className="p-1.5 hover:bg-blue-500/10 rounded-lg text-blue-500 transition-colors hover:scale-110 active:scale-95 border border-transparent hover:border-blue-500/20"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button title="Download" className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-emerald-500 transition-colors hover:scale-110 active:scale-95">
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => setPaymentToDelete(p.entity_id || p._id || p.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors hover:scale-110 active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!paymentsLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-20 text-muted-foreground italic font-medium">No payment records found.</td>
                </tr>
              )}
              {paymentsLoading && (
                <tr>
                  <td colSpan={10} className="text-center py-20 animate-pulse text-primary font-bold">Synchronizing financial ledger...</td>
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
                      toast.success('Payment recorded successfully!');
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
                            <><Plus className="w-4 h-4" /> Save Receipt</>
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
      <EmailPreviewModal 
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        previewData={emailPreview}
        onSend={handleConfirmSendEmail}
        isLoading={isEmailSending}
      />
    </div>
  );
};

export default PaymentsPage;
