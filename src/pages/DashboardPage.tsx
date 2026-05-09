import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Car, Users, ShoppingCart, CreditCard, Landmark, TrendingUp, Database,
  FileText, Hourglass, Truck, Shield, Phone, Gift, CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { getDashboardStatsAction } from '@/store/ducks/dashboard.ducks';
import { RootState } from '@/store/rootReducer';
import { getVehicleInventoryAction } from '@/store/ducks/vehicle_inventory.ducks';
import { api } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
  'hsl(280, 75%, 60%)',
  'hsl(340, 75%, 60%)',
  'hsl(180, 75%, 60%)'
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { stats, loading } = useSelector((state: RootState) => state.dashboard);
  const rawInventory = useSelector((state: RootState) => state.vehicleInventory);
  const { getFilteredData } = usePermissions();

  const inventory = useMemo(() => getFilteredData(rawInventory?.data || [], 'showroom'), [rawInventory?.data, getFilteredData]);
  const [isSeeding, setIsSeeding] = useState(false);

  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  useEffect(() => {
    if (!companyCode) return;
    dispatch(getDashboardStatsAction(companyCode));
    dispatch(getVehicleInventoryAction(companyCode));

    const interval = setInterval(() => {
      dispatch(getDashboardStatsAction(companyCode));
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch, companyCode]);

  const handleSeedDatabase = async () => {
    if (!companyCode) return;
    setIsSeeding(true);
    try {
      await api.post(`/dashboard/seed/${companyCode}`);
      dispatch(getDashboardStatsAction(companyCode));
    } catch (e) {
      console.error('Failed to seed DB', e);
    } finally {
      setIsSeeding(false);
    }
  };

  const isDatabaseEmpty = !stats?.total_vehicles_in_stock && !stats?.total_customers && !stats?.total_sales_revenue;

  // Compute brand-wise and model-wise available inventory from local state
  const availableInventory = useMemo(() => inventory.filter((v: any) => v.status === 'Available'), [inventory]);

  const modelAvailableData = useMemo(() => {
    const map: Record<string, number> = {};
    availableInventory.forEach((v: any) => {
      const key = `${v.brand} ${v.model}`.trim() || 'Unknown';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([model, count]) => ({ model, count })).sort((a, b) => b.count - a.count);
  }, [availableInventory]);

  const brandAvailableData = useMemo(() => {
    const map: Record<string, number> = {};
    availableInventory.forEach((v: any) => {
      const key = v.brand || 'Unknown';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count);
  }, [availableInventory]);

  const operationalCards = [
    { label: 'Registration Pending', value: stats?.registration_pending || 0, icon: FileText, color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
    { label: 'Registration In Process', value: stats?.registration_in_process || 0, icon: Hourglass, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    { label: 'Delivery Pending', value: stats?.delivery_pending || 0, icon: Truck, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
    { label: 'Insurance Pending', value: stats?.insurance_pending || 0, icon: Shield, color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
    { label: 'Today Follow-ups', value: stats?.today_follow_ups || 0, icon: Phone, color: 'text-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  ];

  const incentiveCards = [
    { label: 'Incentive Pending', value: stats?.incentive_pending || 0, icon: Gift, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
    { label: 'Incentive Paid', value: stats?.incentive_paid || 0, icon: CheckCircle2, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
  ];

  const statsCards = [
    { label: 'Vehicles in Stock', value: stats?.total_vehicles_in_stock || 0, icon: Car, color: 'text-info' },
    { label: 'Vehicles Sold', value: stats?.total_vehicles_sold || 0, icon: TrendingUp, color: 'text-success' },
    { label: 'Total Customers', value: stats?.total_customers || 0, icon: Users, color: 'text-primary' },
    { label: 'Total Sales', value: formatCurrency(stats?.total_sales_revenue || 0), icon: ShoppingCart, color: 'text-warning' },
    { label: 'Pending Payments', value: formatCurrency(stats?.total_pending_payments || 0), icon: CreditCard, color: 'text-destructive' },
    { label: 'Pending Loans', value: stats?.total_pending_loans || 0, icon: Landmark, color: 'text-muted-foreground' },
  ];

  const monthlyData = stats?.monthly_revenue || [];
  const modelSalesData = stats?.sales_by_model || [];
  const saleOrders = stats?.recent_sales || [];
  const followUpList = stats?.follow_up_list || [];

  const registrationStats = [
    { label: 'Registration Pending', count: stats?.registration_pending || 0 },
    { label: 'In Process', count: stats?.registration_in_process || 0 },
    { label: 'Completed', count: (stats?.total_vehicles_sold || 0) - (stats?.registration_pending || 0) - (stats?.registration_in_process || 0) },
  ];
  const maxReg = Math.max(...registrationStats.map(s => s.count), 1);

  return (
    <div className="space-y-6 relative">
      {(loading && !stats && !isSeeding) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl min-h-[500px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {isDatabaseEmpty && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between items-center bg-primary/10 border border-primary/20 text-primary p-4 rounded-lg">
          <p className="text-sm font-medium">The dashboard currently has no actual data. You can spawn a fully realistic database layout using the seed tool!</p>
          <button onClick={handleSeedDatabase} className="erp-btn-primary flex items-center gap-2">
            <Database className="w-4 h-4" />
            Seed Database
          </button>
        </motion.div>
      )}

      {/* Operational Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {operationalCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`erp-card p-5 border-l-4 ${stat.borderColor} relative overflow-hidden group`}
          >
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-foreground">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-xl ${stat.bgColor} ${stat.color} shadow-inner`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 relative z-10">
              <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">Updated Today</span>
              <span className={`w-1.5 h-1.5 rounded-full ${stat.bgColor.replace('/10', '/50')} animate-pulse`} />
              <span className={`text-[10px] font-bold ${stat.color} uppercase ml-auto`}>Active</span>
            </div>
            {/* Background Accent */}
            <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full ${stat.bgColor} blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-500`} />
          </motion.div>
        ))}
      </div>

      {/* Incentives Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incentiveCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
            className={`erp-card p-5 border-b-4 ${stat.borderColor} flex items-center justify-between group cursor-pointer`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bgColor} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</p>
                <p className="text-2xl font-black">{stat.value}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-bold text-muted-foreground mb-1">Live Tracking</span>
               <div className="flex gap-1">
                 {[1,2,3].map(j => <span key={j} className={`w-4 h-1 rounded-full ${stat.bgColor}`} />)}
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Financial Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + (i * 0.05) }}
            className="erp-card p-4 border border-border/30 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color} group-hover:scale-110 transition-transform`} />
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider whitespace-nowrap">{stat.label}</span>
            </div>
            <p className="text-xl font-black text-foreground truncate">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Follow-up List and Registration Progress Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Follow-up List */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-3 erp-card p-6 min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black tracking-tight">Today's Follow-up List</h3>
              <p className="text-xs text-muted-foreground font-medium">Active enquiries requiring follow-up today</p>
            </div>
            <button className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary rounded-lg border border-primary/20">View All</button>
          </div>
          
          <div className="space-y-3">
            {followUpList.length > 0 ? followUpList.map((enq, i) => (
              <motion.div 
                key={enq.entity_id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.7 + (i * 0.05) }}
                className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20">
                    {enq.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{enq.name}</h4>
                    <p className="text-[11px] text-muted-foreground font-medium">{enq.vehicle || 'Unknown Model'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${
                    enq.follow_ups?.[enq.follow_ups.length-1]?.status === 'Hot' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    enq.follow_ups?.[enq.follow_ups.length-1]?.status === 'Warm' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                  }`}>
                    {enq.follow_ups?.[enq.follow_ups.length-1]?.status || 'Cold'}
                  </span>
                  <div className="p-2 rounded-xl bg-card border border-border/50 group-hover:border-primary/30 transition-all">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Phone className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm font-bold italic opacity-50">No follow-ups scheduled for today</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Registration Status Progress */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="erp-card p-6">
          <h3 className="text-lg font-black tracking-tight mb-1">Registration Status</h3>
          <p className="text-xs text-muted-foreground font-medium mb-8">Process tracking for all sales</p>
          
          <div className="space-y-8">
            {registrationStats.map((reg, i) => (
              <div key={reg.label} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">{reg.label}</span>
                  <span className="text-xs font-black text-foreground">{Math.round((reg.count / maxReg) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(reg.count / maxReg) * 100}%` }}
                    transition={{ delay: 0.8 + (i * 0.1), duration: 1 }}
                    className={`h-full rounded-full ${
                      i === 0 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 
                      i === 1 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 
                      'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="erp-card p-6 lg:col-span-2 overflow-hidden relative"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="erp-section-title mb-1">Monthly Sales Revenue</h3>
              <p className="text-xs text-muted-foreground">Revenue trends over the last 6 months</p>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-3 h-3 rounded-full bg-primary/20 border border-primary/50" />
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revenue</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {monthlyData.length > 0 ? (
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600 }} 
                  stroke="hsl(var(--muted-foreground))" 
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600 }} 
                  stroke="hsl(var(--muted-foreground))" 
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} 
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']} 
                />
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--primary))" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground font-medium italic">No tracking data available yet</div>
            )}
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="erp-card p-6"
        >
          <h3 className="erp-section-title">Sales by Model</h3>
          <ResponsiveContainer width="100%" height={220}>
            {modelSalesData.length > 0 ? (
              <PieChart>
                <Pie data={modelSalesData} dataKey="count" nameKey="model" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}>
                  {modelSalesData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data available</div>
            )}
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {modelSalesData.map((item: any, i: number) => (
              <div key={item.model} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground">{item.model}</span>
                <span className="ml-auto font-semibold tabular">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 — Available Stock by Model & Brand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="erp-card p-6"
        >
          <h3 className="erp-section-title">Available Stock — By Model</h3>
          <p className="text-xs text-muted-foreground mb-4">Current inventory available for sale, grouped by model</p>
          {modelAvailableData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={modelAvailableData}
                    dataKey="count"
                    nameKey="model"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    strokeWidth={2}
                  >
                    {modelAvailableData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {modelAvailableData.map((item, i) => (
                  <div key={item.model} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{item.model}</span>
                    <span className="ml-auto font-black tabular-nums">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No available vehicles in stock</div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="erp-card p-6"
        >
          <h3 className="erp-section-title">Available Stock — By Brand</h3>
          <p className="text-xs text-muted-foreground mb-4">Current inventory available for sale, grouped by brand</p>
          {brandAvailableData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={brandAvailableData}
                    dataKey="count"
                    nameKey="brand"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    strokeWidth={2}
                  >
                    {brandAvailableData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {brandAvailableData.map((item, i) => (
                  <div key={item.brand} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{item.brand}</span>
                    <span className="ml-auto font-black tabular-nums">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No available vehicles in stock</div>
          )}
        </motion.div>
      </div>

      {/* Recent Sales */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="erp-card"
      >
        <div className="p-4 border-b border-border">
          <h3 className="erp-section-title mb-0">Recent Sales Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">VIN</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {saleOrders.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                     No recent sales available
                   </td>
                 </tr>
              ) : saleOrders.map((order: any) => (
                <tr key={order.entity_id || order.id || order._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-semibold">{order.sales_order_code || '-'}</td>
                  <td className="px-4 py-3">{order.customer_name}</td>
                  <td className="px-4 py-3">{order.brand} {order.model}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.chassis_number || '-'}</td>
                  <td className="px-4 py-3 text-right tabular font-semibold">{formatCurrency(order.total_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${order.status === 'Confirmed' ? 'status-reserved' : order.status === 'Delivered' ? 'status-delivered' : 'status-available'}`}>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
