import { useNavigate } from 'react-router-dom';
import { Calendar, Users, FileText } from 'lucide-react';
import ProgressBar from './mywork/components/ProgressBar';

export default function CourseCard({ course, basePath = '', compact = false }) {
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
        {compact ? null : (
          <div className="mb-3 flex items-center justify-between">
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
        <h3 className="text-lg font-bold text-slate-900 mt-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {/* Teacher */}
        <div className="flex items-center gap-2 mt-3 text-slate-600">
          <Users size={16} />
          <p className="text-sm">{course.teacher.name}</p>
        </div>

        {/* Description */}
        <p className={`text-sm text-slate-600 mt-3 ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>
          {course.description}
        </p>

        {/* Last Activity */}
        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
          <p className="text-xs text-slate-500">Last Activity</p>
          <p className="text-sm font-medium text-slate-800 mt-0.5">
            {course.lastActivityLabel} • {course.lastActivityTime}
          </p>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-medium">Progress</span>
            <span>{course.progressPercent}%</span>
          </div>
          <ProgressBar
            percent={course.progressPercent}
            label={`${course.completedLessons} / ${course.totalLessons} lessons completed`}
          />
        </div>

        {/* Footer with badges */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
          {/* New Announcements Badge */}
          {course.newAnnouncements > 0 && (
            <div className="flex items-center gap-1">
              <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                {course.newAnnouncements} new
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
