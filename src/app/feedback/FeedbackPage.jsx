import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Send, ChevronDown } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { listContacts, startDirectChat } from "../../services/chat.service";

const CATEGORY_OPTIONS = [
  { value: "BUG", label: "Bug report" },
  { value: "PLATFORM", label: "Platform feedback" },
  { value: "COURSE", label: "Course issue" },
  { value: "OTHER", label: "Other" }
];

function preferredRecipient(contacts) {
  if (!contacts.length) return "";
  const coordinator = contacts.find((c) => String(c.role || "").toUpperCase() === "COORDINATOR");
  if (coordinator) return coordinator.id;
  const teacher = contacts.find((c) => String(c.role || "").toUpperCase() === "TEACHER");
  if (teacher) return teacher.id;
  return contacts[0].id;
}

export default function FeedbackPage() {
  const { token, selectedRole } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [contacts, setContacts] = useState([]);
  const [recipientId, setRecipientId] = useState("");
  const [category, setCategory] = useState("BUG");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    let active = true;
    async function loadContacts() {
      setLoading(true);
      try {
        const payload = await listContacts(selectedRole);
        if (!active) return;
        const items = payload.items || [];
        setContacts(items);
        setRecipientId(preferredRecipient(items));
      } catch (err) {
        if (active) toast.error(err.message || "Could not load messaging contacts.", "Feedback");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadContacts();
    return () => { active = false; };
  }, [selectedRole]);

  const recipientOptions = useMemo(() =>
    contacts.slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [contacts]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanSubject = subject.trim();
    const cleanDetails = details.trim();

    if (!recipientId || !cleanSubject || !cleanDetails) {
      toast.error("Recipient, subject, and details are required.", "Validation");
      return;
    }

    setSubmitting(true);
    try {
      const recipient = recipientOptions.find((c) => c.id === recipientId);
      const message = [
        `[Feedback ${category}] ${cleanSubject}`,
        "",
        cleanDetails,
        "",
        `Sender role: ${selectedRole.value}`,
        `Sent at: ${new Date().toISOString()}`
      ].join("\n");

      await startDirectChat(selectedRole, { targetUserId: recipientId, initialMessage: message });
      toast.success(`Feedback sent to ${recipient?.name || "recipient"}.`, "Sent!");
      setSubject("");
      setDetails("");
    } catch (err) {
      toast.error(err.message || "Could not submit feedback.", "Feedback Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-8 w-full min-w-0 max-w-2xl mx-auto">

      {/* Hero */}
      <section
        className="relative rounded-2xl p-6 sm:p-8 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)" }}
        />
        <div className="relative z-10">
          <p className="text-[0.72rem] font-bold uppercase tracking-widest text-white/50 mb-1">UniLink</p>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-white mb-1">Report Issue / Feedback</h1>
          <p className="text-sm text-white/60">Submit feedback through a direct message to your coordinator or teacher.</p>
        </div>
      </section>

      {/* Form Card */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Recipient */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-recipient" className="text-sm font-semibold text-slate-700">Recipient</label>
            <div className="relative">
              <select
                id="fb-recipient"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                disabled={loading || submitting || !recipientOptions.length}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
              >
                {!recipientOptions.length
                  ? <option value="">No allowed recipients</option>
                  : recipientOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                    ))
                }
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-category" className="text-sm font-semibold text-slate-700">Category</label>
            <div className="relative">
              <select
                id="fb-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-subject" className="text-sm font-semibold text-slate-700">Subject</label>
            <input
              id="fb-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short summary of the issue"
              disabled={submitting}
              required
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-details" className="text-sm font-semibold text-slate-700">Details</label>
            <textarea
              id="fb-details"
              rows={7}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue or suggestion in detail"
              disabled={submitting}
              required
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 resize-none disabled:opacity-60"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              Back to dashboard
            </button>
            <button
              type="submit"
              disabled={submitting || loading || !recipientOptions.length}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {submitting ? "Sending..." : "Send feedback"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
