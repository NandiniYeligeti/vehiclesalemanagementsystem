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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Incentive Management</h2>
      </div>

      <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        <button onClick={() => setTab('Pending')} className={`px-4 py-2 rounded-md justify-center flex items-center font-bold text-sm tracking-wide transition-all ${tab === 'Pending' ? 'bg-[#0f172a] text-white shadow-lg' : 'text-muted-foreground bg-white border border-border/50 hover:bg-muted/50'}`}>Pending</button>
        <button onClick={() => setTab('Paid')} className={`px-4 py-2 rounded-md justify-center flex items-center font-bold text-sm tracking-wide transition-all ${tab === 'Paid' ? 'bg-[#0f172a] text-white shadow-lg' : 'text-muted-foreground bg-white border border-border/50 hover:bg-muted/50'}`}>Paid</button>
        <button onClick={() => setTab('History')} className={`px-4 py-2 rounded-md justify-center flex items-center font-bold text-sm tracking-wide transition-all ${tab === 'History' ? 'bg-[#0f172a] text-white shadow-lg' : 'text-muted-foreground bg-white border border-border/50 hover:bg-muted/50'}`}>History</button>
      </div>

      <div className="erp-card overflow-hidden bg-white border border-border/60 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          {tab === 'History' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-gray-50/50">
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4 border-b border-border">Date & Time</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4 border-b border-border">Sales Order</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4 border-b border-border">Salesperson</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4 border-b border-border">Action</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4 border-b border-border">Description</th>
                </tr>
              </thead>
              <tbody>
                {allLogs.map((log, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium">{log.sales_order_code}</td>
                    <td className="px-6 py-4 font-medium">{getSalespersonName(log.salesperson_id, log.salesperson_name)}</td>
                    <td className="px-6 py-4 font-bold">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border ${
                        log.action === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        log.action === 'Edited' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{log.description}</td>
                  </tr>
                ))}
                {!loading && allLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium bg-muted/5">
                      No incentive history logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-gray-50/50">
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4 border-b border-border">Sales Order</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4 border-b border-border">Salesperson</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4 border-b border-border">Customer</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4 border-b border-border">Vehicle</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4 border-b border-border">Amount</th>
                  <th className="text-left font-black tracking-wide text-foreground px-6 py-4 border-b border-border">Incentive</th>
                  <th className="text-right font-black tracking-wide text-foreground px-6 py-4 border-b border-border w-48">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayIncentives.map((item) => (
                  <tr key={item.entity_id || item._id || item.id} className="border-b border-border/40 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-muted-foreground">{item.sales_order_code}</td>
                    <td className="px-6 py-4 font-medium">{getSalespersonName(item.salesperson_id, item.salesperson_name)}</td>
                    <td className="px-6 py-4 font-medium">{item.customer_name}</td>
                    <td className="px-6 py-4 font-medium">{item.brand} {item.model}</td>
                    <td className="px-6 py-4 font-medium">₹{(item.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">₹{(item.incentive_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {item.incentive_status === 'Pending' ? (
                        <>
                          <button onClick={() => setEditingIncentive(item)} className="px-3 py-2 text-xs font-bold bg-[#0f172a] text-white rounded-md hover:bg-[#0f172a]/90 transition-all shadow-sm">
                            Edit
                          </button>
                          <button 
                            onClick={() => setPayingIncentive(item)} 
                            disabled={isProcessing === (item.entity_id || item._id || item.id)}
                            className="px-3 py-2 text-xs font-bold bg-white border border-border rounded-md text-[#0f172a] hover:bg-muted transition-all shadow-sm disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#0f172a] bg-muted/50 rounded-md border border-border/50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                          </span>
                          <button 
                            onClick={() => handleDeleteIncentive(item.entity_id || item._id || item.id)}
                            disabled={isProcessing === (item.entity_id || item._id || item.id)}
                            className="p-1.5 text-xs font-bold bg-white border border-destructive/20 rounded-md text-destructive hover:bg-destructive/5 transition-all shadow-sm disabled:opacity-50"
                            title="Delete Incentive Record"
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
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-medium bg-muted/5">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl ring-1 ring-border shadow-2xl w-full max-w-[400px] mx-4 overflow-hidden border border-border pb-2">
              <div className="flex items-center justify-between p-6 pb-2">
                <h3 className="text-xl font-bold text-[#0f172a]">Payment Details</h3>
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
                  <Form className="p-6 pt-2">
                    <div className="space-y-4 mb-6">
                      <div className="relative">
                        <Field as="select" name="payment_method" className="w-full h-12 px-4 bg-white border-2 border-black rounded-lg appearance-none focus:outline-none font-bold text-[#0f172a]">
                          <option value="Select Method">Select Method</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Google Pay">Google Pay</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Cash">Cash</option>
                        </Field>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L6 6L11 1" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div>
                        <Field 
                          type="text" 
                          name="reference_number" 
                          placeholder="Enter UTR Number" 
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0f172a]/5 focus:border-[#0f172a] transition-all placeholder:text-slate-400 font-medium" 
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setPayingIncentive(null)} className="px-6 py-2.5 text-sm font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                      <button type="submit" disabled={isProcessing !== null} className="px-6 py-2.5 bg-[#1e293b] text-white text-sm font-bold rounded-lg shadow-sm hover:bg-[#0f172a] transition-all flex items-center justify-center min-w-[140px]">
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-2xl ring-1 ring-border shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-border">
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
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block px-1">Incentive Amount (₹)</label>
                        <Field type="number" name="incentive_amount" className="erp-input h-12 rounded-xl text-lg font-black" />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={() => setEditingIncentive(null)} className="px-4 py-2 text-sm font-bold rounded-xl hover:bg-muted transition-colors">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
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
