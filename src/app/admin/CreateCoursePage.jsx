import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

export default function CreateCoursePage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [classGroups, setClassGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    classGroupId: '',
    isCourseChatEnabled: true,
    teacherUserId: ''
  });

  useEffect(() => {
    if (!isAdmin) navigate('/login');
  }, [isAdmin, navigate]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [users, groups, courses] = await Promise.all([
          apiRequest('/admin/users'),
          apiRequest('/admin/class-groups'),
          apiRequest('/admin/courses')
        ]);
        setTeachers((users || []).filter((u) => u.role === 'TEACHER'));
        setClassGroups(groups || []);
        setCourses(courses || []);
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
      await apiRequest('/admin/courses', {
        method: 'POST',
        body: JSON.stringify({
          code: form.code,
          title: form.title,
          description: form.description,
          classGroupId: form.classGroupId,
          isCourseChatEnabled: form.isCourseChatEnabled,
          teacherUserId: form.teacherUserId || null
        })
      });
      setSuccess('Course created successfully.');
      setForm({ code: '', title: '', description: '', classGroupId: '', isCourseChatEnabled: true, teacherUserId: '' });
      const updated = await apiRequest('/admin/courses');
      setCourses(updated || []);
    } catch (err) {
      setError(err.message || 'Failed to create course');
    }
  }

  return (
    <div className="page-shell admin-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Create Course</h1>
          <p className="subtitle">Add a new course, link it to a class group, and assign a teacher.</p>
          <small className="subtitle">Logged in as {user?.email}</small>
        </div>
      </header>

      {error && <p className="error-banner">{error}</p>}
      {success && <p className="success-banner">{success}</p>}
      {loading && <p className="subtitle">Loading...</p>}

      <section className="card">
        <div className="card-header">
          <h3>New Course</h3>
          <span>{courses.length} existing courses</span>
        </div>
        <form onSubmit={handleSubmit} className="admin-form-grid">
          <label>
            Code
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="e.g. CS301"
              required
            />
          </label>
          <label>
            Title
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Algorithms & Data Structures"
              required
            />
          </label>
          <label>
            Description
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Short course description..."
            />
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
          <label>
            Teacher (optional)
            <select
              value={form.teacherUserId}
              onChange={(e) => setForm((p) => ({ ...p, teacherUserId: e.target.value }))}
            >
              <option value="">None</option>
              {teachers.map((u) => (
                <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
              ))}
            </select>
          </label>
          <label>
            Course Chat Enabled
            <input
              type="checkbox"
              checked={form.isCourseChatEnabled}
              onChange={(e) => setForm((p) => ({ ...p, isCourseChatEnabled: e.target.checked }))}
            />
          </label>
          <button className="primary-btn" type="submit">Create Course</button>
        </form>
      </section>
    </div>
  );
}
