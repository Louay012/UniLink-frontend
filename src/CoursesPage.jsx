import { useEffect, useMemo, useState } from 'react';
import CourseCard from './CourseCard';
import { useAuth } from './context/AuthContext';
import { listCourses } from './services/course.service';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'Has Announcements' },
  { id: 'recent', label: 'Recently Active' }
];

function isCourseRecentlyActive(course) {
  const timestamp = course.updatedAt || course.createdAt;
  if (!timestamp) return false;
  const activityDate = new Date(timestamp);
  if (Number.isNaN(activityDate.getTime())) return false;
  const twoDaysMs = 1000 * 60 * 60 * 48;
  return Date.now() - activityDate.getTime() <= twoDaysMs;
}

export default function CoursesPage({ basePath = '' }) {
  const { selectedRole } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      setLoading(true);
      setError('');

      try {
        const payload = await listCourses(selectedRole);
        if (!active) return;

        const items = (payload.items || []).map((course, index) => ({
          ...course,
          teacher: course.teacher || { name: 'Unknown Teacher' },
          announcementCount: Number(course.announcementCount ?? 0),
          attachmentCount: Number(course.attachmentCount ?? 0),
          color: course.color || ['#0e6ba8', '#a23b72', '#f18f01', '#06a77d', '#d62828', '#9d4edd'][index % 6]
        }));

        setCourses(items);
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load courses.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, [selectedRole]);

  const visibleCourses = useMemo(() => {
    const text = searchValue.trim().toLowerCase();

    return courses
      .filter((course) => {
        const haystack = `${course.title || ''} ${course.code || ''} ${course.teacher?.name || ''}`.toLowerCase();
        return haystack.includes(text);
      })
      .filter((course) => {
        if (activeFilter === 'new') return course.announcementCount > 0;
        if (activeFilter === 'recent') return isCourseRecentlyActive(course);
        return true;
      });
  }, [activeFilter, courses, searchValue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">All Courses</h1>
            <p className="text-lg text-slate-600 mt-2">
              You are enrolled in <span className="font-semibold text-primary">{courses.length}</span> courses this semester
            </p>

            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full lg:max-w-lg">
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search courses..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-primary focus:ring-2"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setActiveFilter(option.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      activeFilter === option.id
                        ? 'bg-primary text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mx-4 mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6 lg:mx-8">
          {error}
        </div>
      ) : null}

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="w-full py-12 text-center text-slate-500">Loading courses...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {visibleCourses.map((course) => (
              <CourseCard key={course.id} course={course} basePath={basePath} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && visibleCourses.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-slate-900">No courses found</h3>
            <p className="text-slate-600 mt-2">Try adjusting the search text or selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

