import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

export default function CreateClassGroupPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    code: '',
    name: '',
    departmentId: '',
    levelId: '',
    coordinatorUserId: ''
  });

  useEffect(() => {
    if (!isAdmin) navigate('/login');
  }, [isAdmin, navigate]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [users, departments, levels, groups] = await Promise.all([
          apiRequest('/admin/users'),
          apiRequest('/admin/departments'),
          apiRequest('/admin/levels'),
          apiRequest('/admin/class-groups')
        ]);
        setCoordinators((users || []).filter((u) => u.role === 'TEACHER'));
        setDepartments(departments || []);
        setLevels(levels || []);
        setClassGroups(groups || []);
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiRequest('/admin/class-groups', {
        method: 'POST',
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          departmentId: form.departmentId,
          levelId: form.levelId,
          coordinatorUserId: form.coordinatorUserId || null
        })
      });
      setSuccess('Class group created successfully.');
      setForm({ code: '', name: '', departmentId: '', levelId: '', coordinatorUserId: '' });
      const groups = await apiRequest('/admin/class-groups');
      setClassGroups(groups || []);
    } catch (err) {
      setError(err.message || 'Failed to create class group');
    }
  }

  return (
    <div className="page-shell admin-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Create Class Group</h1>
          <p className="subtitle">Define a new class group with department, level, and optional coordinator.</p>
          <small className="subtitle">Logged in as {user?.email}</small>
        </div>
      </header>

      {error && <p className="error-banner">{error}</p>}
      {success && <p className="success-banner">{success}</p>}
      {loading && <p className="subtitle">Loading...</p>}

      <section className="card">
        <div className="card-header">
          <h3>New Class Group</h3>
          <span>{classGroups.length} existing groups</span>
        </div>
        <form onSubmit={handleSubmit} className="admin-form-grid">
          <label>
            Code
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="e.g. CS-2A"
              required
            />
          </label>
          <label>
            Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Computer Science — Year 2A"
              required
            />
          </label>
          <label>
            Department
            <select
              value={form.departmentId}
              onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}
              required
            >
              <option value="">Select...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
              ))}
            </select>
          </label>
          <label>
            Level
            <select
              value={form.levelId}
              onChange={(e) => setForm((p) => ({ ...p, levelId: e.target.value }))}
              required
            >
              <option value="">Select...</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>{l.code} - {l.name}</option>
              ))}
            </select>
          </label>
          <label>
            Coordinator (optional)
            <select
              value={form.coordinatorUserId}
              onChange={(e) => setForm((p) => ({ ...p, coordinatorUserId: e.target.value }))}
            >
              <option value="">None</option>
              {coordinators.map((u) => (
                <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
              ))}
            </select>
          </label>
          <button className="primary-btn" type="submit">Create Class Group</button>
        </form>
      </section>
    </div>
  );
}
