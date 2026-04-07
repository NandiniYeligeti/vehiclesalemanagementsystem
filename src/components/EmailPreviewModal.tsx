import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EmailPreview {
  to: string;
  subject: string;
  body: string;
}

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: EmailPreview | null;
  onSend: () => void;
  isLoading?: boolean;
}

const EmailPreviewModal = ({ isOpen, onClose, previewData, onSend, isLoading }: EmailPreviewModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Email Dispatch</h3>
                <p className="text-xs text-muted-foreground font-medium">Review message before sending to customer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Recipient</label>
                <div className="px-4 py-3 bg-muted/50 rounded-2xl border border-border font-bold text-sm">
                  {previewData?.to || 'No email address found'}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
                <div className="px-4 py-3 bg-muted/50 rounded-2xl border border-border font-bold text-sm text-primary">
                  {previewData?.subject}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Message Body</label>
                <div className="px-5 py-6 bg-muted/20 rounded-3xl border border-border whitespace-pre-wrap font-medium text-sm leading-relaxed text-foreground/80 min-h-[300px]">
                  {previewData?.body}
                </div>
              </div>
            </div>
            
            {!previewData?.to && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-destructive leading-normal">
                  Warning: The customer has no email address. Sending will fail unless updated in the customer profile.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-muted/10 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              disabled={isLoading || !previewData?.to}
              className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5 disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email Now
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EmailPreviewModal;
