import { useNavigate } from 'react-router-dom';
import CourseCard from './CourseCard';
import { ANNOUNCEMENTS, COURSES, MOCK_USER } from './mockData';
import { buildCourseActivity, flattenAnnouncements, formatTimeAgo, sortAnnouncementsByPriorityThenDate } from './mywork/helpers';

export default function Dashboard({ basePath = '' }) {
  const navigate = useNavigate();
  const quickCourses = COURSES.slice(0, 4);
  const allAnnouncements = sortAnnouncementsByPriorityThenDate(flattenAnnouncements(COURSES, ANNOUNCEMENTS));
  const latestAnnouncements = allAnnouncements.slice(0, 5);

  const recentActivity = COURSES.map((course) => ({
    courseId: course.id,
    courseTitle: course.title,
    ...buildCourseActivity(course, ANNOUNCEMENTS, {})
  })).slice(0, 5);

  const withBase = (path) => `${basePath}${path}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">
            Welcome back, {MOCK_USER.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-white text-opacity-90 mt-2">Your course workspace is ready for today.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-10">

        {/* Latest Announcements */}
        <section>
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
            {latestAnnouncements.slice(0, 5).map((announcement) => (
              <article key={announcement.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {announcement.courseTitle} • {formatTimeAgo(announcement.timestamp)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(withBase(`/courses/${announcement.courseId}`))}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-opacity-90"
                  >
                    View
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* My Courses Quick Access */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              📚 My Courses
            </h2>
            <button
              onClick={() => navigate(withBase('/courses'))}
              className="text-primary hover:text-opacity-80 font-semibold"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {quickCourses.map((course) => (
              <CourseCard key={course.id} course={course} basePath={basePath} compact />
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">🕒 Recent Activity</h2>
          <div className="grid gap-3">
            {recentActivity.map((item) => (
              <div key={item.courseId} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{item.label} in {item.courseTitle}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(withBase(`/courses/${item.courseId}`))}
                  className="rounded-md border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  Open Course
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
