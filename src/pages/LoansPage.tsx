import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import format from 'date-fns/format';
import { 
  Plus, Search, Landmark, Banknote, Clock, Wallet, CheckCircle2, XCircle, 
  RefreshCcw, Phone, MoreVertical, Eye, Edit2, Trash2, Calendar, FileText, Info, 
  AlertTriangle, Loader2, CheckCircle, Percent, X
} from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Actions & Utils
import { getLoansAction, addLoanAction, updateLoanAction, deleteLoanAction, Loan } from "@/store/ducks/loans.ducks";
import { getSalesOrdersAction } from "@/store/ducks/sales_orders.ducks";
import { getBanksAction } from "@/store/ducks/bank_master.ducks";
import { getCompanyBanksAction } from "@/store/ducks/company_bank_master.ducks";
import { usePermissions } from "@/hooks/usePermissions";


const statusColors: Record<string, string> = {
  Applied: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Disbursed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20"
};

const LoansPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const companyCode = user?.CompanyCode || sessionStorage.getItem('companyCode') || '';
  const { hasPermission, getFilteredData } = usePermissions();

  const { data: rawLoans, loading, saving } = useSelector((state: RootState) => state.loans);
  const loans = useMemo(() => getFilteredData(rawLoans || [], 'branch'), [rawLoans, getFilteredData]);

  const { data: rawSalesOrders } = useSelector((state: RootState) => state.salesOrders);
  const salesOrders = useMemo(() => getFilteredData(rawSalesOrders || [], 'branch'), [rawSalesOrders, getFilteredData]);

  const { data: bankMasters = [] } = useSelector((state: RootState) => state.bankMaster);
  const { data: companyBanks = [] } = useSelector((state: RootState) => state.companyBankMaster);

  // Filter States
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal States
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isView, setIsView] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);

  // Form Data State
  const [formData, setFormData] = useState({
    customer_id: "",
    sales_order_id: "",
    bank_name: "",
    bank_person: "",
    mobile: "",
    loan_amount: 0,
    interest_rate: 8.5,
    duration_months: 36,
    status: "Applied",
    emi_amount: 0,
    account_number: "",
    status_date: "",
  });

  useEffect(() => {
    if (companyCode) {
      dispatch(getLoansAction(companyCode));
      dispatch(getSalesOrdersAction(companyCode));
      dispatch(getBanksAction(companyCode));
      dispatch(getCompanyBanksAction(companyCode));
    }
  }, [dispatch, companyCode]);

  // Logic: Auto-calculate EMI
  const calculateEMI = useCallback((principal: number, rate: number, months: number) => {
    if (!principal || !rate || !months) return 0;
    const monthlyRate = rate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  }, []);

  // Update EMI whenever amount/rate/tenure changes
  useEffect(() => {
    const emi_amount = calculateEMI(formData.loan_amount, formData.interest_rate, formData.duration_months);
    setFormData(prev => ({ ...prev, emi_amount }));
  }, [formData.loan_amount, formData.interest_rate, formData.duration_months, calculateEMI]);

  // Filtered Logic (from USER snippet)
  const filteredLoans = useMemo(() => {
    return (loans || []).filter((item) => {
      const matchesTab = tab === "All" || item.status === tab;

      const matchesSearch =
        (item.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.bank_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.loan_code || '').toLowerCase().includes(search.toLowerCase());

      const itemDate = new Date(item.created_at || '');
      const fromOk = dateFrom ? itemDate >= new Date(dateFrom) : true;
      const toOk = dateTo ? itemDate <= new Date(dateTo) : true;

      return matchesTab && matchesSearch && fromOk && toOk;
    });
  }, [loans, tab, search, dateFrom, dateTo]);

  // Handlers
  const handleBankChange = (bankId: string) => {
    const bank = bankMasters.find(b => (b.entity_id || b.id) === bankId);
    if (bank) {
      setFormData((prev) => ({
        ...prev,
        bank_name: bank.bank_name,
        bank_person: bank.contact_person,
        mobile: bank.contact_number,
      }));
    }
  };

  const openCreate = () => {
    const defaultBank = bankMasters.find(b => b.is_default);
    setFormData({
      customer_id: "",
      sales_order_id: "",
      bank_name: defaultBank ? defaultBank.bank_name : "",
      bank_person: defaultBank ? defaultBank.contact_person : "",
      mobile: defaultBank ? defaultBank.contact_number : "",
      loan_amount: 0,
      interest_rate: 8.5,
      duration_months: 36,
      status: "Applied",
      emi_amount: 0,
      account_number: "",
      status_date: "",
    });
    setSelectedLoan(null);
    setIsEdit(true);
    setIsView(false);
    setShowForm(true);
  };

  const openEdit = (loan: Loan) => {
    setFormData({
      customer_id: loan.customer_id,
      sales_order_id: loan.sales_order_id,
      bank_name: loan.bank_name,
      bank_person: loan.bank_person || "",
      mobile: loan.mobile || "",
      loan_amount: loan.loan_amount,
      interest_rate: loan.interest_rate,
      duration_months: loan.duration_months,
      status: loan.status,
      emi_amount: loan.emi_amount,
      account_number: loan.account_number || "",
      status_date: loan.status_date ? new Date(loan.status_date).toISOString().split('T')[0] : "",
    });
    setSelectedLoan(loan);
    setIsEdit(true);
    setIsView(false);
    setShowForm(true);
  };

  const openView = (loan: Loan) => {
    setFormData({
      customer_id: loan.customer_id,
      sales_order_id: loan.sales_order_id,
      bank_name: loan.bank_name,
      bank_person: loan.bank_person || "",
      mobile: loan.mobile || "",
      loan_amount: loan.loan_amount,
      interest_rate: loan.interest_rate,
      duration_months: loan.duration_months,
      status: loan.status,
      emi_amount: loan.emi_amount,
      account_number: loan.account_number || "",
      status_date: loan.status_date ? new Date(loan.status_date).toISOString().split('T')[0] : "",
    });
    setSelectedLoan(loan);
    setIsEdit(false);
    setIsView(true);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.bank_name) return toast.error("Please select a bank");
    if (formData.loan_amount <= 0) return toast.error("Invalid loan amount");

    // Build payload with proper date conversion
    const payload: any = { ...formData };
    if (payload.status_date) {
      const isoDate = new Date(payload.status_date).toISOString();
      payload.status_date = isoDate;
      // If status is Disbursed, also set disbursement_date
      if (payload.status === 'Disbursed') {
        payload.disbursement_date = isoDate;
      }
    } else {
      delete payload.status_date;
    }

    if (selectedLoan) {
      dispatch(updateLoanAction(companyCode, selectedLoan.entity_id || selectedLoan._id || '', payload, () => {
        toast.success("Loan updated successfully");
        setShowForm(false);
      }));
    } else {
      dispatch(addLoanAction({ ...payload, company_id: companyCode, branch_id: 'MAIN' }, companyCode, () => {
        toast.success("Loan application submitted");
        setShowForm(false);
      }));
    }
  };

  const confirmDelete = () => {
    if (loanToDelete) {
      dispatch(deleteLoanAction(companyCode, loanToDelete, () => {
        toast.success("Loan deleted");
        setLoanToDelete(null);
      }));
    }
  };

  const formatCurrency = (amt: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  return (
    <div className="space-y-6">
      <AlertDialog open={!!loanToDelete} onOpenChange={() => setLoanToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center font-black text-2xl tracking-tight">Delete Application?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground font-medium text-sm mt-2">
              This will permanently revoke this loan portfolio from the credit system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-8">
            <AlertDialogCancel className="rounded-xl border-border/60 hover:bg-muted font-bold transition-all h-12 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20 border-none transition-all h-12 px-8"
            >
              Delete Portfolio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter erp-gradient-text">Loan & Finance</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mt-1">
            <Landmark className="w-3 h-3" /> Credit Portfolio Management
          </p>
        </div>
        {hasPermission('loans', 'add') && (
          <Button onClick={openCreate} className="h-11 px-6 rounded-xl font-bold gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" /> Apply Loan
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Portfolio', val: loans.reduce((acc, l) => acc + l.loan_amount, 0), icon: Wallet, color: 'text-primary bg-primary/10' },
          { label: 'Applied', val: loans.filter(l => l.status === 'Applied').length, icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Disbursed', val: loans.filter(l => l.status === 'Disbursed').length, icon: CheckCircle2, color: 'text-purple-500 bg-purple-500/10' },
          { label: 'Rejected', val: loans.filter(l => l.status === 'Rejected').length, icon: XCircle, color: 'text-destructive bg-destructive/10' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-md overflow-hidden relative group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-110 opacity-10 ${stat.color.split(' ')[1]}`} />
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-black tabular-nums">{typeof stat.val === 'number' && i === 0 ? formatCurrency(stat.val) : stat.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controllers: Tabs & Filters */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 hide-scrollbar">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="bg-muted/30 p-1 h-12 rounded-2xl border border-border/50 inline-flex min-w-max">
              {["All", "Applied", "Approved", "Disbursed", "Rejected"].map((t) => (
                <TabsTrigger 
                  key={t} 
                  value={t} 
                  className="rounded-xl px-4 sm:px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-lg active:scale-95 transition-all"
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search Customer / Bank..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="h-12 pl-10 pr-4 rounded-2xl bg-muted/20 border-border/50 focus:ring-primary/10 transition-all font-medium text-sm w-full" 
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-12 w-full sm:w-36 rounded-2xl bg-muted/20 border-border/50 font-bold text-xs" />
            <span className="text-muted-foreground text-[10px] font-black">TO</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-12 w-full sm:w-36 rounded-2xl bg-muted/20 border-border/50 font-bold text-xs" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <Card className="border-none shadow-xl shadow-foreground/5 overflow-hidden rounded-3xl">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="p-4 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground opacity-70">ID & Customer</th>
                <th className="p-4 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground opacity-70">Partner Bank</th>
                <th className="p-4 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground opacity-70">Bank Desk</th>
                <th className="p-4 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground opacity-70">Finance Info</th>
                <th className="p-4 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground opacity-70">Date</th>
                <th className="p-4 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground opacity-70">Status</th>
                <th className="p-4 text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground opacity-70">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-20" />
                  </td>
                </tr>
              ) : filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-muted-foreground font-bold">
                    No loan records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((row) => (
                  <tr key={row.entity_id || row._id} className="border-t border-border/40 hover:bg-muted/10 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{row.customer_name}</span>
                        <span className="text-[10px] font-black text-muted-foreground tracking-tighter uppercase">{row.loan_code}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-3.5 h-3.5 text-primary/60" />
                        <span className="font-bold text-sm">{row.bank_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-muted-foreground">{row.bank_person || 'N/A'}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <a href={`tel:${row.mobile}`} className="text-[11px] font-black hover:underline">{row.mobile || '—'}</a>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-black text-sm">{formatCurrency(row.loan_amount)}</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{row.duration_months}M @ {row.interest_rate}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-bold text-muted-foreground">
                        {row.status_date || row.disbursement_date 
                          ? format(new Date(row.status_date || row.disbursement_date || ''), "dd MMM yyyy")
                          : format(new Date(row.created_at || ''), "dd MMM yyyy")}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border ${statusColors[row.status] || ''}`}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission('loans', 'view') && (
                          <button onClick={() => openView(row)} className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('loans', 'edit') && (
                          <button onClick={() => openEdit(row)} className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-emerald-500/10 hover:text-emerald-500 transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('loans', 'delete') && (
                          <button onClick={() => setLoanToDelete(row.entity_id || row._id || '')} className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal: Create/Edit/View */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    {isEdit ? <Edit2 className="w-6 h-6" /> : isView ? <Eye className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight erp-gradient-text">
                      {isView ? "Loan Insight" : selectedLoan ? "Config Portfolio" : "Init Credit Record"}
                    </h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {isView ? "Detailed Credit Review" : "Configure vehicle financing parameters"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2.5 rounded-2xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sales Order Linking */}
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Link Sales Order</label>
                    <select 
                      className="w-full h-12 px-4 rounded-2xl bg-muted/20 border border-border/50 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                      value={formData.sales_order_id}
                      disabled={isView || !!selectedLoan}
                      onChange={(e) => {
                        const soId = e.target.value;
                        const so = salesOrders.find(o => (o.entity_id || o._id) === soId);
                        if (so) {
                          setFormData(prev => ({ 
                            ...prev, 
                            sales_order_id: soId, 
                            customer_id: so.customer_id, 
                            loan_amount: so.loan_amount 
                          }));
                        }
                      }}
                    >
                      <option value="">Select Sales Order</option>
                      {salesOrders.map(so => (
                        <option key={so.entity_id || so._id} value={so.entity_id || so._id}>{so.sales_order_code} — {so.customer_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bank Details */}
                  <div className="space-y-4 md:col-span-2 p-6 rounded-3xl border border-border/40 bg-muted/10">
                    <h3 className="text-xs font-black uppercase tracking-tight text-primary flex items-center gap-2">
                      <Landmark className="w-3.5 h-3.5" /> Banking Channel
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Partner Bank</label>
                        <select 
                          className="w-full h-11 px-4 rounded-xl bg-background border border-border/50 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                          value={bankMasters.find(b => b.bank_name === formData.bank_name)?.entity_id || ''}
                          disabled={isView}
                          onChange={(e) => handleBankChange(e.target.value)}
                        >
                          <option value="">Select Bank</option>
                          {bankMasters.map(b => (
                            <option key={b.entity_id || b.id} value={b.entity_id || b.id}>{b.bank_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Bank Representative</label>
                        <Input 
                          value={formData.bank_person} 
                          disabled={isView} 
                          onChange={(e) => setFormData(p => ({ ...p, bank_person: e.target.value }))}
                          className="h-11 rounded-xl bg-background border-border/50 font-medium" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Direct Contact (Mobile)</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            value={formData.mobile} 
                            disabled={isView} 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d{0,10}$/.test(val)) setFormData(p => ({ ...p, mobile: val }));
                            }}
                            className="h-11 pl-10 rounded-xl bg-background border-border/50 font-bold" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Finance Config */}
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Loan Amount (INR)</label>
                    <div className="relative">
                      <Banknote className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      <Input 
                        type="number" 
                        value={formData.loan_amount} 
                        disabled={isView}
                        onChange={(e) => setFormData(p => ({ ...p, loan_amount: Number(e.target.value) }))}
                        className="h-11 pl-10 rounded-xl bg-muted/20 border-border/50 font-black text-sm" 
                      />
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Tenure (Months)</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <Input 
                        type="number" 
                        value={formData.duration_months} 
                        disabled={isView}
                        onChange={(e) => setFormData(p => ({ ...p, duration_months: Number(e.target.value) }))}
                        className="h-11 pl-10 rounded-xl bg-muted/20 border-border/50 font-bold text-sm" 
                      />
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Interest Rate (% P.A.)</label>
                    <div className="relative">
                      <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                      <Input 
                        type="number" 
                        step="0.01"
                        value={formData.interest_rate} 
                        disabled={isView}
                        onChange={(e) => setFormData(p => ({ ...p, interest_rate: Number(e.target.value) }))}
                        className="h-11 pl-10 rounded-xl bg-muted/20 border-border/50 font-bold text-sm" 
                      />
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Current Status</label>
                    <select
                      className="w-full h-11 px-4 rounded-xl bg-muted/20 border border-border/50 font-black text-sm outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                      value={formData.status}
                      disabled={isView}
                      onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
                    >
                      {["Applied", "Approved", "Disbursed", "Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">
                      {formData.status === 'Disbursed' ? 'Disbursement Date' : 
                       formData.status === 'Approved' ? 'Approval Date' : 
                       formData.status === 'Rejected' ? 'Rejection Date' : 'Status Date'}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={formData.status_date}
                        disabled={isView}
                        onChange={(e) => setFormData(p => ({ ...p, status_date: e.target.value }))}
                        className="h-11 pl-10 rounded-xl bg-muted/20 border-border/50 font-bold text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {formData.status === 'Disbursed' && (
                    <div className="md:col-span-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-500 ml-1 mb-2 block">Disbursing Company Bank</label>
                      <select
                        className="w-full h-11 px-4 rounded-xl bg-background border border-border/50 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                        value={formData.account_number}
                        disabled={isView}
                        onChange={(e) => setFormData(p => ({ ...p, account_number: e.target.value }))}
                      >
                        <option value="">Select Company Bank Account</option>
                        {companyBanks.map((b: any) => (
                          <option key={b.entity_id || b.id} value={b.account_number}>
                            {b.bank_name} - {b.account_number} ({b.branch_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Calculated Result */}
                  <div className="md:col-span-2 p-6 rounded-3xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">Estimated Monthly EMI</p>
                      <p className="text-3xl font-black text-primary tabular-nums">{formatCurrency(formData.emi_amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Due (EMI x Months)</p>
                      <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(formData.emi_amount * formData.duration_months)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} className="px-8 rounded-xl font-bold">Close</Button>
                {isEdit && (
                  <Button onClick={handleSave} disabled={saving} className="px-10 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : selectedLoan ? "Update Portfolio" : "Initiate Loan"}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoansPage;
