import React, { useState, useMemo } from “react”;

const LOGO = null;

export default function OralHistoryIntakeForm() {
const today = new Date().toISOString().split(“T”)[0];
const [form, setForm] = useState({
interviewee: “”, date: today, interviewer: “”, location: “”,
consent_for: { transcription: false, archival_storage: false, educational_use: false, public_exhibition: false },
retention_until: “indefinite”, embargo: “”, community_review: true, notes: “”,
});
const [initials, setInitials] = useState(””);
const [showJson, setShowJson] = useState(false);
const [copied, setCopied] = useState(false);
const [airtableStatus, setAirtableStatus] = useState(null);
const [airtableMsg, setAirtableMsg] = useState(””);
const [showWithdrawal, setShowWithdrawal] = useState(false);
const [withdrawal, setWithdrawal] = useState({
interviewee: “”, original_date: “”, withdraw_all: true,
withdraw_items: { transcription: false, archival_storage: false, educational_use: false, public_exhibition: false },
notes: “”
});
const [withdrawalJson, setWithdrawalJson] = useState(false);

const consentItems = [
{ key: “transcription”, label: “Transcription”, desc: “Audio may be transcribed using Whisper and the Claude API to create a searchable text record.” },
{ key: “archival_storage”, label: “Archival storage”, desc: “Recording and transcript may be preserved in the community archive for future generations.” },
{ key: “educational_use”, label: “Educational use”, desc: “Excerpts may appear in school curriculum, youth programming, and community workshops.” },
{ key: “public_exhibition”, label: “Public exhibition”, desc: “Material may appear in dashboards, exhibits, podcasts, or media — only after Council approval.” },
];

const retentionOptions = [
{ value: “indefinite”, label: “Indefinite — held in trust by the community” },
{ value: “50_years”, label: “50 years” },
{ value: “25_years”, label: “25 years” },
{ value: “10_years”, label: “10 years” },
{ value: “until_withdrawn”, label: “Until I withdraw consent” },
];

const toggleConsent = (k) => setForm(f => ({ …f, consent_for: { …f.consent_for, [k]: !f.consent_for[k] } }));

const payload = useMemo(() => ({
schema_version: “1.0”,
project: “remembrance_day_project”,
steward: “cypher_innovation_studio”,
interviewee: form.interviewee.trim(),
date: form.date,
interviewer: form.interviewer.trim(),
location: form.location.trim() || null,
consent_for: Object.entries(form.consent_for).filter(([, v]) => v).map(([k]) => k),
retention_until: form.retention_until,
embargo: form.embargo || null,
community_review: form.community_review,
notes: form.notes.trim() || null,
signed_by_initials: initials.trim().toUpperCase() || null,
consent_recorded_at: new Date().toISOString(),
}), [form, initials]);

const jsonText = JSON.stringify(payload, null, 2);
const formValid = form.interviewee.trim() && form.interviewer.trim() && form.date;

const handleCopy = async () => {
try { await navigator.clipboard.writeText(jsonText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
};
const handleDownload = () => {
const blob = new Blob([jsonText], { type: “application/json” });
const url = URL.createObjectURL(blob);
const a = document.createElement(“a”);
a.href = url; a.download = `consent_${form.interviewee.replace(/\s+/g,"_").toLowerCase()||"interview"}_${form.date}.json`;
document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

const sendToAirtable = async () => {
setAirtableStatus(“sending”); setAirtableMsg(””);
try {
const res = await fetch(“https://cypher-consent-intake.raj28.workers.dev”, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify(payload),
});
const data = await res.json();
if (!res.ok) throw new Error(data.error || “Worker error”);
setAirtableMsg(data.message || “Consent record created in Airtable. Status: Pending Review.”);
setAirtableStatus(“done”);
} catch(e) {
setAirtableMsg(`Worker error: ${e.message}. Check that AIRTABLE_TOKEN is set in your Cloudflare Worker settings.`);
setAirtableStatus(“error”);
}
};

const withdrawalPayload = {
schema_version: “1.0”, action: “withdrawal”, project: “remembrance_day_project”,
interviewee: withdrawal.interviewee.trim(), original_interview_date: withdrawal.original_date,
withdraw_items: withdrawal.withdraw_all ? [“all”] : Object.entries(withdrawal.withdraw_items).filter(([,v])=>v).map(([k])=>k),
notes: withdrawal.notes.trim() || null,
withdrawal_recorded_at: new Date().toISOString(),
};
const withdrawalJsonText = JSON.stringify(withdrawalPayload, null, 2);
const handleDownloadWithdrawal = () => {
const blob = new Blob([withdrawalJsonText], { type: “application/json” });
const url = URL.createObjectURL(blob);
const a = document.createElement(“a”);
a.href = url; a.download = `withdrawal_${withdrawal.interviewee.replace(/\s+/g,"_").toLowerCase()||"record"}_${today}.json`;
document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

const Toggle = ({ on, onClick, ariaLabel }) => (
<button type=“button” role=“switch” aria-checked={on} aria-label={ariaLabel} onClick={onClick}
className=“relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-200”
style={{ backgroundColor: on ? “#215244” : “#D9CFC0” }}>
<span className=“inline-block h-5 w-5 rounded-full transition-transform duration-200”
style={{ transform: on ? “translateX(24px)” : “translateX(4px)”, backgroundColor: on ? “#B37602” : “#fff”, boxShadow: “0 1px 3px rgba(0,0,0,0.25)” }} />
</button>
);
const SectionHeader = ({ numeral, title, kicker }) => (
<div className="mb-6">
<div className="flex items-baseline gap-4 mb-1">
<span className=“display text-2xl italic” style={{ color: “#B37602” }}>{numeral}</span>
<h2 className=“display text-2xl md:text-3xl tracking-tight” style={{ color: “#215244”, fontWeight: 500 }}>{title}</h2>
</div>
{kicker && <p className=“text-sm leading-relaxed pl-10” style={{ color: “#2D5A52” }}>{kicker}</p>}
</div>
);
const Label = ({ children }) => (
<span className=“block text-[11px] tracking-[0.18em] uppercase mb-1” style={{ color: “#215244”, fontWeight: 500 }}>{children}</span>
);

return (
<div className=“min-h-screen w-full” style={{ backgroundColor: “#F5EFE3”, color: “#1A1A1A”, fontFamily: ‘“IBM Plex Sans”, system-ui, sans-serif’ }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400&display=swap'); .display { font-family: 'Fraunces', Georgia, serif; } .mono { font-family: 'IBM Plex Mono', monospace; } .field-input { font-family: inherit; background: transparent; border: none; border-bottom: 1px solid rgba(33,82,68,0.4); padding: 6px 0 8px; width: 100%; color: #1A1A1A; font-size: 16px; outline: none; transition: border-color 0.2s; border-radius: 0; } .field-input::placeholder { color: rgba(33,82,68,0.4); } .field-input:focus { border-bottom: 2px solid #B37602; } select.field-input { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23215244' d='M1 1l5 5 5-5'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 4px center; padding-right: 24px; cursor: pointer; } textarea.field-input { resize: vertical; min-height: 64px; } .ornament-line { background-image: linear-gradient(to right,#215244 40%,transparent 40%); background-size: 8px 1px; background-repeat: repeat-x; height: 1px; } .btn { font-family: inherit; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; font-size: 12px; padding: 13px 26px; border: none; cursor: pointer; transition: all 0.2s; } .btn:disabled { opacity: 0.4; cursor: not-allowed; } .btn-teal { background: #215244; color: #F5EFE3; } .btn-teal:hover:not(:disabled) { background: #2D5A52; transform: translateY(-1px); } .btn-outline { background: transparent; color: #215244; border: 1px solid #215244; } .btn-outline:hover:not(:disabled) { background: #215244; color: #F5EFE3; } .btn-gold { background: #B37602; color: #F5EFE3; } .btn-gold:hover:not(:disabled) { background: #215244; } .json-pre { font-family: 'IBM Plex Mono', monospace; font-size: 12px; line-height: 1.65; color: #F5EFE3; background: #215244; padding: 22px; overflow-x: auto; white-space: pre; border-left: 3px solid #B37602; } .sec-divider { border-color: rgba(33,82,68,0.18); }`}</style>

```
  <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">

    {/* HEADER — real Cypher logo */}
    <header className="mb-14">
      <div className="mb-10">
        <img src={`data:image/png;base64,${LOGO}`} alt="Cypher Innovation Studio" style={{ height: "60px", width: "auto", objectFit: "contain", display: "block" }} />
      </div>
      <h1 className="display text-4xl md:text-5xl leading-[1.05] mb-7 tracking-tight" style={{ color: "#215244", fontWeight: 500 }}>
        Oral History<br /><span style={{ fontStyle: "italic", color: "#B37602" }}>Intake & Consent</span>
      </h1>
      <div className="ornament-line mb-6" />
      <p className="display text-lg italic leading-relaxed max-w-xl" style={{ color: "#2D5A52" }}>Your stories belong to you. This form protects that.</p>
      <p className="text-[11px] tracking-[0.2em] uppercase mt-2" style={{ color: "#215244", opacity: 0.6 }}>— Adapted from the Community Data Council Agreement</p>
    </header>

    {/* I — Interview Information */}
    <section className="mb-14">
      <SectionHeader numeral="I." title="Interview Information" kicker="Names appear in the archive exactly as written here." />
      <div className="pl-0 md:pl-10 space-y-6">
        <div><Label>Interviewee</Label><input type="text" className="field-input" value={form.interviewee} onChange={e=>setForm({...form,interviewee:e.target.value})} placeholder="Name as it should appear in the archive" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><Label>Date</Label><input type="date" className="field-input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
          <div><Label>Interviewer</Label><input type="text" className="field-input" value={form.interviewer} onChange={e=>setForm({...form,interviewer:e.target.value})} placeholder="Name of interviewer" /></div>
        </div>
        <div><Label>Location (optional)</Label><input type="text" className="field-input" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Moorestown, NJ — front porch" /></div>
      </div>
    </section>

    {/* II — Consent */}
    <section className="mb-14">
      <SectionHeader numeral="II." title="What you consent to" kicker="Each item is a separate decision. You may withdraw any of these at any time." />
      <div className="pl-0 md:pl-10">
        <div className="border-t sec-divider">
          {consentItems.map(item => (
            <div key={item.key} className="flex items-start gap-5 py-5 border-b sec-divider">
              <div className="pt-1"><Toggle on={form.consent_for[item.key]} onClick={()=>toggleConsent(item.key)} ariaLabel={`Consent for ${item.label}`} /></div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <h3 className="display text-lg" style={{color:"#215244",fontWeight:500}}>{item.label}</h3>
                  <span className="text-[10px] tracking-[0.2em] uppercase shrink-0" style={{color:form.consent_for[item.key]?"#B37602":"rgba(33,82,68,0.5)",fontWeight:500}}>
                    {form.consent_for[item.key]?"Granted":"Not granted"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{color:"#1A1A1A",opacity:0.78}}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* III — Retention */}
    <section className="mb-14">
      <SectionHeader numeral="III." title="Retention preference" kicker="How long the archive holds your contribution. Embargo delays all release until the date you set." />
      <div className="pl-0 md:pl-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><Label>Retention</Label>
          <select className="field-input" value={form.retention_until} onChange={e=>setForm({...form,retention_until:e.target.value})}>
            {retentionOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div><Label>Embargo until (optional)</Label><input type="date" className="field-input" value={form.embargo} onChange={e=>setForm({...form,embargo:e.target.value})} /></div>
      </div>
    </section>

    {/* IV — Council Review */}
    <section className="mb-14">
      <SectionHeader numeral="IV." title="Community review" kicker="Whether the Community Data Council must approve any public release." />
      <div className="pl-0 md:pl-10">
        <div className="flex items-start gap-5 p-5" style={{backgroundColor:form.community_review?"rgba(33,82,68,0.06)":"rgba(179,118,2,0.08)",borderLeft:`3px solid ${form.community_review?"#215244":"#B37602"}`}}>
          <div className="pt-1"><Toggle on={form.community_review} onClick={()=>setForm({...form,community_review:!form.community_review})} ariaLabel="Require Council review" /></div>
          <div className="flex-1">
            <h3 className="display text-lg mb-1" style={{color:"#215244",fontWeight:500}}>Council review required</h3>
            <p className="text-sm leading-relaxed" style={{color:"#1A1A1A",opacity:0.78}}>
              {form.community_review?"Recommended. Nothing is released publicly without majority Council approval.":"Council review waived. We strongly recommend keeping this on."}
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* V — Notes */}
    <section className="mb-14">
      <SectionHeader numeral="V." title="Notes from the interviewee" kicker="Names not to publish, topics off the record, requests for the archivist." />
      <div className="pl-0 md:pl-10">
        <textarea className="field-input" rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional. Plain language is welcome." />
      </div>
    </section>

    {/* MOD 1 — VI. Signature / Initials */}
    <section className="mb-14">
      <SectionHeader numeral="VI." title="Confirm with initials"
        kicker="Type your initials to confirm these consent selections reflect your wishes. This creates a timestamped attestation embedded in the exported JSON record." />
      <div className="pl-0 md:pl-10">
        <div className="flex items-end gap-6">
          <div style={{width:"120px"}}>
            <Label>Your initials</Label>
            <input type="text" className="field-input" maxLength={5} value={initials} onChange={e=>setInitials(e.target.value)}
              placeholder="RAJ" style={{fontSize:"22px",letterSpacing:"0.2em",textTransform:"uppercase",textAlign:"center"}} />
          </div>
          {initials.trim() && (
            <p className="text-xs pb-2" style={{color:"#2D5A52"}}>
              Signed <strong>{initials.trim().toUpperCase()}</strong> · {new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}
            </p>
          )}
        </div>
      </div>
    </section>

    {/* Acknowledgment */}
    <div className="p-6 mb-12" style={{backgroundColor:"rgba(33,82,68,0.05)",borderTop:"1px solid rgba(33,82,68,0.2)",borderBottom:"1px solid rgba(33,82,68,0.2)"}}>
      <p className="text-[11px] tracking-[0.22em] uppercase mb-2" style={{color:"#B37602",fontWeight:600}}>Your rights, always</p>
      <p className="text-sm leading-relaxed" style={{color:"#1A1A1A"}}>
        You may withdraw consent at any time by notifying any Council member or Cypher directly. Your data will be removed from the archive within 30 days. Cypher does not own your story. The community does.
      </p>
    </div>

    {/* Export buttons */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
      <button className="btn btn-teal" disabled={!formValid} onClick={()=>setShowJson(true)}>
        {showJson?"Refresh export":"Generate consent record"}
      </button>
      {showJson && <>
        <button className="btn btn-outline" onClick={handleCopy}>{copied?"Copied ✓":"Copy JSON"}</button>
        <button className="btn btn-outline" onClick={handleDownload}>Download .json</button>
      </>}
    </div>

    {/* MOD 2 — Airtable */}
    {showJson && formValid && (
      <div className="mb-10">
        <button className="btn btn-gold" onClick={sendToAirtable} disabled={airtableStatus==="sending"}>
          {airtableStatus==="sending"?"Sending to Airtable…":"Send to Airtable"}
        </button>
        {airtableMsg && (
          <div className="mt-4 p-4 text-sm" style={{borderLeft:`3px solid ${airtableStatus==="error"?"#B37602":"#4AB396"}`,backgroundColor:"rgba(33,82,68,0.05)"}}>
            <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{color:airtableStatus==="error"?"#B37602":"#215244",fontWeight:600}}>
              {airtableStatus==="error"?"Connection issue":"Airtable response"}
            </p>
            {airtableMsg}
          </div>
        )}
      </div>
    )}

    {!formValid && <p className="text-xs mb-8" style={{color:"#B37602",fontStyle:"italic"}}>Interviewee, interviewer, and date are required before exporting.</p>}

    {showJson && formValid && (
      <div className="mb-16">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-[11px] tracking-[0.22em] uppercase" style={{color:"#215244",fontWeight:600}}>Consent Record · JSON</span>
          <span className="mono text-[10px]" style={{color:"#215244",opacity:0.6}}>schema v1.0</span>
        </div>
        <pre className="json-pre">{jsonText}</pre>
      </div>
    )}

    {/* MOD 3 — Withdrawal Companion */}
    <div className="mb-16">
      <button className="w-full text-left py-4 border-t border-b flex items-center justify-between"
        style={{borderColor:"rgba(33,82,68,0.2)"}}
        onClick={()=>setShowWithdrawal(!showWithdrawal)}>
        <span className="display text-lg" style={{color:"#215244",fontWeight:500}}>Withdraw a previous consent</span>
        <span style={{color:"#B37602",fontSize:"20px"}}>{showWithdrawal?"−":"+"}</span>
      </button>
      {showWithdrawal && (
        <div className="pt-8 pb-4">
          <p className="text-sm mb-8 leading-relaxed" style={{color:"#2D5A52"}}>
            To withdraw from a previous session, complete this form. Your data will be removed within 30 days. An email to any Council member is also sufficient — this creates a formal JSON record.
          </p>
          <div className="space-y-6">
            <div><Label>Interviewee name</Label><input type="text" className="field-input" value={withdrawal.interviewee} onChange={e=>setWithdrawal({...withdrawal,interviewee:e.target.value})} placeholder="Name as it appeared in the original record" /></div>
            <div><Label>Original interview date</Label><input type="date" className="field-input" value={withdrawal.original_date} onChange={e=>setWithdrawal({...withdrawal,original_date:e.target.value})} /></div>
            <div>
              <Label>What to withdraw</Label>
              <div className="mt-3 flex items-center gap-4 py-3 border-b sec-divider">
                <Toggle on={withdrawal.withdraw_all} onClick={()=>setWithdrawal({...withdrawal,withdraw_all:!withdrawal.withdraw_all})} ariaLabel="Withdraw all" />
                <span className="text-sm font-medium" style={{color:"#215244"}}>Withdraw ALL consent — remove everything</span>
              </div>
              {!withdrawal.withdraw_all && consentItems.map(item=>(
                <div key={item.key} className="flex items-center gap-4 py-3 border-b sec-divider">
                  <Toggle on={withdrawal.withdraw_items[item.key]} onClick={()=>setWithdrawal({...withdrawal,withdraw_items:{...withdrawal.withdraw_items,[item.key]:!withdrawal.withdraw_items[item.key]}})} ariaLabel={`Withdraw ${item.label}`} />
                  <span className="text-sm" style={{color:"#215244"}}>{item.label}</span>
                </div>
              ))}
            </div>
            <div><Label>Notes (optional)</Label><textarea className="field-input" rows={2} value={withdrawal.notes} onChange={e=>setWithdrawal({...withdrawal,notes:e.target.value})} placeholder="Any context for the withdrawal" /></div>
            <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
              <button className="btn btn-teal" disabled={!withdrawal.interviewee.trim()||!withdrawal.original_date} onClick={()=>setWithdrawalJson(true)}>
                Generate withdrawal record
              </button>
              {withdrawalJson && withdrawal.interviewee.trim() && withdrawal.original_date && (
                <button className="btn btn-outline" onClick={handleDownloadWithdrawal}>Download withdrawal.json</button>
              )}
            </div>
            {withdrawalJson && withdrawal.interviewee.trim() && withdrawal.original_date && (
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-[11px] tracking-[0.22em] uppercase" style={{color:"#215244",fontWeight:600}}>Withdrawal Record · JSON</span>
                </div>
                <pre className="json-pre">{withdrawalJsonText}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Footer */}
    <footer className="pt-10 border-t" style={{borderColor:"rgba(33,82,68,0.2)"}}>
      <div className="ornament-line mb-8" />
      <p className="display text-xl italic leading-snug max-w-2xl mb-4" style={{color:"#215244"}}>
        The future is built from the stories we choose to remember.
      </p>
      <div className="flex items-center gap-2 mt-6">
        <span className="text-[10px] tracking-[0.28em] uppercase" style={{color:"#B37602",fontWeight:600}}>Cypher</span>
        <span style={{color:"rgba(33,82,68,0.4)"}}>·</span>
        <span className="text-[10px] tracking-[0.28em] uppercase" style={{color:"#215244"}}>Remembrance Day Project</span>
        <span style={{color:"rgba(33,82,68,0.4)"}}>·</span>
        <span className="mono text-[10px]" style={{color:"#215244",opacity:0.6}}>consent v1.0</span>
      </div>
    </footer>
  </div>
</div>
```

);
}
