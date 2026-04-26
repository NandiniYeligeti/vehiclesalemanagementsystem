import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Car, Users, ShoppingCart, CreditCard, Landmark, TrendingUp, Database
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {statsCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="erp-card p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-sm text-muted-foreground font-semibold">{stat.label}</span>
            </div>
            <p className="text-3xl font-black mt-1 text-foreground whitespace-nowrap overflow-hidden text-ellipsis">{stat.value}</p>
          </motion.div>
        ))}
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
