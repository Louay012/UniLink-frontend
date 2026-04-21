import { useEffect, useMemo, useState } from 'react';
import CourseCard from './CourseCard';
import { ANNOUNCEMENTS, COURSES, LESSONS } from './mockData';
import { isCourseRecentlyActive } from './mywork/helpers';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'Has New Announcements' },
  { id: 'recent', label: 'Recently Active' }
];

export default function CoursesPage({ basePath = '' }) {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const enrichedCourses = useMemo(() => COURSES, []);

  const visibleCourses = useMemo(() => {
    const text = searchValue.trim().toLowerCase();

    return enrichedCourses
      .filter((course) => course.title.toLowerCase().includes(text))
      .filter((course) => {
        if (activeFilter === 'new') return course.newAnnouncements > 0;
        if (activeFilter === 'recent') return isCourseRecentlyActive(course, ANNOUNCEMENTS, LESSONS);
        return true;
      });
  }, [activeFilter, enrichedCourses, searchValue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">All Courses</h1>
            <p className="text-lg text-slate-600 mt-2">
              You are enrolled in <span className="font-semibold text-primary">{COURSES.length}</span> courses this semester
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

      {/* Courses List */}
      <div className="w-full px-4 py-12 sm:px-6 lg:px-8 flex justify-center">
        <div className="flex flex-wrap gap-6 justify-center ">
          {visibleCourses.map((course) => (
            <div key={course.id} className="w-[400px] h-[318px]">
              <CourseCard course={course} basePath={basePath} />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {visibleCourses.length === 0 && (
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
