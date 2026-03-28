import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";

const ROLES = ["STUDENT", "TEACHER", "COORDINATOR", "ADMIN"];

export default function AdminPage() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Form state for creating a new user
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", role: "STUDENT"
  });
  const [formError,   setFormError]   = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) navigate("/login");
  }, [isAdmin]);

  // Load all users when the page opens
  useEffect(() => {
    fetchUsers();
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

  async function handleRoleChange(userId, newRole) {
    try {
      await apiRequest(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      // Update the list locally without refetching
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
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500">Logged in as {user?.email}</p>
        </div>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="text-sm text-red-500 hover:text-red-700 font-medium"
        >
          Logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* ── Create User Form ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New User</h2>

          {formError   && <p className="text-red-500 text-sm mb-3">{formError}</p>}
          {formSuccess && <p className="text-green-600 text-sm mb-3">{formSuccess}</p>}

          <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
            {[
              { label: "First Name", key: "firstName", type: "text" },
              { label: "Last Name",  key: "lastName",  type: "text" },
              { label: "Email",      key: "email",     type: "email" },
              { label: "Password",   key: "password",  type: "password" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
              >
                Create User
              </button>
            </div>
          </form>
        </div>

        {/* ── Users Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            All Users ({users.length})
          </h2>

          {loading && <p className="text-gray-400 text-sm">Loading users...</p>}
          {error   && <p className="text-red-500 text-sm">{error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-800">
                        {u.first_name} {u.last_name}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                      <td className="py-3 pr-4">
                        <select
                          value={u.role || "STUDENT"}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.status === "ACTIVE"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {u.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}