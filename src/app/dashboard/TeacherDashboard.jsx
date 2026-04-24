import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BookOpen, FileText, MessageCircle, AlertCircle } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  listCourses,
  listCourseAnnouncements,
  listCourseAttachments,
  listCourseChats
} from "../../services/course.service";
import DashboardSectionHeader from "./components/DashboardSectionHeader";
import { formatDateTime, getPriorityRank, getBadgeTone } from "./utils/dashboard.helpers";

export default function TeacherDashboard() {
  const { user, token, selectedRole } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [courseBundles, setCourseBundles] = useState({});
  const [courseQuery, setCourseQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const teacherUserId = user?.id || selectedRole.userId || null;

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

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
            const [announcementsPayload, attachmentsPayload, chatsPayload] = await Promise.all([
              listCourseAnnouncements(selectedRole, course.id),
              listCourseAttachments(selectedRole, course.id),
              listCourseChats(selectedRole, course.id)
            ]);

            return [
              course.id,
              {
                announcements: announcementsPayload.items || [],
                attachments: attachmentsPayload.items || [],
                chats: chatsPayload.items || []
              }
            ];
          })
        );

        if (!active) return;
        setCourseBundles(Object.fromEntries(bundles));
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Could not load your courses.");
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
        const bundle = courseBundles[course.id] || { announcements: [], attachments: [], chats: [] };
        const announcements = bundle.announcements || [];
        const attachments = bundle.attachments || [];
        const chats = bundle.chats || [];
        const lastUpdate = announcements[0]?.createdAt || course.updatedAt || course.createdAt || null;
        const openQuestionCount = chats.filter((chat) => chat.lastMessage && chat.lastMessage.senderUserId !== teacherUserId).length;

        return {
          ...course,
          announcements,
          attachments,
          chats,
          lastUpdate,
          openQuestionCount
        };
      })
      .sort((left, right) => {
        const rightTime = new Date(right.lastUpdate || 0).getTime();
        const leftTime = new Date(left.lastUpdate || 0).getTime();
        if (rightTime !== leftTime) return rightTime - leftTime;
        return String(left.title || "").localeCompare(String(right.title || ""));
      });
  }, [courses, courseBundles, teacherUserId]);

  const filteredCourses = useMemo(() => {
    const query = courseQuery.trim().toLowerCase();
    if (!query) return withCourseData;

    return withCourseData.filter((course) => {
      const haystack = `${course.title || ""} ${course.code || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [courseQuery, withCourseData]);

  const allAnnouncements = useMemo(() => {
    return withCourseData
      .flatMap((course) =>
        (course.announcements || []).map((announcement) => ({
          ...announcement,
          courseId: course.id,
          courseTitle: course.title
        }))
      )
      .sort((left, right) => {
        const priorityDiff = getPriorityRank(left.priority) - getPriorityRank(right.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
      });
  }, [withCourseData]);

  const recentBroadcasts = allAnnouncements.slice(0, 4);
  const urgentAnnouncements = allAnnouncements
    .filter((announcement) => String(announcement.priority || "").toUpperCase() === "URGENT")
    .slice(0, 3);

  const stats = useMemo(() => {
    const openQuestions = withCourseData.reduce((sum, course) => sum + course.openQuestionCount, 0);
    return [
      { label: "Announcements Sent", value: allAnnouncements.length, hint: "Across your assigned courses" },
      { label: "Open Questions", value: openQuestions, hint: "Chats waiting on you" },
      { label: "Courses Managed", value: withCourseData.length, hint: "Current load" }
    ];
  }, [allAnnouncements.length, withCourseData]);

  const broadcastSignals = useMemo(() => {
    const items = [];

    const staleCourse = withCourseData.find((course) => {
      if (!course.lastUpdate) return true;
      const ageDays = (Date.now() - new Date(course.lastUpdate).getTime()) / (1000 * 60 * 60 * 24);
      return ageDays > 7;
    });

    if (staleCourse) {
      items.push({
        icon: Bell,
        title: "Course needs update",
        text: `${staleCourse.title} has no recent announcement.`
      });
    }

    const noMaterialCourse = withCourseData.find((course) => course.attachments.length === 0);
    if (noMaterialCourse) {
      items.push({
        icon: FileText,
        title: "Missing shared material",
        text: `${noMaterialCourse.title} has no attached resources yet.`
      });
    }

    if (urgentAnnouncements[0]) {
      items.push({
        icon: AlertCircle,
        title: "Urgent course note",
        text: `${urgentAnnouncements[0].courseTitle}: ${urgentAnnouncements[0].title}`
      });
    }

    return items.slice(0, 3);
  }, [urgentAnnouncements, withCourseData]);

  const quickActions = [
    { label: "Post Announcement", icon: Bell, to: "/courses" },
    { label: "Message Class Rep", icon: MessageCircle, to: "/chat" },
    { label: "Manage Materials", icon: BookOpen, to: "/courses" }
  ];

  return (
    <div className="page-shell dashboard-work">
      <header className="hero dashboard-work-hero teacher-tone">
        <div>
          <p className="tag">UniLink</p>
          <h1>Teacher Dashboard</h1>
          <p className="subtitle">Broadcast from one place, monitor engagement, and react to real course signals.</p>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="dashboard-work-metrics" aria-label="Teacher metrics">
        {stats.map((stat) => (
          <article className="dashboard-metric" key={stat.label}>
            <p>{stat.label}</p>
            <h3>{isLoading ? "..." : stat.value}</h3>
            <small>{stat.hint}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-work-section">
        <DashboardSectionHeader title="Recent Broadcasts" kicker="Announcement Stream" meta={`${recentBroadcasts.length} latest`} />

        <div className="dashboard-list">
          {recentBroadcasts.length ? (
            recentBroadcasts.map((announcement) => (
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
                <button type="button" className="dashboard-inline-action" onClick={() => navigate(`/courses/${announcement.courseId}`)}>
                  Open course
                </button>
              </article>
            ))
          ) : (
            <p className="subtitle">No announcements yet for your courses.</p>
          )}
        </div>
      </section>

      <div className="dashboard-work-grid">
        <section className="card dashboard-card-tight">
          <DashboardSectionHeader title="Broadcast Hub" kicker="What Needs Attention" meta={`${broadcastSignals.length} items`} />
          <div className="dashboard-mini-list">
            {broadcastSignals.length ? (
              broadcastSignals.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={`${item.title}-${item.text}`} className="dashboard-mini-item">
                    <Icon size={14} />
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.text}</p>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="subtitle">Everything looks stable right now.</p>
            )}
          </div>
        </section>

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
      </div>

      <section className="dashboard-work-section">
        <DashboardSectionHeader title="Courses Managed" kicker="Teaching Portfolio" meta={`${filteredCourses.length} visible`} />

        <input
          className="course-search"
          type="text"
          value={courseQuery}
          placeholder="Search by course title or code"
          onChange={(event) => setCourseQuery(event.target.value)}
        />

        <div className="dashboard-course-grid">
          {filteredCourses.map((course) => (
            <article key={course.id} className="dashboard-course-card">
              <div className="dashboard-course-header" style={{ background: course.color || "#0f172a" }} />
              <div className="dashboard-course-body">
                <p className="dashboard-course-code">{course.code}</p>
                <h4>{course.title}</h4>
                <p>{course.teacher?.name || "Teacher"}</p>
                <small>
                  Announcements: {course.announcements.length} . Materials: {course.attachments.length} . Open questions: {course.openQuestionCount}
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
    </div>
  );
}
