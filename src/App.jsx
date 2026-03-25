import React from "react";
import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:4000/api";

const roles = [
  { label: "Student View", value: "STUDENT", userId: "u-student-1" },
  { label: "Teacher View", value: "TEACHER", userId: "u-teacher-1" }
];

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function App() {
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  async function fetchCourses(roleConfig) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/courses?role=${roleConfig.value}&userId=${roleConfig.userId}`
      );
      const data = await response.json();
      setCourses(data.items || []);
      setSelectedCourseId((prev) => prev || data.items?.[0]?.id || null);
    } catch (e) {
      setError("Could not load courses. Please make sure backend is running.");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCourseDetails(courseId, roleConfig) {
    if (!courseId) {
      setAnnouncements([]);
      setAttachments([]);
      return;
    }

    try {
      const [aRes, atRes] = await Promise.all([
        fetch(`${API_BASE}/courses/${courseId}/announcements?role=${roleConfig.value}&userId=${roleConfig.userId}`),
        fetch(`${API_BASE}/courses/${courseId}/attachments?role=${roleConfig.value}&userId=${roleConfig.userId}`)
      ]);

      const [aData, atData] = await Promise.all([aRes.json(), atRes.json()]);
      setAnnouncements(aData.items || []);
      setAttachments(atData.items || []);
    } catch (e) {
      setError("Could not load course details.");
    }
  }

  async function handlePublish(event) {
    event.preventDefault();
    if (!selectedCourse || !title.trim() || !body.trim()) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/courses/${selectedCourse.id}/announcements?role=${selectedRole.value}&userId=${selectedRole.userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: title.trim(), body: body.trim() })
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || "Failed to publish");
      }

      setTitle("");
      setBody("");
      await fetchCourseDetails(selectedCourse.id, selectedRole);
    } catch (e) {
      setError(e.message || "Failed to publish announcement.");
    }
  }

  useEffect(() => {
    fetchCourses(selectedRole);
  }, [selectedRole.value]);

  useEffect(() => {
    fetchCourseDetails(selectedCourseId, selectedRole);
  }, [selectedCourseId, selectedRole.value]);

  return (
    <div className="page-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Courses Hub</h1>
          <p className="subtitle">
            Responsive course workspace with announcements and attachments for students and teachers.
          </p>
        </div>
        <div className="role-switch">
          {roles.map((role) => (
            <button
              key={role.value}
              className={selectedRole.value === role.value ? "active" : ""}
              onClick={() => setSelectedRole(role)}
            >
              {role.label}
            </button>
          ))}
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <main className="layout">
        <aside className="courses-panel">
          <div className="panel-header">
            <h2>My Courses</h2>
            {isLoading ? <span>Loading...</span> : <span>{courses.length} courses</span>}
          </div>
          <div className="course-list">
            {courses.map((course) => (
              <button
                key={course.id}
                className={`course-item ${selectedCourseId === course.id ? "selected" : ""}`}
                onClick={() => setSelectedCourseId(course.id)}
              >
                <span className="dot" style={{ background: course.color || "#0e6ba8" }} />
                <div>
                  <h3>{course.title}</h3>
                  <p>{course.code}</p>
                  <small>
                    {course.announcementCount} announcements . {course.attachmentCount} attachments
                  </small>
                </div>
              </button>
            ))}
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
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
