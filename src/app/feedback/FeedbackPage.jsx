import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ChevronDown } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { listFeedbackReports, submitFeedbackReport } from "../../services/feedback.service";
import { userHasRole } from "../../utils/roles";

const CATEGORY_OPTIONS = [
  { value: "BUG", label: "Bug report" },
  { value: "PLATFORM", label: "Platform feedback" },
  { value: "COURSE", label: "Course issue" },
  { value: "OTHER", label: "Other" }
];

export default function FeedbackPage() {
  const { token, selectedRole, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const isAdmin = userHasRole(user, "ADMIN");

  const [category, setCategory] = useState("BUG");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    let active = true;
    async function loadReports() {
      if (!isAdmin) {
        setReports([]);
        return;
      }
      setLoading(true);
      try {
        const payload = await listFeedbackReports(selectedRole);
        if (!active) return;
        setReports(payload.items || []);
      } catch (err) {
        if (active) toast.error(err.message || "Could not load bug reports.", "Feedback");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReports();
    return () => { active = false; };
  }, [selectedRole, isAdmin]);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanSubject = subject.trim();
    const cleanDetails = details.trim();

    if (!cleanSubject || !cleanDetails) {
      toast.error("Subject and details are required.", "Validation");
      return;
    }

    setSubmitting(true);
    try {
      const payload = await submitFeedbackReport(selectedRole, {
        category,
        subject: cleanSubject,
        details: cleanDetails
      });
      toast.success("Bug report submitted.", "Sent!");
      setSubject("");
      setDetails("");
      if (isAdmin && payload.report) {
        setReports((previous) => [payload.report, ...previous]);
      }
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
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-white mb-1">
            {isAdmin ? "Bug Reports" : "Report Issue / Feedback"}
          </h1>
          <p className="text-sm text-white/60">
            {isAdmin ? "Review submitted bug reports and platform feedback." : "Submit bug reports and platform feedback outside direct messages."}
          </p>
        </div>
      </section>

      {!isAdmin ? (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

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
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {submitting ? "Sending..." : "Send feedback"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 m-0">Bug Reports</h2>
              <p className="text-sm text-slate-500 m-0">Submitted reports are stored here, not in chat.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{reports.length} total</span>
          </div>

          <div className="grid gap-3">
            {reports.map((report) => (
              <article key={report.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm text-slate-900">{report.subject}</strong>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-bold text-slate-600">{report.category}</span>
                </div>
                <p className="mt-2 mb-3 whitespace-pre-wrap text-sm text-slate-700">{report.details}</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{report.reporter?.name || "Unknown reporter"}</span>
                  <span>{report.reporter?.role || "Member"}</span>
                  <span>{report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}</span>
                </div>
              </article>
            ))}
            {!reports.length ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                {loading ? "Loading reports..." : "No bug reports yet."}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
