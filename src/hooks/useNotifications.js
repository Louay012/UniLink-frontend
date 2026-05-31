import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getReadAnnouncementIds,
  listCourseAnnouncements,
  listCourseAttachments,
  listCourses,
  markAnnouncementsRead as apiMarkRead,
  markCourseAnnouncementsRead as apiMarkCourseRead
} from "../services/course.service";
import { listChats, markChatRead } from "../services/chat.service";
import { listGlobalAnnouncements } from "../services/announcement.service";
import { connectSocket } from "../services/socket";

const NOTIFICATION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export default function useNotifications(selectedRole) {
  const [notifications, setNotifications] = useState([]);
  const [serverReadIds, setServerReadIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;

    function handleNotification(notif) {
      if (!notif?.id) return;
      setNotifications((prev) => {
        if (prev.some((item) => item.id === notif.id)) return prev;
        return [{ ...notif, read: false }, ...prev];
      });
    }

    socket.on("notification", handleNotification);
    if (selectedRole?.userId) socket.emit("user:join", { userId: selectedRole.userId });

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [selectedRole?.userId]);

  useEffect(() => {
    let active = true;
    async function loadReadState() {
      try {
        const result = await getReadAnnouncementIds(selectedRole);
        if (active && result?.ids) setServerReadIds(new Set(result.ids));
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

        const coursesPayload = await listCourses(selectedRole);
        const courses = coursesPayload.items || [];
        const bundles = await Promise.all(
          courses.map(async (course) => {
            const [annPayload, attPayload] = await Promise.all([
              listCourseAnnouncements(selectedRole, course.id).catch(() => ({ items: [] })),
              listCourseAttachments(selectedRole, course.id).catch(() => ({ items: [] }))
            ]);
            return {
              course,
              announcements: annPayload.items || [],
              attachments: attPayload.items || []
            };
          })
        );

        for (const bundle of bundles) {
          for (const ann of bundle.announcements) {
            const annTime = new Date(ann.createdAt || 0).getTime();
            if (annTime < cutoff) continue;
            items.push({
              id: `ann-${ann.id}`,
              announcementId: ann.id,
              type: "announcement",
              title: ann.title,
              subtitle: `${bundle.course.title} - Announcement`,
              timestamp: ann.createdAt,
              link: `/courses/${bundle.course.id}`,
              courseId: bundle.course.id,
              read: false
            });
          }

          for (const att of bundle.attachments) {
            const uploadTime = new Date(att.uploadedAt || att.createdAt || 0).getTime();
            if (uploadTime < cutoff) continue;
            items.push({
              id: `file-${att.id}`,
              announcementId: att.announcementId,
              type: "file",
              title: att.title || att.fileName || "New file",
              subtitle: `${bundle.course.title} - File uploaded`,
              timestamp: att.uploadedAt || att.createdAt,
              link: `/courses/${bundle.course.id}`,
              courseId: bundle.course.id,
              read: false
            });
          }
        }

        try {
          const globalPayload = await listGlobalAnnouncements(selectedRole);
          const globalAnnouncements = globalPayload.items || [];
          for (const ann of globalAnnouncements) {
            const annTime = new Date(ann.createdAt || 0).getTime();
            if (annTime < cutoff) continue;
            items.push({
              id: `global-ann-${ann.id}`,
              announcementId: ann.id,
              type: "announcement",
              title: ann.title,
              subtitle: "Global announcement",
              timestamp: ann.createdAt,
              link: "/announcements",
              read: Boolean(ann.read)
            });

            for (const att of ann.attachments || []) {
              items.push({
                id: `global-file-${att.id}`,
                announcementId: ann.id,
                type: "file",
                title: att.title || att.fileName || "New file",
                subtitle: "Global announcement file",
                timestamp: ann.createdAt,
                link: "/announcements",
                read: Boolean(ann.read)
              });
            }
          }
        } catch { /* ignore */ }

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
        } catch { /* ignore */ }

        if (active) setNotifications(items);
      } catch {
        if (active) setNotifications([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNotifications();
    return () => { active = false; };
  }, [selectedRole?.value, selectedRole?.userId]);

  const enriched = useMemo(() => (
    notifications.map((notification) => ({
      ...notification,
      read: notification.announcementId ? serverReadIds.has(notification.announcementId) || notification.read : notification.read
    }))
  ), [notifications, serverReadIds]);

  const unreadCount = useMemo(() => enriched.filter((notification) => !notification.read).length, [enriched]);

  const markAllRead = useCallback(async () => {
    const announcementIds = notifications
      .filter((notification) => notification.announcementId && !serverReadIds.has(notification.announcementId))
      .map((notification) => notification.announcementId);

    if (announcementIds.length > 0) {
      try {
        await apiMarkRead(selectedRole, announcementIds);
      } catch { /* ignore */ }
    }

    const chatIds = notifications
      .filter((notification) => notification.type === "message" && notification.id.startsWith("chat-") && !notification.read)
      .map((notification) => notification.id.replace("chat-", ""));

    for (const chatId of chatIds) {
      try {
        await markChatRead(selectedRole, chatId);
      } catch { /* ignore */ }
    }

    setServerReadIds((prev) => {
      const next = new Set(prev);
      for (const id of announcementIds) next.add(id);
      return next;
    });

    if (chatIds.length > 0) {
      setNotifications((prev) => prev.map((notification) => (
        notification.type === "message" ? { ...notification, read: true } : notification
      )));
    }
  }, [notifications, serverReadIds, selectedRole]);

  const dismiss = useCallback(async (notificationId) => {
    const notif = notifications.find((notification) => notification.id === notificationId);
    if (!notif) return;

    if (notif.announcementId) {
      setServerReadIds((prev) => new Set([...prev, notif.announcementId]));
      try {
        await apiMarkRead(selectedRole, [notif.announcementId]);
      } catch { /* ignore */ }
    }

    if (notif.type === "message" && notif.id.startsWith("chat-")) {
      const chatId = notif.id.replace("chat-", "");
      try {
        await markChatRead(selectedRole, chatId);
        setNotifications((prev) => prev.map((notification) => (
          notification.id === notificationId ? { ...notification, read: true } : notification
        )));
      } catch { /* ignore */ }
    }
  }, [notifications, selectedRole]);

  const dismissByCourse = useCallback(async (courseId) => {
    try {
      await apiMarkCourseRead(selectedRole, courseId);
    } catch { /* ignore */ }

    setServerReadIds((prev) => {
      const next = new Set(prev);
      for (const notification of notifications) {
        if (notification.courseId === courseId && notification.announcementId) {
          next.add(notification.announcementId);
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
