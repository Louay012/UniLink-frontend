import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

export default function AcademicSetupPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [classForm, setClassForm] = useState({
    code: '',
    name: '',
    departmentId: '',
    levelId: '',
    coordinatorUserId: ''
  });

  const [courseForm, setCourseForm] = useState({
    code: '',
    title: '',
    description: '',
    classGroupId: '',
    isCourseChatEnabled: true,
    teacherUserId: ''
  });

  const [assignUserForm, setAssignUserForm] = useState({
    userId: '',
    classGroupId: ''
  });

  const [assignCourseForm, setAssignCourseForm] = useState({
    courseId: '',
    classGroupId: ''
  });

  useEffect(() => {
    if (!isAdmin) navigate('/login');
  }, [isAdmin, navigate]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError('');
      const [u, c, d, l, g] = await Promise.all([
        apiRequest('/admin/users'),
        apiRequest('/admin/courses'),
        apiRequest('/admin/departments'),
        apiRequest('/admin/levels'),
        apiRequest('/admin/class-groups')
      ]);
      setUsers(u || []);
      setCourses(c || []);
      setDepartments(d || []);
      setLevels(l || []);
      setClassGroups(g || []);
    } catch (err) {
      setError(err.message || 'Failed to load academic setup data');
    } finally {
      setLoading(false);
    }
  }

  const coordinators = useMemo(() => users.filter((u) => u.role === 'COORDINATOR'), [users]);
  const teachers = useMemo(() => users.filter((u) => u.role === 'TEACHER'), [users]);
  const students = useMemo(() => users.filter((u) => u.role === 'STUDENT'), [users]);

  async function handleCreateClassGroup(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiRequest('/admin/class-groups', {
        method: 'POST',
        body: JSON.stringify({
          code: classForm.code,
          name: classForm.name,
          departmentId: classForm.departmentId,
          levelId: classForm.levelId,
          coordinatorUserId: classForm.coordinatorUserId || null
        })
      });
      setSuccess('Class group created successfully.');
      setClassForm({ code: '', name: '', departmentId: '', levelId: '', coordinatorUserId: '' });
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to create class group');
    }
  }

  async function handleCreateCourse(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiRequest('/admin/courses', {
        method: 'POST',
        body: JSON.stringify({
          code: courseForm.code,
          title: courseForm.title,
          description: courseForm.description,
          classGroupId: courseForm.classGroupId,
          isCourseChatEnabled: courseForm.isCourseChatEnabled,
          teacherUserId: courseForm.teacherUserId || null
        })
      });
      setSuccess('Course created successfully.');
      setCourseForm({ code: '', title: '', description: '', classGroupId: '', isCourseChatEnabled: true, teacherUserId: '' });
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to create course');
    }
  }

  async function handleAssignUserToClassGroup(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/admin/users/${assignUserForm.userId}/class-group`, {
        method: 'PATCH',
        body: JSON.stringify({ classGroupId: assignUserForm.classGroupId })
      });
      setSuccess('User assigned to class group successfully.');
      setAssignUserForm({ userId: '', classGroupId: '' });
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to assign user to class group');
    }
  }

  async function handleAssignCourseToClassGroup(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/admin/courses/${assignCourseForm.courseId}/class-group`, {
        method: 'PATCH',
        body: JSON.stringify({ classGroupId: assignCourseForm.classGroupId })
      });
      setSuccess('Course assigned to class group successfully.');
      setAssignCourseForm({ courseId: '', classGroupId: '' });
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to assign course to class group');
    }
  }

  return (
    <div className="page-shell admin-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Academic Setup Lab</h1>
          <p className="subtitle">Test class groups, course creation, and assignment flows from one place.</p>
          <small className="subtitle">Logged in as {user?.email}</small>
        </div>
      </header>

      {error ? <p className="error-banner">{error}</p> : null}
      {success ? <p className="success-banner">{success}</p> : null}
      {loading ? <p className="subtitle">Loading academic data...</p> : null}

      <section className="card">
        <div className="card-header">
          <h3>1) Create Class Group</h3>
          <span>{classGroups.length} groups</span>
        </div>
        <form onSubmit={handleCreateClassGroup} className="admin-form-grid">
          <label>Code<input type="text" value={classForm.code} onChange={(e) => setClassForm((prev) => ({ ...prev, code: e.target.value }))} required /></label>
          <label>Name<input type="text" value={classForm.name} onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))} required /></label>
          <label>Department<select value={classForm.departmentId} onChange={(e) => setClassForm((prev) => ({ ...prev, departmentId: e.target.value }))} required><option value="">Select...</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.code} - {d.name}</option>)}</select></label>
          <label>Level<select value={classForm.levelId} onChange={(e) => setClassForm((prev) => ({ ...prev, levelId: e.target.value }))} required><option value="">Select...</option>{levels.map((l) => <option key={l.id} value={l.id}>{l.code} - {l.name}</option>)}</select></label>
          <label>Coordinator (optional)<select value={classForm.coordinatorUserId} onChange={(e) => setClassForm((prev) => ({ ...prev, coordinatorUserId: e.target.value }))}><option value="">None</option>{coordinators.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}</select></label>
          <button className="primary-btn" type="submit">Create Class Group</button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>2) Create Course</h3>
          <span>{courses.length} courses</span>
        </div>
        <form onSubmit={handleCreateCourse} className="admin-form-grid">
          <label>Code<input type="text" value={courseForm.code} onChange={(e) => setCourseForm((prev) => ({ ...prev, code: e.target.value }))} required /></label>
          <label>Title<input type="text" value={courseForm.title} onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))} required /></label>
          <label>Description<input type="text" value={courseForm.description} onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))} /></label>
          <label>Class Group<select value={courseForm.classGroupId} onChange={(e) => setCourseForm((prev) => ({ ...prev, classGroupId: e.target.value }))} required><option value="">Select...</option>{classGroups.map((g) => <option key={g.id} value={g.id}>{g.code} - {g.name}</option>)}</select></label>
          <label>Teacher (optional)<select value={courseForm.teacherUserId} onChange={(e) => setCourseForm((prev) => ({ ...prev, teacherUserId: e.target.value }))}><option value="">None</option>{teachers.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}</select></label>
          <label><span>Course Chat Enabled</span><input type="checkbox" checked={courseForm.isCourseChatEnabled} onChange={(e) => setCourseForm((prev) => ({ ...prev, isCourseChatEnabled: e.target.checked }))} /></label>
          <button className="primary-btn" type="submit">Create Course</button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>3) Assign User to Class Group</h3>
          <span>Students only</span>
        </div>
        <form onSubmit={handleAssignUserToClassGroup} className="admin-form-grid">
          <label>Student<select value={assignUserForm.userId} onChange={(e) => setAssignUserForm((prev) => ({ ...prev, userId: e.target.value }))} required><option value="">Select...</option>{students.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>)}</select></label>
          <label>Class Group<select value={assignUserForm.classGroupId} onChange={(e) => setAssignUserForm((prev) => ({ ...prev, classGroupId: e.target.value }))} required><option value="">Select...</option>{classGroups.map((g) => <option key={g.id} value={g.id}>{g.code} - {g.name}</option>)}</select></label>
          <button className="primary-btn" type="submit">Assign User</button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>4) Assign Course to Class Group</h3>
          <span>Update existing course</span>
        </div>
        <form onSubmit={handleAssignCourseToClassGroup} className="admin-form-grid">
          <label>Course<select value={assignCourseForm.courseId} onChange={(e) => setAssignCourseForm((prev) => ({ ...prev, courseId: e.target.value }))} required><option value="">Select...</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}</select></label>
          <label>Class Group<select value={assignCourseForm.classGroupId} onChange={(e) => setAssignCourseForm((prev) => ({ ...prev, classGroupId: e.target.value }))} required><option value="">Select...</option>{classGroups.map((g) => <option key={g.id} value={g.id}>{g.code} - {g.name}</option>)}</select></label>
          <button className="primary-btn" type="submit">Assign Course</button>
        </form>
      </section>
    </div>
  );
}
