import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/services/api";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { getSalespersonsAction } from "@/store/ducks/salespersons.ducks";
import { getCustomersAction, addCustomerAction } from "@/store/ducks/customers.ducks";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, UserPlus, PhoneCall, Calendar, MessageSquare,
  User, Car, Banknote, Mail, Loader2, ArrowRight, X, Phone, ClipboardList, BadgeCheck
} from "lucide-react";

interface Props { onNavigate?: (tab: string) => void; }

export default function EnquiriesPage({ onNavigate }: Props) {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const companyCode = user?.CompanyCode || "DEFAULT_COMPANY";

  const { data: salespersons } = useSelector((state: RootState) => state.salespersons);
  const { data: customers } = useSelector((state: RootState) => state.customers);

  const [tab, setTab] = useState("enquiry");
  const [loading, setLoading] = useState(false);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Enquiry form
  const [form, setForm] = useState({ name: "", mobile: "", email: "", vehicle: "", budget: "", salesperson: "" });

  // Follow-up form
  const [selectedEnquiryId, setSelectedEnquiryId] = useState("");
  const [fu, setFu] = useState({ date: "", remark: "", status: "Contacted", nextDate: "" });

  // Customer convert
  const [convertEnquiryId, setConvertEnquiryId] = useState("");

  useEffect(() => {
    if (companyCode) {
      dispatch(getSalespersonsAction(companyCode));
      dispatch(getCustomersAction(companyCode));
      fetchEnquiries();
    }
  }, [dispatch, companyCode]);

  const fetchEnquiries = async () => {
    try {
      const res = await api.get(`/enquiry/${companyCode}`);
      setEnquiries(Array.isArray(res.data) ? res.data : []);
    } catch { setEnquiries([]); }
  };

  const resetForm = () => setForm({ name: "", mobile: "", email: "", vehicle: "", budget: "", salesperson: "" });

  const saveEnquiry = async () => {
    if (!form.name || !form.mobile) return toast.error("Name and Mobile are required");
    setLoading(true);
    try {
      await api.post(`/enquiry/${companyCode}`, { ...form, company_id: companyCode, branch_id: "MAIN_BRANCH" });
      toast.success("Enquiry saved successfully");
      resetForm();
      setShowForm(false);
      fetchEnquiries();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error saving enquiry");
    } finally { setLoading(false); }
  };

  const addFollowUp = async () => {
    if (!selectedEnquiryId) return toast.error("Select an enquiry first");
    if (!fu.date || !fu.remark) return toast.error("Date and Remark are required");
    setLoading(true);
    try {
      const enq = enquiries.find(e => (e.entity_id || e.id) === selectedEnquiryId);
      const newFollowUps = [...(enq?.follow_ups || []), { date: fu.date, remark: fu.remark, status: fu.status, next_date: fu.nextDate }];
      await api.put(`/enquiry/${companyCode}/${selectedEnquiryId}`, { follow_ups: newFollowUps });
      toast.success("Follow-up added");
      setFu({ date: "", remark: "", status: "Contacted", nextDate: "" });
      fetchEnquiries();
    } catch { toast.error("Error adding follow-up"); }
    finally { setLoading(false); }
  };

  const convertToCustomer = () => {
    if (!convertEnquiryId) return toast.error("Select an enquiry to convert");
    const enq = enquiries.find(e => (e.entity_id || e.id) === convertEnquiryId);
    if (!enq) return toast.error("Enquiry not found");
    setLoading(true);
    const payload = {
      company_id: companyCode, branch_id: "MAIN_BRANCH",
      customer_name: enq.name, mobile_number: enq.mobile, email: enq.email || "",
      address: "TBD", city: "TBD", state: "TBD", pincode: "000000"
    };
    dispatch(addCustomerAction(payload, companyCode, async () => {
      try {
        await api.put(`/enquiry/${companyCode}/${enq.entity_id || enq.id}`, { is_converted: true });
        toast.success(`${enq.name} converted to customer!`);
        fetchEnquiries();
        setTab("converted");
      } catch (err) {
        toast.error("Customer created but enquiry status update failed");
      }
      setLoading(false);
    }, () => { toast.error("Error converting"); setLoading(false); }));
  };

  const selectedEnquiry = useMemo(() =>
    enquiries.find(e => (e.entity_id || e.id) === selectedEnquiryId), [enquiries, selectedEnquiryId]);

  const activeEnquiries = useMemo(() =>
    enquiries.filter(e => !e.is_converted && (
      (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.mobile || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.vehicle || "").toLowerCase().includes(search.toLowerCase())
    )), [enquiries, search]);

  const convertedLeads = useMemo(() =>
    enquiries.filter(e => e.is_converted && (
      (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.mobile || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.vehicle || "").toLowerCase().includes(search.toLowerCase())
    )), [enquiries, search]);

  const formatDate = (d: string) => {
    if (!d) return "";
    try { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d)); }
    catch { return d; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter erp-gradient-text">Enquiry Management</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mt-1">
            <ClipboardList className="w-3 h-3" /> Lead Pipeline • {activeEnquiries.length} Active • {convertedLeads.length} Converted
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted/30 p-1 h-12 rounded-2xl border border-border/50 inline-flex">
          {[
            { val: "enquiry", label: "Enquiry", icon: UserPlus },
            { val: "followup", label: "Follow Up", icon: PhoneCall },
            { val: "customer", label: "Convert", icon: ArrowRight },
            { val: "converted", label: "Converted Leads", icon: BadgeCheck },
          ].map(t => (
            <TabsTrigger key={t.val} value={t.val}
              className="rounded-xl px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-lg transition-all flex items-center gap-2">
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ─── TAB 1: ENQUIRY ─── */}
      {tab === "enquiry" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative group flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search enquiries..." value={search} onChange={e => setSearch(e.target.value)}
                className="h-11 pl-10 rounded-2xl bg-muted/20 border-border/50 font-medium text-sm" />
            </div>
            <Button onClick={() => setShowForm(true)} className="h-11 px-6 rounded-xl font-bold gap-2 shadow-xl shadow-primary/20">
              <Plus className="w-4 h-4" /> New Enquiry
            </Button>
          </div>

          {/* Enquiry Cards */}
          {activeEnquiries.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">No active enquiries found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeEnquiries.map(enq => (
                <motion.div key={enq.entity_id || enq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  <div className="h-1 w-full bg-primary" />
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{enq.name}</h3>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{formatDate(enq.created_at)}</p>
                        </div>
                      </div>
                      {enq.follow_ups?.length > 0 && (
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px]">{enq.follow_ups.length} Follow-ups</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                        <Phone className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-[11px] font-bold truncate">{enq.mobile}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                        <Car className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-[11px] font-bold truncate">{enq.vehicle || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                        <Banknote className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="text-[11px] font-bold truncate">₹{enq.budget || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                        <UserPlus className="w-3 h-3 text-purple-500 shrink-0" />
                        <span className="text-[11px] font-bold truncate">{enq.salesperson || "Unassigned"}</span>
                      </div>
                    </div>
                    {enq.email && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Mail className="w-3 h-3" /> {enq.email}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* New Enquiry Modal */}
          <AnimatePresence>
            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><UserPlus className="w-5 h-5" /></div>
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-tight erp-gradient-text">New Enquiry</h2>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Capture lead details</p>
                      </div>
                    </div>
                    <button onClick={() => setShowForm(false)} className="p-2 rounded-2xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Name *</label>
                        <Input className="h-11 rounded-xl" placeholder="Customer Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Mobile *</label>
                        <Input className="h-11 rounded-xl" placeholder="Mobile Number" value={form.mobile}
                          onChange={e => { if (/^\d{0,10}$/.test(e.target.value)) setForm({ ...form, mobile: e.target.value }); }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Email</label>
                        <Input className="h-11 rounded-xl" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vehicle Interest</label>
                        <Input className="h-11 rounded-xl" placeholder="E.g. Nexon EV" value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Budget (₹)</label>
                        <Input className="h-11 rounded-xl" type="number" placeholder="Amount" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Salesperson</label>
                        <select className="w-full h-11 px-4 rounded-xl bg-muted/20 border border-border/50 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/10"
                          value={form.salesperson} onChange={e => setForm({ ...form, salesperson: e.target.value })}>
                          <option value="">Select Salesperson</option>
                          {(salespersons || []).map((sp: any) => (
                            <option key={sp.entity_id || sp.id} value={sp.full_name || sp.name}>{sp.full_name || sp.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowForm(false)} className="px-6 rounded-xl font-bold">Cancel</Button>
                    <Button onClick={saveEnquiry} disabled={loading} className="px-8 rounded-xl font-black shadow-xl shadow-primary/20">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Enquiry"}
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── TAB 2: FOLLOW UP ─── */}
      {tab === "followup" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Select Enquiry */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-black flex items-center gap-2"><PhoneCall className="w-5 h-5 text-primary" /> Add Follow-up</h2>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Select Enquiry</label>
                <select className="w-full h-12 px-4 rounded-2xl bg-muted/20 border border-border/50 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/10"
                  value={selectedEnquiryId} onChange={e => setSelectedEnquiryId(e.target.value)}>
                  <option value="">— Select an Enquiry —</option>
                  {activeEnquiries.map(e => (
                    <option key={e.entity_id || e.id} value={e.entity_id || e.id}>{e.name} — {e.mobile}</option>
                  ))}
                </select>
              </div>

              {selectedEnquiryId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/10 p-5 rounded-2xl border border-border/40">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Follow-up Date *</label>
                    <Input className="h-11 rounded-xl" type="date" value={fu.date} onChange={e => setFu({ ...fu, date: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</label>
                    <select className="w-full h-11 px-4 rounded-xl bg-background border border-border/50 font-bold text-sm outline-none"
                      value={fu.status} onChange={e => setFu({ ...fu, status: e.target.value })}>
                      <option>Contacted</option><option>Interested</option><option>Test Drive Scheduled</option><option>Not Reachable</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Remark *</label>
                    <Input className="h-11 rounded-xl" placeholder="Discussion summary..." value={fu.remark} onChange={e => setFu({ ...fu, remark: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Next Follow-up Date</label>
                    <Input className="h-11 rounded-xl" type="date" value={fu.nextDate} onChange={e => setFu({ ...fu, nextDate: e.target.value })} />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addFollowUp} disabled={loading} className="h-11 px-8 rounded-xl font-black shadow-lg shadow-primary/20 w-full">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "+ Add Follow-up"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-up Cards */}
          {selectedEnquiry && (selectedEnquiry.follow_ups || []).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground px-1">
                Follow-ups for {selectedEnquiry.name} ({selectedEnquiry.follow_ups.length})
              </h3>
              {selectedEnquiry.follow_ups.map((f: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        f.status === "Interested" ? "bg-emerald-500/10 text-emerald-500" :
                        f.status === "Test Drive Scheduled" ? "bg-purple-500/10 text-purple-500" :
                        f.status === "Not Reachable" ? "bg-red-500/10 text-red-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <Badge className={`text-[9px] font-black uppercase tracking-widest border ${
                          f.status === "Interested" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          f.status === "Test Drive Scheduled" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                          f.status === "Not Reachable" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }`}>{f.status}</Badge>
                        <p className="text-sm font-medium text-foreground mt-1">{f.remark}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" /> {formatDate(f.date)}
                      </div>
                      {f.next_date && (
                        <p className="text-[10px] font-bold text-primary mt-1">Next: {formatDate(f.next_date)}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {selectedEnquiryId && (!selectedEnquiry?.follow_ups || selectedEnquiry.follow_ups.length === 0) && (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">No follow-ups yet for this enquiry.</div>
          )}
        </div>
      )}

      {/* ─── TAB 3: CUSTOMER CONVERT ─── */}
      {tab === "customer" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black">Convert to Customer</h2>
                <p className="text-sm text-muted-foreground mt-2">Select an enquiry to convert into a formal customer profile</p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Select Enquiry to Convert</label>
                  <select className="w-full h-12 px-4 rounded-2xl bg-muted/20 border border-border/50 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/10"
                    value={convertEnquiryId} onChange={e => setConvertEnquiryId(e.target.value)}>
                    <option value="">— Select Enquiry —</option>
                    {activeEnquiries.map(e => (
                      <option key={e.entity_id || e.id} value={e.entity_id || e.id}>{e.name} — {e.mobile}</option>
                    ))}
                  </select>
                </div>

                {convertEnquiryId && (() => {
                  const enq = activeEnquiries.find(e => (e.entity_id || e.id) === convertEnquiryId);
                  if (!enq) return null;
                  return (
                    <div className="bg-muted/10 p-5 rounded-2xl border border-border/40 space-y-2">
                      <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-primary" /><span className="text-sm font-bold">{enq.name}</span></div>
                      <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-emerald-500" /><span className="text-sm">{enq.mobile}</span></div>
                      {enq.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-blue-500" /><span className="text-sm">{enq.email}</span></div>}
                      {enq.vehicle && <div className="flex items-center gap-2"><Car className="w-3.5 h-3.5 text-purple-500" /><span className="text-sm">{enq.vehicle}</span></div>}
                    </div>
                  );
                })()}

                <Button onClick={convertToCustomer} disabled={loading || !convertEnquiryId}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/20 text-sm uppercase tracking-widest">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-4 h-4 mr-2" /> Convert & Go to Customers</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── TAB 4: CONVERTED LEADS ─── */}
      {tab === "converted" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative group flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search converted leads..." value={search} onChange={e => setSearch(e.target.value)}
                className="h-11 pl-10 rounded-2xl bg-muted/20 border-border/50 font-medium text-sm" />
            </div>
          </div>

          {convertedLeads.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">No converted leads yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {convertedLeads.map(enq => (
                <motion.div key={enq.entity_id || enq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-3">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                      <BadgeCheck className="w-3 h-3 mr-1" /> Converted
                    </Badge>
                  </div>
                  <div className="h-1 w-full bg-emerald-500" />
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{enq.name}</h3>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Converted on {formatDate(enq.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                        <Phone className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-[11px] font-bold truncate">{enq.mobile}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                        <Car className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-[11px] font-bold truncate">{enq.vehicle || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                        <UserPlus className="w-3 h-3 text-purple-500 shrink-0" />
                        <span className="text-[11px] font-bold truncate">{enq.salesperson || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                        <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="text-[11px] font-bold truncate">{formatDate(enq.created_at)}</span>
                      </div>
                    </div>
                    <Button variant="ghost" className="w-full h-8 rounded-lg text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-primary/5"
                      onClick={() => {
                        if (onNavigate) onNavigate("customers");
                        toast.info(`Viewing ${enq.name} in Customers`);
                      }}>
                      View Profile <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
