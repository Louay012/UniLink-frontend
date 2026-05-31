import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { userHasRole } from '../../utils/roles';

const ROLES = ['STUDENT', 'TEACHER', 'COORDINATOR', 'ADMIN'];
const TABS = ['Users', 'Courses', 'Class Groups'];

/* ─────────────────────────────────────────
   TAB BAR
───────────────────────────────────────── */
function TabBar({ active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      background: 'var(--color-background-secondary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: '10px',
      padding: '4px',
      width: 'fit-content',
      marginBottom: '20px',
    }}>
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: '7px 18px',
            borderRadius: '7px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: active === tab ? 600 : 400,
            background: active === tab ? 'var(--color-background-primary)' : 'transparent',
            color: active === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            boxShadow: active === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all .15s',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   USERS TAB
───────────────────────────────────────── */
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  useEffect(() => {
    apiRequest('/admin/class-groups')
      .then((data) => setGroups(data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, selectedGroup]);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/admin/users');
      let filtered = data || [];
      if (selectedRole !== 'ALL') {
        filtered = filtered.filter((u) => userHasRole(u, selectedRole));
      }
      if (selectedGroup !== 'ALL') {
        filtered = filtered.filter((u) => u.code === selectedGroup);
      }
      setUsers(filtered);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <h3 className="title">User Directory</h3>
        <div className="filter-controls">
          <label htmlFor="role-filter">Role: </label>
          <select
            id="role-filter"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <label htmlFor="group-filter" style={{ marginLeft: '12px' }}>Group: </label>
          <select
            id="group-filter"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="ALL">All Groups</option>
            {groups.map((g) => (
              <option key={g.code} value={g.code}>{g.code} — {g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}
      {loading && <p className="subtitle">Loading users…</p>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Group</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '24px' }}>No users found.</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="role-badge">
                      {Array.isArray(u.roles) && u.roles.length ? u.roles.join(', ') : u.role}
                    </span>
                  </td>
                  <td>
                    {userHasRole(u, 'STUDENT')
                      ? (u.code ?? <span style={{ color: 'var(--color-text-tertiary)' }}>Unassigned</span>)
                      : <span style={{ color: 'var(--color-text-tertiary)' }}>N/A</span>}
                  </td>
                  <td>
                    <span className={u.status === 'ACTIVE' ? 'status-badge active' : 'status-badge'}>
                      {u.status || 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────
   COURSES TAB
───────────────────────────────────────── */
function CoursesTab() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiRequest('/admin/coursesinfo')
      .then((data) => setCourses(data || []))
      .catch((err) => setError(err.message || 'Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="card">
      <div className="card-header">
        <h3 className="title">Courses</h3>
        <div className="filter-controls">
          <input
            type="text"
            placeholder="Search by code or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '7px',
              border: '0.5px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              outline: 'none',
              minWidth: '220px',
            }}
          />
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}
      {loading && <p className="subtitle">Loading courses…</p>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Class Group</th>
                <th>Chat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '24px' }}>No courses found.</td></tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><span className="role-badge">{c.code}</span></td>
                  <td>{c.title}</td>
                  <td>{ c.name ?? <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}</td>
                  <td>
                    <span className={c.is_course_chat_enabled ? 'status-badge active' : 'status-badge'}>
                      {c.is_course_chat_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────
   CLASS GROUPS TAB
───────────────────────────────────────── */
function ClassGroupsTab() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/admin/class-groups')
      .then((data) => setGroups(data || []))
      .catch((err) => setError(err.message || 'Failed to load class groups'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <h3 className="title">Class Groups</h3>
        <span>{groups.length} groups</span>
      </div>

      {error && <p className="error-banner">{error}</p>}
      {loading && <p className="subtitle">Loading class groups…</p>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Coordinator</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '24px' }}>No class groups found.</td></tr>
              )}
              {groups.map((g) => (
                <tr key={g.id}>
                  <td><span className="role-badge">{g.code}</span></td>
                  <td>{g.name}</td>
                  <td>{g.departmentCode ?? g.departmentName ?? <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}</td>
                  <td>
                    {g.coordinatorName
                      ? `${g.coordinatorName} `
                      : <span style={{ color: 'var(--color-text-tertiary)' }}>None</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
const ViewUsersPage = () => {
  const { user, isAdmin } = useAuth();
  const navigateTo = useNavigate();
  const [activeTab, setActiveTab] = useState('Users');

  useEffect(() => {
    if (!isAdmin) navigateTo('/login');
  }, [isAdmin, navigateTo]);

  return (
    <div className="page-shell admin-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1 className="title">Directory</h1>
          <p className="subtitle">Browse users, courses, and class groups.</p>
          <small className="subtitle">Logged in as {user?.email}</small>
        </div>
      </header>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'Users'        && <UsersTab />}
      {activeTab === 'Courses'      && <CoursesTab />}
      {activeTab === 'Class Groups' && <ClassGroupsTab />}
    </div>
  );
};

export default ViewUsersPage;