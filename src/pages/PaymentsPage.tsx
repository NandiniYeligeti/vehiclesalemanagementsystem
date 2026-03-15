import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Printer, X } from 'lucide-react';
import { payments as initialPayments, customers, salespersons, formatCurrency } from '@/data/mockData';

const PaymentsPage = () => {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = initialPayments.filter(p =>
    p.customer.name.toLowerCase().includes(search.toLowerCase()) ||
    p.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.receiptNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center h-9 px-3 rounded-lg bg-card border border-input gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground" />
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Receipt', 'Customer', 'Invoice', 'Date', 'Amount', 'Mode', 'Type', 'Status'].map(h => (
                  <th key={h} className={`${h === 'Amount' ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{p.receiptNumber}</td>
                  <td className="px-4 py-3 font-semibold">{p.customer.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.invoiceNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.paymentDate}</td>
                  <td className="px-4 py-3 text-right tabular font-semibold">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3"><span className="status-badge status-available">{p.paymentMode}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{p.paymentType}</td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${p.status === 'Completed' ? 'status-sold' : p.status === 'Pending' ? 'status-reserved' : 'bg-red-100 text-red-700'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Record Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl ring-1 ring-border shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-base font-bold">Record Payment</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="erp-label">Customer</label>
                <select className="erp-select">
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="erp-label">Invoice Number</label><input className="erp-input" placeholder="SO-XXXX" /></div>
              <div><label className="erp-label">Payment Date</label><input className="erp-input" type="date" /></div>
              <div><label className="erp-label">Payment Amount</label><input className="erp-input" type="number" placeholder="0" /></div>
              <div>
                <label className="erp-label">Payment Mode</label>
                <select className="erp-select">
                  {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Payment Type</label>
                <select className="erp-select">
                  {['Down Payment', 'Loan Disbursement', 'Balance Payment', 'Accessories Payment'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="erp-label">Reference Number</label><input className="erp-input" /></div>
              <div><label className="erp-label">Bank Name</label><input className="erp-input" /></div>
              <div>
                <label className="erp-label">Collected By</label>
                <select className="erp-select">
                  {salespersons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="erp-label">Branch</label><input className="erp-input" /></div>
              <div className="sm:col-span-2"><label className="erp-label">Remarks</label><textarea className="erp-input h-20 resize-none" /></div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button className="px-4 py-2 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Save Payment</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
