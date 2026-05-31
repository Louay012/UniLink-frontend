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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', status: 'ACTIVE', role: '',
    // teacher fields
    employeeCode: '', professionalGrade: '', employmentStatus: '', academicRank: '', hireDate: '', officeLocation: '', officeHours: '', bio: ''
  });
  const [editError, setEditError] = useState('');
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [coordinatorProfile, setCoordinatorProfile] = useState(null);

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

  function openEditModal(user) {
    setEditingUser(user);
    setEditError('');
    setShowEditModal(true);
    // fetch detailed info
    (async () => {
      try {
        const details = await apiRequest(`/admin/users/${user.id}/details`);
        setTeacherProfile(details.teacherProfile || null);
        setCoordinatorProfile(details.coordinatorProfile || null);
        setEditForm(prev => ({
          ...prev,
          firstName: details.firstName || user.first_name || '',
          lastName: details.lastName || user.last_name || '',
          email: details.email || user.email || '',
          phone: details.phone || user.phone || '',
          status: details.status || user.status || 'ACTIVE',
          role: (details.roles && details.roles.length) ? details.roles[0] : (user.role || 'STUDENT'),
          employeeCode: details.teacherProfile?.employeeCode || '',
          professionalGrade: details.teacherProfile?.professionalGrade || '',
          employmentStatus: details.teacherProfile?.employmentStatus || '',
          academicRank: details.teacherProfile?.academicRank || '',
          hireDate: details.teacherProfile?.hireDate ? details.teacherProfile.hireDate.split('T')[0] : '',
          officeLocation: details.teacherProfile?.officeLocation || '',
          officeHours: details.teacherProfile?.officeHours || '',
          bio: details.teacherProfile?.bio || ''
        }));
      } catch (err) {
        // fallback to basic user info
        setEditForm(prev => ({
          ...prev,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          status: user.status || 'ACTIVE',
          role: Array.isArray(user.roles) && user.roles.length ? user.roles[0] : (user.role || 'STUDENT')
        }));
        setTeacherProfile(null);
        setCoordinatorProfile(null);
      }
    })();
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingUser(null);
    setEditForm({ firstName: '', lastName: '', email: '', phone: '', status: 'ACTIVE', role: '' });
    setEditError('');
  }

  async function saveEdit(id) {
    setEditError('');
    try {
      // Update basic fields
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        status: editForm.status
      };

      const updated = await apiRequest(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      // If role changed, update role too
      const currentRole = Array.isArray(editingUser.roles) && editingUser.roles.length ? editingUser.roles[0] : editingUser.role;
      if (editForm.role && editForm.role !== currentRole) {
        await apiRequest(`/admin/users/${id}/role`, {
          method: 'PATCH',
          body: JSON.stringify({ role: editForm.role })
        });
      }

      // If TEACHER, update teacher profile
      if (editForm.role === 'TEACHER') {
        const teacherPayload = {
          employeeCode: editForm.employeeCode,
          professionalGrade: editForm.professionalGrade,
          employmentStatus: editForm.employmentStatus,
          academicRank: editForm.academicRank,
          hireDate: editForm.hireDate || null,
          officeLocation: editForm.officeLocation,
          officeHours: editForm.officeHours,
          bio: editForm.bio
        };
        await apiRequest(`/admin/users/${id}/teacher`, {
          method: 'PATCH',
          body: JSON.stringify(teacherPayload)
        });
      }

      // Refresh local list entry
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated, role: editForm.role, roles: [editForm.role] } : u)));
      closeEditModal();
    } catch (err) {
      setEditError(err.message || 'Failed to update user');
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
                <th>Actions</th>
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
                  <td>
                    <button className="link" onClick={() => openEditModal(u)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditModal && editingUser && (
          <div className="announcement-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
            <div className="announcement-modal-panel">
              <div className="announcement-modal-header">
                <div>
                  <p className="announcement-modal-kicker">Edit User</p>
                  <h3>{editingUser.first_name} {editingUser.last_name}</h3>
                  <p className="announcement-modal-subtitle">Update account details, role, and teacher profile.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button aria-label="Close" className="announcement-modal-close" onClick={closeEditModal}>✕</button>
                </div>
              </div>

              <form className="announcement-modal-form" onSubmit={(e) => { e.preventDefault(); saveEdit(editingUser.id); }}>
                <div className="announcement-modal-grid">
                  <div className="announcement-field">
                    <span>First name</span>
                    <input value={editForm.firstName} onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))} />
                  </div>

                  <div className="announcement-field">
                    <span>Last name</span>
                    <input value={editForm.lastName} onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))} />
                  </div>

                  <div className="announcement-field announcement-field-wide">
                    <span>Email</span>
                    <input type="email" value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
                  </div>

                  <div className="announcement-field">
                    <span>Phone</span>
                    <input value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>

                  <div className="announcement-field">
                    <span>Status</span>
                    <select value={editForm.status} onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  <div className="announcement-field">
                    <span>Role</span>
                    <select value={editForm.role} onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}>
                      <option value="STUDENT">STUDENT</option>
                      <option value="TEACHER">TEACHER</option>
                      <option value="COORDINATOR">COORDINATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>

                {editError ? <p className="error-banner">{editError}</p> : null}

                {/* Teacher fields */}
                {editForm.role === 'TEACHER' && (
                  <div>
                    <div style={{ height: 8 }} />
                    <div style={{ fontWeight: 800, color: '#334155', marginBottom: 8 }}>Teacher profile</div>
                    <div className="announcement-modal-grid">
                      <div className="announcement-field">
                        <span>Employee code</span>
                        <input value={editForm.employeeCode} onChange={(e) => setEditForm(prev => ({ ...prev, employeeCode: e.target.value }))} />
                      </div>
                      <div className="announcement-field">
                        <span>Professional grade</span>
                        <input value={editForm.professionalGrade} onChange={(e) => setEditForm(prev => ({ ...prev, professionalGrade: e.target.value }))} />
                      </div>
                      <div className="announcement-field">
                        <span>Employment status</span>
                        <input value={editForm.employmentStatus} onChange={(e) => setEditForm(prev => ({ ...prev, employmentStatus: e.target.value }))} />
                      </div>
                      <div className="announcement-field">
                        <span>Academic rank</span>
                        <input value={editForm.academicRank} onChange={(e) => setEditForm(prev => ({ ...prev, academicRank: e.target.value }))} />
                      </div>
                      <div className="announcement-field">
                        <span>Hire date</span>
                        <input type="date" value={editForm.hireDate} onChange={(e) => setEditForm(prev => ({ ...prev, hireDate: e.target.value }))} />
                      </div>
                      <div className="announcement-field">
                        <span>Office location</span>
                        <input value={editForm.officeLocation} onChange={(e) => setEditForm(prev => ({ ...prev, officeLocation: e.target.value }))} />
                      </div>
                      <div className="announcement-field announcement-field-wide">
                        <span>Office hours</span>
                        <input value={editForm.officeHours} onChange={(e) => setEditForm(prev => ({ ...prev, officeHours: e.target.value }))} />
                      </div>
                      <div className="announcement-field announcement-field-wide">
                        <span>Bio</span>
                        <textarea value={editForm.bio} onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))} rows={4} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Coordinator groups (read-only) */}
                {coordinatorProfile && coordinatorProfile.supervisedGroups && coordinatorProfile.supervisedGroups.length > 0 && (
                  <div>
                    <div style={{ height: 8 }} />
                    <div style={{ fontWeight: 800, color: '#334155', marginBottom: 8 }}>Coordinator — supervised groups</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {coordinatorProfile.supervisedGroups.map(g => (
                        <span key={g.id} className="role-badge">{g.code} — {g.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="button" onClick={closeEditModal} className="py-2 px-3 rounded-md">Cancel</button>
                  <button type="submit" className="primary-btn">Save changes</button>
                </div>
              </form>
            </div>
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