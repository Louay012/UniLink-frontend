import { useNavigate } from 'react-router-dom';
import CourseCard from './CourseCard';
import { COURSES, MOCK_USER } from './mockData';

export default function Dashboard({ basePath = '' }) {
  const navigate = useNavigate();
  const recentCourses = COURSES.slice(0, 3);
  const coursesWithAnnouncements = COURSES.filter((c) => c.newAnnouncements > 0);
  const withBase = (path) => `${basePath}${path}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">
            Welcome back, {MOCK_USER.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-white text-opacity-90 mt-2">
            You have {coursesWithAnnouncements.length} courses with new announcements
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-primary">
            <div className="text-3xl font-bold text-primary">{COURSES.length}</div>
            <p className="text-slate-600 mt-2">Active Courses</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="text-3xl font-bold text-red-500">
              {coursesWithAnnouncements.reduce((sum, c) => sum + c.newAnnouncements, 0)}
            </div>
            <p className="text-slate-600 mt-2">New Announcements</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-500">7</div>
            <p className="text-slate-600 mt-2">Days Until Exam</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-500">3</div>
            <p className="text-slate-600 mt-2">Pending Tasks</p>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              📢 Latest Announcements
            </h2>
            <button
              onClick={() => navigate(withBase('/announcements'))}
              className="text-primary hover:text-opacity-80 font-semibold"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {coursesWithAnnouncements.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow border-l-4 p-4 hover:shadow-md transition-all cursor-pointer"
                style={{ borderLeftColor: course.color }}
                onClick={() => navigate(withBase(`/courses/${course.id}`))}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{course.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {course.newAnnouncements} new announcement{course.newAnnouncements > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span
                    className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full"
                  >
                    {course.newAnnouncements} NEW
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Courses */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              📚 Your Courses
            </h2>
            <button
              onClick={() => navigate(withBase('/courses'))}
              className="text-primary hover:text-opacity-80 font-semibold"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCourses.map((course) => (
              <CourseCard key={course.id} course={course} basePath={basePath} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
