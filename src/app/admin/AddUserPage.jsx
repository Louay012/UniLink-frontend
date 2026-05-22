import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

const ROLES = ["STUDENT", "TEACHER", "COORDINATOR", "ADMIN"];

const AddUserPage = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigateTo = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "STUDENT"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("single"); // "single" | "bulk"
  const [dragOver, setDragOver] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkResult, setBulkResult] = useState(null); // { created, skipped, errors }


  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) navigateTo("/login");
  }, [isAdmin, navigateTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/admin/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSuccess("User created successfully!");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "STUDENT"
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // ── Bulk upload handlers ────────────────────────────────────────────────────
  const ACCEPTED = [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];
 
  const validateFile = (file) => {
    if (!file) return "No file selected.";
    if (!ACCEPTED.includes(file.type) && !/\.(csv|xlsx|xls)$/i.test(file.name))
      return "Only CSV and Excel (.xlsx / .xls) files are supported.";
    if (file.size > 5 * 1024 * 1024) return "File must be smaller than 5 MB.";
    return null;
  };
 
  const handleFileChange = (file) => {
    setBulkResult(null);
    setBulkError("");
    const err = validateFile(file);
    if (err) { setBulkError(err); setBulkFile(null); return; }
    setBulkFile(file);
  };
 
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };
 
  const handleBulkSubmit = async () => {
    if (!bulkFile) { setBulkError("Please select a file first."); return; }
    setBulkLoading(true);
    setBulkError("");
    setBulkResult(null);
 
    const formData = new FormData();
    formData.append("file", bulkFile);
    
    try {
      // apiRequest may not support FormData — call fetch directly
      const token = localStorage.getItem("token"); // adjust to your auth storage
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed.");
      setBulkResult(data); // { created, skipped, errors: [{row, reason}] }
      setBulkFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="page-shell admin-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1 className="title">Add User</h1>
          <p className="subtitle">Create new accounts for students, teachers, or administrators.</p>
          <small className="subtitle">Logged in as {user?.email}</small>
        </div>
        
      </header>

      <section className="card">
        <div className="card-header">
          <h3 className="title">Create New User</h3>
          <span className="subtitle">Directory management</span>
        </div>
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === "single" ? "active" : ""}`}
            onClick={() => setActiveTab("single")}
          >
            Single User
          </button>
          <button
            className={`tab-btn ${activeTab === "bulk" ? "active" : ""}`}
            onClick={() => setActiveTab("bulk")}
          >
            Bulk Upload
          </button>
        </div>

        {activeTab == "single" && (
        <>
        {error && <p className="error-banner">{error}</p>}
        {success && <p className="success-banner">{success}</p>}

        <form onSubmit={handleSubmit} className="admin-form-grid">
          {[
            { label: "First Name", key: "firstName", type: "text" },
            { label: "Last Name", key: "lastName", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Password", key: "password", type: "password" }
          ].map(({ label, key, type }) => (
            <label key={key}>
              {label}
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                required
              />
            </label>
          ))}

          <label>
            Role
            <select
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
        </>)}
        {activeTab === "bulk" && (
          <div className="bulk-panel">
            <p className="bulk-hint">
              Upload a <strong>CSV</strong> or <strong>Excel</strong> file. Each row must have the
              columns: <code>firstName, lastName, email, password, role</code>.{" "}
              <a href="/templates/bulk_users_template.csv" download className="template-link">
                Download template ↓
              </a>
            </p>
 
            {/* Drop zone */}
            <div
              className={`drop-zone ${dragOver ? "drag-over" : ""} ${bulkFile ? "has-file" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              {bulkFile ? (
                <>
                  <span className="drop-icon">📄</span>
                  <span className="drop-filename">{bulkFile.name}</span>
                  <span className="drop-size">({(bulkFile.size / 1024).toFixed(1)} KB)</span>
                  <button
                    className="remove-file-btn"
                    onClick={(e) => { e.stopPropagation(); setBulkFile(null); setBulkError(""); setBulkResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  >
                    ✕ Remove
                  </button>
                </>
              ) : (
                <>
                  <span className="drop-icon">☁️</span>
                  <span className="drop-label">Drag & drop your file here, or <u>click to browse</u></span>
                  <span className="drop-sub">CSV or Excel · max 5 MB</span>
                </>
              )}
            </div>
 
            {bulkError && <p className="error-banner">{bulkError}</p>}
 
            <button
              className="primary-btn"
              onClick={handleBulkSubmit}
              disabled={bulkLoading || !bulkFile}
            >
              {bulkLoading ? "Uploading..." : "Upload & Create Users"}
            </button>
 
            {/* Results */}
            {bulkResult && (
              <div className="bulk-result">
                <p className="success-banner">
                  ✅ {bulkResult.created} user{bulkResult.created !== 1 ? "s" : ""} created
                  {bulkResult.skipped > 0 && `, ${bulkResult.skipped} skipped (duplicates)`}.
                </p>
                {bulkResult.errors?.length > 0 && (
                  <details className="error-details">
                    <summary>{bulkResult.errors.length} row error{bulkResult.errors.length !== 1 ? "s" : ""} — click to expand</summary>
                    <table className="error-table">
                      <thead><tr><th>Row</th><th>Reason</th></tr></thead>
                      <tbody>
                        {bulkResult.errors.map((e, i) => (
                          <tr key={i}><td>{e.row}</td><td>{e.reason}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

      </section>
    </div>
  );
};

export default AddUserPage;
