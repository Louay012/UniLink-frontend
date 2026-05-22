import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Bell,
  FileText,
  MessageCircle,
  AlertCircle,
  User,
  ArrowRight,
  ChevronRight
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  listCourses,
  listCourseAnnouncements,
  listCourseAttachments
} from "../../services/course.service";

/* ─── helpers ──────────────────────────────────────────── */

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Deterministic color from course id / title so it is stable across renders
const COURSE_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"
];

function courseColor(id = "") {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

/* ─── sub-components ────────────────────────────────────── */

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="dash-stat-card" style={{ "--stat-color": color }}>
      <div className="dash-stat-icon">
        <Icon size={20} />
      </div>
      <div className="dash-stat-body">
        <h3 className="dash-stat-value">{value}</h3>
        <p className="dash-stat-label">{label}</p>
      </div>
    </div>
  );
}

function CourseCard({ course, onClick }) {
  const color = courseColor(course.id);
  const hasUnread = course.unreadCount > 0;

  return (
    <button
      type="button"
      className="dash-course-card"
      onClick={onClick}
    >
      <div className="dash-course-banner" style={{ background: color }} />
      <div className="dash-course-content">
        <div className="dash-course-top">
          <span className="dash-course-code">{course.code}</span>
          {hasUnread && (
            <span className="dash-course-badge">{course.unreadCount}</span>
          )}
        </div>
        <h4 className="dash-course-title">{course.title}</h4>
        <p className="dash-course-teacher">
          {course.teacher?.name || "Unknown Teacher"}
        </p>
        {course.description && (
          <p className="dash-course-desc">{course.description}</p>
        )}
        <div className="dash-course-meta">
          <span>{course.attachments?.length ?? 0} files</span>
          <span>{course.announcements?.length ?? 0} announcements</span>
        </div>
        <span className="dash-course-open">
          Open <ChevronRight size={13} />
        </span>
      </div>
    </button>
  );
}

function QuickAction({ icon: Icon, label, to, navigate }) {
  return (
    <button
      type="button"
      className="dash-quick-action"
      onClick={() => navigate(to)}
    >
      <span className="dash-quick-icon">
        <Icon size={17} />
      </span>
      <span>{label}</span>
    </button>
  );
}

/* ─── main component ─────────────────────────────────────── */

export default function StudentDashboard() {
  const { user, selectedRole, token } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [courseBundles, setCourseBundles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  /* redirect if not logged in */
  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  /* load data */
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError("");

    async function load() {
      try {
        const payload = await listCourses(selectedRole);
        const courseItems = payload.items || [];
        if (!active) return;
        setCourses(courseItems);

        const bundles = await Promise.all(
          courseItems.map(async (course) => {
            const [annPayload, attPayload] = await Promise.all([
              listCourseAnnouncements(selectedRole, course.id).catch(() => ({ items: [] })),
              listCourseAttachments(selectedRole, course.id).catch(() => ({ items: [] }))
            ]);
            return [
              course.id,
              {
                announcements: annPayload.items || [],
                attachments: attPayload.items || []
              }
            ];
          })
        );

        if (!active) return;
        setCourseBundles(Object.fromEntries(bundles));
      } catch (e) {
        if (active) setError(e.message || "Could not load dashboard data.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [selectedRole]);

  /* enriched courses with bundle data */
  const enrichedCourses = useMemo(() =>
    courses.map((c) => {
      const bundle = courseBundles[c.id] || { announcements: [], attachments: [] };
      return {
        ...c,
        announcements: bundle.announcements,
        attachments: bundle.attachments,
        unreadCount: bundle.announcements.length // all count as "new" (no per-message read tracking on dashboard)
      };
    }).sort((a, b) => {
      const aT = new Date(a.announcements[0]?.createdAt || a.updatedAt || 0).getTime();
      const bT = new Date(b.announcements[0]?.createdAt || b.updatedAt || 0).getTime();
      return bT - aT;
    }),
  [courses, courseBundles]);

  const topCourses = enrichedCourses.slice(0, 4);

  const totalMaterials = useMemo(
    () => enrichedCourses.reduce((sum, c) => sum + c.attachments.length, 0),
    [enrichedCourses]
  );

  const totalUnread = useMemo(
    () => enrichedCourses.reduce((sum, c) => sum + c.announcements.length, 0),
    [enrichedCourses]
  );

  /* greeting */
  const fullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : "Student";

  const greeting = `${getGreeting()}, ${fullName}`;

  const stats = [
    { icon: BookOpen, value: isLoading ? "—" : enrichedCourses.length, label: "Enrolled Courses", color: "#6366f1" },
    { icon: Bell, value: isLoading ? "—" : totalUnread, label: "Announcements", color: "#f59e0b" },
    { icon: FileText, value: isLoading ? "—" : totalMaterials, label: "Course Materials", color: "#10b981" }
  ];

  const quickActions = [
    { icon: MessageCircle, label: "Message", to: "/chat" },
    { icon: BookOpen, label: "Courses", to: "/courses" },
    { icon: AlertCircle, label: "Feedback", to: "/feedback" },
    { icon: User, label: "Profile", to: "/profile" }
  ];

  return (
    <div className="dash-shell">

      {/* ── 1. Welcome Hero ── */}
      <section className="dash-hero">
        <div className="dash-hero-content">
          <p className="dash-hero-tag">UniLink Student Portal</p>
          <h1 className="dash-hero-title">{greeting}</h1>
          <p className="dash-hero-sub">
            {user?.classGroup
              ? `${user.classGroup} · `
              : ""}
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="dash-hero-gfx" aria-hidden="true" />
      </section>

      {error && <div className="error-banner">{error}</div>}

      {/* ── 2. Stats Row ── */}
      <section className="dash-stats" aria-label="Overview statistics">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      {/* ── 3. My Courses ── */}
      <section className="dash-section">
        <div className="dash-section-header">
          <div>
            <p className="dash-section-kicker">This Semester</p>
            <h2 className="dash-section-title">My Courses</h2>
          </div>
          {enrichedCourses.length > 4 && (
            <button
              type="button"
              className="dash-view-all"
              onClick={() => navigate("/courses")}
            >
              View all <ArrowRight size={14} />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="dash-course-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="dash-course-card dash-course-skeleton" />
            ))}
          </div>
        ) : topCourses.length ? (
          <div className="dash-course-grid">
            {topCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => navigate(`/courses/${course.id}`)}
              />
            ))}
          </div>
        ) : (
          <p className="dash-empty">No courses enrolled yet.</p>
        )}

        {!isLoading && enrichedCourses.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              type="button"
              className="dash-view-all-btn"
              onClick={() => navigate("/courses")}
            >
              View all {enrichedCourses.length} courses <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>

      {/* ── 4. Quick Actions ── */}
      <section className="dash-section">
        <div className="dash-section-header">
          <div>
            <p className="dash-section-kicker">Shortcuts</p>
            <h2 className="dash-section-title">Quick Actions</h2>
          </div>
        </div>
        <div className="dash-quick-row">
          {quickActions.map((a) => (
            <QuickAction key={a.label} {...a} navigate={navigate} />
          ))}
        </div>
      </section>

    </div>
  );
}
