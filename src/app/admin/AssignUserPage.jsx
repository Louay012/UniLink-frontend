import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

export default function AssignUserPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    userId: '',
    classGroupId: ''
  });

  useEffect(() => {
    if (!isAdmin) navigate('/login');
  }, [isAdmin, navigate]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [users, groups] = await Promise.all([
          apiRequest('/admin/users'),
          apiRequest('/admin/class-groups')
        ]);
        setStudents((users || []).filter((u) => u.role === 'STUDENT'));
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
      await apiRequest(`/admin/users/${form.userId}/class-group`, {
        method: 'PATCH',
        body: JSON.stringify({ classGroupId: form.classGroupId })
      });
      setSuccess('User assigned to class group successfully.');
      setForm({ userId: '', classGroupId: '' });
    } catch (err) {
      setError(err.message || 'Failed to assign user to class group');
    }
  }

  return (
    <div className="page-shell admin-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Assign User to Class Group</h1>
          <p className="subtitle">Move a student into a class group.</p>
          <small className="subtitle">Logged in as {user?.email}</small>
        </div>
      </header>

      {error && <p className="error-banner">{error}</p>}
      {success && <p className="success-banner">{success}</p>}
      {loading && <p className="subtitle">Loading...</p>}

      <section className="card">
        <div className="card-header">
          <h3>Assign Student</h3>
          <span>Students only</span>
        </div>
        <form onSubmit={handleSubmit} className="admin-form-grid">
          <label>
            Student
            <select
              value={form.userId}
              onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
              required
            >
              <option value="">Select...</option>
              {students.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.email})
                </option>
              ))}
            </select>
          </label>
          <label>
            Class Group
            <select
              value={form.classGroupId}
              onChange={(e) => setForm((p) => ({ ...p, classGroupId: e.target.value }))}
              required
            >
              <option value="">Select...</option>
              {classGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.code} - {g.name}</option>
              ))}
            </select>
          </label>
          <button className="primary-btn" type="submit">Assign User</button>
        </form>
      </section>
    </div>
  );
}
