import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, X } from 'lucide-react';
import { customers as initialCustomers, Customer, formatCurrency, saleOrders, payments, loans, ledgerEntries } from '@/data/mockData';

const CustomersPage = () => {
  const [customers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center h-9 px-3 rounded-lg bg-card border border-input gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mobile</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">City</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 tabular">{c.mobile}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{c.city}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.createdDate}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedCustomer(c)} className="p-1.5 rounded hover:bg-muted transition-colors" title="View">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl ring-1 ring-border shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-base font-bold">Add Customer</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {['Customer Name', 'Mobile Number', 'Email', 'Address', 'City', 'State', 'Pincode'].map((label) => (
                <div key={label}>
                  <label className="erp-label">{label}</label>
                  <input className="erp-input" placeholder={label} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Save Customer</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl ring-1 ring-border shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-base font-bold">{selectedCustomer.name} — Profile</h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Mobile:</span> <span className="ml-2 font-medium">{selectedCustomer.mobile}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="ml-2 font-medium">{selectedCustomer.email}</span></div>
                <div><span className="text-muted-foreground">City:</span> <span className="ml-2 font-medium">{selectedCustomer.city}</span></div>
                <div><span className="text-muted-foreground">State:</span> <span className="ml-2 font-medium">{selectedCustomer.state}</span></div>
              </div>

              {/* Purchases */}
              <div>
                <h4 className="erp-section-title">Vehicles Purchased</h4>
                {saleOrders.filter(s => s.customerId === selectedCustomer.id).map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg mb-2 text-sm">
                    <span className="font-medium">{s.vehicle.model.brand} {s.vehicle.model.model}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.vehicle.chassisNumber}</span>
                    <span className="font-semibold tabular">{formatCurrency(s.totalAmount)}</span>
                  </div>
                ))}
              </div>

              {/* Payments */}
              <div>
                <h4 className="erp-section-title">Payments Made</h4>
                {payments.filter(p => p.customerId === selectedCustomer.id).map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg mb-2 text-sm">
                    <span>{p.paymentType}</span>
                    <span className="text-muted-foreground">{p.paymentDate}</span>
                    <span className="font-semibold tabular">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Ledger */}
              <div>
                <h4 className="erp-section-title">Ledger</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-xs font-semibold text-muted-foreground">Date</th>
                      <th className="text-left py-2 text-xs font-semibold text-muted-foreground">Description</th>
                      <th className="text-right py-2 text-xs font-semibold text-muted-foreground">Debit</th>
                      <th className="text-right py-2 text-xs font-semibold text-muted-foreground">Credit</th>
                      <th className="text-right py-2 text-xs font-semibold text-muted-foreground">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerEntries.filter(l => l.customerId === selectedCustomer.id).map(l => (
                      <tr key={l.id} className="border-b border-border last:border-0">
                        <td className="py-2">{l.date}</td>
                        <td className="py-2">{l.description}</td>
                        <td className="py-2 text-right tabular">{l.debit > 0 ? formatCurrency(l.debit) : '—'}</td>
                        <td className="py-2 text-right tabular">{l.credit > 0 ? formatCurrency(l.credit) : '—'}</td>
                        <td className="py-2 text-right tabular font-semibold">{formatCurrency(l.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
