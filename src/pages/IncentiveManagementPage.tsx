import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { getSalesOrdersAction, updateSalesOrderAction } from '@/store/ducks/sales_orders.ducks';
import { getSalespersonsAction } from '@/store/ducks/salespersons.ducks';
import { Search, Loader2, Edit2, CheckCircle2, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field } from 'formik';
import { toast } from 'sonner';

const IncentiveManagementPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const [tab, setTab] = useState<'Pending' | 'Paid' | 'History'>('Pending');
  const [search, setSearch] = useState('');
  const [editingIncentive, setEditingIncentive] = useState<any>(null);
  const [payingIncentive, setPayingIncentive] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const rawSalesOrders = useSelector((state: RootState) => state.salesOrders?.data);
  const salesOrders = Array.isArray(rawSalesOrders) ? rawSalesOrders : [];
  const loading = useSelector((state: RootState) => state.salesOrders?.loading);

  const rawSalespersons = useSelector((state: RootState) => state.salespersons?.data);
  const salespersons = Array.isArray(rawSalespersons) ? rawSalespersons : [];

  useEffect(() => {
    if (companyCode) {
      dispatch(getSalesOrdersAction(companyCode));
      dispatch(getSalespersonsAction(companyCode));
    }
  }, [dispatch, companyCode]);

  // Filter for incentives: only those with incentive_status
  const incentives = salesOrders.filter(so => so.incentive_status);

  // Filter by tab
  const filteredByTab = incentives.filter(so => {
    if (tab === 'History') return true;
    return so.incentive_status === tab;
  });

  // Filter by search
  const displayIncentives = tab === 'History' ? [] : filteredByTab.filter(so => {
    const sp = salespersons.find(s => (s.entity_id || s._id || s.id) === so.salesperson_id);
    const spName = so.salesperson_name || sp?.full_name || sp?.name || 'Unknown';
    return (
      so.sales_order_code?.toLowerCase().includes(search.toLowerCase()) ||
      so.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      spName.toLowerCase().includes(search.toLowerCase()) ||
      so.model?.toLowerCase().includes(search.toLowerCase())
    );
  });

  let allLogs: any[] = [];
  if (tab === 'History') {
    salesOrders.forEach(so => {
      if (so.incentive_logs && Array.isArray(so.incentive_logs)) {
        so.incentive_logs.forEach((log: any) => {
          allLogs.push({
            ...log,
            sales_order_code: so.sales_order_code,
            salesperson_id: so.salesperson_id,
            salesperson_name: so.salesperson_name,
            customer_name: so.customer_name,
            vehicle: `${so.brand} ${so.model}`,
          });
        });
      }
    });
    // Sort logs descending by timestamp
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (search) {
      allLogs = allLogs.filter(log => 
         log.sales_order_code?.toLowerCase().includes(search.toLowerCase()) ||
         getSalespersonName(log.salesperson_id).toLowerCase().includes(search.toLowerCase()) ||
         log.action?.toLowerCase().includes(search.toLowerCase()) ||
         log.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
  }

  const getSalespersonName = (id: string, denormalizedName?: string) => {
    if (denormalizedName) return denormalizedName;
    const sp = salespersons.find(s => (s.entity_id || s._id || s.id) === id);
    return sp?.full_name || sp?.name || 'Unknown';
  };

  const handleMarkPaid = (id: string, paymentMethod: string, referenceNumber: string) => {
    setIsProcessing(id);
    dispatch(updateSalesOrderAction(
      id, 
      { 
        incentive_status: 'Paid', 
        incentive_payment_method: paymentMethod,
        incentive_reference_number: referenceNumber,
        company_id: companyCode 
      }, 
      () => {
        setIsProcessing(null);
        setPayingIncentive(null);
        toast.success('Incentive marked as paid');
      }, 
      () => {
        setIsProcessing(null);
        toast.error('Failed to update status');
      }
    ));
  };

  const handleDeleteIncentive = (id: string) => {
    if (!window.confirm('Are you sure you want to move this incentive back to Pending? The incentive data will be preserved.')) return;
    setIsProcessing(id);
    dispatch(updateSalesOrderAction(
      id,
      {
        incentive_status: 'Pending',
        incentive_payment_method: '',
        incentive_reference_number: '',
        company_id: companyCode
      },
      () => {
        setIsProcessing(null);
        toast.success('Incentive moved back to Pending');
      },
      () => {
        setIsProcessing(null);
        toast.error('Failed to update status');
      }
    ));
  };

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Incentive Management</h2>
      </div>

      <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        <button onClick={() => setTab('Pending')} className={`px-4 py-2 rounded-md justify-center flex items-center font-black text-xs tracking-widest uppercase transition-all ${tab === 'Pending' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground bg-card border border-border/50 hover:bg-muted/50'}`}>Pending</button>
        <button onClick={() => setTab('Paid')} className={`px-4 py-2 rounded-md justify-center flex items-center font-black text-xs tracking-widest uppercase transition-all ${tab === 'Paid' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground bg-card border border-border/50 hover:bg-muted/50'}`}>Paid</button>
        <button onClick={() => setTab('History')} className={`px-4 py-2 rounded-md justify-center flex items-center font-black text-xs tracking-widest uppercase transition-all ${tab === 'History' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground bg-card border border-border/50 hover:bg-muted/50'}`}>History</button>
      </div>

      <div className="erp-card overflow-hidden bg-card">
        <div className="overflow-x-auto">
          {tab === 'History' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4">Date & Time</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4">Sales Order</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4">Salesperson</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4">Action</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-primary">{log.sales_order_code}</td>
                    <td className="px-6 py-4 font-medium">{getSalespersonName(log.salesperson_id, log.salesperson_name)}</td>
                    <td className="px-6 py-4 font-bold">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border ${
                        log.action === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        log.action === 'Edited' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{log.description}</td>
                  </tr>
                ))}
                {!loading && allLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium italic">
                      No incentive history logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4">Sales Order</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4">Salesperson</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4">Customer</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4">Vehicle</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4">Amount</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4">Incentive</th>
                  <th className="text-right font-black tracking-wide text-foreground px-6 py-4 w-48">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayIncentives.map((item) => (
                  <tr key={item.entity_id || item._id || item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary">{item.sales_order_code}</td>
                    <td className="px-6 py-4 font-medium">{getSalespersonName(item.salesperson_id, item.salesperson_name)}</td>
                    <td className="px-6 py-4 font-medium">{item.customer_name}</td>
                    <td className="px-6 py-4 font-medium">{item.brand} {item.model}</td>
                    <td className="px-6 py-4 font-medium tabular">₹{(item.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400 tabular">₹{(item.incentive_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right">
                      {item.incentive_status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingIncentive(item)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-md shadow-primary/20">
                            Edit
                          </button>
                          <button 
                            onClick={() => setPayingIncentive(item)} 
                            disabled={isProcessing === (item.entity_id || item._id || item.id)}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-all shadow-sm disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 text-primary font-bold">
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 shadow-sm">
                            <CheckCircle2 className="w-3 h-3" /> PAID
                          </span>
                          <button 
                            onClick={() => handleDeleteIncentive(item.entity_id || item._id || item.id)}
                            disabled={isProcessing === (item.entity_id || item._id || item.id)}
                            className="p-1.5 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all disabled:opacity-50"
                            title="Reset to Pending"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                
                {!loading && displayIncentives.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-medium italic">
                      No incentives found in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {payingIncentive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm shadow-2xl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-border">
              <div className="flex items-center justify-between p-6 bg-muted/20 border-b border-border">
                <h3 className="text-lg font-bold">Payment Confirmation</h3>
                <button onClick={() => setPayingIncentive(null)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <Formik
                initialValues={{ payment_method: 'Bank Transfer', reference_number: '' }}
                onSubmit={(values) => {
                  handleMarkPaid(
                    payingIncentive.entity_id || payingIncentive._id || payingIncentive.id,
                    values.payment_method,
                    values.reference_number
                  );
                }}
              >
                {({ isSubmitting }) => (
                  <Form className="p-6 space-y-4">
                    <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                       <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Incentive Due</p>
                       <p className="text-xl font-black text-primary">₹{(payingIncentive.incentive_amount || 0).toLocaleString()}</p>
                    </div>

                    <div>
                      <label className="erp-label">Payment Method</label>
                      <Field as="select" name="payment_method" className="erp-select">
                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                        <option value="Google Pay">UPI (GPay/PhonePe)</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Cash">Cash Payment</option>
                      </Field>
                    </div>
                    
                    <div>
                      <label className="erp-label">Transaction Reference / UTR</label>
                      <Field 
                        type="text" 
                        name="reference_number" 
                        placeholder="e.g. TXN12345678" 
                        className="erp-input font-mono" 
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                      <button type="button" onClick={() => setPayingIncentive(null)} className="px-4 py-2 text-sm font-bold rounded-xl hover:bg-muted transition-colors">Cancel</button>
                      <button type="submit" disabled={isProcessing !== null} className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center min-w-[140px]">
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </motion.div>
          </div>
        )}

        {editingIncentive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-border">
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                <h3 className="text-lg font-bold">Edit Incentive</h3>
                <button onClick={() => setEditingIncentive(null)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <Formik
                initialValues={{ incentive_amount: editingIncentive.incentive_amount || 0 }}
                onSubmit={(values, { setSubmitting }) => {
                  dispatch(updateSalesOrderAction(
                    editingIncentive.entity_id || editingIncentive._id || editingIncentive.id,
                    { incentive_amount: Number(values.incentive_amount), company_id: companyCode },
                    () => {
                      setSubmitting(false);
                      setEditingIncentive(null);
                      toast.success('Incentive updated successfully');
                    },
                    () => {
                      setSubmitting(false);
                      toast.error('Failed to update incentive');
                    }
                  ));
                }}
              >
                {({ isSubmitting }) => (
                  <Form className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="p-4 bg-muted/20 rounded-xl border border-border/50 flex flex-col gap-2">
                        <div className="flex justify-between items-center"><span className="text-xs text-muted-foreground font-bold">Sales Order</span> <span className="text-sm font-black">{editingIncentive.sales_order_code}</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-muted-foreground font-bold">Salesperson</span> <span className="text-sm font-bold">{getSalespersonName(editingIncentive.salesperson_id, editingIncentive.salesperson_name)}</span></div>
                      </div>
                      
                      <div>
                        <label className="erp-label">Incentive Amount (₹)</label>
                        <Field type="number" name="incentive_amount" className="erp-input h-12 rounded-xl text-lg font-black tabular shadow-inner" />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                      <button type="button" onClick={() => setEditingIncentive(null)} className="px-4 py-2 text-sm font-bold rounded-xl hover:bg-muted transition-colors">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-primary-foreground text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
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

export default IncentiveManagementPage;
