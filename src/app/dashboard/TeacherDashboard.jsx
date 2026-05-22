import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Bell,
  FileText,
  MessageCircle,
  AlertCircle,
  ChevronRight,
  Users,
  Search,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  listCourses,
  listCourseAnnouncements,
  listCourseAttachments,
  listCourseChats,
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
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
];

function courseColor(id = "") {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ─── sub-components ────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 leading-none mt-0.5">
          {loading ? "..." : value}
        </p>
      </div>
    </div>
  );
}

function CourseCard({ course, onClick }) {
  const color = courseColor(course.id);

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
          {course.openQuestions > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-[0.65rem] font-bold rounded-full">
              {course.openQuestions} ?
            </span>
          )}
        </div>
        <h4 className="font-heading text-sm font-extrabold text-slate-900 leading-tight">
          {course.title}
        </h4>
        {course.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-0.5">
            {course.description}
          </p>
        )}
        <div className="flex gap-3 text-[0.72rem] text-slate-400 font-semibold mt-1">
          <span>{course.announcements?.length ?? 0} posts</span>
          <span>{course.attachments?.length ?? 0} files</span>
          <span>{course.studentCount ?? "—"} students</span>
        </div>
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-indigo-500 mt-2 transition-all group-hover:gap-1.5">
          Manage <ChevronRight size={13} />
        </span>
      </div>
    </button>
  );
}

function SignalCard({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:border-slate-200">
      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="h-12 w-full bg-slate-200 animate-pulse" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-2.5 w-16 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
        <div className="h-3 w-full bg-slate-200 rounded animate-pulse mt-1" />
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────── */

export default function TeacherDashboard() {
  const { user, token, selectedRole } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [courseBundles, setCourseBundles] = useState({});
  const [loading, setLoading] = useState(true);

  const teacherUserId = user?.id || selectedRole?.userId || null;
  const teacherName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : "Teacher";

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const payload = await listCourses(selectedRole);
        const items = payload.items || [];
        if (!active) return;
        setCourses(items);

        const bundles = await Promise.all(
          items.map(async (course) => {
            const [annP, attP, chatP] = await Promise.all([
              listCourseAnnouncements(selectedRole, course.id).catch(() => ({ items: [] })),
              listCourseAttachments(selectedRole, course.id).catch(() => ({ items: [] })),
              listCourseChats(selectedRole, course.id).catch(() => ({ items: [] })),
            ]);
            return [course.id, {
              announcements: annP.items || [],
              attachments: attP.items || [],
              chats: chatP.items || [],
            }];
          })
        );

        if (!active) return;
        setCourseBundles(Object.fromEntries(bundles));
      } catch (err) {
        if (active) toast.error(err.message || "Failed to load dashboard.", "Dashboard");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => { active = false; };
  }, [selectedRole]);

  const enrichedCourses = useMemo(() => {
    return courses
      .map((c) => {
        const b = courseBundles[c.id] || { announcements: [], attachments: [], chats: [] };
        const openQuestions = (b.chats || []).filter(
          (ch) => ch.lastMessage && ch.lastMessage.senderUserId !== teacherUserId
        ).length;
        return { ...c, ...b, openQuestions, color: courseColor(c.id) };
      })
      .sort((a, b) => {
        const aTime = new Date(a.announcements[0]?.createdAt || a.updatedAt || 0).getTime();
        const bTime = new Date(b.announcements[0]?.createdAt || b.updatedAt || 0).getTime();
        return bTime - aTime;
      });
  }, [courses, courseBundles, teacherUserId]);

  const stats = useMemo(() => {
    const totalAnn = enrichedCourses.reduce((s, c) => s + (c.announcements?.length || 0), 0);
    const totalOpen = enrichedCourses.reduce((s, c) => s + c.openQuestions, 0);
    const totalFiles = enrichedCourses.reduce((s, c) => s + (c.attachments?.length || 0), 0);
    return { totalAnn, totalOpen, totalFiles };
  }, [enrichedCourses]);

  const recentAnnouncements = useMemo(() => {
    return enrichedCourses
      .flatMap((c) =>
        (c.announcements || []).map((a) => ({ ...a, courseTitle: c.title, courseId: c.id }))
      )
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [enrichedCourses]);

  const signals = useMemo(() => {
    const items = [];
    const stale = enrichedCourses.find((c) => {
      const last = c.announcements[0]?.createdAt || c.updatedAt;
      if (!last) return true;
      return (Date.now() - new Date(last).getTime()) > 7 * 24 * 60 * 60 * 1000;
    });
    if (stale) items.push({ icon: Bell, title: "Course needs update", text: `${stale.title} has no recent announcement.` });

    const noMat = enrichedCourses.find((c) => (c.attachments || []).length === 0);
    if (noMat) items.push({ icon: FileText, title: "Missing materials", text: `${noMat.title} has no attached files.` });

    const urgent = recentAnnouncements.find((a) => String(a.priority).toUpperCase() === "URGENT");
    if (urgent) items.push({ icon: AlertCircle, title: "Urgent announcement", text: `${urgent.courseTitle}: ${urgent.title}` });

    return items.slice(0, 3);
  }, [enrichedCourses, recentAnnouncements]);

  return (
    <div className="flex flex-col gap-6 pb-8 w-full min-w-0 max-w-[1200px] mx-auto">

      {/* ── Hero ── */}
      <section
        className="relative rounded-2xl p-6 sm:p-8 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)" }}
        />
        <div className="relative z-10">
          <p className="text-[0.72rem] font-bold uppercase tracking-widest text-white/50 mb-1">
            UniLink · Teacher
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-white mb-1 leading-tight">
            {getGreeting()}, {teacherName}
          </h1>
          <p className="text-sm text-white/60">
            {loading
              ? "Loading your teaching portfolio..."
              : `You manage ${enrichedCourses.length} course${enrichedCourses.length !== 1 ? "s" : ""} this semester`}
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Courses" value={enrichedCourses.length} color="#6366f1" loading={loading} />
        <StatCard icon={Bell} label="Announcements" value={stats.totalAnn} color="#f59e0b" loading={loading} />
        <StatCard icon={FileText} label="Materials" value={stats.totalFiles} color="#10b981" loading={loading} />
        <StatCard icon={MessageCircle} label="Open Questions" value={stats.totalOpen} color="#ef4444" loading={loading} />
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Recent Announcements */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Broadcasts</h2>
            <span className="text-xs text-slate-400 font-semibold">{recentAnnouncements.length} latest</span>
          </div>
          {recentAnnouncements.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentAnnouncements.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="flex items-start gap-4 bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-indigo-200 hover:shadow-md transition-all group cursor-pointer"
                  onClick={() => navigate(`/courses/${a.courseId}`)}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    String(a.priority).toUpperCase() === "URGENT" ? "bg-red-500" : "bg-indigo-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{a.title}</h4>
                      {String(a.priority).toUpperCase() === "URGENT" && (
                        <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                          🔴 Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{a.body}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {a.courseTitle} · {timeAgo(a.createdAt)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Open →
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500 text-sm">No announcements yet.</p>
            </div>
          )}
        </div>

        {/* Right: Signals + Quick Actions */}
        <div className="flex flex-col gap-6">
          {/* Signals */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">🔔 Needs Attention</h3>
            {signals.length > 0 ? (
              <div className="flex flex-col gap-2">
                {signals.map((s, i) => (
                  <SignalCard key={i} icon={s.icon} title={s.title} text={s.text} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Everything looks stable.</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">⚡ Quick Actions</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: "Post Announcement", icon: Bell, to: "/courses", color: "#f59e0b" },
                { label: "Message Students", icon: MessageCircle, to: "/chat", color: "#6366f1" },
                { label: "Manage Materials", icon: BookOpen, to: "/courses", color: "#10b981" },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.to)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left w-full"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${action.color}15`, color: action.color }}
                  >
                    <action.icon size={15} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{action.label}</span>
                  <ChevronRight size={14} className="ml-auto text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Courses Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            My Courses <span className="text-slate-400 font-normal text-sm">({enrichedCourses.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : enrichedCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedCourses.map((c) => (
              <CourseCard key={c.id} course={c} onClick={() => navigate(`/courses/${c.id}`)} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Users size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No courses assigned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
