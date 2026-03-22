import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/data/mockData';
import { useDispatch, useSelector } from 'react-redux';
import { getCustomersAction, getCustomerLedgerAction } from '@/store/ducks/customers.ducks';
import { RootState } from '@/store/rootReducer';

const LedgerPage = () => {
  const dispatch = useDispatch();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const { data: customers, ledger, ledgerLoading, loading } = useSelector((state: RootState) => state.customers);
  const user = useSelector((state: RootState) => state.auth.user);
  
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

  const customer = customers?.find((c: any) => c.entity_id === selectedCustomerId || c._id === selectedCustomerId || c.id === selectedCustomerId);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <label className="erp-label">Select Customer</label>
          <select 
            className="erp-select w-64" 
            value={selectedCustomerId} 
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            disabled={loading}
          >
            {customers?.map((c: any) => (
              <option key={c.entity_id || c._id || c.id} value={c.entity_id || c._id || c.id}>
                {c.customer_name || c.name}
              </option>
            ))}
          </select>
        </div>
        {customer && (
          <div className="text-sm text-muted-foreground mt-auto">
            {customer.mobile_number || customer.mobile} • {customer.city}
          </div>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card relative min-h-[200px]">
        {ledgerLoading && (
           <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
           </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Debit</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credit</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody>
              {!ledger || ledger.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No ledger entries found for this customer.</td></tr>
              ) : (
                ledger.map((l: any) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(l.date)}</td>
                    <td className="px-4 py-3">{l.description}</td>
                    <td className="px-4 py-3 text-right tabular text-destructive">{l.debit > 0 ? formatCurrency(l.debit) : '—'}</td>
                    <td className="px-4 py-3 text-right tabular text-success">{l.credit > 0 ? formatCurrency(l.credit) : '—'}</td>
                    <td className="px-4 py-3 text-right tabular font-bold">{formatCurrency(l.balance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default LedgerPage;
