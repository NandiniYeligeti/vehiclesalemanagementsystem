import { useState } from 'react';
import { motion } from 'framer-motion';
import { Printer, Save } from 'lucide-react';
import { customers, salespersons, vehicleInventory, vehicleModels, formatCurrency } from '@/data/mockData';

const SalesOrderPage = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [registrationCharges, setRegistrationCharges] = useState(45000);
  const [insurance, setInsurance] = useState(28000);
  const [accessories, setAccessories] = useState(15000);
  const [downPayment, setDownPayment] = useState(0);
  const [loanAmount, setLoanAmount] = useState(0);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const availableVehicles = vehicleInventory.filter(v => v.status === 'Available');
  const selectedVehicle = vehicleInventory.find(v => v.id === selectedVehicleId);
  const vehiclePrice = selectedVehicle?.model.basePrice || 0;
  const totalAmount = vehiclePrice + registrationCharges + insurance + accessories;
  const balanceAmount = totalAmount - downPayment - loanAmount;

  return (
    <div className="grid grid-cols-12 gap-6 lg:gap-8">
      {/* Left: Form Sections */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        {/* Customer Information */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card p-6">
          <h3 className="erp-section-title">Customer Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="erp-label">Select Customer</label>
              <select className="erp-select" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="erp-label">Mobile Number</label><input className="erp-input" value={selectedCustomer?.mobile || ''} readOnly /></div>
            <div><label className="erp-label">Email</label><input className="erp-input" value={selectedCustomer?.email || ''} readOnly /></div>
            <div><label className="erp-label">Address</label><input className="erp-input" value={selectedCustomer ? `${selectedCustomer.address}, ${selectedCustomer.city}` : ''} readOnly /></div>
          </div>
        </motion.section>

        {/* Vehicle Details */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="erp-card p-6">
          <h3 className="erp-section-title">Vehicle Selection</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="erp-label">Select Vehicle (Available Only)</label>
              <select className="erp-select" value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}>
                <option value="">Select Vehicle</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.model.brand} {v.model.model} {v.model.variant} — {v.color} [{v.chassisNumber}]</option>
                ))}
              </select>
            </div>
            {selectedVehicle && (
              <>
                <div><label className="erp-label">Fuel Type</label><input className="erp-input" value={selectedVehicle.model.fuelType} readOnly /></div>
                <div><label className="erp-label">Color</label><input className="erp-input" value={selectedVehicle.color} readOnly /></div>
                <div><label className="erp-label">Chassis Number</label><input className="erp-input font-mono" value={selectedVehicle.chassisNumber} readOnly /></div>
                <div><label className="erp-label">Engine Number</label><input className="erp-input font-mono" value={selectedVehicle.engineNumber} readOnly /></div>
              </>
            )}
          </div>
        </motion.section>

        {/* Sales Details */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="erp-card p-6">
          <h3 className="erp-section-title">Sales Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="erp-label">Salesperson</label>
              <select className="erp-select">
                <option value="">Select Salesperson</option>
                {salespersons.map(s => <option key={s.id} value={s.id}>{s.name} — {s.branch}</option>)}
              </select>
            </div>
            <div><label className="erp-label">Sale Date</label><input className="erp-input" type="date" defaultValue="2026-03-15" /></div>
            <div><label className="erp-label">Delivery Date</label><input className="erp-input" type="date" /></div>
          </div>
        </motion.section>

        {/* Payment Calculation */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="erp-card p-6">
          <h3 className="erp-section-title">Payment Calculation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="erp-label">Vehicle Price</label><input className="erp-input tabular" value={vehiclePrice.toLocaleString('en-IN')} readOnly /></div>
            <div><label className="erp-label">Registration Charges</label><input className="erp-input tabular" type="number" value={registrationCharges} onChange={(e) => setRegistrationCharges(Number(e.target.value))} /></div>
            <div><label className="erp-label">Insurance</label><input className="erp-input tabular" type="number" value={insurance} onChange={(e) => setInsurance(Number(e.target.value))} /></div>
            <div><label className="erp-label">Accessories</label><input className="erp-input tabular" type="number" value={accessories} onChange={(e) => setAccessories(Number(e.target.value))} /></div>
          </div>
        </motion.section>

        {/* Payment Section */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="erp-card p-6">
          <h3 className="erp-section-title">Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="erp-label">Down Payment</label><input className="erp-input tabular" type="number" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} /></div>
            <div><label className="erp-label">Loan Amount</label><input className="erp-input tabular" type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} /></div>
            <div><label className="erp-label">Balance Amount</label><input className="erp-input tabular font-semibold" value={balanceAmount.toLocaleString('en-IN')} readOnly /></div>
          </div>
        </motion.section>
      </div>

      {/* Right: Financial Summary (Sticky) */}
      <div className="col-span-12 lg:col-span-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:sticky lg:top-8 p-6 bg-foreground text-background rounded-xl shadow-xl"
        >
          <h3 className="text-lg font-semibold mb-6">Sale Summary</h3>
          <div className="space-y-3 tabular text-sm">
            <div className="flex justify-between opacity-70"><span>Vehicle Price</span><span>{formatCurrency(vehiclePrice)}</span></div>
            <div className="flex justify-between opacity-70"><span>Registration</span><span>{formatCurrency(registrationCharges)}</span></div>
            <div className="flex justify-between opacity-70"><span>Insurance</span><span>{formatCurrency(insurance)}</span></div>
            <div className="flex justify-between opacity-70"><span>Accessories</span><span>{formatCurrency(accessories)}</span></div>
            <div className="pt-4 mt-4 border-t border-background/10 flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between opacity-70"><span>Down Payment</span><span>- {formatCurrency(downPayment)}</span></div>
            <div className="flex justify-between opacity-70"><span>Loan Amount</span><span>- {formatCurrency(loanAmount)}</span></div>
            <div className="pt-3 mt-3 border-t border-background/10 flex justify-between font-bold">
              <span>Balance Due</span>
              <span>{formatCurrency(balanceAmount)}</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            <button className="w-full py-3 bg-primary hover:opacity-90 rounded-lg font-semibold transition-opacity flex items-center justify-center gap-2 text-primary-foreground">
              <Save className="w-4 h-4" /> Save Sale
            </button>
            <button className="w-full py-3 border border-background/20 hover:bg-background/5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> Save & Print Invoice
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SalesOrderPage;
