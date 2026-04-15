import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

const AssignCoursesPage = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigateTo = useNavigate();

  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) navigateTo("/login");
  }, [isAdmin, navigateTo]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [coursesData, usersData] = await Promise.all([
          apiRequest("/admin/courses"),
          apiRequest("/admin/users"),
        ]);
        setCourses(coursesData);
        // Filter for students and teachers only
        setUsers(usersData.filter(u => u.role === "STUDENT" || u.role === "TEACHER"));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !selectedUser) {
      setError("Please select both a course and a user.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/admin/users/${selectedUser}/courses`, {
        method: "POST",
        body: JSON.stringify({ courseId: selectedCourse }),
      });
      setSuccess("Course assigned successfully!");
      setSelectedCourse("");
      setSelectedUser("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell admin-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1 className="title">Assign Courses</h1>
          <p className="subtitle">Assign courses to students and teachers.</p>
          <small className="subtitle">Logged in as {user?.email}</small>
        </div>
        <button className="danger-btn" onClick={() => { logout(); navigateTo("/login"); }}>
          Logout
        </button>
      </header>

      <section className="card">
        <div className="card-header">
          <h3 className="title">Course Assignment</h3>
          <span className="subtitle">Management</span>
        </div>

        {error && <p className="error-banner">{error}</p>}
        {success && <p className="success-banner">{success}</p>}

        <form onSubmit={handleAssign} className="admin-form-grid">
          <label>
            Select Course
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
            >
              <option value="">Choose a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Select User (Student/Teacher)
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
            >
              <option value="">Choose a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.role})
                </option>
              ))}
            </select>
          </label>

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Assigning..." : "Assign Course"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AssignCoursesPage;
