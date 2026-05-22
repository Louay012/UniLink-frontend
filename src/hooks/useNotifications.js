import { useEffect, useMemo, useState } from "react";
import { listCourses, listCourseAnnouncements, listCourseAttachments } from "../services/course.service";
import { listChats } from "../services/chat.service";
import { connectSocket } from "../services/socket";

const STORAGE_KEY = "unilink-notif-seen";

function loadSeen() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSeen(seen) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch { /* ignore */ }
}

export default function useNotifications(selectedRole) {
  const [notifications, setNotifications] = useState([]);
  const [seen, setSeen] = useState(loadSeen);
  const [loading, setLoading] = useState(false);

  // Real-time notifications via Socket.IO
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    function handleNotification(notif) {
      if (!notif || !notif.id) return;
      setNotifications((prev) => {
        // Avoid duplicates
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [{ ...notif, read: false }, ...prev];
      });
    }

    socket.on("notification", handleNotification);

    // Join user's personal room for notifications
    if (selectedRole?.userId) {
      socket.emit("user:join", { userId: selectedRole.userId });
    }

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [selectedRole?.userId]);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      setLoading(true);
      try {
        const items = [];

        // 1. Fetch courses + their announcements + attachments
        const coursesPayload = await listCourses(selectedRole);
        const courses = coursesPayload.items || [];

        const bundles = await Promise.all(
          courses.map(async (course) => {
            const [annPayload, attPayload] = await Promise.all([
              listCourseAnnouncements(selectedRole, course.id).catch(() => ({ items: [] })),
              listCourseAttachments(selectedRole, course.id).catch(() => ({ items: [] }))
            ]);
            return { course, announcements: annPayload.items || [], attachments: attPayload.items || [] };
          })
        );

        for (const bundle of bundles) {
          // Announcement notifications
          for (const ann of bundle.announcements) {
            items.push({
              id: `ann-${ann.id}`,
              type: "announcement",
              title: ann.title,
              subtitle: `${bundle.course.title} · ${ann.priority === "URGENT" ? "🔴 Urgent" : "Announcement"}`,
              timestamp: ann.createdAt,
              link: `/courses/${bundle.course.id}`,
              read: false
            });
          }

          // Recent file notifications (last 7 days only)
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          for (const att of bundle.attachments) {
            const uploadTime = new Date(att.uploadedAt || att.createdAt || 0).getTime();
            if (uploadTime > weekAgo) {
              items.push({
                id: `file-${att.id}`,
                type: "file",
                title: att.title || att.fileName || "New file",
                subtitle: `${bundle.course.title} · File uploaded`,
                timestamp: att.uploadedAt || att.createdAt,
                link: `/courses/${bundle.course.id}`,
                read: false
              });
            }
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
        // If full load fails, just leave empty
        if (active) setNotifications([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNotifications();
    return () => { active = false; };
  }, [selectedRole?.value, selectedRole?.userId]);

  // Apply seen state
  const enriched = useMemo(() => {
    return notifications.map((n) => ({
      ...n,
      read: seen.has(n.id)
    }));
  }, [notifications, seen]);

  const unreadCount = useMemo(() => enriched.filter((n) => !n.read).length, [enriched]);

  function markAllRead() {
    const next = new Set(seen);
    for (const n of notifications) {
      next.add(n.id);
    }
    setSeen(next);
    saveSeen(next);
  }

  function dismiss(id) {
    const next = new Set(seen);
    next.add(id);
    setSeen(next);
    saveSeen(next);
  }

  return {
    notifications: enriched,
    unreadCount,
    loading,
    markAllRead,
    dismiss
  };
}
