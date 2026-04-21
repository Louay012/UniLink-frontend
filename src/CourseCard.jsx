import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Users } from 'lucide-react';

export default function CourseCard({ course, basePath = '', compact = false }) {
  const navigate = useNavigate();
  const withBase = (path) => `${basePath}${path}`;
  const unreadAnnouncements = course.newAnnouncements || 0;

  return (
    <div
      onClick={() => navigate(withBase(`/courses/${course.id}`))}
      className="group h-full w-full bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-slate-200 flex flex-col"
    >
      {/* Color Header */}
      <div
        className="h-20 w-full transition-all"
        style={{ backgroundColor: course.color }}
      ></div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {compact ? null : (
          <div className="mb-2.5 flex items-center justify-between">
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              {course.code}
            </span>
            <span className="text-xs font-medium text-slate-500">Tap to open</span>
          </div>
        )}

        {/* Course Code */}
        {compact ? (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{course.code}</p>
        ) : null}

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5 group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
          {course.title}
        </h3>

        {/* Teacher */}
        <div className="flex items-center gap-2 mt-2.5 text-slate-600">
          <Users size={16} />
          <p className="text-sm">{course.teacher.name}</p>
        </div>

        {/* Description */}
        <p className={`text-sm text-slate-600 mt-2.5 min-h-[2.8rem] ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>
          {course.description}
        </p>

        {/* Footer with unread badges and date */}
        <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {unreadAnnouncements > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1.5">
                <Bell size={13} />
                {unreadAnnouncements} new
              </span>
            )}
            {unreadAnnouncements === 0 && (
              <span className="text-xs text-slate-500">No new announcements</span>
            )}
          </div>

          {/* Next Lesson Date */}
          {course.nextLesson && (
            <div className="flex items-center gap-1 text-xs text-slate-500 ml-auto">
              <Calendar size={14} />
              <span>{new Date(course.nextLesson).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
