import { useEffect, useMemo, useState } from "react";
import {
  listChats,
  listContacts,
  listMessages,
  startDirectChat,
  sendMessage
} from "../services/chat.service";

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
    const items = payload.items || [];
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
        if (active) {
          setError(e.message || "Could not load messaging data.");
        }
      }
    }

    load();

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
