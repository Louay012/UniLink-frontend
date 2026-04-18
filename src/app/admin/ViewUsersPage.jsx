import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

const ROLES = ["STUDENT", "TEACHER", `COORDINATOR`, "ADMIN"];

const ViewUsersPage = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigateTo = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) navigateTo("/login");
  }, [isAdmin, navigateTo]);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const data = await apiRequest("/admin/users");

      if (selectedRole === "ALL") {
        setUsers(data);
      } else {
        setUsers(data.filter(u => u.role === selectedRole));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell admin-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1 className="title">View Users</h1>
          <p className="subtitle">Browse and manage all users in the system.</p>
          <small className="subtitle">Logged in as {user?.email}</small>
        </div>
        
      </header>

      <section className="card">
        <div className="card-header">
          <h3 className="title">User Directory</h3>
          <div className="filter-controls">
            <label htmlFor="role-filter">Filter by Role: </label>
            <select
              id="role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="error-banner">{error}</p>}
        {loading ? <p className="subtitle">Loading users...</p> : null}

        {!loading && !error && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                    <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="role-badge">{u.role}</span>
                    </td>
                    <td>
                      <span className={u.status === "ACTIVE" ? "status-badge active" : "status-badge"}>
                        {u.status || "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ViewUsersPage;
