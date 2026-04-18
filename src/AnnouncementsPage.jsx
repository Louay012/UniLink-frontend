import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ANNOUNCEMENTS, COURSES } from "./mockData";
import AnnouncementCard from "./mywork/components/AnnouncementCard";
import { flattenAnnouncements, sortAnnouncementsByPriorityThenDate } from "./mywork/helpers";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "urgent", label: "Urgent" },
  { id: "unread", label: "Unread" }
];

export default function AnnouncementsPage({ basePath = "" }) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [readIds, setReadIds] = useState(new Set(["a-2"]));

  const allAnnouncements = useMemo(() => {
    const flattened = flattenAnnouncements(COURSES, ANNOUNCEMENTS);
    return sortAnnouncementsByPriorityThenDate(flattened);
  }, []);

  const visibleAnnouncements = useMemo(() => {
    if (activeFilter === "urgent") {
      return allAnnouncements.filter((item) => item.visualType === "URGENT");
    }

    if (activeFilter === "unread") {
      return allAnnouncements.filter((item) => !readIds.has(item.id));
    }

    return allAnnouncements;
  }, [activeFilter, allAnnouncements, readIds]);

  const markAsRead = (announcementId) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(announcementId);
      return next;
    });
  };

  const withBase = (path) => `${basePath}${path}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Global Announcements</h1>
            <p className="text-slate-600 mt-1">Pinned, urgent, and normal announcements sorted by priority and recency.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeFilter === filter.id
                    ? "bg-primary text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-primary"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {visibleAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              showCourse
              actionLabel={readIds.has(announcement.id) ? "Open Course" : "Mark Read"}
              onAction={() => {
                if (readIds.has(announcement.id)) {
                  navigate(withBase(`/courses/${announcement.courseId}`));
                  return;
                }
                markAsRead(announcement.id);
              }}
            />
          ))}
        </div>

        {visibleAnnouncements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 mt-4">
            No announcements found for this filter.
          </div>
        ) : null}
      </div>
    </div>
  );
}
