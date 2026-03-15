import { useState } from 'react';
import { motion } from 'framer-motion';
import { customers, ledgerEntries, formatCurrency } from '@/data/mockData';

const LedgerPage = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0].id);

  const entries = ledgerEntries.filter(l => l.customerId === selectedCustomerId);
  const customer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <label className="erp-label">Select Customer</label>
          <select className="erp-select w-64" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {customer && (
          <div className="text-sm text-muted-foreground mt-auto">
            {customer.mobile} • {customer.city}
          </div>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card">
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
              {entries.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No ledger entries found for this customer.</td></tr>
              ) : (
                entries.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{l.date}</td>
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
