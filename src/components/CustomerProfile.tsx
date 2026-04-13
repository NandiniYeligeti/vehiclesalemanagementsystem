import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { getCustomerLedgerAction, updateCustomerAction, Customer } from '@/store/ducks/customers.ducks';
import { getSalesOrdersAction } from '@/store/ducks/sales_orders.ducks';
import { getPaymentsAction } from '@/store/ducks/payments.ducks';
import { getLoansAction } from '@/store/ducks/loans.ducks';
import { X, Upload, FileText, Check, Plus, Loader2, Download, Edit2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerProfileProps {
  customer: Customer;
  onClose: () => void;
  mode?: 'view' | 'edit';
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customer, onClose, mode = 'view' }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const dispatch = useDispatch();
  const customerId = (customer.entity_id || customer._id || customer.id) as string;
  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  // Live data from Redux
  const { data: salesOrders } = useSelector((state: RootState) => state.salesOrders);
  const { data: payments } = useSelector((state: RootState) => state.payments);
  const { data: loans } = useSelector((state: RootState) => state.loans);
  const { ledger: customerLedger, ledgerLoading } = useSelector((state: RootState) => state.customers);

  // Filter for this customer
  const customerVehicles = (salesOrders || []).filter((s: any) => s.customer_id === customerId);
  const customerPayments = (payments || []).filter((p: any) => p.customer_id === customerId);
  const customerLoans = (loans || []).filter((l: any) => l.customer_id === customerId);

  const [newDocuments, setNewDocuments] = useState<File[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit form state — initialized from customer prop
  const [editForm, setEditForm] = useState({
    customer_name: customer.customer_name || customer.name || '',
    mobile_number: customer.mobile_number || customer.mobile || '',
    email: customer.email || '',
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || '',
    pincode: customer.pincode || '',
    aadhaar_card_no: customer.aadhaar_card_no || '',
    pan_card_no: customer.pan_card_no || '',
  });

  useEffect(() => {
    if (customerId && companyCode) {
      dispatch(getCustomerLedgerAction(customerId));
      dispatch(getSalesOrdersAction(companyCode));
      dispatch(getPaymentsAction(companyCode));
      dispatch(getLoansAction(companyCode));
    }
  }, [dispatch, customerId, companyCode]);

  const handleSaveProfile = () => {
    // Validate required fields
    if (!editForm.customer_name?.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (editForm.mobile_number && !/^\d{10}$/.test(editForm.mobile_number)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }

    setIsUpdating(true);
    dispatch(updateCustomerAction(
      customerId,
      editForm,
      companyCode,
      () => {
        setIsUpdating(false);
        setIsEditing(false);
        toast.success('Customer profile updated successfully');
      },
      (err: string) => {
        setIsUpdating(false);
        toast.error(err || 'Failed to update customer profile');
      }
    ));
  };

  const handleUploadDocs = () => {
    if (newDocuments.length === 0) return;
    setIsUpdating(true);
    const formData = new FormData();
    newDocuments.forEach(file => formData.append('documents', file));

    dispatch(updateCustomerAction(
      customerId,
      formData,
      companyCode,
      () => {
        setIsUpdating(false);
        setNewDocuments([]);
        toast.success('Documents added successfully');
      },
      (err: string) => {
        setIsUpdating(false);
        toast.error(err || 'Failed to add documents');
      }
    ));
  };

  const profileFields = [
    { label: 'Customer Name', key: 'customer_name', required: true },
    { label: 'Mobile Number', key: 'mobile_number', required: true, pattern: '\\d{10}' },
    { label: 'Email', key: 'email', type: 'email' },
    { label: 'Aadhaar Card', key: 'aadhaar_card_no' },
    { label: 'PAN Card', key: 'pan_card_no' },
    { label: 'City', key: 'city' },
    { label: 'State', key: 'state' },
    { label: 'Pincode', key: 'pincode' },
    { label: 'Full Address', key: 'address', span: true, multiline: true },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl ring-1 ring-border shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl overflow-hidden border border-border shadow-sm">
              {customer.photo ? (
                <img src={`http://localhost:4001/uploads/${customer.photo}`} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                (customer.customer_name || customer.name || '?')[0].toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">{customer.customer_name || customer.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] bg-primary/10 text-primary font-black uppercase px-2 py-0.5 rounded-full tracking-tighter">
                  {customerId?.slice(-6).toUpperCase() || 'CUST'}
                </span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{customer.mobile_number || customer.mobile}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'profile' && (
              isEditing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditForm({ customer_name: customer.customer_name || customer.name || '', mobile_number: customer.mobile_number || customer.mobile || '', email: customer.email || '', address: customer.address || '', city: customer.city || '', state: customer.state || '', pincode: customer.pincode || '', aadhaar_card_no: customer.aadhaar_card_no || '', pan_card_no: customer.pan_card_no || '' }); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-xs font-bold active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-xs font-black active:scale-95 transition-all hover:bg-primary/10 hover:text-primary"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              )
            )}
            {activeTab === 'documents' && mode === 'edit' && newDocuments.length > 0 && (
              <button onClick={handleUploadDocs} disabled={isUpdating} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50">
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                Upload Docs
              </button>
            )}
            <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
               <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 pt-4 border-b border-border/50 bg-muted/5">
              <TabsList className="h-12 bg-transparent gap-1 p-0">
                {['profile', 'vehicles', 'loan', 'payments', 'ledger', 'documents'].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="h-10 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary text-xs font-black uppercase tracking-widest transition-all"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {/* Profile Tab — shows form in edit mode, read-only in view mode */}
              <TabsContent value="profile" className="m-0 focus-visible:outline-none">
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {profileFields.map((field) => (
                        <div key={field.key} className={field.span ? 'md:col-span-2' : ''}>
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block opacity-70">
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </label>
                          {field.multiline ? (
                            <textarea
                              className="erp-input w-full resize-none h-20 py-2 px-4 text-sm"
                              value={editForm[field.key as keyof typeof editForm]}
                              onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                              placeholder={field.label}
                            />
                          ) : (
                            <input
                              type={field.type || 'text'}
                              className="erp-input w-full h-11 px-4 text-sm"
                              value={editForm[field.key as keyof typeof editForm]}
                              onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                              placeholder={field.label}
                              required={field.required}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-8">
                    {[
                      { label: 'Mobile Number', value: customer.mobile_number || customer.mobile },
                      { label: 'Email', value: customer.email || 'N/A' },
                      { label: 'Aadhaar Card', value: customer.aadhaar_card_no || 'N/A' },
                      { label: 'PAN Card', value: customer.pan_card_no || 'N/A' },
                      { label: 'City', value: customer.city || '—' },
                      { label: 'State', value: customer.state || '—' },
                      { label: 'Pincode', value: customer.pincode || '—' },
                      { label: 'Full Address', value: customer.address || '—', span: true },
                    ].map((item, idx) => (
                      <div key={idx} className={item.span ? 'col-span-2 lg:col-span-4' : ''}>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60 leading-none">{item.label}</p>
                        <p className="text-sm font-bold text-foreground/90">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vehicles" className="m-0 focus-visible:outline-none">
                {customerVehicles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerVehicles.map((so: any) => (
                      <div key={so._id || so.id} className="erp-card p-5 group hover:border-primary/40 transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-black text-lg">{so.brand} {so.model}</h4>
                            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-tighter mb-4">{so.variant}</p>
                          </div>
                          <div className="p-2 rounded-xl bg-primary/5 text-primary opacity-0 group-hover:opacity-100 transition-all">
                            <Download className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[11px] font-medium border-t border-border/50 pt-4">
                          <div>
                            <span className="text-muted-foreground block text-[9px] uppercase font-black opacity-50 mb-0.5">VIN / Chassis</span>
                            <span className="font-mono text-foreground/80">{so.chassis_number || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[9px] uppercase font-black opacity-50 mb-0.5">Status</span>
                            <span className="font-bold text-emerald-600">{so.status || 'Delivered'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-bold italic">No vehicle associations found for this customer.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="loan" className="m-0 focus-visible:outline-none">
                {customerLoans.length > 0 ? (
                  <div className="space-y-4">
                    {customerLoans.map((loan: any) => (
                      <div key={loan._id || loan.id} className="erp-card p-6 flex flex-col md:flex-row gap-6 md:items-center">
                        <div className="flex-1">
                          <h4 className="text-lg font-black">{loan.bank_name}</h4>
                          <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mt-1 opacity-70">A/C: {loan.account_number || '•••• 8890'}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-right md:text-left">
                          <div>
                            <span className="text-[9px] font-black uppercase text-muted-foreground block mb-0.5 opacity-50">Amount</span>
                            <span className="text-sm font-black text-primary">₹{(loan.loan_amount || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-muted-foreground block mb-0.5 opacity-50">Monthly EMI</span>
                            <span className="text-sm font-bold">₹{(loan.emi || 0).toLocaleString()}</span>
                          </div>
                          <div className="hidden md:block">
                            <span className="text-[9px] font-black uppercase text-muted-foreground block mb-0.5 opacity-50">Tenure</span>
                            <span className="text-sm font-bold">{loan.months || 0} Months</span>
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center ${
                          loan.status === 'Disbursed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {loan.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-bold italic">No loan applications found for this customer.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="m-0 focus-visible:outline-none">
                {customerPayments.length > 0 ? (
                  <div className="erp-card overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30 border-b border-border font-black text-muted-foreground uppercase text-[10px] tracking-widest">
                        <tr>
                          <th className="px-6 py-4 text-left">Receipt</th>
                          <th className="px-6 py-4 text-left">Mode</th>
                          <th className="px-6 py-4 text-left">Type</th>
                          <th className="px-6 py-4 text-left">Date</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerPayments.map((p: any) => (
                          <tr key={p._id || p.id} className="border-b border-border/50 hover:bg-muted/10">
                            <td className="px-6 py-4 font-mono font-bold">{p.payment_code || p.reference_number || '—'}</td>
                            <td className="px-6 py-4 font-bold">{p.payment_mode}</td>
                            <td className="px-6 py-4 text-muted-foreground">{p.payment_type || '—'}</td>
                            <td className="px-6 py-4 text-muted-foreground font-medium">{(p.payment_date || '').split('T')[0]}</td>
                            <td className="px-6 py-4 text-right font-black text-emerald-600">₹{(p.payment_amount || p.amount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-bold italic">No payment history available.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ledger" className="m-0 focus-visible:outline-none">
                {ledgerLoading ? (
                  <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
                ) : customerLedger && customerLedger.length > 0 ? (
                  <div className="erp-card overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30 border-b border-border font-black text-muted-foreground uppercase text-[10px] tracking-widest">
                        <tr>
                          <th className="px-6 py-4 text-left">Date</th>
                          <th className="px-6 py-4 text-left">Description</th>
                          <th className="px-6 py-4 text-right">Debit</th>
                          <th className="px-6 py-4 text-right">Credit</th>
                          <th className="px-6 py-4 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerLedger.map((l: any, idx: number) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-muted/10 font-medium">
                            <td className="px-6 py-4 text-muted-foreground italic">{(l.date || '').split('T')[0]}</td>
                            <td className="px-6 py-4 font-bold">{l.description}</td>
                            <td className="px-6 py-4 text-right font-black text-destructive/80">₹{(l.debit || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-black text-emerald-600">₹{(l.credit || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-black">₹{(l.balance || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-bold italic">No financial ledger entries yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="m-0 focus-visible:outline-none">
                <div className="space-y-6">
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                    <h4 className="text-sm font-black mb-1">Add Documents</h4>
                    <p className="text-[10px] text-muted-foreground mb-4 uppercase font-bold">Upload Aadhaar, PAN, Address Proof, etc.</p>
                    <label className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-primary/30 rounded-2xl hover:bg-primary/5 transition-all cursor-pointer bg-white group shadow-sm">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            setNewDocuments([...newDocuments, ...Array.from(e.target.files)]);
                          }
                        }}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black uppercase text-primary/60 tracking-widest">Select Files</span>
                      </div>
                    </label>
                    {newDocuments.length > 0 && (
                      <div className="mt-6 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Staged for upload:</p>
                        {newDocuments.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-primary/20 shadow-sm">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="text-xs font-bold text-foreground/80">{f.name}</span>
                              <span className="text-[10px] font-medium text-muted-foreground">({(f.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button onClick={() => setNewDocuments(newDocuments.filter((_, idx) => idx !== i))} className="p-1 hover:text-destructive transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={handleUploadDocs}
                          disabled={isUpdating}
                          className="mt-3 w-full py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-md flex items-center justify-center gap-2"
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload {newDocuments.length} File{newDocuments.length !== 1 ? 's' : ''}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(customer.documents || []).length > 0 ? (
                      (customer.documents || []).map((doc: string, idx: number) => (
                        <div key={idx} className="erp-card p-4 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black truncate max-w-[140px] leading-tight">Document_{idx + 1}</p>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Uploaded Document</p>
                            </div>
                          </div>
                          <a href={`http://localhost:4001/uploads/${doc}`} target="_blank" rel="noreferrer" className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-primary">
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 flex flex-col items-center justify-center py-20 text-muted-foreground/30 border border-dashed rounded-3xl">
                        <FileText className="w-12 h-12 mb-4 opacity-10" />
                        <p className="text-sm font-bold italic">No documents available.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
