import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { getCustomersAction, getCustomerLedgerAction } from '@/store/ducks/customers.ducks';
import { RootState } from '@/store/rootReducer';
import { CarFront, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const LedgerPage = () => {
  const dispatch = useDispatch();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('all');

  const { data: rawCustomers, ledger, ledgerLoading, loading } = useSelector((state: RootState) => state.customers);
  const { user } = useSelector((state: RootState) => state.auth);
  const { getFilteredData } = usePermissions();

  const customers = useMemo(() => getFilteredData(rawCustomers || [], 'showroom'), [rawCustomers, getFilteredData]);
  
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  useEffect(() => {
    if (companyCode && customers.length === 0) {
      dispatch(getCustomersAction(companyCode));
    }
  }, [dispatch, companyCode, customers.length]);

  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomerId) {
      const firstId = customers[0].entity_id || customers[0]._id || customers[0].id || '';
      setSelectedCustomerId(firstId);
    }
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (selectedCustomerId) {
       dispatch(getCustomerLedgerAction(selectedCustomerId));
    }
  }, [dispatch, selectedCustomerId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    } catch {
      return dateString;
    }
  };

  // Process data for UI
  const { totalPurchase, totalPaid, totalOutstanding, vehiclesArray } = useMemo(() => {
    if (!ledger || !ledger.length) {
      return { totalPurchase: 0, totalPaid: 0, totalOutstanding: 0, vehiclesArray: [] };
    }

    let globalPurchase = 0;
    let globalPaid = 0;

    const groupMap: Record<string, any> = {};

    ledger.forEach((item: any) => {
      globalPurchase += (item.debit || 0);
      globalPaid += (item.credit || 0);

      const vId = item.vehicle_id || 'unassigned';
      if (!groupMap[vId]) {
        groupMap[vId] = {
          vehicle_id: vId,
          vehicle_name: item.vehicle_name || 'Other/Unassigned',
          sales_order_code: item.sales_order_code || '',
          items: [],
          outstanding: 0
        };
      }
      groupMap[vId].items.push({ ...item });
    });

    const arr = Object.values(groupMap);

    // Calculate local balances per vehicle
    arr.forEach(group => {
      let runBalance = 0;
      group.items.forEach((txn: any) => {
        runBalance += (txn.debit || 0);
        runBalance -= (txn.credit || 0);
        txn.localBalance = runBalance;
      });
      group.outstanding = runBalance;
    });

    return {
      totalPurchase: globalPurchase,
      totalPaid: globalPaid,
      totalOutstanding: globalPurchase - globalPaid,
      vehiclesArray: arr
    };
  }, [ledger]);

  const displayedVehicles = selectedVehicleId === 'all' 
    ? vehiclesArray 
    : vehiclesArray.filter(v => v.vehicle_id === selectedVehicleId);

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

  const handleExportExcel = () => {
    if (!ledger || ledger.length === 0) {
      toast.error('No ledger data to export');
      return;
    }

    const headers = ['Date', 'Vehicle', 'Description', 'Status', 'Debit', 'Credit', 'Balance'];
    const rows = ledger.map((item: any) => [
      formatDate(item.date),
      item.vehicle_name || 'N/A',
      item.description || '',
      item.status || '',
      item.debit || 0,
      item.credit || 0,
      item.localBalance || 0
    ]);

    const customerName = customers.find((c: any) => (c.entity_id || c._id || c.id) === selectedCustomerId)?.customer_name || 'Customer';
    downloadCSV(`${customerName}_Ledger`, headers, rows);
    toast.success('Ledger data exported to Excel');
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-foreground">
      <h1 className="text-2xl font-bold tracking-tight">Customer Ledger</h1>

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 erp-card p-4">
        <select 
          className="w-full sm:w-[40%] h-11 px-4 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-muted/30 text-foreground font-semibold"
          value={selectedCustomerId} 
          onChange={(e) => {
            setSelectedCustomerId(e.target.value);
            setSelectedVehicleId('all');
          }}
          disabled={loading}
        >
          {customers?.map((c: any) => (
            <option key={c.entity_id || c._id || c.id} value={c.entity_id || c._id || c.id}>
              {c.customer_name || c.name}
            </option>
          ))}
        </select>

        <select 
          className="w-full sm:w-[30%] h-10 px-3 border border-border rounded-md text-sm outline-none focus:border-primary transition-colors bg-background text-foreground appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5z%22%20fill%3D%22%2394a3b8%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center]"
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
        >
          <option value="all">All Sales Orders / Vehicles</option>
          {vehiclesArray.map(v => (
            <option key={v.vehicle_id} value={v.vehicle_id}>
              {v.sales_order_code ? `${v.sales_order_code} — ` : ''}{v.vehicle_name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Purchase</p>
          <h2 className="text-2xl font-bold text-foreground">{formatCurrency(totalPurchase)}</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Paid</p>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">Outstanding</p>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalOutstanding)}</h2>
        </div>
      </div>

      {/* Loader */}
      {ledgerLoading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Vehicle Groups */}
      {!ledgerLoading && displayedVehicles.length === 0 && (
         <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">
            No ledger entries found for this customer.
         </div>
      )}

      {!ledgerLoading && displayedVehicles.map(group => (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card overflow-hidden" key={group.vehicle_id}>
          <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
            <CarFront className="w-5 h-5 text-red-500 fill-red-100 dark:fill-red-900/30" />
            <div className="flex flex-col">
              <h3 className="font-bold text-foreground">{group.vehicle_name}</h3>
              {group.sales_order_code && (
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{group.sales_order_code}</span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-transparent">
                  <th className="px-5 py-4 font-bold text-foreground">Date</th>
                  <th className="px-5 py-4 font-bold text-foreground">Description</th>
                  <th className="px-5 py-4 font-bold text-foreground">Debit</th>
                  <th className="px-5 py-4 font-bold text-foreground">Credit</th>
                  <th className="px-5 py-4 font-bold text-foreground">Balance</th>
                  <th className="px-5 py-4 font-bold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground/80">
                {group.items.map((entry: any) => (
                  <tr key={entry.id || Math.random()} className="hover:bg-muted/5 transition-colors bg-card">
                    <td className="px-5 py-4 whitespace-nowrap">{formatDate(entry.date)}</td>
                    <td className="px-5 py-4 font-medium whitespace-nowrap">{entry.description}</td>
                    <td className="px-5 py-4 font-medium whitespace-nowrap">
                      {entry.description === 'Discount Allowed' 
                        ? <span className="text-red-600 dark:text-red-400">{formatCurrency(entry.credit)}</span> 
                        : (entry.debit > 0 ? <span className="text-red-600 dark:text-red-400">{formatCurrency(entry.debit)}</span> : '-')}
                    </td>
                    <td className="px-5 py-4 font-medium whitespace-nowrap">
                      {entry.description === 'Discount Allowed' 
                        ? '-' 
                        : (entry.credit > 0 ? <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(entry.credit)}</span> : '-')}
                    </td>
                    <td className="px-5 py-4 font-bold text-foreground whitespace-nowrap">{formatCurrency(entry.localBalance)}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {entry.status ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                          ['Done', 'Received', 'Disbursed'].includes(entry.status) ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                          ['Pending', 'Applied'].includes(entry.status) ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                          entry.status === 'Approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                          entry.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {entry.status}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card Footer */}
          <div className="px-5 py-4 border-t border-border bg-muted/10 flex justify-end">
            <h4 className="font-black text-foreground">Outstanding: {formatCurrency(group.outstanding)}</h4>
          </div>
        </motion.div>
      ))}

      {/* Bottom Buttons */}
      <div className="flex items-center gap-3 pt-4 print:hidden">
        <button 
          onClick={handleExportPDF}
          className="h-11 px-6 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Export Document (PDF)
        </button>
        <button 
          onClick={handleExportExcel}
          className="h-11 px-6 erp-card hover:bg-muted text-foreground text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export Data (Excel)
        </button>
      </div>

    </div>
  );
};

export default LedgerPage;
