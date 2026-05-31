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
import {
  getReadFeedbackReportIds,
  listFeedbackReports,
  markFeedbackReportsRead
} from "../services/feedback.service";
import { connectSocket } from "../services/socket";

const NOTIFICATION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export default function useNotifications(selectedRole) {
  const [notifications, setNotifications] = useState([]);
  const [serverReadIds, setServerReadIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const isAdmin = String(selectedRole?.value || "").toUpperCase() === "ADMIN";

  function markNotificationsReadLocally({ ids = [], chatIds = [] } = {}) {
    const idSet = new Set(ids.map(String));
    const chatIdSet = new Set(chatIds.map(String));
    if (!idSet.size && !chatIdSet.size) return;

    setNotifications((prev) => prev.map((notification) => (
      idSet.has(notification.announcementId || notification.reportId || notification.id)
      || chatIdSet.has(notification.chatId || notification.id.replace(/^chat-/, ""))
        ? { ...notification, read: true }
        : notification
    )));
  }

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;

    function handleNotification(notif) {
      if (!notif?.id) return;
      if (isAdmin && notif.type !== "bug-report") return;
      if (!isAdmin && notif.type === "bug-report") return;
      setNotifications((prev) => {
        if (prev.some((item) => item.id === notif.id)) return prev;
        return [{ ...notif, read: false }, ...prev];
      });
    }

    function handleNotificationRead(payload) {
      if (!payload) return;
      const readIds = [
        ...(payload.announcementIds || []),
        ...(payload.reportIds || [])
      ].map(String);
      if (!readIds.length) return;

      setServerReadIds((prev) => {
        const next = new Set(prev);
        for (const id of readIds) next.add(id);
        return next;
      });
      markNotificationsReadLocally({ ids: readIds });
    }

    function handleChatRead(payload) {
      if (!payload?.chatId) return;
      const chatId = String(payload.chatId);
      setNotifications((prev) => prev.map((notification) => (
        notification.id === `chat-${chatId}` || String(notification.chatId || "") === chatId
          ? { ...notification, read: true }
          : notification
      )));
    }

    socket.on("notification", handleNotification);
    socket.on("notification.read", handleNotificationRead);
    socket.on("chat.read", handleChatRead);
    if (selectedRole?.userId) socket.emit("user:join", { userId: selectedRole.userId });

    return () => {
      socket.off("notification", handleNotification);
      socket.off("notification.read", handleNotificationRead);
      socket.off("chat.read", handleChatRead);
    };
  }, [isAdmin, selectedRole?.userId]);

  useEffect(() => {
    let active = true;
    async function loadReadState() {
      try {
        const result = isAdmin
          ? await getReadFeedbackReportIds(selectedRole)
          : await getReadAnnouncementIds(selectedRole);
        if (active && result?.ids) setServerReadIds(new Set(result.ids));
      } catch { /* ignore */ }
    }
    if (selectedRole?.userId) loadReadState();
    return () => { active = false; };
  }, [isAdmin, selectedRole?.value, selectedRole?.userId]);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      setLoading(true);
      try {
        const items = [];
        const cutoff = Date.now() - NOTIFICATION_WINDOW_MS;

        if (isAdmin) {
          const reportsPayload = await listFeedbackReports(selectedRole);
          const reports = (reportsPayload.items || []).filter((report) => String(report.category || "").toUpperCase() === "BUG");
          for (const report of reports) {
            items.push({
              id: `bug-${report.id}`,
              reportId: report.id,
              type: "bug-report",
              title: report.subject,
              subtitle: `${report.reporter?.name || "Unknown reporter"} · Bug report`,
              timestamp: report.createdAt,
              link: "/feedback",
              read: Boolean(report.read)
            });
          }

          if (active) setNotifications(items);
          return;
        }

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
                chatId: chat.id,
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
      read: notification.announcementId
        ? serverReadIds.has(notification.announcementId) || notification.read
        : notification.reportId
          ? serverReadIds.has(notification.reportId) || notification.read
          : notification.read
    }))
  ), [notifications, serverReadIds]);

  const unreadCount = useMemo(() => enriched.filter((notification) => !notification.read).length, [enriched]);

  const markAllRead = useCallback(async () => {
    const announcementIds = notifications
      .filter((notification) => notification.announcementId && !serverReadIds.has(notification.announcementId))
      .map((notification) => notification.announcementId);

    const reportIds = notifications
      .filter((notification) => notification.reportId && !serverReadIds.has(notification.reportId))
      .map((notification) => notification.reportId);

    const chatIds = notifications
      .filter((notification) => notification.type === "message" && !notification.read)
      .map((notification) => String(notification.chatId || notification.id.replace(/^chat-/, "")));

    setServerReadIds((prev) => {
      const next = new Set(prev);
      for (const id of announcementIds) next.add(id);
      for (const id of reportIds) next.add(id);
      return next;
    });

    markNotificationsReadLocally({ ids: [...announcementIds, ...reportIds], chatIds });

    if (announcementIds.length > 0) {
      try {
        await apiMarkRead(selectedRole, announcementIds);
      } catch { /* ignore */ }
    }

    if (reportIds.length > 0) {
      try {
        await markFeedbackReportsRead(selectedRole, reportIds);
      } catch { /* ignore */ }
    }

    for (const chatId of chatIds) {
      try {
        await markChatRead(selectedRole, chatId);
      } catch { /* ignore */ }
    }
  }, [notifications, serverReadIds, selectedRole]);

  const dismiss = useCallback(async (notificationId) => {
    const notif = notifications.find((notification) => notification.id === notificationId);
    if (!notif) return;

    if (notif.announcementId) {
      setServerReadIds((prev) => new Set([...prev, notif.announcementId]));
      markNotificationsReadLocally({ ids: [notif.announcementId] });
      try {
        await apiMarkRead(selectedRole, [notif.announcementId]);
      } catch { /* ignore */ }
    }

    if (notif.reportId) {
      setServerReadIds((prev) => new Set([...prev, notif.reportId]));
      markNotificationsReadLocally({ ids: [notif.reportId] });
      try {
        await markFeedbackReportsRead(selectedRole, [notif.reportId]);
      } catch { /* ignore */ }
    }

    if (notif.type === "message" && notif.id.startsWith("chat-")) {
      const chatId = notif.id.replace("chat-", "");
      markNotificationsReadLocally({ chatIds: [chatId] });
      try {
        await markChatRead(selectedRole, chatId);
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

    markNotificationsReadLocally({
      ids: notifications
        .filter((notification) => notification.courseId === courseId && notification.announcementId)
        .map((notification) => notification.announcementId)
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
