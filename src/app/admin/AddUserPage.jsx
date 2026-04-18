import React, { useState, useEffect } from 'react';
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
      </section>
    </div>
  );
};

export default AddUserPage;
