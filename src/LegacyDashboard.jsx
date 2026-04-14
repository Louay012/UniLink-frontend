import React from "react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "./context/AuthContext";
import { apiRequest } from "./services/api";
import { useNavigate } from "react-router-dom";

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function LegacyDashboard() {
  const { selectedRole, setSelectedRole, roleOptions, user, logout, isAdmin, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);
  
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [courseQuery, setCourseQuery] = useState("");

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const filteredCourses = useMemo(() => {
    const query = courseQuery.trim().toLowerCase();
    if (!query) {
      return courses;
    }

    return courses.filter((course) => {
      const haystack = `${course.title} ${course.code} ${course.teacher?.name || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [courses, courseQuery]);

  const dashboardStats = useMemo(() => {
    const totalAnnouncements = courses.reduce(
      (acc, course) => acc + Number(course.announcementCount || 0),
      0
    );
    const totalAttachments = courses.reduce(
      (acc, course) => acc + Number(course.attachmentCount || 0),
      0
    );

    return [
      { label: "Courses", value: courses.length },
      { label: "Announcements", value: totalAnnouncements },
      { label: "Attachments", value: totalAttachments },
      { label: "Active Role", value: selectedRole.label }
    ];
  }, [courses, selectedRole.label]);

  const recentActivity = useMemo(() => {
    return announcements
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
  }, [announcements]);

  async function fetchCourses() {
    setIsLoading(true);
    setError("");

    try {
      const payload = await apiRequest("/courses", selectedRole);
      setCourses(payload.items || []);
      setSelectedCourseId((prev) => prev || payload.items?.[0]?.id || null);
    } catch {
      setError("Could not load courses. Please make sure backend is running.");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCourseDetails(courseId) {
    if (!courseId) {
      setAnnouncements([]);
      setAttachments([]);
      return;
    }

    try {
      const [announcementsPayload, attachmentsPayload] = await Promise.all([
        apiRequest(`/courses/${courseId}/announcements`, selectedRole),
        apiRequest(`/courses/${courseId}/attachments`, selectedRole)
      ]);

      setAnnouncements(announcementsPayload.items || []);
      setAttachments(attachmentsPayload.items || []);
    } catch {
      setError("Could not load course details.");
    }
  }

  async function handlePublish(event) {
    event.preventDefault();
    if (!selectedCourse || !title.trim() || !body.trim()) {
      return;
    }

    try {
      await apiRequest(`/courses/${selectedCourse.id}/announcements`, selectedRole, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: title.trim(), body: body.trim() })
      });

      setTitle("");
      setBody("");
      await fetchCourseDetails(selectedCourse.id);
    } catch (e) {
      setError(e.message || "Failed to publish announcement.");
    }
  }

  useEffect(() => {
    fetchCourses();
  }, [selectedRole.value]);

  useEffect(() => {
    fetchCourseDetails(selectedCourseId);
  }, [selectedCourseId, selectedRole.value]);

  return (
    <div className="page-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Courses Hub</h1>
          <p className="subtitle">
            Course workspace with announcements and attachments. Messaging now lives in the dedicated Chat page.
          </p>
        </div>
        <div className="role-switch">
          {roleOptions.map((role) => (
            <button
              key={role.value}
              className={selectedRole.value === role.value ? "active" : ""}
              onClick={() => setSelectedRole(role)}
            >
              {role.label}
            </button>
          ))}
          <button className="danger-btn" onClick={() => { logout(); navigate("/login"); }}>
            Logout
          </button>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="stats-grid">
        {dashboardStats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <p>{stat.label}</p>
            <h3>{stat.value}</h3>
          </article>
        ))}
      </section>

      <main className="layout">
        <aside className="courses-panel">
          <div className="panel-header">
            <h2>My Courses</h2>
            {isLoading ? <span>Loading...</span> : <span>{courses.length} courses</span>}
          </div>

          <input
            className="course-search"
            type="text"
            placeholder="Search by title, code, or teacher"
            value={courseQuery}
            onChange={(event) => setCourseQuery(event.target.value)}
          />

          <div className="course-list">
            {filteredCourses.map((course) => (
              <button
                key={course.id}
                className={`course-item ${selectedCourseId === course.id ? "selected" : ""}`}
                onClick={() => setSelectedCourseId(course.id)}
              >
                <span className="dot" style={{ background: course.color || "#22c55e" }} />
                <div>
                  <h3>{course.title}</h3>
                  <p>{course.code}</p>
                  <small>
                    {course.announcementCount} announcements . {course.attachmentCount} attachments
                  </small>
                </div>
              </button>
            ))}
            {!filteredCourses.length ? <p className="subtitle">No course matches this search.</p> : null}
          </div>
        </aside>

        <section className="details-panel">
          {!selectedCourse ? (
            <div className="empty-state">Select a course to view details.</div>
          ) : (
            <>
              <div className="course-banner">
                <div>
                  <h2>{selectedCourse.title}</h2>
                  <p>{selectedCourse.description}</p>
                  <small>
                    Class: {selectedCourse.classGroupCode} . Semester: {selectedCourse.semester} . Teacher: {selectedCourse.teacher?.name}
                  </small>
                </div>
              </div>

              <div className="grid">
                <article className="card">
                  <div className="card-header">
                    <h3>Announcements</h3>
                    <span>{announcements.length}</span>
                  </div>

                  {selectedRole.value === "TEACHER" ? (
                    <form className="announce-form" onSubmit={handlePublish}>
                      <input
                        type="text"
                        value={title}
                        placeholder="Announcement title"
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      <textarea
                        rows={3}
                        value={body}
                        placeholder="Write a clear course update..."
                        onChange={(e) => setBody(e.target.value)}
                      />
                      <button type="submit">Publish</button>
                    </form>
                  ) : null}

                  <div className="feed">
                    {announcements.map((item) => (
                      <div key={item.id} className="feed-item">
                        <h4>{item.title}</h4>
                        <p>{item.body}</p>
                        <small>{formatDate(item.createdAt)}</small>
                      </div>
                    ))}
                    {!announcements.length ? <p>No announcements yet.</p> : null}
                  </div>
                </article>

                <article className="card">
                  <div className="card-header">
                    <h3>Attachments</h3>
                    <span>{attachments.length}</span>
                  </div>
                  <div className="attachment-list">
                    {attachments.map((file) => (
                      <a href={file.url} className="attachment" key={file.id}>
                        <div>
                          <h4>{file.title}</h4>
                          <p>{file.type.toUpperCase()} . {file.size}</p>
                        </div>
                        <small>{formatDate(file.uploadedAt)}</small>
                      </a>
                    ))}
                    {!attachments.length ? <p>No attachments available.</p> : null}
                  </div>
                </article>

                <article className="card wide-card">
                  <div className="card-header">
                    <h3>Recent Activity</h3>
                    <span>{recentActivity.length} latest</span>
                  </div>
                  <div className="activity-list">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="activity-item">
                        <div>
                          <h4>{item.title}</h4>
                          <p>{item.body}</p>
                        </div>
                        <small>{formatDate(item.createdAt)}</small>
                      </div>
                    ))}
                    {!recentActivity.length ? <p>No recent activity for this course.</p> : null}
                  </div>
                </article>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
