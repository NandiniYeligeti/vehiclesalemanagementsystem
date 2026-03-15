import { motion } from 'framer-motion';
import { Save } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="erp-card p-6">
        <h3 className="erp-section-title">Company Information</h3>
        <div className="space-y-4">
          <div><label className="erp-label">Company Name</label><input className="erp-input" defaultValue="AutoDesk Motors Pvt. Ltd." /></div>
          <div><label className="erp-label">GST Number</label><input className="erp-input font-mono" defaultValue="27AADCB2230M1ZT" /></div>
          <div><label className="erp-label">Company Address</label><textarea className="erp-input h-20 resize-none" defaultValue="123 Auto Plaza, MG Road, Mumbai 400001" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="erp-label">Phone</label><input className="erp-input" defaultValue="+91 22 2345 6789" /></div>
            <div><label className="erp-label">Email</label><input className="erp-input" defaultValue="admin@autodesk.in" /></div>
          </div>
          <div><label className="erp-label">Invoice Prefix</label><input className="erp-input font-mono" defaultValue="SO-" /></div>
        </div>
      </motion.div>

      <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
        <Save className="w-4 h-4" /> Save Settings
      </button>
    </div>
  );
};

export default SettingsPage;
