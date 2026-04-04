import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Save, Loader2, Globe, Building2, MapPin, Phone, Mail, FileText, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { Formik, Form, Field } from 'formik';
import { RootState } from '@/store/rootReducer';
import { getCompanySettingsAction, updateCompanySettingsAction } from '@/store/ducks/company.ducks';
import { toast } from 'sonner';
import { getMastersAction, addMasterAction, deleteMasterAction } from '@/store/ducks/company_masters.ducks';

const MasterSection = ({ title, type, data, onAdd, onDelete, loading }: { title: string, type: 'Showroom' | 'Branch' | 'Area', data: any[], onAdd: (name: string) => void, onDelete: (id: string) => void, loading: boolean }) => {
  const [name, setName] = React.useState('');
  return (
    <div className="erp-card p-6 bg-white border border-border/50 shadow-sm rounded-2xl flex flex-col gap-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{title}</h3>
      <div className="flex gap-2">
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="erp-input h-10 text-xs" 
          placeholder={`Enter new ${title.toLowerCase()}`}
        />
        <button 
          onClick={() => { if(name) { onAdd(name); setName(''); } }} 
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {data.map((item) => (
          <div key={item.entity_id || item.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 group hover:bg-muted/50 transition-colors">
            <span className="text-xs font-bold">{item.name}</span>
            <button 
              onClick={() => onDelete(item.entity_id || item.id)} 
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {data.length === 0 && <p className="text-[10px] text-muted-foreground/60 italic text-center py-4">No {title.toLowerCase()}s added yet.</p>}
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';
  
  const { settings, loading, saving } = useSelector((state: RootState) => state.company);
  const { data: masters, loading: mastersLoading } = useSelector((state: RootState) => state.companyMasters);

  useEffect(() => {
    if (companyCode) {
      dispatch(getCompanySettingsAction(companyCode));
      dispatch(getMastersAction(companyCode));
    }
  }, [dispatch, companyCode]);

  const handleAddMaster = (type: 'Showroom' | 'Branch' | 'Area', name: string) => {
    dispatch(addMasterAction(companyCode, { type, name, company_id: companyCode }, () => {
      toast.success(`${type} added successfully`);
    }));
  };

  const handleDeleteMaster = (id: string, type: string) => {
    dispatch(deleteMasterAction(companyCode, id, () => {
      toast.success(`${type} deleted successfully`);
    }));
  };

  if (loading && !settings) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initialValues = {
    company_name: settings?.company_name || '',
    logo_url: settings?.logo_url || '',
    gst_number: settings?.gst_number || '',
    address: settings?.address || '',
    phone: settings?.phone || '',
    email: settings?.email || '',
    invoice_prefix: settings?.invoice_prefix || 'SO-',
    currency: settings?.currency || 'INR',
    timezone: settings?.timezone || 'Asia/Kolkata',
  };

  const showrooms = (masters || []).filter(m => m.type === 'Showroom');
  const branches = (masters || []).filter(m => m.type === 'Branch');
  const areas = (masters || []).filter(m => m.type === 'Area');

  return (
    <div className="max-w-4xl space-y-12 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-[#0f172a]">Settings</h2>
        <p className="text-muted-foreground font-medium">Manage your company profile and application preferences.</p>
      </div>

      <Formik
        initialValues={initialValues}
        enableReinitialize
        onSubmit={(values) => {
          dispatch(updateCompanySettingsAction(companyCode, values, () => {
            toast.success('Settings updated successfully');
          }));
        }}
      >
        {({ values, isSubmitting, setFieldValue }) => (
          <Form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Branding Section */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-1 space-y-6">
                 <div className="erp-card p-6 bg-white border border-border/50 shadow-sm rounded-2xl flex flex-col items-center text-center">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6 w-full text-left">Logo & Branding</h3>
                    <div className="w-32 h-32 rounded-2xl bg-muted/30 border-2 border-dashed border-border flex items-center justify-center overflow-hidden mb-6 group relative">
                       {values.logo_url ? (
                         <img src={values.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                       ) : (
                         <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                       )}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <label className="cursor-pointer p-2 bg-white rounded-full text-black hover:scale-110 transition-transform">
                            <ImageIcon className="w-5 h-5" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.currentTarget.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const base64 = event.target?.result as string;
                                    setFieldValue('logo_url', base64);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                         </label>
                       </div>
                    </div>
                    <div className="w-full space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Company Logo</label>
                        <button 
                          type="button" 
                          onClick={() => setFieldValue('logo_url', '')} 
                          className="text-[10px] font-bold text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-all">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Browse from Device
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                setFieldValue('logo_url', base64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                      </label>
                      <p className="text-[10px] text-muted-foreground/60 italic px-1 text-center">Recommended: Square PNG with transparent background.</p>
                    </div>
                 </div>

                 <div className="erp-card p-6 bg-white border border-border/50 shadow-sm rounded-2xl">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Preferences</h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Currency</label>
                        <Field as="select" name="currency" className="erp-select">
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                        </Field>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Timezone</label>
                        <Field as="select" name="timezone" className="erp-select">
                          <option value="Asia/Kolkata">Asia/Kolkata</option>
                          <option value="UTC">UTC</option>
                        </Field>
                      </div>
                    </div>
                 </div>
              </motion.div>

              {/* Main Info Section */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2 space-y-6">
                <div className="erp-card p-8 bg-white border border-border/50 shadow-sm rounded-2xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#0f172a]">Company Profile</h3>
                      <p className="text-xs text-muted-foreground font-medium">This information will appear on invoices and reports.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Company Name</label>
                      <Field name="company_name" className="erp-input" placeholder="Enter company name" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">GST Number</label>
                      <Field name="gst_number" className="erp-input font-mono uppercase" placeholder="22AAAAA0000A1Z5" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Invoice Prefix</label>
                      <Field name="invoice_prefix" className="erp-input font-mono uppercase" placeholder="SO-" />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5 pt-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                         <MapPin className="w-3 h-3 text-primary" /> Company Address
                       </label>
                       <Field as="textarea" name="address" className="erp-input h-24 resize-none pt-3" placeholder="Enter full business address" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-primary" /> Phone Number
                      </label>
                      <Field name="phone" className="erp-input" placeholder="+91 00000 00000" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-primary" /> Support Email
                      </label>
                      <Field name="email" className="erp-input" placeholder="admin@company.com" />
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving || isSubmitting}
                      className="px-8 py-3.5 rounded-xl bg-[#0f172a] text-white text-sm font-black hover:bg-[#1e293b] active:scale-95 transition-all flex items-center gap-3 shadow-lg shadow-[#0f172a]/10 disabled:opacity-70 disabled:pointer-events-none"
                    >
                      {saving || isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Update Settings
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </Form>
        )}
      </Formik>

      {/* Masters Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
             <MapPin className="w-5 h-5" />
           </div>
           <div>
             <h3 className="text-lg font-black text-[#0f172a]">Organization Masters</h3>
             <p className="text-xs text-muted-foreground font-medium">Manage Showrooms, Branches and Operating Areas.</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MasterSection 
            title="Showrooms" 
            type="Showroom" 
            data={showrooms} 
            onAdd={(name) => handleAddMaster('Showroom', name)} 
            onDelete={(id) => handleDeleteMaster(id, 'Showroom')}
            loading={mastersLoading}
          />
          <MasterSection 
            title="Branches" 
            type="Branch" 
            data={branches} 
            onAdd={(name) => handleAddMaster('Branch', name)} 
            onDelete={(id) => handleDeleteMaster(id, 'Branch')}
            loading={mastersLoading}
          />
          <MasterSection 
            title="Areas" 
            type="Area" 
            data={areas} 
            onAdd={(name) => handleAddMaster('Area', name)} 
            onDelete={(id) => handleDeleteMaster(id, 'Area')}
            loading={mastersLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
