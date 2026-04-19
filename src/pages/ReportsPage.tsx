import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileDown, BarChart3, Loader2, Calendar, Filter } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { getCustomersAction } from '@/store/ducks/customers.ducks';
import { getSalesOrdersAction } from '@/store/ducks/sales_orders.ducks';
import { getVehicleInventoryAction } from '@/store/ducks/vehicle_inventory.ducks';
import { getPaymentsAction } from '@/store/ducks/payments.ducks';
import { getLoansAction } from '@/store/ducks/loans.ducks';
import { toast } from 'sonner';

const reportTypes = [
  { id: 'sales', name: 'Sales Report', description: 'Complete sales data with vehicle and customer details' },
  { id: 'customer', name: 'Customer Report', description: 'Customer list with purchase history' },
  { id: 'stock', name: 'Vehicle Stock Report', description: 'Current inventory status and vehicle details' },
  { id: 'payment', name: 'Payment Report', description: 'All payment transactions with mode and status' },
  { id: 'loan', name: 'Loan Report', description: 'Loan disbursement, EMI, and status tracking' },
];

const ReportsPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedModel, setSelectedModel] = useState('All Models');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const customers = useSelector((state: RootState) => state.customers.data) || [];
  const salesOrders = useSelector((state: RootState) => state.salesOrders?.data) || [];
  const inventory = useSelector((state: RootState) => state.vehicleInventory.data) || [];
  const payments = useSelector((state: RootState) => state.payments.data) || [];
  const loans = useSelector((state: RootState) => state.loans.data) || [];
  
  const models = Array.from(new Set(inventory.map(item => item.model))).filter(Boolean);

  useEffect(() => {
    if (companyCode) {
      dispatch(getCustomersAction(companyCode));
      dispatch(getSalesOrdersAction(companyCode));
      dispatch(getVehicleInventoryAction(companyCode));
      dispatch(getPaymentsAction(companyCode));
      dispatch(getLoansAction(companyCode));
    }
  }, [dispatch, companyCode]);

  const formatDate = (dateStr: any) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  };

  const isWithinDateRange = (dateStr: any) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return true;
    
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (date < from) return false;
    }
    
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (date > to) return false;
    }
    
    return true;
  };

  const getReportData = (id: string) => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = '';

    switch (id) {
      case 'sales':
        headers = ['Order Code', 'Date', 'Customer', 'Vehicle', 'Amount', 'Status', 'Salesperson'];
        rows = salesOrders
          .filter(so => isWithinDateRange(so.sale_date || so.created_at))
          .filter(so => selectedModel === 'All Models' || so.model === selectedModel)
          .map(so => [
            so.sales_order_code,
            formatDate(so.sale_date || so.created_at),
            so.customer_name,
            `${so.brand} ${so.model}`,
            `₹${(so.total_amount || 0).toLocaleString()}`,
            so.status,
            so.salesperson_name
          ]);
        filename = 'Sales_Report';
        break;

      case 'customer':
        headers = ['Name', 'Mobile', 'Email', 'City', 'Created At'];
        rows = customers
          .filter(c => isWithinDateRange(c.created_at))
          .map(c => [
            c.customer_name,
            c.mobile_number,
            c.email,
            c.city,
            formatDate(c.created_at)
          ]);
        filename = 'Customer_Report';
        break;

      case 'stock':
        headers = ['Brand', 'Model', 'Variant', 'Color', 'Chassis No', 'Status', 'Price', 'Created At'];
        rows = inventory
          .filter(item => selectedModel === 'All Models' || item.model === selectedModel)
          .map(item => [
            item.brand,
            item.model,
            item.variant,
            item.color,
            item.chassis_number,
            item.status,
            `₹${(item.selling_price || item.base_price || 0).toLocaleString()}`,
            formatDate(item.created_at)
          ]);
        filename = 'Inventory_Report';
        break;

      case 'payment':
        headers = ['Voucher No', 'Date', 'Customer', 'Method', 'Amount', 'Status'];
        rows = payments
          .filter(p => isWithinDateRange(p.payment_date))
          .map(p => [
            p.voucher_number || p.entity_id,
            formatDate(p.payment_date),
            p.customer_name,
            p.payment_mode,
            `₹${(p.amount || 0).toLocaleString()}`,
            p.status
          ]);
        filename = 'Payment_Report';
        break;

      case 'loan':
        headers = ['Customer', 'Order Code', 'Bank', 'Loan Amount', 'EMI', 'Status', 'Date'];
        rows = loans
          .filter(l => isWithinDateRange(l.created_at))
          .map(l => [
            l.customer_name,
            l.sales_order_code,
            l.bank_name,
            `₹${(l.loan_amount || 0).toLocaleString()}`,
            `₹${(l.emi || 0).toLocaleString()}`,
            l.status,
            formatDate(l.created_at)
          ]);
        filename = 'Loan_Report';
        break;
    }

    return { headers, rows, filename };
  };

  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = (reportId: string) => {
    setIsDownloading(reportId);
    setTimeout(() => {
      try {
        const { headers, rows, filename } = getReportData(reportId);
        if (rows.length === 0) {
          toast.error('No data found for the selected filters');
        } else {
          downloadCSV(filename, headers, rows);
          toast.success(`${filename} exported successfully`);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to export report');
      } finally {
        setIsDownloading(null);
      }
    }, 500);
  };

  const currentReportData = selectedReportId ? getReportData(selectedReportId) : null;

  return (
    <div className="space-y-6 text-foreground">
      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-lg text-foreground">Report Filters</h3>
          {selectedReportId && (
            <span className="ml-auto px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
              Viewing: {reportTypes.find(r => r.id === selectedReportId)?.name}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <label className="erp-label">Date From</label>
            <div className="relative">
              <input className="erp-input pl-10 h-11" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="erp-label">Date To</label>
            <div className="relative">
              <input className="erp-input pl-10 h-11" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="erp-label">Vehicle Model</label>
            <select className="erp-select h-11" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              <option>All Models</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 flex gap-2 items-end">
             <button onClick={() => { setDateFrom(''); setDateTo(''); setSelectedModel('All Models'); }} className="h-11 px-4 text-xs font-bold bg-muted/30 hover:bg-muted text-muted-foreground rounded-lg transition-all border border-border/50">
               Reset
             </button>
             {selectedReportId && (
               <button onClick={() => handleDownload(selectedReportId)} disabled={isDownloading === selectedReportId} className="h-11 flex-1 px-4 text-xs font-black bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                 {isDownloading === selectedReportId ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileDown className="w-4 h-4" /> Export CSV</>}
               </button>
             )}
          </div>
        </div>
      </motion.div>

      {/* Report Cards / Table Toggle */}
      {!selectedReportId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report, i) => (
            <motion.div
              key={report.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedReportId(report.id)}
              className="erp-card p-6 flex flex-col hover:border-primary/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors border border-primary/10">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-black text-lg text-foreground">{report.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6 flex-1 font-medium leading-relaxed">{report.description}</p>
              <div className="flex gap-3">
                <button 
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                >
                  View Live Report
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedReportId(null)} className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 bg-muted/20 px-4 py-2 rounded-xl">
              ← Back to Reports Catalog
            </button>
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted/10 px-4 py-2 rounded-xl border border-border/50">
              {currentReportData?.rows.length} Records Found
            </div>
          </div>
          
          <div className="erp-card overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {currentReportData?.headers.map((header, i) => (
                      <th key={header + i} className="text-left font-black tracking-wide text-foreground px-6 py-4 uppercase text-[11px] tracking-thighter">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentReportData?.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                  {currentReportData?.rows.length === 0 && (
                    <tr>
                      <td colSpan={currentReportData?.headers.length} className="px-6 py-12 text-center text-muted-foreground font-medium italic bg-muted/5">
                        No records match your current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ReportsPage;
