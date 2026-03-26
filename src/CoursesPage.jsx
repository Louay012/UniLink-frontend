import { useEffect } from 'react';
import CourseCard from './CourseCard';
import { COURSES } from './mockData';

export default function CoursesPage({ basePath = '' }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSES.map((course) => (
            <CourseCard key={course.id} course={course} basePath={basePath} />
          ))}
        </div>

        {/* Empty State */}
        {COURSES.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-slate-900">No courses yet</h3>
            <p className="text-slate-600 mt-2">You haven't enrolled in any courses yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
