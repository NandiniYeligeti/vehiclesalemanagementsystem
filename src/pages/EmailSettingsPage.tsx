import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';
import { getCompanySettingsAction, updateCompanySettingsAction, sendTestEmailAction } from '@/store/ducks/company.ducks';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { 
  Mail, Server, Shield, User, Lock, Send, Save, 
  CheckCircle2, AlertCircle, Loader2, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const emailSettingsSchema = Yup.object().shape({
  sender_name: Yup.string().required('Sender name is required'),
  sender_email: Yup.string().email('Invalid email').required('Sender email is required'),
  smtp_host: Yup.string().required('SMTP host is required'),
  smtp_port: Yup.number().required('Port is required'),
  encryption_type: Yup.string().required('Required'),
  email_username: Yup.string().required('Username is required'),
  email_password: Yup.string().required('Password is required'),
});

const EmailSettingsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { settings, loading, saving, emailSending, error } = useSelector((state: RootState) => state.company);
  const companyCode = user?.CompanyCode || '';

  useEffect(() => {
    if (companyCode) {
      dispatch(getCompanySettingsAction(companyCode));
    }
  }, [dispatch, companyCode]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const initialValues = {
    sender_name: settings?.email_settings?.sender_name || '',
    sender_email: settings?.email_settings?.sender_email || '',
    smtp_host: settings?.email_settings?.smtp_host || '',
    smtp_port: settings?.email_settings?.smtp_port || 587,
    encryption_type: settings?.email_settings?.encryption_type || 'TLS',
    email_username: settings?.email_settings?.email_username || '',
    email_password: settings?.email_settings?.email_password || '',
    enable_email: settings?.email_settings?.enable_email ?? true,
    auto_send_receipt: settings?.email_settings?.auto_send_receipt ?? true,
    attach_invoice: settings?.email_settings?.attach_invoice ?? true,
  };

  const handleSubmit = (values: any) => {
    if (!settings) return;
    const updatedSettings = {
      ...settings,
      email_settings: values
    };
    dispatch(updateCompanySettingsAction(companyCode, updatedSettings, () => {
      toast.success('Email settings saved successfully');
    }));
  };

  const handleTestEmail = (values: any) => {
    dispatch(sendTestEmailAction(companyCode, values, () => {
      toast.success('Test email sent successfully! Please check your inbox.');
    }));
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          Email Configuration
        </h1>
        <p className="text-muted-foreground text-sm flex items-center gap-2 ml-12">
          Configure your SMTP server to enable automated billing and customer notifications.
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={emailSettingsSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, isSubmitting }) => (
          <Form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sender Details */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col"
              >
                <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-3">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Sender Identity</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Sender Name *</label>
                    <div className="relative group">
                      <Field 
                        name="sender_name"
                        placeholder="e.g. Sales Department"
                        className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.sender_name && touched.sender_name ? 'border-red-500' : 'border-border group-hover:border-primary/50'}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Sender Email Address *</label>
                    <div className="relative group">
                      <Field 
                        name="sender_email"
                        placeholder="noreply@yourcompany.com"
                        className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.sender_email && touched.sender_email ? 'border-red-500' : 'border-border group-hover:border-primary/50'}`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Server Details */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col"
              >
                <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-3">
                  <Server className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Server Configuration</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">SMTP Host *</label>
                    <Field 
                      name="smtp_host"
                      placeholder="e.g. smtp.gmail.com"
                      className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.smtp_host && touched.smtp_host ? 'border-red-500' : 'border-border hover:border-primary/50'}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Port *</label>
                      <Field 
                        name="smtp_port"
                        type="number"
                        className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 border-border hover:border-primary/50`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Encryption</label>
                      <Field 
                        as="select"
                        name="encryption_type"
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
                      >
                        <option value="TLS">TLS (Recommended)</option>
                        <option value="SSL">SSL</option>
                        <option value="None">None</option>
                      </Field>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Authentication */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col md:col-span-2"
              >
                <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-3">
                  <Shield className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Authentication</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Username *</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <Field 
                        name="email_username"
                        placeholder="your@email.com"
                        className={`w-full pl-11 pr-4 py-2.5 bg-background border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.email_username && touched.email_username ? 'border-red-500' : 'border-border group-hover:border-primary/50'}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Password / App Password *</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <Field 
                        name="email_password"
                        type="password"
                        placeholder="••••••••••••"
                        className={`w-full pl-11 pr-4 py-2.5 bg-background border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.email_password && touched.email_password ? 'border-red-500' : 'border-border group-hover:border-primary/50'}`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Preferences */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col md:col-span-2"
              >
                <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-3">
                  <Info className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Email Preferences</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                   <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center pt-1">
                        <Field type="checkbox" name="enable_email" className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold group-hover:text-primary transition-colors">Enable Email Sending</span>
                        <span className="text-[10px] text-muted-foreground">Turn on/off all outgoing emails from the system.</span>
                      </div>
                   </label>
                   
                   <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center pt-1">
                        <Field type="checkbox" name="auto_send_receipt" className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold group-hover:text-primary transition-colors">Auto-Send Receipt</span>
                        <span className="text-[10px] text-muted-foreground">Email receipt automatically after a successful payment.</span>
                      </div>
                   </label>

                   <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center pt-1">
                        <Field type="checkbox" name="attach_invoice" className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold group-hover:text-primary transition-colors">Attach Invoice PDF</span>
                        <span className="text-[10px] text-muted-foreground">Always include the Invoice PDF as an attachment.</span>
                      </div>
                   </label>
                </div>
              </motion.div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4 pb-10">
              <button
                type="button"
                disabled={emailSending}
                onClick={() => handleTestEmail(values)}
                className="flex-1 py-4 px-6 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground font-black uppercase tracking-widest text-[11px] rounded-2xl border border-border flex items-center justify-center gap-3 transition-all disabled:opacity-50"
              >
                {emailSending ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Send className="w-4 h-4" />}
                Send Test Email
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[11px] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Configuration
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EmailSettingsPage;
