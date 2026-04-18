import { useEffect, useMemo, useState } from "react";
import {
  listChats,
  listContacts,
  listMessages,
  startDirectChat,
  sendMessage
} from "../services/chat.service";
import { connectSocket } from "../services/socket";

export default function useMessaging(selectedRole) {
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(selectedRole.userId || null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [directMessageDraft, setDirectMessageDraft] = useState("");
  const [error, setError] = useState("");

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) || null,
    [chats, selectedChatId]
  );

  async function refreshChats() {
    const payload = await listChats(selectedRole);
    const raw = payload.items || [];

    // Normalize server fields to frontend-friendly shape
    const items = raw.map((c) => ({
      ...c,
      // backend uses `chat_type`; frontend expects `chatType`
      chatType: String(c.chat_type || c.chatType || "").toUpperCase(),
      // prefer computed `title` or fallback to name
      title: c.title || c.name || "",
      // normalized counts
      messageCount: Number(c.messageCount ?? c.message_count ?? 0),
    }));

    if (payload.actorUserId) {
      setCurrentUserId(payload.actorUserId);
    }
    setChats(items);
    setSelectedChatId((prev) => {
      if (prev && items.some((chat) => chat.id === prev)) {
        return prev;
      }
      return items[0]?.id || null;
    });
  }

  async function refreshContacts() {
    const payload = await listContacts(selectedRole);
    const items = payload.items || [];
    if (payload.actorUserId) {
      setCurrentUserId(payload.actorUserId);
    }
    setContacts(items);
    setSelectedContactId((prev) => {
      if (prev && items.some((contact) => contact.id === prev)) {
        return prev;
      }
      return items[0]?.id || "";
    });
  }

  async function refreshMessages(chatId) {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const payload = await listMessages(selectedRole, chatId);
    if (payload.actorUserId) {
      setCurrentUserId(payload.actorUserId);
    }
    setMessages(payload.items || []);
  }

  async function sendCurrentMessage() {
    if (!selectedChat || !messageDraft.trim()) {
      return;
    }

    await sendMessage(selectedRole, selectedChat.id, messageDraft.trim());
    setMessageDraft("");
    await Promise.all([refreshMessages(selectedChat.id), refreshChats()]);
  }

  async function createDirectChat() {
    if (!selectedContactId) {
      return;
    }

    const payload = await startDirectChat(selectedRole, {
      targetUserId: selectedContactId,
      initialMessage: directMessageDraft.trim()
    });

    setDirectMessageDraft("");
    await refreshChats();
    if (payload.chat?.id) {
      setSelectedChatId(payload.chat.id);
    }
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await Promise.all([refreshChats(), refreshContacts()]);
      } catch (e) {
        if (active) setError(e.message || "Could not load messaging data.");
      }
    }

    load();

    const socket = connectSocket();
    if (socket) {
      const handler = (message) => {
        if (!message || !message.chatId) return;

        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== message.chatId) return chat;
            return {
              ...chat,
              messageCount: (chat.messageCount || 0) + 1,
              lastMessage: { id: message.id, senderUserId: message.senderUserId, body: message.body, createdAt: message.createdAt }
            };
          })
        );

        if (message.chatId === selectedChatId) {
          setMessages((prev) => [...prev, message]);
        }
      };

      socket.on("message.created", handler);

      // cleanup socket on unmount or role change
      return () => {
        active = false;
        socket.off("message.created", handler);
      };
    }

    return () => {
      active = false;
    };
  }, [selectedRole.value]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await refreshMessages(selectedChatId);
      } catch (e) {
        if (active) {
          setError(e.message || "Could not load messages.");
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [selectedChatId, selectedRole.value]);

  return {
    chats,
    contacts,
    currentUserId,
    selectedChat,
    selectedChatId,
    setSelectedChatId,
    messages,
    messageDraft,
    setMessageDraft,
    selectedContactId,
    setSelectedContactId,
    directMessageDraft,
    setDirectMessageDraft,
    sendCurrentMessage,
    createDirectChat,
    error,
    setError
  };
}
