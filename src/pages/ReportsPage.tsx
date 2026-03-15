import { motion } from 'framer-motion';
import { FileDown, BarChart3 } from 'lucide-react';

const reportTypes = [
  { name: 'Sales Report', description: 'Complete sales data with vehicle and customer details' },
  { name: 'Customer Report', description: 'Customer list with purchase history' },
  { name: 'Vehicle Stock Report', description: 'Current inventory status and vehicle details' },
  { name: 'Payment Report', description: 'All payment transactions with mode and status' },
  { name: 'Loan Report', description: 'Loan disbursement, EMI, and status tracking' },
];

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card p-6">
        <h3 className="erp-section-title">Report Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className="erp-label">Date From</label><input className="erp-input" type="date" /></div>
          <div><label className="erp-label">Date To</label><input className="erp-input" type="date" /></div>
          <div>
            <label className="erp-label">Vehicle Model</label>
            <select className="erp-select">
              <option>All Models</option>
              <option>Maruti Swift</option>
              <option>Hyundai Creta</option>
              <option>Tata Nexon EV</option>
            </select>
          </div>
          <div>
            <label className="erp-label">Branch</label>
            <select className="erp-select">
              <option>All Branches</option>
              <option>Mumbai Central</option>
              <option>Delhi South</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report, i) => (
          <motion.div
            key={report.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="erp-card p-5 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold">{report.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 flex-1">{report.description}</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                <FileDown className="w-3.5 h-3.5" /> Excel
              </button>
              <button className="flex-1 py-2 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
