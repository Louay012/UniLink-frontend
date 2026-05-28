import React, { useState, useEffect, useRef,useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

const ROLES = ["STUDENT", "TEACHER", "COORDINATOR", "ADMIN"];

const ACCEPTED_EXTENSIONS = /\.(csv|xlsx|xls)$/i;
 
function DropZone({ onFile, file, disabled }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
 
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  }, [onFile, disabled]);
 
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };
  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      className={`drop-zone ${dragging ? "drag-over" : ""} ${file ? "has-file" : ""} ${disabled ? "disabled" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        style={{ display: "none" }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
        disabled={disabled}
      />
      <div className="drop-zone-icon">{file ? "📄" : "⬆️"}</div>
      {file ? (
        <>
          <p className="drop-zone-name">{file.name}</p>
          <p className="drop-zone-hint">{(file.size / 1024).toFixed(1)} KB — click to replace</p>
        </>
      ) : (
        <>
          <p className="drop-zone-name">Drop your file here or click to browse</p>
          <p className="drop-zone-hint">Accepts .csv, .xls, .xlsx — max 10 MB</p>
        </>
      )}
    </div>
  );
}
function StatCard({ label, value, type }) {
  const classMap = {
    success: "stat-card stat-card--success",
    danger:  "stat-card stat-card--danger",
    warning: "stat-card stat-card--warning",
    default: "stat-card",
  };
  return (
    <div className={classMap[type] || classMap.default}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
    </div>
  );
}
function ErrorTable({ title, rows, columns }) {
  if (!rows?.length) return null;
  return (
    <div className="error-table-wrapper">
      <p className="error-table__title">{title} ({rows.length})</p>
      <div className="error-table__container">
        <table className="error-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "row-even" : "row-odd"}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


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
  
  const [activeTab, setActiveTab] = useState("single"); // "single" | "bulk"
    
  const [bulkFile, setBulkFile]       = useState(null);
  const [bulkStatus, setBulkStatus]   = useState("idle"); // idle | uploading | done | error
  const [bulkResult, setBulkResult]   = useState(null);
  const [bulkError, setBulkError]     = useState("");



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
  
    const validateFile = (f) => {
    if (!f) return "No file selected.";
    if (!ACCEPTED_EXTENSIONS.test(f.name))
      return "Only CSV and Excel (.xlsx / .xls) files are supported.";
    if (f.size > 10 * 1024 * 1024) return "File must be smaller than 10 MB.";
    return null;
  };
 
  const handleFileSelect = (f) => {
    setBulkResult(null);
    setBulkError("");
    setBulkStatus("idle");
    const err = validateFile(f);
    if (err) { setBulkError(err); return; }
    setBulkFile(f);
  };
 
  const resetBulk = () => {
    setBulkFile(null);
    setBulkStatus("idle");
    setBulkResult(null);
    setBulkError("");
  };
 const handleBulkUpload = async () => {
  if (!bulkFile) { setBulkError("Please select a file first."); return; }
  setBulkStatus("uploading");
  setBulkError("");
  setBulkResult(null);

  const formData = new FormData();
  formData.append("file", bulkFile);

  try {
    const data = await apiRequest("/admin/bulk", {
      method: "POST",
      body: formData,
    });
    setBulkResult(data);
    setBulkStatus("done");
    setBulkFile(null);
  } catch (err) {
    setBulkError(err.message || "Upload failed. Please try again.");
    setBulkStatus("error");
  }
};
const isUploading = bulkStatus === "uploading";

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
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit mb-6">
          <button
          type="button"                          
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200  ${activeTab === "single" ?  "bg-blue-600 text-white shadow-lg shadow-blue-600/40" : "text-gray-400 hover:text-black hover:bg-white/10"}`}
            onClick={() => setActiveTab("single")}
          >
            Single User
          </button>
          <button
          type="button"                          
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200  ${activeTab === "bulk" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40" : "text-gray-400 hover:text-black hover:bg-white/10"}`}
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
              Upload a <strong>CSV</strong> or <strong>Excel</strong> file. Columns:{" "}
              <code>firstName, lastName, email, password, role</code>, and optional <code>classGroup</code>.{" "}
              <a href="/templates/bulk_users_template.csv" download className="template-link" title="Example: John,Doe,j.doe@example.com,secret123,STUDENT,GL1">
                Download template ↓
              </a>
            </p>
 
            <DropZone onFile={handleFileSelect} file={bulkFile} disabled={isUploading} />
 
            {bulkError && <p className="error-banner" style={{ marginTop: "0.75rem" }}>{bulkError}</p>}
 
            <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
              <button
                className="primary-btn"
                onClick={handleBulkUpload}
                disabled={!bulkFile || isUploading}
                style={{ flex: 1 }}
              >
                {isUploading ? "Uploading..." : "Upload & Create Users"}
              </button>
              {(bulkFile || bulkStatus !== "idle") && (
                <button onClick={resetBulk} disabled={isUploading}>
                  Reset
                </button>
              )}
            </div>
                        {/* Progress bar */}
            {isUploading && (
              <div className="progress-bar">
                <div className="progress-bar__fill" />
              </div>
            )}
 
            {/* Results */}
            {bulkResult && (
              <div className="bulk-result" style={{ marginTop: "1.5rem" }}>
                <div className={`${bulkResult.data?.inserted === 0 ? "error-banner" : "success-banner"}`}>
                  {bulkResult.message}
                </div>
 
                <div style={{ display: "flex", gap: 8, margin: "1rem 0" }}>
                  <StatCard label="Total rows" value={bulkResult.data?.total}      type="default" />
                  <StatCard label="Inserted"   value={bulkResult.data?.inserted}   type="success" />
                  <StatCard label="Duplicates" value={bulkResult.data?.duplicates} type="warning" />
                  <StatCard label="Failed"     value={bulkResult.data?.failed}     type="danger"  />
                </div>
 
                <ErrorTable
                  title="Validation errors"
                  rows={bulkResult.errors}
                  columns={[
                    { key: "row",    label: "Row",    width: "60px" },
                    { key: "email",  label: "Email",  width: "180px", render: (r) => r.data?.email || "—" },
                    { key: "errors", label: "Issues", render: (r) => r.errors.join("; ") },
                  ]}
                />
 
                <ErrorTable
                  title="Skipped duplicates"
                  rows={bulkResult.duplicates}
                  columns={[
                    { key: "row",    label: "Row",    width: "60px" },
                    { key: "email",  label: "Email",  width: "220px" },
                    { key: "reason", label: "Reason" },
                  ]}
                />
              </div>
            )}
          </div>
        )}



      </section>
    </div>
  );
};

export default AddUserPage;
