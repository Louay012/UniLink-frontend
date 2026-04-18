const PINNED_ANNOUNCEMENT_IDS = new Set(["a-1", "a-8"]);

const COURSE_COMPLETION_BY_ID = {
  "c-1": { completed: 7, total: 10 },
  "c-2": { completed: 4, total: 8 },
  "c-3": { completed: 6, total: 9 },
  "c-4": { completed: 2, total: 7 },
  "c-5": { completed: 3, total: 12 },
  "c-6": { completed: 5, total: 11 }
};

function toDateSafe(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCourseCompletion(courseId) {
  const fallback = { completed: 0, total: 0 };
  const progress = COURSE_COMPLETION_BY_ID[courseId] || fallback;
  const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  return {
    ...progress,
    percent: clamp(percent, 0, 100)
  };
}

function getAnnouncementPriorityScore(announcement) {
  if (PINNED_ANNOUNCEMENT_IDS.has(announcement.id)) return 0;
  if (announcement.badge === "URGENT") return 1;
  return 2;
}

function getAnnouncementVisualType(announcement) {
  if (PINNED_ANNOUNCEMENT_IDS.has(announcement.id)) return "PINNED";
  if (announcement.badge === "URGENT") return "URGENT";
  return "NORMAL";
}

function sortAnnouncementsByPriorityThenDate(announcements) {
  return [...announcements].sort((a, b) => {
    const priorityDiff = getAnnouncementPriorityScore(a) - getAnnouncementPriorityScore(b);
    if (priorityDiff !== 0) return priorityDiff;
    return toDateSafe(b.timestamp) - toDateSafe(a.timestamp);
  });
}

function flattenAnnouncements(courses, announcementsByCourse) {
  return courses.flatMap((course) =>
    (announcementsByCourse[course.id] || []).map((announcement) => ({
      ...announcement,
      courseTitle: course.title,
      author: course.teacher.name,
      visualType: getAnnouncementVisualType(announcement)
    }))
  );
}

function getAttachmentKind(attachment) {
  const type = String(attachment.type || "").toLowerCase();
  const name = String(attachment.name || "").toLowerCase();
  if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (type.includes("image") || /(\.png|\.jpg|\.jpeg|\.gif|\.webp)$/.test(name)) return "image";
  if (type.includes("video") || /(\.mp4|\.mov|\.avi|\.mkv)$/.test(name)) return "video";
  return "file";
}

function formatTimeAgo(timestamp) {
  const now = new Date();
  const then = toDateSafe(timestamp);
  const diffMs = now - then;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildCourseActivity(course, announcementsByCourse, lessonsByCourse) {
  const latestAnnouncement = (announcementsByCourse[course.id] || [])
    .slice()
    .sort((a, b) => toDateSafe(b.timestamp) - toDateSafe(a.timestamp))[0];

  if (latestAnnouncement) {
    return {
      label: "New announcement",
      time: formatTimeAgo(latestAnnouncement.timestamp),
      timestamp: latestAnnouncement.timestamp
    };
  }

  const lessons = lessonsByCourse[course.id] || [];
  if (lessons.length > 0) {
    return {
      label: "New lesson added",
      time: "Yesterday",
      timestamp: course.nextLesson || new Date().toISOString()
    };
  }

  return {
    label: "No recent updates",
    time: "-",
    timestamp: course.nextLesson || new Date(0).toISOString()
  };
}

function isCourseRecentlyActive(course, announcementsByCourse, lessonsByCourse) {
  const activity = buildCourseActivity(course, announcementsByCourse, lessonsByCourse);
  const activityDate = toDateSafe(activity.timestamp);
  const twoDaysMs = 1000 * 60 * 60 * 48;
  return new Date() - activityDate <= twoDaysMs;
}

export {
  PINNED_ANNOUNCEMENT_IDS,
  getCourseCompletion,
  getAnnouncementVisualType,
  sortAnnouncementsByPriorityThenDate,
  flattenAnnouncements,
  getAttachmentKind,
  formatTimeAgo,
  buildCourseActivity,
  isCourseRecentlyActive
};
