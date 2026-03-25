import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { getCustomersAction, getCustomerLedgerAction } from '@/store/ducks/customers.ducks';
import { RootState } from '@/store/rootReducer';
import { CarFront } from 'lucide-react';

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 font-sans">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Ledger</h1>

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <select 
          className="w-full sm:w-[40%] h-10 px-3 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 transition-colors"
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
          className="w-full sm:w-[30%] h-10 px-3 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 transition-colors bg-white text-slate-800 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5z%22%20fill%3D%22%2394a3b8%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center]"
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
        >
          <option value="all">Select Vehicle</option>
          {vehiclesArray.map(v => (
            <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_name}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Purchase</p>
          <h2 className="text-2xl font-bold text-slate-900">{formatCurrency(totalPurchase)}</h2>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Paid</p>
          <h2 className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</h2>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Outstanding</p>
          <h2 className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</h2>
        </div>
      </div>

      {/* Loader */}
      {ledgerLoading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
        </div>
      )}

      {/* Vehicle Groups */}
      {!ledgerLoading && displayedVehicles.length === 0 && (
         <div className="text-center py-20 text-slate-500 bg-white rounded-lg border border-slate-200">
            No ledger entries found for this customer.
         </div>
      )}

      {!ledgerLoading && displayedVehicles.map(group => (
        <motion.div 
           initial={{ opacity: 0, y: 10 }} 
           animate={{ opacity: 1, y: 0 }} 
           key={group.vehicle_id} 
           className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
        >
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <CarFront className="w-5 h-5 text-red-500 fill-red-100" />
            <h3 className="font-bold text-slate-800">{group.vehicle_name}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="px-5 py-3 font-semibold text-slate-800">Date</th>
                  <th className="px-5 py-3 font-semibold text-slate-800">Description</th>
                  <th className="px-5 py-3 font-semibold text-slate-800">Debit</th>
                  <th className="px-5 py-3 font-semibold text-slate-800">Credit</th>
                  <th className="px-5 py-3 font-semibold text-slate-800">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {group.items.map((entry: any) => (
                  <tr key={entry.id || Math.random()}>
                    <td className="px-5 py-3">{formatDate(entry.date)}</td>
                    <td className="px-5 py-3">{entry.description}</td>
                    <td className="px-5 py-3 text-red-500">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                    <td className="px-5 py-3 text-emerald-600">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{formatCurrency(entry.localBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card Footer */}
          <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
            <h4 className="font-bold text-slate-800">Outstanding: {formatCurrency(group.outstanding)}</h4>
          </div>
        </motion.div>
      ))}

      {/* Bottom Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <button className="h-10 px-6 bg-[#070F2B] hover:bg-[#1B1A55] text-white text-sm font-semibold rounded-md shadow transition-colors">
          Export PDF
        </button>
        <button className="h-10 px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-md shadow-sm transition-colors">
          Export Excel
        </button>
      </div>

    </div>
  );
};

export default LedgerPage;
