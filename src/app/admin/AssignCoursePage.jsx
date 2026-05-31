import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

export default function AssignCoursePage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    courseId: '',
    classGroupId: ''
  });

  useEffect(() => {
    if (!isAdmin) navigate('/login');
  }, [isAdmin, navigate]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [courses, groups] = await Promise.all([
          apiRequest('/admin/courses'),
          apiRequest('/admin/class-groups')
        ]);
        setCourses(courses || []);
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
      await apiRequest(`/admin/courses/${form.courseId}/class-group`, {
        method: 'PATCH',
        body: JSON.stringify({ classGroupId: form.classGroupId })
      });
      setSuccess('Course assigned to class group successfully.');
      setForm({ courseId: '', classGroupId: '' });
    } catch (err) {
      setError(err.message || 'Failed to assign course to class group');
    }
  }

  return (
    <div className="page-shell admin-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Assign Course to Class Group</h1>
          <p className="subtitle">Reassign an existing course to a different class group.</p>
          <small className="subtitle">Logged in as {user?.email}</small>
        </div>
      </header>

      {error && <p className="error-banner">{error}</p>}
      {success && <p className="success-banner">{success}</p>}
      {loading && <p className="subtitle">Loading...</p>}

      <section className="card">
        <div className="card-header">
          <h3>Assign Course</h3>
          <span>Update existing course</span>
        </div>
        <form onSubmit={handleSubmit} className="admin-form-grid">
          <label>
            Course
            <select
              value={form.courseId}
              onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
              required
            >
              <option value="">Select...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
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
          <button className="primary-btn" type="submit">Assign Course</button>
        </form>
      </section>
    </div>
  );
}
