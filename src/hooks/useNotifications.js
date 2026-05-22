import { useEffect, useMemo, useState, useCallback } from "react";
import { listCourses, listCourseAnnouncements, listCourseAttachments, getReadAnnouncementIds, getUnreadCounts, markAnnouncementsRead as apiMarkRead, markCourseAnnouncementsRead as apiMarkCourseRead } from "../services/course.service";
import { listChats } from "../services/chat.service";
import { connectSocket } from "../services/socket";

// Only show notifications from the last 30 days
const NOTIFICATION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export default function useNotifications(selectedRole) {
  const [notifications, setNotifications] = useState([]);
  const [serverReadIds, setServerReadIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Real-time notifications via Socket.IO
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    function handleNotification(notif) {
      if (!notif || !notif.id) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [{ ...notif, read: false }, ...prev];
      });
    }

    socket.on("notification", handleNotification);

    if (selectedRole?.userId) {
      socket.emit("user:join", { userId: selectedRole.userId });
    }

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [selectedRole?.userId]);

  // Load server-side read state
  useEffect(() => {
    let active = true;
    async function loadReadState() {
      try {
        const result = await getReadAnnouncementIds(selectedRole);
        if (active && result?.ids) {
          setServerReadIds(new Set(result.ids));
        }
      } catch { /* ignore */ }
    }
    if (selectedRole?.userId) loadReadState();
    return () => { active = false; };
  }, [selectedRole?.value, selectedRole?.userId]);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      setLoading(true);
      try {
        const items = [];
        const cutoff = Date.now() - NOTIFICATION_WINDOW_MS;

        // 1. Fetch courses + their announcements + attachments
        const coursesPayload = await listCourses(selectedRole);
        const courses = coursesPayload.items || [];

        const bundles = await Promise.all(
          courses.map(async (course) => {
            const [annPayload, attPayload] = await Promise.all([
              listCourseAnnouncements(selectedRole, course.id).catch(() => ({ items: [] })),
              listCourseAttachments(selectedRole, course.id).catch(() => ({ items: [] }))
            ]);
            return { course, announcements: annPayload.items || annPayload || [], attachments: attPayload.items || attPayload || [] };
          })
        );

        for (const bundle of bundles) {
          // Announcement notifications (within time window)
          for (const ann of bundle.announcements) {
            const annTime = new Date(ann.createdAt || 0).getTime();
            if (annTime < cutoff) continue;

            items.push({
              id: `ann-${ann.id}`,
              announcementId: ann.id,
              type: "announcement",
              title: ann.title,
              subtitle: `${bundle.course.title} · ${ann.priority === "URGENT" ? "🔴 Urgent" : "Announcement"}`,
              timestamp: ann.createdAt,
              link: `/courses/${bundle.course.id}`,
              courseId: bundle.course.id,
              read: false
            });
          }

          // Recent file notifications (within time window)
          for (const att of bundle.attachments) {
            const uploadTime = new Date(att.uploadedAt || att.createdAt || 0).getTime();
            if (uploadTime < cutoff) continue;

            items.push({
              id: `file-${att.id}`,
              type: "file",
              title: att.title || att.fileName || "New file",
              subtitle: `${bundle.course.title} · File uploaded`,
              timestamp: att.uploadedAt || att.createdAt,
              link: `/courses/${bundle.course.id}`,
              courseId: bundle.course.id,
              read: false
            });
          }
        }

        // 2. Fetch chats for unread message counts
        try {
          const chatsPayload = await listChats(selectedRole);
          const chats = chatsPayload.items || [];
          for (const chat of chats) {
            const unread = Number(chat.unreadCount ?? chat.unread_count ?? 0);
            if (unread > 0) {
              items.push({
                id: `chat-${chat.id}`,
                type: "message",
                title: `${unread} unread message${unread > 1 ? "s" : ""}`,
                subtitle: chat.title || chat.name || "Chat",
                timestamp: chat.lastMessage?.createdAt || chat.updatedAt,
                link: "/chat",
                read: false
              });
            }
          }
        } catch { /* chat loading failed — skip silently */ }

        if (!active) return;
        setNotifications(items);
      } catch {
        if (active) setNotifications([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNotifications();
    return () => { active = false; };
  }, [selectedRole?.value, selectedRole?.userId]);

  // Apply server read state — items whose announcement_id is in the read set are marked read
  const enriched = useMemo(() => {
    return notifications.map((n) => ({
      ...n,
      read: n.announcementId ? serverReadIds.has(n.announcementId) : n.read
    }));
  }, [notifications, serverReadIds]);

  const unreadCount = useMemo(() => enriched.filter((n) => !n.read).length, [enriched]);

  const markAllRead = useCallback(async () => {
    // Get all unread announcement IDs and mark them on the server
    const announcementIds = notifications
      .filter((n) => n.announcementId && !serverReadIds.has(n.announcementId))
      .map((n) => n.announcementId);

    if (announcementIds.length > 0) {
      try {
        await apiMarkRead(selectedRole, announcementIds);
      } catch { /* ignore */ }
    }

    // Optimistically mark all as read locally
    setServerReadIds((prev) => {
      const next = new Set(prev);
      for (const id of announcementIds) next.add(id);
      return next;
    });
  }, [notifications, serverReadIds, selectedRole]);

  const dismiss = useCallback(async (notificationId) => {
    // Find the announcement ID from the notification
    const notif = notifications.find((n) => n.id === notificationId);
    if (notif?.announcementId) {
      setServerReadIds((prev) => new Set([...prev, notif.announcementId]));
      try {
        await apiMarkRead(selectedRole, [notif.announcementId]);
      } catch { /* ignore */ }
    }
  }, [notifications, selectedRole]);

  // Dismiss all notifications for a specific course (server-persisted)
  const dismissByCourse = useCallback(async (courseId) => {
    try {
      await apiMarkCourseRead(selectedRole, courseId);
    } catch { /* ignore */ }

    // Optimistically mark all course announcements as read
    setServerReadIds((prev) => {
      const next = new Set(prev);
      for (const n of notifications) {
        if (n.courseId === courseId && n.announcementId) {
          next.add(n.announcementId);
        }
      }
      return next;
    });
  }, [notifications, selectedRole]);

  return {
    notifications: enriched,
    unreadCount,
    loading,
    markAllRead,
    dismiss,
    dismissByCourse
  };
}
