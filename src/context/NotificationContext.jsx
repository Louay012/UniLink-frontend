import React, { createContext, useContext, useState, useCallback } from "react";
import useNotifications from "../hooks/useNotifications";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

/* ─── localStorage helpers for "seen courses" ─────────── */

const SEEN_COURSES_KEY = "unilink-seen-courses";

function loadSeenCourses() {
  try {
    const raw = localStorage.getItem(SEEN_COURSES_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSeenCourses(set) {
  try {
    localStorage.setItem(SEEN_COURSES_KEY, JSON.stringify([...set]));
  } catch { /* ignore */ }
}

/* ─── Provider ─────────────────────────────────────────── */

export function NotificationProvider({ children }) {
  const { selectedRole } = useAuth();
  const { notifications, unreadCount, loading, markAllRead: hookMarkAllRead, dismiss, dismissByCourse } =
    useNotifications(selectedRole);

  // Track which course IDs the student has already visited
  const [seenCourses, setSeenCourses] = useState(loadSeenCourses);

  /**
   * Mark all notifications related to a specific course as seen,
   * AND record the course as "visited" (hides sidebar/course badges).
   */
  const dismissByCourseId = useCallback(
    (courseId) => {
      // 1) Mark notification-panel items as read (uses the hook)
      dismissByCourse(courseId);

      // 2) Record course as visited (clears sidebar + course card badges)
      setSeenCourses((prev) => {
        const next = new Set(prev);
        next.add(courseId);
        saveSeenCourses(next);
        return next;
      });
    },
    [dismissByCourse]
  );

  /**
   * Mark all notifications as read AND clear all course badges.
   */
  const markAllRead = useCallback(() => {
    hookMarkAllRead();

    // Also mark all courses as seen
    const allCourseIds = new Set(seenCourses);
    notifications.forEach((n) => {
      if (n.courseId) allCourseIds.add(n.courseId);
    });
    setSeenCourses(allCourseIds);
    saveSeenCourses(allCourseIds);
  }, [hookMarkAllRead, notifications, seenCourses]);

  /**
   * Check if a course has unseen announcements.
   * Returns true if the course has announcements AND the user hasn't visited it yet.
   */
  const isCourseUnseen = useCallback(
    (courseId) => !seenCourses.has(courseId),
    [seenCourses]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAllRead,
        dismiss,
        dismissByCourseId,
        isCourseUnseen,
        seenCourses,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext must be used inside NotificationProvider");
  return ctx;
}
