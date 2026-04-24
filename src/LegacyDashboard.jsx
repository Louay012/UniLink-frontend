import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bell, BookOpen, FileText, MessageCircle, AlertCircle } from "lucide-react";

import { useAuth } from "./context/AuthContext";
import {
  listCourses,
  listCourseAnnouncements,
  listCourseAttachments
} from "./services/course.service";
import DashboardSectionHeader from "./app/dashboard/components/DashboardSectionHeader";
import { formatDateTime, getPriorityRank, getBadgeTone } from "./app/dashboard/utils/dashboard.helpers";

function getStorageKey(role) {
  return `unilink-dashboard-read-announcements-${String(role || "STUDENT").toUpperCase()}`;
}

export default function LegacyDashboard() {
  const { selectedRole, token } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [courseBundles, setCourseBundles] = useState({});
  const [courseQuery, setCourseQuery] = useState("");
  const [readIds, setReadIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    const raw = localStorage.getItem(getStorageKey(selectedRole.value));
    if (!raw) {
      setReadIds(new Set());
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setReadIds(new Set(Array.isArray(parsed) ? parsed : []));
    } catch {
      setReadIds(new Set());
    }
  }, [selectedRole.value]);

  useEffect(() => {
    localStorage.setItem(getStorageKey(selectedRole.value), JSON.stringify([...readIds]));
  }, [readIds, selectedRole.value]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const payload = await listCourses(selectedRole);
        const courseItems = payload.items || [];
        if (!active) return;

        setCourses(courseItems);

        const bundles = await Promise.all(
          courseItems.map(async (course) => {
            const [announcementsPayload, attachmentsPayload] = await Promise.all([
              listCourseAnnouncements(selectedRole, course.id),
              listCourseAttachments(selectedRole, course.id)
            ]);

            return [
              course.id,
              {
                announcements: announcementsPayload.items || [],
                attachments: attachmentsPayload.items || []
              }
            ];
          })
        );

        if (!active) return;
        setCourseBundles(Object.fromEntries(bundles));
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Could not load dashboard data.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [selectedRole]);

  const withCourseData = useMemo(() => {
    return courses
      .map((course) => {
        const bundle = courseBundles[course.id] || { announcements: [], attachments: [] };
        const announcements = bundle.announcements || [];
        const attachments = bundle.attachments || [];
        const lastUpdate = announcements[0]?.createdAt || course.updatedAt || course.createdAt || null;
        const unreadCount = announcements.filter((announcement) => !readIds.has(announcement.id)).length;

        return {
          ...course,
          announcements,
          attachments,
          lastUpdate,
          unreadCount
        };
      })
      .sort((left, right) => {
        const rightTime = new Date(right.lastUpdate || 0).getTime();
        const leftTime = new Date(left.lastUpdate || 0).getTime();
        if (rightTime !== leftTime) return rightTime - leftTime;
        return String(left.title || "").localeCompare(String(right.title || ""));
      });
  }, [courses, courseBundles, readIds]);

  const allAnnouncements = useMemo(() => {
    return withCourseData
      .flatMap((course) =>
        (course.announcements || []).map((announcement) => ({
          ...announcement,
          courseId: course.id,
          courseTitle: course.title,
          attachments: (course.attachments || []).filter(
            (attachment) => String(attachment.announcementId) === String(announcement.id)
          )
        }))
      )
      .sort((left, right) => {
        const priorityDiff = getPriorityRank(left.priority) - getPriorityRank(right.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
      });
  }, [withCourseData]);

  const unreadAnnouncements = useMemo(
    () => allAnnouncements.filter((announcement) => !readIds.has(announcement.id)),
    [allAnnouncements, readIds]
  );

  const featuredAnnouncements = unreadAnnouncements.slice(0, 4);

  const recentAttachments = useMemo(() => {
    return withCourseData
      .flatMap((course) =>
        (course.attachments || []).map((attachment) => ({
          ...attachment,
          courseTitle: course.title
        }))
      )
      .sort((left, right) => new Date(right.uploadedAt || right.createdAt || 0) - new Date(left.uploadedAt || left.createdAt || 0))
      .slice(0, 3);
  }, [withCourseData]);

  const filteredCourses = useMemo(() => {
    const query = courseQuery.trim().toLowerCase();
    if (!query) return withCourseData;

    return withCourseData.filter((course) => {
      const haystack = `${course.title || ""} ${course.code || ""} ${course.teacher?.name || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [courseQuery, withCourseData]);

  const stats = useMemo(() => {
    const materialsCount = withCourseData.reduce((sum, course) => sum + course.attachments.length, 0);
    return [
      { label: "Unread", value: unreadAnnouncements.length, hint: "Announcements to check" },
      { label: "Courses", value: withCourseData.length, hint: "Registered this semester" },
      { label: "Materials", value: materialsCount, hint: "Resources available" }
    ];
  }, [unreadAnnouncements.length, withCourseData]);

  const quickActions = [
    { label: "Message Coordinator", icon: MessageCircle, to: "/chat" },
    { label: "Report Issue / Feedback", icon: AlertCircle, to: "/feedback" },
    { label: "Open Courses", icon: BookOpen, to: "/courses" }
  ];

  const courseHealthCards = useMemo(() => {
    return withCourseData.slice(0, 3).map((course) => ({
      id: course.id,
      title: course.title,
      teacherName: course.teacher?.name || "Teacher",
      lastUpdate: course.lastUpdate,
      materialsCount: course.attachments.length,
      unreadCount: course.unreadCount
    }));
  }, [withCourseData]);

  const generalNotice = allAnnouncements[0] || null;

  function markAsRead(announcementId) {
    setReadIds((previous) => {
      const next = new Set(previous);
      next.add(announcementId);
      return next;
    });
  }

  function openAnnouncement(announcement) {
    markAsRead(announcement.id);
    navigate(`/courses/${announcement.courseId}`);
  }

  return (
    <div className="page-shell dashboard-work">
      <header className="hero dashboard-work-hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Student Dashboard</h1>
          <p className="subtitle">A clear stream of announcements, resources, and actions from your actual course data.</p>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="dashboard-work-metrics" aria-label="Student metrics">
        {stats.map((stat) => (
          <article className="dashboard-metric" key={stat.label}>
            <p>{stat.label}</p>
            <h3>{isLoading ? "..." : stat.value}</h3>
            <small>{stat.hint}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-work-section">
        <DashboardSectionHeader
          title="Latest Announcements"
          kicker="Announcement Stream"
          meta={`${featuredAnnouncements.length} unread shown`}
          action={
            <button type="button" className="dashboard-ghost-btn" onClick={() => navigate("/courses")}>
              View courses <ArrowRight size={14} />
            </button>
          }
        />

        <div className="dashboard-list">
          {featuredAnnouncements.length ? (
            featuredAnnouncements.map((announcement) => (
              <article key={announcement.id} className="dashboard-list-item">
                <div className="dashboard-list-main">
                  <div className="dashboard-list-title-row">
                    <h4>{announcement.title}</h4>
                    <span className={`priority-chip ${getBadgeTone(announcement.priority)}`}>
                      {String(announcement.priority || "NORMAL").toUpperCase()}
                    </span>
                  </div>
                  <p>{announcement.body}</p>
                  <small>
                    {announcement.courseTitle} . {formatDateTime(announcement.createdAt)}
                  </small>
                </div>
                <button type="button" className="dashboard-inline-action" onClick={() => openAnnouncement(announcement)}>
                  View in course
                </button>
              </article>
            ))
          ) : (
            <p className="subtitle">You are fully up to date.</p>
          )}
        </div>
      </section>

      <div className="dashboard-work-grid">
        <section className="card dashboard-card-tight">
          <DashboardSectionHeader title="Quick Actions" kicker="Actions" meta="Real navigation" />
          <div className="dashboard-action-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.label} type="button" className="dashboard-action-btn" onClick={() => navigate(action.to)}>
                  <Icon size={16} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card dashboard-card-tight">
          <DashboardSectionHeader title="Focus Today" kicker="Resource Activity" meta={`${recentAttachments.length} latest files`} />
          <div className="dashboard-mini-list">
            {recentAttachments.length ? (
              recentAttachments.map((attachment) => (
                <article key={attachment.id} className="dashboard-mini-item">
                  <FileText size={14} />
                  <div>
                    <h4>{attachment.title || attachment.fileName || "Attachment"}</h4>
                    <p>{attachment.courseTitle}</p>
                  </div>
                </article>
              ))
            ) : (
              <p className="subtitle">No recent files to show.</p>
            )}
          </div>
        </section>
      </div>

      <section className="dashboard-work-section">
        <DashboardSectionHeader title="Courses" kicker="My Courses" meta={`${filteredCourses.length} visible`} />

        <input
          className="course-search"
          type="text"
          value={courseQuery}
          placeholder="Search by course title, code, or teacher"
          onChange={(event) => setCourseQuery(event.target.value)}
        />

        <div className="dashboard-course-grid">
          {filteredCourses.map((course) => (
            <article key={course.id} className="dashboard-course-card">
              <div className="dashboard-course-header" style={{ background: course.color || "#0f172a" }} />
              <div className="dashboard-course-body">
                <p className="dashboard-course-code">{course.code}</p>
                <h4>{course.title}</h4>
                <p>{course.teacher?.name || "Unknown Teacher"}</p>
                <small>
                  {course.announcements.length} announcements . {course.attachments.length} attachments . {course.unreadCount} unread
                </small>
                <button type="button" className="dashboard-inline-action" onClick={() => navigate(`/courses/${course.id}`)}>
                  Open course
                </button>
              </div>
            </article>
          ))}
          {!filteredCourses.length ? <p className="subtitle">No course matches your search.</p> : null}
        </div>
      </section>

      <section className="dashboard-work-section">
        <DashboardSectionHeader title="Course Health" kicker="Overview" meta="Current semester snapshot" />
        <div className="dashboard-health-grid">
          <article className="dashboard-health-notice">
            <p>General notice</p>
            <h4>{generalNotice ? generalNotice.title : "No general notice right now"}</h4>
            <small>{generalNotice ? generalNotice.body : "New platform-wide updates will appear here."}</small>
          </article>

          {courseHealthCards.map((course) => (
            <article key={course.id} className="dashboard-health-card">
              <h4>{course.title}</h4>
              <p>Teacher: {course.teacherName}</p>
              <small>
                Last update: {course.lastUpdate ? formatDateTime(course.lastUpdate) : "No update yet"}
              </small>
              <small>Materials: {course.materialsCount} . Unread: {course.unreadCount}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
