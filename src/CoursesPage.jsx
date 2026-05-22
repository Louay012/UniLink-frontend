import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, BookOpen } from 'lucide-react';

import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useNotificationContext } from './context/NotificationContext';
import { listCourses } from './services/course.service';

/* ─── helpers ─────────────────────────────────────────────── */

const COURSE_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'
];

function courseColor(id = '') {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

function isCourseRecentlyActive(course) {
  const timestamp = course.updatedAt || course.createdAt;
  if (!timestamp) return false;
  const activityDate = new Date(timestamp);
  if (Number.isNaN(activityDate.getTime())) return false;
  return Date.now() - activityDate.getTime() <= 1000 * 60 * 60 * 48;
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Courses' },
  { id: 'new', label: 'Has Announcements' },
  { id: 'recent', label: 'Recently Active' }
];

/* ─── CourseCard (identical to Dashboard) ──────────────────── */

function CourseCard({ course, onClick, isUnseen = true }) {
  const color = courseColor(course.id);
  const hasUnread = (course.announcementCount ?? 0) > 0 && isUnseen;

  return (
    <button
      type="button"
      className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden text-left cursor-pointer p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200 w-full"
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
              {course.announcementCount}
            </span>
          )}
        </div>
        <h4 className="font-heading text-sm font-extrabold text-slate-900 leading-tight">
          {course.title}
        </h4>
        <p className="text-xs text-slate-500 mt-0.5 mb-1">
          {course.teacher?.name || 'Unknown Teacher'}
        </p>
        {course.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-0.5">
            {course.description}
          </p>
        )}
        <div className="flex gap-3 text-[0.72rem] text-slate-400 font-semibold mt-1">
          <span>{course.attachmentCount ?? 0} files</span>
          <span>{course.announcementCount ?? 0} announcements</span>
        </div>
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-indigo-500 mt-2 transition-all group-hover:gap-1.5">
          Open <ChevronRight size={13} />
        </span>
      </div>
    </button>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────── */

function CardSkeleton() {
  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="h-12 w-full bg-slate-200 animate-pulse" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-2.5 w-16 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse" />
        <div className="h-3 w-full bg-slate-200 rounded animate-pulse mt-1" />
        <div className="h-3 w-2/3 bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────── */

export default function CoursesPage({ basePath = '' }) {
  const { selectedRole } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isCourseUnseen } = useNotificationContext();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      setLoading(true);
      try {
        const payload = await listCourses(selectedRole);
        if (!active) return;

        const items = (payload.items || []).map((course) => ({
          ...course,
          teacher: course.teacher || { name: 'Unknown Teacher' },
          announcementCount: Number(course.announcementCount ?? 0),
          attachmentCount: Number(course.attachmentCount ?? 0)
        }));

        setCourses(items);
      } catch (err) {
        if (active) toast.error(err.message || 'Failed to load courses.', 'Courses');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCourses();
    return () => { active = false; };
  }, [selectedRole]);

  const visibleCourses = useMemo(() => {
    const text = searchValue.trim().toLowerCase();
    return courses
      .filter((c) => {
        const haystack = `${c.title || ''} ${c.code || ''} ${c.teacher?.name || ''}`.toLowerCase();
        return haystack.includes(text);
      })
      .filter((c) => {
        if (activeFilter === 'new') return c.announcementCount > 0;
        if (activeFilter === 'recent') return isCourseRecentlyActive(c);
        return true;
      });
  }, [courses, searchValue, activeFilter]);

  return (
    <div className="flex flex-col gap-6 pb-8 w-full min-w-0 max-w-[1200px] mx-auto">

      {/* ── Hero ── */}
      <section
        className="relative rounded-2xl p-6 sm:p-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-widest text-white/50 mb-1">
              UniLink
            </p>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-white mb-1 leading-tight">
              My Courses
            </h1>
            <p className="text-sm text-white/60">
              {loading
                ? 'Loading your courses...'
                : `You are enrolled in ${courses.length} course${courses.length !== 1 ? 's' : ''} this semester`}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search courses..."
              className="w-full bg-white/10 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:bg-white/15 focus:border-white/30 transition-all"
            />
          </div>
        </div>
      </section>

      {/* ── Filter Pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setActiveFilter(opt.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              activeFilter === opt.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {opt.label}
            {opt.id === 'all' && !loading && (
              <span className={`ml-1.5 text-[0.65rem] font-bold ${activeFilter === opt.id ? 'opacity-70' : 'text-slate-400'}`}>
                {courses.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Courses Grid — always 3 columns ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : visibleCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isUnseen={isCourseUnseen(course.id)}
              onClick={() => navigate(`${basePath}/courses/${course.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <BookOpen size={28} className="text-slate-400" />
          </div>
          <div className="text-center">
            <p className="font-heading text-base font-extrabold text-slate-900">No courses found</p>
            <p className="text-sm text-slate-500 mt-1">
              {searchValue || activeFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'You are not enrolled in any courses yet.'}
            </p>
          </div>
          {(searchValue || activeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearchValue(''); setActiveFilter('all'); }}
              className="text-sm font-semibold text-indigo-500 hover:opacity-75 transition-opacity"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
