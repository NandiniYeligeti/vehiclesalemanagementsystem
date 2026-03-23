import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, CheckCircle, Clock, Banknote, Landmark, Percent, Calendar, X, Trash2, Edit2, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getLoansAction, addLoanAction, updateLoanAction, deleteLoanAction, Loan } from '@/store/ducks/loans.ducks';
import { getCustomersAction } from '@/store/ducks/customers.ducks';
import { getSalesOrdersAction } from '@/store/ducks/sales_orders.ducks';

const loanValidationSchema = Yup.object().shape({
  customer_id: Yup.string().required('Customer is required'),
  sales_order_id: Yup.string().required('Sales Order is required'),
  bank_name: Yup.string().required('Bank Name is required'),
  loan_amount: Yup.number().min(1, 'Amount must be positive').required('Amount is required'),
  interest_rate: Yup.number().min(0).required('Interest rate is required'),
  months: Yup.number().min(1).required('Tenure is required'),
});

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
import { AlertTriangle } from 'lucide-react';

const LoansPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const { data: loans, loading, saving } = useSelector((state: RootState) => state.loans);
  const { data: customers } = useSelector((state: RootState) => state.customers);
  const { data: salesOrders } = useSelector((state: RootState) => state.salesOrders);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Custom delete state
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (companyCode) {
      dispatch(getLoansAction(companyCode));
      dispatch(getCustomersAction(companyCode));
      dispatch(getSalesOrdersAction(companyCode));
    }
  }, [dispatch, companyCode]);

  const filtered = (loans || []).filter(l => {
    const matchSearch = (l.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (l.bank_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateEMI = (principal: number, rate: number, months: number) => {
    if (!principal || !rate || !months) return 0;
    const monthlyRate = rate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };

  const confirmDelete = () => {
    if (loanToDelete) {
      setIsDeleting(true);
      dispatch(deleteLoanAction(loanToDelete, () => {
        setIsDeleting(false);
        setLoanToDelete(null);
      }, () => setIsDeleting(false)));
    }
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={!!loanToDelete} onOpenChange={() => setLoanToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center font-black text-2xl">Delete Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground font-medium text-sm mt-2">
              Are you sure you want to remove this loan application? This will permanently delete the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-8">
            <AlertDialogCancel className="rounded-xl border-border/60 hover:bg-muted font-bold transition-all h-12 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20 border-none transition-all h-12 px-8"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete Portfolio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight erp-gradient-text">Loan Management</h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Finance & Credit Portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center h-10 px-4 rounded-xl bg-card border border-border shadow-sm">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input 
              type="text" 
              placeholder="Search by customer or bank..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-48 sm:w-64 placeholder:text-muted-foreground font-medium" 
            />
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> Apply Loan
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Applied', 'Approved', 'Disbursed', 'Rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              filterStatus === status 
              ? 'bg-primary text-primary-foreground border-primary shadow-md' 
              : 'bg-card border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Aggregating Credit Data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full erp-card p-20 text-center border-dashed border-2">
            <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="font-bold text-muted-foreground">No loan applications matching your filters.</p>
          </div>
        ) : (
          filtered.map((loan, i) => (
            <motion.div
              key={loan.entity_id || loan._id || loan.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="erp-card group hover:border-primary/40 transition-all relative overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                      <Banknote className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-foreground tracking-tight">{loan.customer_name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3" /> APPLIED ON {new Date(loan.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    loan.status === 'Disbursed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    loan.status === 'Approved' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    loan.status === 'Rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                    {loan.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-5 border-y border-border/50 bg-muted/20 px-4 -mx-6">
                  <div className="text-center border-r border-border/50 last:border-0 px-2">
                    <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-black mb-1 opacity-70">Credit Limit</p>
                    <p className="text-sm font-black text-foreground">{formatCurrency(loan.loan_amount)}</p>
                  </div>
                  <div className="text-center border-r border-border/50 last:border-0 px-2">
                    <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-black mb-1 opacity-70">Monthly EMI</p>
                    <p className="text-sm font-black text-primary">{formatCurrency(loan.emi)}</p>
                  </div>
                  <div className="text-center border-r border-border/50 last:border-0 px-2">
                    <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-black mb-1 opacity-70">Tenure</p>
                    <p className="text-sm font-black text-foreground">{loan.months} Months</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Partner Bank</span>
                    <span className="text-sm font-bold flex items-center gap-2">
                      <Landmark className="w-3.5 h-3.5 text-primary/60" /> {loan.bank_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2.5 rounded-xl border border-border hover:bg-muted transition-all"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                    <button 
                      onClick={() => setLoanToDelete(loan.entity_id || loan._id || loan.id!)}
                      className="p-2.5 rounded-xl border border-destructive/10 text-destructive bg-destructive/5 hover:bg-destructive hover:text-white transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Loan Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl overflow-hidden my-auto"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight erp-gradient-text">Loan Application</h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Configure Vehicle Financing</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>

              <Formik
                initialValues={{
                  customer_id: '',
                  sales_order_id: '',
                  bank_name: '',
                  loan_amount: 0,
                  interest_rate: 8.5,
                  months: 36,
                  emi: 0,
                  account_number: '',
                  company_id: companyCode,
                  branch_id: 'MAIN_BRANCH'
                }}
                validationSchema={loanValidationSchema}
                onSubmit={(values, { setSubmitting }) => {
                  const emi = calculateEMI(values.loan_amount, values.interest_rate, values.months);
                  dispatch(addLoanAction(
                    { ...values, emi },
                    companyCode,
                    () => {
                      setShowForm(false);
                      setSubmitting(false);
                    },
                    () => setSubmitting(false)
                  ));
                }}
              >
                {({ values, setFieldValue, isSubmitting }) => {
                  // Link Sales Order to pre-fill Loan Amount
                  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const soId = e.target.value;
                    setFieldValue('sales_order_id', soId);
                    const so = salesOrders.find(o => (o.entity_id || o._id || o.id) === soId);
                    if (so) {
                      setFieldValue('loan_amount', so.loan_amount || 0);
                      setFieldValue('customer_id', so.customer_id);
                    }
                  };

                  const liveEMI = calculateEMI(values.loan_amount, values.interest_rate, values.months);

                  return (
                    <Form className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="erp-label">Link Sales Order</label>
                          <select className="erp-select h-12" name="sales_order_id" onChange={handleOrderChange}>
                            <option value="">Select Sales Order</option>
                            {(salesOrders || []).map(o => (
                              <option key={o.entity_id || o._id || o.id} value={o.entity_id || o._id || o.id}>
                                {o.sales_order_code} — {o.customer_name} ({formatCurrency(o.loan_amount)})
                              </option>
                            ))}
                          </select>
                          <ErrorMessage name="sales_order_id" component="div" className="text-[10px] font-black text-destructive uppercase mt-1" />
                        </div>

                        <div>
                          <label className="erp-label">Partner Bank</label>
                          <div className="relative">
                            <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                            <Field name="bank_name" placeholder="e.g. HDFC Bank" className="erp-input h-12 pl-12" />
                          </div>
                          <ErrorMessage name="bank_name" component="div" className="text-[10px] font-black text-destructive uppercase mt-1" />
                        </div>

                        <div>
                          <label className="erp-label">Loan Amount (Principal)</label>
                          <div className="relative">
                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                            <Field type="number" name="loan_amount" className="erp-input h-12 pl-12 font-bold" />
                          </div>
                          <ErrorMessage name="loan_amount" component="div" className="text-[10px] font-black text-destructive uppercase mt-1" />
                        </div>

                        <div>
                          <label className="erp-label">Interest Rate (Annual %)</label>
                          <div className="relative">
                            <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                            <Field type="number" step="0.1" name="interest_rate" className="erp-input h-12 pl-12" />
                          </div>
                        </div>

                        <div>
                          <label className="erp-label">Tenure (Months)</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                            <Field type="number" name="months" className="erp-input h-12 pl-12" />
                          </div>
                        </div>

                        <div className="md:col-span-2 p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">Calculated Monthly Installment</p>
                            <p className="text-3xl font-black text-primary">{formatCurrency(liveEMI)} <span className="text-xs font-bold text-primary/50">/ month</span></p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Payment</p>
                             <p className="text-sm font-bold text-foreground">{formatCurrency(liveEMI * values.months)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-4">
                        <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-14 rounded-2xl border border-border font-bold hover:bg-muted transition-all">Cancel</button>
                        <button 
                          type="submit" 
                          disabled={isSubmitting} 
                          className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Submit Application</>}
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

export default LoansPage;
