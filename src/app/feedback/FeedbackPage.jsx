import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { listContacts, startDirectChat } from "../../services/chat.service";

const CATEGORY_OPTIONS = [
  { value: "BUG", label: "Bug report" },
  { value: "PLATFORM", label: "Platform feedback" },
  { value: "COURSE", label: "Course issue" },
  { value: "OTHER", label: "Other" }
];

function preferredRecipient(contacts) {
  if (!contacts.length) return "";

  const coordinator = contacts.find((contact) => String(contact.role || "").toUpperCase() === "COORDINATOR");
  if (coordinator) return coordinator.id;

  const teacher = contacts.find((contact) => String(contact.role || "").toUpperCase() === "TEACHER");
  if (teacher) return teacher.id;

  return contacts[0].id;
}

export default function FeedbackPage() {
  const { token, selectedRole } = useAuth();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [recipientId, setRecipientId] = useState("");
  const [category, setCategory] = useState("BUG");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    let active = true;

    async function loadContacts() {
      setLoading(true);
      setError("");

      try {
        const payload = await listContacts(selectedRole);
        if (!active) return;
        const items = payload.items || [];
        setContacts(items);
        setRecipientId(preferredRecipient(items));
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Could not load messaging contacts.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadContacts();

    return () => {
      active = false;
    };
  }, [selectedRole]);

  const recipientOptions = useMemo(() => {
    return contacts
      .slice()
      .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
  }, [contacts]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanSubject = subject.trim();
    const cleanDetails = details.trim();

    if (!recipientId || !cleanSubject || !cleanDetails) {
      setError("Recipient, subject, and details are required.");
      return;
    }

    setSubmitting(true);
    try {
      const recipient = recipientOptions.find((contact) => contact.id === recipientId);
      const message = [
        `[Feedback ${category}] ${cleanSubject}`,
        "",
        cleanDetails,
        "",
        `Sender role: ${selectedRole.value}`,
        `Sent at: ${new Date().toISOString()}`
      ].join("\n");

      await startDirectChat(selectedRole, {
        targetUserId: recipientId,
        initialMessage: message
      });

      setSuccess(`Feedback sent to ${recipient?.name || "recipient"}.`);
      setSubject("");
      setDetails("");
    } catch (submitError) {
      setError(submitError.message || "Could not submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell dashboard-work">
      <header className="hero dashboard-work-hero feedback-tone">
        <div>
          <p className="tag">UniLink</p>
          <h1>Report Issue / Feedback</h1>
          <p className="subtitle">Submit feedback through a real direct message flow supported by the current backend messaging policy.</p>
        </div>
      </header>

      {error ? (
        <div className="error-banner">
          <AlertCircle size={16} /> {error}
        </div>
      ) : null}

      {success ? (
        <div className="success-banner">
          <CheckCircle2 size={16} /> {success}
        </div>
      ) : null}

      <section className="dashboard-work-section">
        <form className="feedback-form" onSubmit={handleSubmit}>
          <label>
            Recipient
            <select
              value={recipientId}
              onChange={(event) => setRecipientId(event.target.value)}
              disabled={loading || submitting || !recipientOptions.length}
              required
            >
              {!recipientOptions.length ? <option value="">No allowed recipients</option> : null}
              {recipientOptions.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} ({contact.role})
                </option>
              ))}
            </select>
          </label>

          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={submitting}>
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            Subject
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Short summary"
              disabled={submitting}
              required
            />
          </label>

          <label>
            Details
            <textarea
              rows={8}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Explain the issue or suggestion"
              disabled={submitting}
              required
            />
          </label>

          <div className="feedback-actions">
            <button type="button" className="dashboard-ghost-btn" onClick={() => navigate("/dashboard")}>
              Back to dashboard
            </button>
            <button type="submit" className="primary-btn" disabled={submitting || loading || !recipientOptions.length}>
              <Send size={14} /> {submitting ? "Sending..." : "Send feedback"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
