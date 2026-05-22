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
import { useToast } from "../../context/ToastContext";

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
    <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
        style={{ background: `${color}18`, color }}
      >
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-heading text-3xl font-extrabold text-slate-900 leading-none">{value}</h3>
        <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
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
      className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden text-left cursor-pointer p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200"
      onClick={onClick}
    >
      <div className="h-12 w-full shrink-0" style={{ background: color }} />
      <div className="p-4 flex flex-col gap-0.5 flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
            {course.code}
          </span>
          {hasUnread && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[0.65rem] font-bold rounded-full animate-pulse-badge">
              {course.unreadCount}
            </span>
          )}
        </div>
        <h4 className="font-heading text-sm font-extrabold text-slate-900 leading-tight">{course.title}</h4>
        <p className="text-xs text-slate-500 mt-0.5 mb-1">
          {course.teacher?.name || "Unknown Teacher"}
        </p>
        {course.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-0.5">
            {course.description}
          </p>
        )}
        <div className="flex gap-3 text-[0.72rem] text-slate-400 font-semibold mt-1">
          <span>{course.attachments?.length ?? 0} files</span>
          <span>{course.announcements?.length ?? 0} announcements</span>
        </div>
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-indigo-500 mt-2 transition-all group-hover:gap-1.5">
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
      className="flex flex-col items-center gap-2 py-4 px-2 bg-white border border-slate-200 rounded-xl cursor-pointer text-sm font-bold text-slate-700 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:border-indigo-300 hover:text-indigo-500 group"
      onClick={() => navigate(to)}
    >
      <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500/15">
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

  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [courseBundles, setCourseBundles] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  /* redirect if not logged in */
  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  /* load data */
  useEffect(() => {
    let active = true;
    setIsLoading(true);

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
        if (active) toast.error(e.message || "Could not load dashboard data.", "Dashboard Error");

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
        unreadCount: bundle.announcements.length
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
    <div className="flex flex-col gap-5 sm:gap-7 pb-8 w-full min-w-0 max-w-[1200px] mx-auto">

      {/* ── 1. Welcome Hero ── */}
      <section className="relative rounded-xl sm:rounded-2xl p-5 sm:p-8 overflow-hidden flex items-center justify-between min-h-[110px] sm:min-h-[130px]"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)" }}
        />
        <div className="relative z-10">
          <p className="text-[0.72rem] font-bold uppercase tracking-widest text-white/50 mb-1">UniLink Student Portal</p>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-white mb-1 leading-tight">{greeting}</h1>
          <p className="text-sm text-white/50">
            {user?.classGroup ? `${user.classGroup} · ` : ""}
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }}
          aria-hidden="true"
        />
      </section>

      {/* ── 2. Stats Row ── */}
      <section
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        aria-label="Overview statistics"
      >
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      {/* ── 3. My Courses ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400 mb-0.5">This Semester</p>
            <h2 className="font-heading text-base font-extrabold text-slate-900">My Courses</h2>
          </div>
          {enrichedCourses.length > 4 && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-500 hover:opacity-75 transition-opacity"
              onClick={() => navigate("/courses")}
            >
              View all <ArrowRight size={14} />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
            ))}
          </div>
        ) : topCourses.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => navigate(`/courses/${course.id}`)}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm py-4">No courses enrolled yet.</p>
        )}

        {!isLoading && enrichedCourses.length > 0 && (
          <div className="text-center mt-4">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 border-[1.5px] border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-500/5 transition-all"
              onClick={() => navigate("/courses")}
            >
              View all {enrichedCourses.length} courses <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>

      {/* ── 4. Quick Actions ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Shortcuts</p>
            <h2 className="font-heading text-base font-extrabold text-slate-900">Quick Actions</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <QuickAction key={a.label} {...a} navigate={navigate} />
          ))}
        </div>
      </section>

    </div>
  );
}
