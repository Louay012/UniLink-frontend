import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";

const ROLES = ["STUDENT", "TEACHER", "COORDINATOR", "ADMIN"];

export default function AdminDashboard() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [users,   setUsers]   = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error,   setError]   = useState("");
  const [errorCourses, setErrorCourses] = useState("");

  // Form state for creating a new user
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", role: "STUDENT"
  });
  const [formError,   setFormError]   = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) navigate("/login");
  }, [isAdmin, navigate]);

  // Load all users when the page opens
  useEffect(() => {
    fetchUsers();
  }, []);

  // Load all courses when the page opens
  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const data = await apiRequest("/admin/users");
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourses() {
    try {
      setLoadingCourses(true);
      const data = await apiRequest("/admin/courses");
      setCourses(data);
    } catch (err) {
      setErrorCourses(err.message);
    } finally {
      setLoadingCourses(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await apiRequest(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      // Update the list locally without refetchfetching
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );
    } catch (err) {
      alert("Failed to update role: " + err.message);
    }
  }

  async function handleDelete(userId) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiRequest(`/admin/users/${userId}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    }
  }

  async function handleAssignCourse(userId, courseId) {
    if (!courseId) return;
    try {
      await apiRequest(`/admin/users/${userId}/courses`, {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
      alert("Course assigned successfully!");
      fetchUsers(); // Refresh to show updated state if necessary
    } catch (err) {
      alert("Failed to assign course: " + err.message);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    try {
      await apiRequest("/admin/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setFormSuccess("User created successfully!");
      setForm({ firstName: "", lastName: "", email: "", password: "", role: "STUDENT" });
      fetchUsers(); // Refresh the list
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="page-shell admin-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Administration</h1>
          <p className="subtitle">Manage accounts, roles, and access across your university platform.</p>
          <small className="subtitle">Logged in as {user?.email}</small>
        </div>
        
      </header>

      <section className="card">
        <div className="card-header">
          <h3>Create User</h3>
          <span>Directory management</span>
        </div>

        {formError ? <p className="error-banner">{formError}</p> : null}
        {formSuccess ? <p className="success-banner">{formSuccess}</p> : null}

        <form onSubmit={handleCreateUser} className="admin-form-grid">
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
                placeholder={label.toLowerCase()}
              />
            </label>
          ))}

          <label>
            Role
            <select
              value={form.role}
              onChange={(e) => set: (prev) => ({ ...prev, role: e.target.value }))}
            >
              {/* Note: I'll fix the broken syntax in the select onChange below if I see it */}
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <button className="primary-btn" type="submit">Create User</button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>User Accounts</h3>
          <span>{users.length} accounts</span>
        </div>

        {loading ? <p className="subtitle">Loading users...</p>: null}
        {error ? <p className="error-banner">{error}</p> : null}

        {!loading && !error ? (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Assign Course</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role || "STUDENT"}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={u.status === "ACTIVE" ? "status-badge active" : "status-badge"}>
                        {u.status || "ACTIVE"}
                      </span>
                    </td>
                    <td>
                      <select
                        className="admin-select"
                        value=""
                        onChange={(e) => handleAssignCourse(u.id, e.target.value)}
                      >
                        <option value="" disabled>Assign course...</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.title}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="link-danger" onClick={() => handleDelete(u.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
