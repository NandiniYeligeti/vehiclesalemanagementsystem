import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";

const steps = ["Enquiry", "Follow-ups", "Customer", "Sales Order", "Completed"];

export default function EnquiriesPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [data, setData] = useState<any>({ followUps: [] });
  const [form, setForm] = useState({ name:"", mobile:"", email:"", vehicle:"", budget:"", salesperson:"" });
  const [fu, setFu] = useState({ date:"", remark:"", status:"Contacted", nextDate:"" });

  const companyCode = useSelector((state: RootState) => state.auth.user?.CompanyCode || 'DEFAULT_COMPANY');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const next = () => setStepIndex(p=>p+1);
  const back = () => setStepIndex(p=>p-1);

  const saveEnquiry = async () =>  {
    if(!form.name || !form.mobile) return showToast("Fill required fields");
    setLoading(true);
    try {
      const payload = { ...form, company_id: companyCode, branch_id: 'MAIN_BRANCH' };
      const res = await api.post(`/enquiry/${companyCode}`, payload);
      setData(res.data);
      showToast("Enquiry Saved Successfully");
      next();
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Error saving  enquiry");
    } finally {
      setLoading(false);
    }
  };

  const addFollowUp = async () => {
    if (!data.entity_id && !data.id) return showToast("No active Enquiry to update");
    setLoading(true);
    try {
      const newFollowUps = [...(data.follow_ups || []), fu];
      const res = await api.put(`/enquiry/${companyCode}/${data.entity_id || data.id}`, { follow_ups: newFollowUps });
      setData(res.data);
      setFu({ date:"", remark:"", status:"Contacted", nextDate:"" });
      showToast("Follow-up Added");
    } catch (err: any) {
      showToast("Error updating follow-up");
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async () => showToast("Reminder Email Sent");
  const sendQuotation = async () => showToast("Quotation PDF Sent");
  
  const convert = async () => { 
    setLoading(true);
    try {
      // Typically we'd create a customer here via API
      const custPayload = {
        company_id: companyCode,
        branch_id: 'MAIN_BRANCH',
        customer_name: data.name,
        mobile_number: data.mobile,
        email: data.email,
        address: "TBD",
        city: "TBD",
        state: "TBD",
        pincode: "000000"
      };
      await api.post(`/customer/${companyCode}`, custPayload);
      showToast("Converted to Customer");
      next();
    } catch (err: any) {
      showToast("Error converting to customer");
    } finally {
      setLoading(false);
    }
  };

  const createSO = async () => { 
    setData({...data, orderId:"SO-"+Date.now()}); 
    showToast("Sales Order Draft Created"); 
    next(); 
  };
  
  const sendDelivery = async () => showToast("Delivery Email Sent");

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-xl z-50 animate-in slide-in-from-bottom-5">
          {toast}
        </div>
      )}

      {/* Stepper */}
      <div className="flex justify-between max-w-3xl mx-auto mb-8 relative">
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-border -z-10" />
        {steps.map((s,i)=>(
          <div key={i} className="flex-1 text-center group">
            <div className={`mx-auto w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold shadow-sm transition-colors ${i<=stepIndex?"bg-primary text-primary-foreground shadow-primary/30":"bg-card border-2 border-border text-muted-foreground"}`}>
              {i+1}
            </div>
            <p className={`text-xs mt-2 font-bold ${i<=stepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</p>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto">
        <Card className="rounded-2xl border-none shadow-2xl overflow-hidden ring-1 ring-border bg-card">
          <CardContent className="p-8 space-y-6">

            {loading && <p className="text-sm font-medium text-primary animate-pulse">Processing request...</p>}

            {/* Enquiry */}
            {stepIndex===0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div>
                  <h2 className="text-xl font-black">Create Enquiry</h2>
                  <p className="text-sm text-muted-foreground">Capture basic details to start a new lead</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Name</label>
                    <Input className="erp-input h-11" placeholder="Customer Name" onChange={e=>setForm({...form,name:e.target.value})}/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile</label>
                    <Input className="erp-input h-11" placeholder="Mobile Number" onChange={e=>setForm({...form,mobile:e.target.value})}/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Email</label>
                    <Input className="erp-input h-11" placeholder="Email Address" onChange={e=>setForm({...form,email:e.target.value})}/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Vehicle of Interest</label>
                    <Input className="erp-input h-11" placeholder="E.g., Nexon EV" onChange={e=>setForm({...form,vehicle:e.target.value})}/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Budget (₹)</label>
                    <Input className="erp-input h-11" type="number" placeholder="Budget Amount" onChange={e=>setForm({...form,budget:e.target.value})}/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Assigned Salesperson</label>
                    <Input className="erp-input h-11" placeholder="Salesperson Name" onChange={e=>setForm({...form,salesperson:e.target.value})}/>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button disabled={loading} onClick={saveEnquiry} className="h-11 px-8 rounded-xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20">
                    Save & Next →
                  </Button>
                </div>
              </div>
            )}

            {/* Follow-ups */}
            {stepIndex===1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div>
                  <h2 className="text-xl font-black">Follow-ups</h2>
                  <p className="text-sm text-muted-foreground">Log interactions and set future reminders</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-5 rounded-2xl border border-border">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Follow-up Date</label>
                    <Input className="erp-input h-10" type="date" value={fu.date} onChange={e=>setFu({...fu,date:e.target.value})}/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Remark</label>
                    <Input className="erp-input h-10" placeholder="Discussion summary" value={fu.remark} onChange={e=>setFu({...fu,remark:e.target.value})}/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Status</label>
                    <select className="erp-select h-10 rounded-xl w-full" value={fu.status} onChange={e=>setFu({...fu,status:e.target.value})}>
                      <option>Contacted</option>
                      <option>Interested</option>
                      <option>Test Drive Scheduled</option>
                      <option>Not Reachable</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Next Follow-up</label>
                    <Input className="erp-input h-10" type="date" value={fu.nextDate} onChange={e=>setFu({...fu,nextDate:e.target.value})}/>
                  </div>
                  <div className="sm:col-span-2 flex justify-end pt-2">
                    <Button disabled={loading} onClick={addFollowUp} variant="outline" className="h-10 px-6 rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                      + Add Record
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.followUps?.map((f: any, i: number)=>(
                    <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{f.status}</Badge>
                          <span className="text-xs font-bold text-muted-foreground">{f.date}</span>
                        </div>
                        <p className="text-sm">{f.remark}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-muted-foreground block uppercase">Next Actions</span>
                        <span className="text-sm font-semibold">{f.nextDate || 'None'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button disabled={loading} variant="secondary" onClick={sendReminder} className="rounded-xl flex-1 h-11">Email Reminder</Button>
                  <Button disabled={loading} variant="secondary" onClick={sendQuotation} className="rounded-xl flex-1 h-11">Send Quotation PDF</Button>
                </div>

                <div className="flex justify-between pt-4 mt-2">
                  <Button onClick={back} variant="ghost" className="rounded-xl px-6 h-11">← Back</Button>
                  <Button onClick={next} className="rounded-xl px-8 h-11 bg-primary text-primary-foreground font-black">Next Step →</Button>
                </div>
              </div>
            )}

            {/* Customer */}
            {stepIndex===2 && (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 py-8">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black">Convert to Customer</h2>
                  <p className="text-muted-foreground mt-2">Ready to convert {data.name} into a formal customer profile?</p>
                </div>
                <div className="flex justify-center gap-4 pt-4">
                  <Button onClick={back} variant="ghost" className="h-12 px-6 rounded-xl">Back</Button>
                  <Button disabled={loading} onClick={convert} className="h-12 px-10 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black shadow-lg shadow-green-600/20 text-lg">
                    Convert Now
                  </Button>
                </div>
              </div>
            )}

            {/* Sales */}
            {stepIndex===3 && (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 py-8">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black">Generate Sales Order</h2>
                  <p className="text-muted-foreground mt-2">Create a formal sales order document for the vehicle purchase.</p>
                </div>
                <div className="flex justify-center gap-4 pt-4">
                  <Button onClick={back} variant="ghost" className="h-12 px-6 rounded-xl">Back</Button>
                  <Button disabled={loading} onClick={createSO} className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-600/20 text-lg">
                    Generate Order
                  </Button>
                </div>
              </div>
            )}

            {/* Completed */}
            {stepIndex===4 && (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 py-8">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-primary">Process Completed!</h2>
                  <p className="text-muted-foreground mt-2">Order ID: <span className="font-bold text-foreground">{data.orderId}</span></p>
                </div>
                <div className="flex justify-center gap-4 pt-6">
                  <Button disabled={loading} onClick={sendDelivery} variant="outline" className="h-12 px-8 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold">
                    Email Delivery Notes
                  </Button>
                  <Button onClick={() => { setStepIndex(0); setData({followUps:[]}); }} className="h-12 px-8 rounded-xl bg-foreground text-background font-black hover:bg-foreground/90">
                    Start New Enquiry
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
