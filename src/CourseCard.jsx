import { useNavigate } from 'react-router-dom';
import { Calendar, Users, FileText } from 'lucide-react';
import { formatDate } from './mockData';

export default function CourseCard({ course, basePath = '' }) {
  const navigate = useNavigate();
  const withBase = (path) => `${basePath}${path}`;

  return (
    <div
      onClick={() => navigate(withBase(`/courses/${course.id}`))}
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer hover:scale-105 border border-slate-200"
    >
      {/* Color Header */}
      <div
        className="h-24 w-full transition-all"
        style={{ backgroundColor: course.color }}
      ></div>

      {/* Content */}
      <div className="p-5">
        {/* Course Code */}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {course.code}
        </p>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 mt-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {/* Teacher */}
        <div className="flex items-center gap-2 mt-3 text-slate-600">
          <Users size={16} />
          <p className="text-sm">{course.teacher.name}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 mt-3 line-clamp-2">
          {course.description}
        </p>

        {/* Footer with badges */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
          {/* New Announcements Badge */}
          {course.newAnnouncements > 0 && (
            <div className="flex items-center gap-1">
              <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                {course.newAnnouncements} NEW
              </span>
            </div>
          )}

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
