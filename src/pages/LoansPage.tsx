import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { loans, formatCurrency } from '@/data/mockData';

const LoansPage = () => {
  const [search, setSearch] = useState('');

  const filtered = loans.filter(l =>
    l.customer.name.toLowerCase().includes(search.toLowerCase()) ||
    l.bankName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center h-9 px-3 rounded-lg bg-card border border-input gap-2 w-fit">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search loans..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((loan, i) => (
          <motion.div
            key={loan.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="erp-card p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold">{loan.customer.name}</h3>
                <p className="text-xs text-muted-foreground">Order: {loan.saleOrderId}</p>
              </div>
              <span className={`status-badge ${loan.status === 'Disbursed' ? 'status-sold' : loan.status === 'Approved' ? 'status-available' : loan.status === 'Pending' ? 'status-reserved' : 'status-delivered'}`}>
                {loan.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-medium">{loan.bankName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Loan Amount</span><span className="font-semibold tabular">{formatCurrency(loan.loanAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">EMI</span><span className="tabular">{formatCurrency(loan.emiAmount)}/mo</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tenure</span><span>{loan.tenure} months</span></div>
              {loan.disbursementDate && (
                <div className="flex justify-between"><span className="text-muted-foreground">Disbursed</span><span>{loan.disbursementDate}</span></div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LoansPage;
