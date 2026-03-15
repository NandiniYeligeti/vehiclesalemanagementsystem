import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2 } from 'lucide-react';
import { salespersons as initialSalespersons, Salesperson } from '@/data/mockData';

const SalespersonsPage = () => {
  const [salespersons] = useState<Salesperson[]>(initialSalespersons);
  const [search, setSearch] = useState('');

  const filtered = salespersons.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center h-9 px-3 rounded-lg bg-card border border-input gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search salespersons..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground" />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Salesperson
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sp, i) => (
          <motion.div
            key={sp.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="erp-card p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-base">{sp.name}</h3>
                <p className="text-xs text-muted-foreground">{sp.branch}</p>
              </div>
              <span className={`status-badge ${sp.status === 'Active' ? 'status-available' : 'status-reserved'}`}>
                {sp.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Mobile</span><span className="tabular">{sp.mobile}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{sp.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Commission</span><span className="font-semibold">{sp.commissionPct}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Sales</span><span className="font-bold text-primary">{sp.totalSales}</span></div>
            </div>
            <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SalespersonsPage;
