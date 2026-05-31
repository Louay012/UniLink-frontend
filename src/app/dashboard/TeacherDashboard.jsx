import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileText,
  MessageCircle,
  Plus,
  Trash2,
  Users
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  listCourses,
  listCourseAnnouncements,
  listCourseAttachments
} from "../../services/course.service";

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
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 leading-none mt-0.5">{loading ? "..." : value}</p>
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
        <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{course.code}</span>
        <h4 className="font-heading text-sm font-extrabold text-slate-900 leading-tight">{course.title}</h4>
        {course.description ? <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-0.5">{course.description}</p> : null}
        <div className="flex gap-3 text-[0.72rem] text-slate-400 font-semibold mt-1">
          <span>{course.announcementCount ?? 0} posts</span>
          <span>{course.attachmentCount ?? 0} files</span>
          <span>{course.studentCount ?? "-"} students</span>
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

function TeacherCalendar({ storageKey }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch (_error) {
      return [];
    }
  });
  const [draft, setDraft] = useState({ title: "", note: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, storageKey]);

  const days = useMemo(() => {
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const last = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    const end = new Date(last);
    end.setDate(last.getDate() + (6 - last.getDay()));
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    return Array.from({ length: totalDays }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [viewDate]);

  const entriesByDate = useMemo(() => {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.date]) acc[entry.date] = [];
      acc[entry.date].push(entry);
      return acc;
    }, {});
  }, [entries]);

  const selectedKey = dateKey(selectedDate);
  const selectedEntries = entriesByDate[selectedKey] || [];

  function moveMonth(offset) {
    setViewDate((previous) => new Date(previous.getFullYear(), previous.getMonth() + offset, 1));
  }

  function submitEntry(event) {
    event.preventDefault();
    const title = draft.title.trim();
    const note = draft.note.trim();
    if (!title && !note) return;

    if (editingId) {
      setEntries((previous) => previous.map((entry) => (
        entry.id === editingId ? { ...entry, date: selectedKey, title: title || "Untitled note", note } : entry
      )));
      setEditingId(null);
    } else {
      setEntries((previous) => [
        ...previous,
        { id: `${selectedKey}-${Date.now()}`, date: selectedKey, title: title || "Untitled note", note, createdAt: new Date().toISOString() }
      ]);
    }
    setDraft({ title: "", note: "" });
    setMobileFormOpen(false);
  }

  function editEntry(entry) {
    setSelectedDate(new Date(`${entry.date}T12:00:00`));
    setDraft({ title: entry.title || "", note: entry.note || "" });
    setEditingId(entry.id);
    setMobileFormOpen(true);
  }

  function deleteEntry(entryId) {
    setEntries((previous) => previous.filter((entry) => entry.id !== entryId));
    if (editingId === entryId) {
      setEditingId(null);
      setDraft({ title: "", note: "" });
    }
  }

  const entryPanel = (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400">Selected day</p>
          <h3 className="font-heading text-base font-extrabold text-slate-900">
            {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </h3>
        </div>
        <CalendarDays size={20} className="text-indigo-500" />
      </div>

      <form className="mb-4 flex flex-col gap-2" onSubmit={submitEntry}>
        <input
          value={draft.title}
          onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
          placeholder="Reminder title"
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <textarea
          rows={3}
          value={draft.note}
          onChange={(event) => setDraft((previous) => ({ ...previous, note: event.target.value }))}
          placeholder="Notes, tasks, or event details"
          className="resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700">
          <Plus size={15} /> {editingId ? "Save entry" : "Add entry"}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {selectedEntries.length ? selectedEntries.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">{entry.title}</p>
                {entry.note ? <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-500">{entry.note}</p> : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-indigo-600" onClick={() => editEntry(entry)} aria-label="Edit entry">
                  <Edit3 size={14} />
                </button>
                <button type="button" className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-600" onClick={() => deleteEntry(entry.id)} aria-label="Delete entry">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400">
            No entries for this day.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400">Personal planner</p>
            <h2 className="font-heading text-base font-extrabold text-slate-900">
              {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" onClick={() => moveMonth(-1)} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" onClick={() => moveMonth(1)} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          className="grid min-w-0 gap-1 overflow-hidden text-center text-[0.68rem] font-bold uppercase tracking-wider text-slate-400"
          style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
        >
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <span key={day} className="min-w-0 truncate py-1 text-center">{day}</span>
          ))}
        </div>
        <div
          className="mt-1 grid min-w-0 gap-1 overflow-hidden"
          style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
        >
          {days.map((day) => {
            const key = dateKey(day);
            const inMonth = day.getMonth() === viewDate.getMonth();
            const isSelected = sameDay(day, selectedDate);
            const hasEntries = Boolean(entriesByDate[key]?.length);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedDate(day);
                  setMobileFormOpen(true);
                }}
                className={`relative flex h-9 min-w-0 items-center justify-center overflow-hidden rounded-lg border px-1 py-1 text-center text-xs font-semibold transition-all sm:h-10 lg:h-11 ${isSelected ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50"} ${inMonth ? "text-slate-700" : "text-slate-300"}`}
              >
                <span>{day.getDate()}</span>
                {hasEntries ? <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-500" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden lg:block">
        {entryPanel}
      </div>

      {mobileFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-3 backdrop-blur-sm lg:hidden" onClick={() => setMobileFormOpen(false)}>
          <div className="max-h-[86vh] w-full overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm"
                onClick={() => setMobileFormOpen(false)}
              >
                Close
              </button>
            </div>
            {entryPanel}
          </div>
        </div>
      ) : null}
    </section>
  );
}

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
            const [annP, attP] = await Promise.all([
              listCourseAnnouncements(selectedRole, course.id).catch(() => ({ items: [] })),
              listCourseAttachments(selectedRole, course.id).catch(() => ({ items: [] }))
            ]);
            return [course.id, {
              announcements: annP.items || [],
              attachments: attP.items || []
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
  }, [selectedRole, toast]);

  const enrichedCourses = useMemo(() => {
    return courses
      .map((course) => {
        const bundle = courseBundles[course.id] || { announcements: [], attachments: [] };
        return { ...course, ...bundle, color: courseColor(course.id) };
      })
      .sort((left, right) => {
        const leftTime = new Date(left.announcements[0]?.createdAt || left.updatedAt || 0).getTime();
        const rightTime = new Date(right.announcements[0]?.createdAt || right.updatedAt || 0).getTime();
        return rightTime - leftTime;
      });
  }, [courses, courseBundles]);

  const stats = useMemo(() => {
    const totalAnn = enrichedCourses.reduce((sum, course) => sum + (Number(course.announcementCount) || 0), 0);
    const totalFiles = enrichedCourses.reduce((sum, course) => sum + (Number(course.attachmentCount) || 0), 0);
    return { totalAnn, totalFiles };
  }, [enrichedCourses]);

  const signals = useMemo(() => {
    const items = [];
    const stale = enrichedCourses.find((course) => {
      const last = course.announcements[0]?.createdAt || course.updatedAt;
      if (!last) return true;
      return (Date.now() - new Date(last).getTime()) > 7 * 24 * 60 * 60 * 1000;
    });
    if (stale) items.push({ icon: Bell, title: "Course needs update", text: `${stale.title} has no recent announcement.` });

    const noMaterials = enrichedCourses.find((course) => (Number(course.attachmentCount) || 0) === 0);
    if (noMaterials) items.push({ icon: FileText, title: "Missing materials", text: `${noMaterials.title} has no attached files.` });

    return items.slice(0, 3);
  }, [enrichedCourses]);

  const quickActions = [
    { icon: Bell, label: "Post", to: "/courses" },
    { icon: MessageCircle, label: "Message", to: "/chat" },
    { icon: BookOpen, label: "Courses", to: "/courses" },
    { icon: CalendarDays, label: "Planner", to: "/dashboard" }
  ];

  return (
    <div className="flex flex-col gap-6 pb-8 w-full min-w-0 max-w-none mx-auto">
      <section
        className="relative rounded-2xl p-6 sm:p-8 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
        <div className="relative z-10">
          <p className="text-[0.72rem] font-bold uppercase tracking-widest text-white/50 mb-1">UniLink Teacher</p>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-white mb-1 leading-tight">
            {getGreeting()}, {teacherName}
          </h1>
          <p className="text-sm text-white/60">
            {loading ? "Loading your teaching portfolio..." : `You manage ${enrichedCourses.length} course${enrichedCourses.length !== 1 ? "s" : ""} this semester`}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Courses" value={enrichedCourses.length} color="#6366f1" loading={loading} />
        <StatCard icon={Bell} label="Announcements" value={stats.totalAnn} color="#f59e0b" loading={loading} />
        <StatCard icon={FileText} label="Materials" value={stats.totalFiles} color="#10b981" loading={loading} />
      </div>

      <TeacherCalendar storageKey={`unilink_teacher_calendar_${teacherUserId || "local"}`} />

      <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Needs Attention</h3>
        {signals.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {signals.map((signal, index) => (
              <SignalCard key={`${signal.title}-${index}`} icon={signal.icon} title={signal.title} text={signal.text} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Everything looks stable.</p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            My Courses <span className="text-slate-400 font-normal text-sm">({enrichedCourses.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => <SkeletonCard key={item} />)}
          </div>
        ) : enrichedCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedCourses.map((course) => (
              <CourseCard key={course.id} course={course} onClick={() => navigate(`/courses/${course.id}`)} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Users size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No courses assigned yet.</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Shortcuts</p>
            <h2 className="font-heading text-base font-extrabold text-slate-900">Quick Actions</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <QuickAction key={action.label} {...action} navigate={navigate} />
          ))}
        </div>
      </section>
    </div>
  );
}
