import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Printer, X, Loader2, Eye, Download, Mail, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { getCustomersAction } from '@/store/ducks/customers.ducks';
import { getSalespersonsAction } from '@/store/ducks/salespersons.ducks';
import { getSalesOrdersAction } from '@/store/ducks/sales_orders.ducks';
import { getPaymentsAction, addPaymentAction, deletePaymentAction, resendPaymentEmailAction, previewPaymentEmailAction } from '@/store/ducks/payments.ducks';
import { getCompanySettingsAction } from '@/store/ducks/company.ducks';
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
import { usePermissions } from '@/hooks/usePermissions';

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
  const { user } = useSelector((state: RootState) => state.auth);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';
  const { hasPermission, getFilteredData } = usePermissions();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [emailPreview, setEmailPreview] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [currentEmailId, setCurrentEmailId] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const { data: payments = [], loading: paymentsLoading, saving } = useSelector((state: RootState) => state.payments);
  const { settings } = useSelector((state: RootState) => state.company);
  
  const rawCustomers = useSelector((state: RootState) => state.customers?.data || []);
  const customers = useMemo(() => getFilteredData(rawCustomers, 'showroom'), [rawCustomers, getFilteredData]);

  const rawSalespersons = useSelector((state: RootState) => state.salespersons?.data || []);
  const salespersons = useMemo(() => getFilteredData(rawSalespersons, 'branch'), [rawSalespersons, getFilteredData]);

  const { data: salesOrders = [] } = useSelector((state: RootState) => state.salesOrders);

  useEffect(() => {
    if (companyCode) {
      dispatch(getPaymentsAction(companyCode));
      dispatch(getCustomersAction(companyCode));
      dispatch(getSalesOrdersAction(companyCode));
      dispatch(getSalespersonsAction(companyCode));
      dispatch(getCompanySettingsAction(companyCode));
    }
  }, [dispatch, companyCode]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => (c.entity_id || c._id || c.id) === customerId);
    return customer?.customer_name || customer?.name || 'Unknown';
  };

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
      toast.success('Payment receipt email sent successfully!');
      dispatch(getPaymentsAction(companyCode));
    }));
  };

  const handlePrint = (p: any) => {
    const customer = customers.find(c => (c.entity_id || c._id || c.id) === p.customer_id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoUrl = settings?.logo_url 
      ? (settings.logo_url.startsWith('http') ? settings.logo_url : `http://localhost:4001/${settings.logo_url}`)
      : '';

    const content = `
      <html>
        <head>
          <title>Payment Receipt - ${p.payment_code}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .receipt-container { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 8px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .company-logo { height: 60px; margin-bottom: 15px; }
            .company-info h1 { margin: 0; color: #2563eb; font-size: 24px; }
            .receipt-info { text-align: right; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 12px; color: #666; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f9f9f9; }
            .total-row { display: flex; justify-content: space-between; padding: 15px 0; margin-top: 20px; border-top: 2px solid #eee; font-size: 20px; font-weight: bold; color: #2563eb; }
            @media print { .no-print { display: none; } body { padding: 0; } .receipt-container { border: none; } }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="company-info">
                ${logoUrl ? `<img src="${logoUrl}" class="company-logo" alt="Logo" />` : ''}
                <h1>${settings?.company_name || user?.company_name || 'VEHICLE ERP'}</h1>
                <p>${companyCode} | Payment Receipt</p>
              </div>
              <div class="receipt-info">
                <h2 style="margin-top: 0;">RECEIPT</h2>
                <p><strong>No:</strong> ${p.payment_code}</p>
                <p><strong>Date:</strong> ${formatDate(p.payment_date)}</p>
              </div>
            </div>

            <div class="grid">
              <div>
                <div class="section-title">Customer Details</div>
                <p><strong>${customer?.customer_name || 'N/A'}</strong></p>
                <p>${customer?.mobile_number || ''}</p>
                <p>${customer?.email || ''}</p>
              </div>
              <div>
                <div class="section-title">Reference Details</div>
                <p><strong>Invoice/SO:</strong> ${p.invoice_number}</p>
                <p><strong>Category:</strong> ${p.payment_type}</p>
                <p><strong>Mode:</strong> ${p.payment_mode}</p>
                ${p.reference_number ? `<p><strong>Ref No:</strong> ${p.reference_number}</p>` : ''}
              </div>
            </div>

            <div style="margin-top: 40px;">
              <div class="section-title">Payment Summary</div>
              <div class="row" style="font-weight: bold; color: #666;"><span>Description</span><span>Amount</span></div>
              <div class="row"><span>${p.payment_type} Credit</span><span>₹${(p.payment_amount || 0).toLocaleString('en-IN')}</span></div>
              <div class="total-row"><span>Total Amount Received</span><span>₹${(p.payment_amount || 0).toLocaleString('en-IN')}</span></div>
            </div>

            <div style="margin-top: 80px; display: flex; justify-content: space-between;">
              <div style="text-align: center; border-top: 1px solid #333; width: 240px; padding-top: 10px; font-size: 12px;">Customer Signature</div>
              <div style="text-align: center; border-top: 1px solid #333; width: 240px; padding-top: 10px; font-size: 12px;">Authorized Signatory</div>
            </div>

            <p style="margin-top: 60px; font-size: 10px; color: #999; text-align: center; font-style: italic;">This is a computer-generated receipt and does not require a physical signature.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
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
    const list = (payments || []).filter(p =>
      (p.payment_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.remarks || '').toLowerCase().includes(search.toLowerCase())
    );
    // Sort by date descending
    return [...list].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
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
        {hasPermission('payments', 'add') && (
          <button 
            onClick={() => setShowForm(true)} 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all font-bold"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        )}
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
                    <div className="flex justify-end items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      {hasPermission('payments', 'view') && (
                        <button 
                          title="View" 
                          onClick={() => { setSelectedPayment(p); setShowViewModal(true); }}
                          className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors hover:scale-110 active:scale-95"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('payments', 'view') && (
                        <button
                          title="Print"
                          onClick={() => handlePrint(p)}
                          className="p-2 hover:bg-orange-500/10 rounded-lg text-orange-500 transition-colors hover:scale-110 active:scale-95"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('payments', 'edit') && (
                        <button
                          title="Send Email"
                          onClick={() => handleOpenEmailPreview(p)}
                          className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-500 transition-colors hover:scale-110 active:scale-95 border border-transparent hover:border-blue-500/20"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('payments', 'delete') && (
                        <button 
                          title="Delete" 
                          onClick={() => setPaymentToDelete(p.entity_id || p._id || p.id)}
                          className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors hover:scale-110 active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
                        {values.payment_mode !== 'Cash' && (
                          <div>
                            <label className="erp-label">
                              {values.payment_mode === 'Cheque' ? 'Cheque Number' : 
                               values.payment_mode === 'UPI' ? 'UPI No' : 
                               values.payment_mode === 'Bank Transfer' ? 'Bank UTR No' : 
                               'Reference Number'}
                            </label>
                            <Field name="reference_number" className="erp-input h-10 font-mono" placeholder={
                               values.payment_mode === 'Cheque' ? 'Enter Check No' : 
                               values.payment_mode === 'UPI' ? 'Enter UPI No' : 
                               'UTR / Ref No'
                            } />
                          </div>
                        )}
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

      {/* View Payment Modal */}
      <AnimatePresence>
        {showViewModal && selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-border">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                <div>
                  <h3 className="text-xl font-bold">Payment Details: {selectedPayment.payment_code}</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedPayment.payment_date)}</p>
                </div>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2">Customer</h4>
                    <p className="font-bold text-lg">{getCustomerName(selectedPayment.customer_id)}</p>
                    <p className="text-sm text-muted-foreground">ID: {selectedPayment.customer_id?.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2">Reference</h4>
                    <p className="font-bold">{selectedPayment.invoice_number || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Type: {selectedPayment.payment_type}</p>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 shadow-inner">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-muted-foreground">Payment Amount</span>
                    <span className="text-2xl font-black text-primary tabular-nums">{formatCurrency(selectedPayment.payment_amount)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                    <div>
                      <p className="text-[9px] uppercase font-black text-primary/60 mb-1">Mode</p>
                      <p className="font-bold">{selectedPayment.payment_mode}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-black text-primary/60 mb-1">Status</p>
                      <p className="font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> COMPLETED</p>
                    </div>
                  </div>
                </div>

                {selectedPayment.reference_number && (
                  <div className="p-4 rounded-xl border border-dashed border-border bg-muted/5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Transaction Reference No.</p>
                    <p className="font-mono font-bold text-foreground tracking-tight">{selectedPayment.reference_number}</p>
                  </div>
                )}

                {selectedPayment.remarks && (
                  <div>
                    <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2">Remarks</h4>
                    <p className="text-sm text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-border/50">"{selectedPayment.remarks}"</p>
                  </div>
                )}

                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Collected By</p>
                    <p className="text-sm font-bold flex items-center gap-2">
                      {salespersons.find(s => (s.entity_id || s._id || s.id) === selectedPayment.collected_by)?.full_name || 'System Operator'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Email Status</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${selectedPayment.email_status === 'Sent' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                      {selectedPayment.email_status || 'NOT SENT'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-muted/20 flex gap-3">
                <button 
                  onClick={() => handlePrint(selectedPayment)} 
                  className="flex-1 erp-btn flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
                <button 
                  onClick={() => handleOpenEmailPreview(selectedPayment)} 
                  className="flex-1 erp-btn flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/20"
                >
                  <Mail className="w-4 h-4" /> Send Email
                </button>
                <button onClick={() => setShowViewModal(false)} className="px-6 py-3 bg-card hover:bg-muted font-bold rounded-xl transition-colors border border-border">Close</button>
              </div>
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
