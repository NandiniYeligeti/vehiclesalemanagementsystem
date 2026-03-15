import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { vehicleModels as initialModels, vehicleInventory as initialInventory, VehicleModel, VehicleInventory } from '@/data/mockData';

const VehiclesPage = () => {
  const [tab, setTab] = useState<'models' | 'inventory'>('inventory');
  const [models] = useState<VehicleModel[]>(initialModels);
  const [inventory] = useState<VehicleInventory[]>(initialInventory);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModelForm, setShowModelForm] = useState(false);
  const [showInventoryForm, setShowInventoryForm] = useState(false);

  const filteredInventory = inventory.filter(v => {
    const matchSearch = v.chassisNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.model.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.model.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredModels = models.filter(m =>
    m.brand.toLowerCase().includes(search.toLowerCase()) || m.model.toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = {
    All: inventory.length,
    Available: inventory.filter(v => v.status === 'Available').length,
    Reserved: inventory.filter(v => v.status === 'Reserved').length,
    Sold: inventory.filter(v => v.status === 'Sold').length,
    Delivered: inventory.filter(v => v.status === 'Delivered').length,
  };

  return (
    <div className="space-y-6">
      {/* Tab Toggle */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
        <button onClick={() => setTab('inventory')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'inventory' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
          Inventory
        </button>
        <button onClick={() => setTab('models')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'models' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
          Vehicle Models
        </button>
      </div>

      {tab === 'inventory' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center h-9 px-3 rounded-lg bg-card border border-input gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search chassis, model..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === status ? 'bg-primary text-primary-foreground' : 'bg-card border border-input text-muted-foreground hover:text-foreground'}`}
                  >
                    {status} ({count})
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowInventoryForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          </div>

          {/* Inventory Table */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chassis Number</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Engine Number</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Purchase Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((v) => (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{v.model.brand} {v.model.model}</div>
                        <div className="text-xs text-muted-foreground">{v.model.variant} • {v.model.fuelType}</div>
                      </td>
                      <td className="px-4 py-3">{v.color}</td>
                      <td className="px-4 py-3 font-mono text-xs">{v.chassisNumber}</td>
                      <td className="px-4 py-3 font-mono text-xs hidden md:table-cell">{v.engineNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{v.purchaseDate}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${v.status === 'Available' ? 'status-available' : v.status === 'Sold' ? 'status-sold' : v.status === 'Reserved' ? 'status-reserved' : 'status-delivered'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1.5 rounded hover:bg-muted transition-colors"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      ) : (
        <>
          {/* Models */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center h-9 px-3 rounded-lg bg-card border border-input gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search models..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground" />
            </div>
            <button onClick={() => setShowModelForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Add Model
            </button>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Model</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fuel</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base Price</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold">{m.brand}</td>
                      <td className="px-4 py-3">{m.model}</td>
                      <td className="px-4 py-3">{m.variant}</td>
                      <td className="px-4 py-3"><span className="status-badge status-available">{m.fuelType}</span></td>
                      <td className="px-4 py-3 text-right tabular font-semibold">₹{m.basePrice.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded hover:bg-muted transition-colors"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                          <button className="p-1.5 rounded hover:bg-muted transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}

      {/* Add Model Modal */}
      {showModelForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl ring-1 ring-border shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-base font-bold">Add Vehicle Model</h3>
              <button onClick={() => setShowModelForm(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {['Brand', 'Model', 'Variant', 'Fuel Type', 'Base Price'].map((label) => (
                <div key={label}><label className="erp-label">{label}</label><input className="erp-input" placeholder={label} /></div>
              ))}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setShowModelForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => setShowModelForm(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Save Model</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Inventory Modal */}
      {showInventoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl ring-1 ring-border shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-base font-bold">Add Vehicle to Inventory</h3>
              <button onClick={() => setShowInventoryForm(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="erp-label">Vehicle Model</label>
                <select className="erp-select">
                  <option value="">Select Model</option>
                  {models.map(m => <option key={m.id} value={m.id}>{m.brand} {m.model} {m.variant}</option>)}
                </select>
              </div>
              {['Color', 'Chassis Number', 'Engine Number', 'Purchase Date'].map((label) => (
                <div key={label}><label className="erp-label">{label}</label><input className="erp-input" placeholder={label} type={label.includes('Date') ? 'date' : 'text'} /></div>
              ))}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setShowInventoryForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => setShowInventoryForm(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Save Vehicle</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VehiclesPage;
