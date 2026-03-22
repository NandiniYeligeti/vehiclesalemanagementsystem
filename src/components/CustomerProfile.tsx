
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { saleOrders, payments, loans, vehicleInventory, formatCurrency } from '@/data/mockData';
import { useDispatch, useSelector } from 'react-redux';
import { getCustomerLedgerAction } from '@/store/ducks/customers.ducks';

interface CustomerProfileProps {
  customer: any;
  onClose: () => void;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customer, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');

  // Filter data for this customer
  const customerId = customer.id || customer._id;
  const dispatch = useDispatch();
  // Live data from Redux
  const salesOrders = useSelector((state: any) => state.salesOrders.data || []);
  const payments = useSelector((state: any) => state.payments.data || []);
  const loans = useSelector((state: any) => state.loans.data || []);
  const customerLedger = useSelector((state: any) => state.customers.ledger);
  const ledgerLoading = useSelector((state: any) => state.customers.ledgerLoading);

  // Filter for this customer
  const customerVehicles = salesOrders.filter((s: any) => s.customer_id === customerId);
  const customerPayments = payments.filter((p: any) => p.customer_id === customerId);
  const customerLoans = loans.filter((l: any) => l.customer_id === customerId);

  useEffect(() => {
    if (customerId) {
      dispatch(getCustomerLedgerAction(customerId));
    }
  }, [dispatch, customerId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
      <div className="bg-card rounded-2xl ring-1 ring-border shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg overflow-hidden border border-border">
              {customer.photo ? (
                <img src={`http://localhost:4001/uploads/${customer.photo}`} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                (customer.customer_name || customer.name || '?')[0].toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold">{customer.customer_name || customer.name}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{customer.customer_code || customer.id || 'No Code'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">✕</button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="loan">Loan</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            {/* Profile fields mapped here */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Mobile</p>
                <p className="text-sm font-semibold">{customer.mobile_number || customer.mobile}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Email</p>
                <p className="text-sm font-semibold">{customer.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">City</p>
                <p className="text-sm font-semibold">{customer.city}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">State</p>
                <p className="text-sm font-semibold">{customer.state}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Aadhaar</p>
                <p className="text-sm font-semibold">{customer.aadhaar_card_no || customer.aadhaarCardNo}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">PAN</p>
                <p className="text-sm font-semibold">{customer.pan_card_no || customer.panCardNo}</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="vehicles">
            {/* Vehicles data here */}
            {customerVehicles.length > 0 ? (
              <div className="space-y-3">
                {customerVehicles.map((so) => (
                  <div key={so.id} className="p-4 border rounded-xl flex flex-col gap-1">
                    <div className="font-bold">{so.vehicle.model.brand} {so.vehicle.model.model} ({so.vehicle.model.variant})</div>
                    <div className="text-xs text-muted-foreground">Chassis: {so.vehicle.chassisNumber} | Engine: {so.vehicle.engineNumber}</div>
                    <div className="text-xs">Color: {so.vehicle.color} | Status: {so.vehicle.status}</div>
                    <div className="text-xs">Sale Date: {so.saleDate} | Delivery: {so.deliveryDate}</div>
                  </div>
                ))}
              </div>
            ) : <div className="text-muted-foreground text-sm">No vehicles found.</div>}
          </TabsContent>
          <TabsContent value="loan">
            {/* Loan data here */}
            {customerLoans.length > 0 ? (
              <div className="space-y-3">
                {customerLoans.map((loan) => (
                  <div key={loan.id} className="p-4 border rounded-xl flex flex-col gap-1">
                    <div className="font-bold">Bank: {loan.bankName}</div>
                    <div className="text-xs">Loan Amount: {formatCurrency(loan.loanAmount)} | EMI: {formatCurrency(loan.emiAmount)} | Tenure: {loan.tenure} months</div>
                    <div className="text-xs">Status: {loan.status} | Disbursement: {loan.disbursementDate || '—'}</div>
                  </div>
                ))}
              </div>
            ) : <div className="text-muted-foreground text-sm">No loan records found.</div>}
          </TabsContent>
          <TabsContent value="payments">
            {/* Payments data here */}
            {customerPayments.length > 0 ? (
              <div className="space-y-3">
                {customerPayments.map((p) => (
                  <div key={p.id} className="p-4 border rounded-xl flex flex-col gap-1">
                    <div className="font-bold">{p.paymentType} ({p.paymentMode})</div>
                    <div className="text-xs">Amount: {formatCurrency(p.amount)} | Date: {p.paymentDate}</div>
                    <div className="text-xs">Status: {p.status} | Ref: {p.referenceNumber}</div>
                  </div>
                ))}
              </div>
            ) : <div className="text-muted-foreground text-sm">No payments found.</div>}
          </TabsContent>
          <TabsContent value="ledger">
            {/* Ledger data here */}
            {ledgerLoading ? (
              <div className="text-muted-foreground text-sm">Loading ledger...</div>
            ) : customerLedger && customerLedger.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="px-2 py-1">Date</th>
                      <th className="px-2 py-1">Description</th>
                      <th className="px-2 py-1">Debit</th>
                      <th className="px-2 py-1">Credit</th>
                      <th className="px-2 py-1">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerLedger.map((l: any) => (
                      <tr key={l.id}>
                        <td className="px-2 py-1">{l.date}</td>
                        <td className="px-2 py-1">{l.description}</td>
                        <td className="px-2 py-1">{formatCurrency(l.debit)}</td>
                        <td className="px-2 py-1">{formatCurrency(l.credit)}</td>
                        <td className="px-2 py-1">{formatCurrency(l.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="text-muted-foreground text-sm">No ledger entries found.</div>}
          </TabsContent>
          <TabsContent value="documents">
            {/* Documents data here */}
            <div className="text-muted-foreground text-sm">No documents uploaded.</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerProfile;
