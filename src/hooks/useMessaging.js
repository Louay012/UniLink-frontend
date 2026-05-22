import { useEffect, useMemo, useRef, useState } from "react";
import {
  listChats,
  listContacts,
  listMessages,
  startDirectChat,
  sendMessage,
  sendMessageWithFiles,
  editMessage,
  deleteMessage,
  markChatRead,
  deleteChat
} from "../services/chat.service";
import { connectSocket } from "../services/socket";

const MESSAGE_PAGE_SIZE = 35;

function toMillis(value) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function normalizeChat(chat) {
  return {
    ...chat,
    chatType: String(chat.chat_type || chat.chatType || "").toUpperCase(),
    title: chat.title || chat.name || "",
    messageCount: Number(chat.messageCount ?? chat.message_count ?? 0),
    unreadCount: Number(chat.unreadCount ?? chat.unread_count ?? 0)
  };
}

function sortChatsByNewest(items) {
  return [...(items || [])].sort((a, b) => {
    const aStamp = toMillis(a.lastMessage?.createdAt || a.updatedAt || a.createdAt);
    const bStamp = toMillis(b.lastMessage?.createdAt || b.updatedAt || b.createdAt);
    if (bStamp !== aStamp) {
      return bStamp - aStamp;
    }
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

function normalizeMessage(item) {
  return {
    ...item,
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    replyToMessage: item.replyToMessage || null,
    forwardedFromMessage: item.forwardedFromMessage || null
  };
}

function sortMessagesAsc(items) {
  return [...(items || [])].sort((a, b) => {
    const aStamp = toMillis(a.createdAt);
    const bStamp = toMillis(b.createdAt);
    if (aStamp !== bStamp) {
      return aStamp - bStamp;
    }
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

export default function useMessaging(selectedRole) {
  const socketRef = useRef(null);
  const typingStopTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(selectedRole?.userId || null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagePaging, setMessagePaging] = useState({
    hasOlder: false,
    nextBefore: null,
    hasNewer: false,
    nextAfter: null,
    isLoadingOlder: false
  });
  const [messageDraft, setMessageDraft] = useState("");
  const [messageFiles, setMessageFiles] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingBody, setEditingBody] = useState("");
  const [replyTargetMessage, setReplyTargetMessage] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [directMessageDraft, setDirectMessageDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [debouncedMessageSearch, setDebouncedMessageSearch] = useState("");
  const [messageSearchResults, setMessageSearchResults] = useState([]);
  const [focusedMessageId, setFocusedMessageId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMessageSearch(messageSearchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [messageSearchQuery]);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) || null,
    [chats, selectedChatId]
  );

  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return chats;
    return chats.filter((chat) => {
      const haystack = `${chat.title || ""} ${(chat.members || []).map((member) => member.name || "").join(" ")}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [chats, searchQuery]);

  function getCurrentUserName() {
    const memberName = selectedChat?.members?.find((member) => String(member.id) === String(currentUserId))?.name;
    return memberName || selectedRole?.label || "You";
  }

  function clearTypingStopTimer() {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
  }

  function emitTypingState(nextValue) {
    const socket = socketRef.current;
    if (!socket || !selectedChatId || !currentUserId) {
      return;
    }

    const hasContent = Boolean(String(nextValue || "").trim());

    if (hasContent && !isTypingRef.current) {
      socket.emit("chat.typing.start", {
        chatId: selectedChatId,
        userId: currentUserId,
        userName: getCurrentUserName()
      });
      isTypingRef.current = true;
    }

    clearTypingStopTimer();
    typingStopTimerRef.current = setTimeout(() => {
      if (socketRef.current && isTypingRef.current) {
        socketRef.current.emit("chat.typing.stop", {
          chatId: selectedChatId,
          userId: currentUserId
        });
      }
      isTypingRef.current = false;
      typingStopTimerRef.current = null;
    }, hasContent ? 1200 : 0);

    if (!hasContent && isTypingRef.current && socket) {
      socket.emit("chat.typing.stop", {
        chatId: selectedChatId,
        userId: currentUserId
      });
      isTypingRef.current = false;
    }
  }

  async function refreshChats() {
    const payload = await listChats(selectedRole);
    const items = sortChatsByNewest((payload.items || []).map(normalizeChat));

    if (payload.actorUserId) {
      setCurrentUserId(payload.actorUserId);
    }

    setChats(items);
    setSelectedChatId((previous) => {
      if (previous && items.some((chat) => chat.id === previous)) {
        return previous;
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
    setSelectedContactId((previous) => {
      if (previous && items.some((contact) => contact.id === previous)) {
        return previous;
      }
      return items[0]?.id || "";
    });
  }

  async function refreshMessages(chatId, options = {}) {
    if (!chatId) {
      setMessages([]);
      setMessagePaging({ hasOlder: false, nextBefore: null, hasNewer: false, nextAfter: null, isLoadingOlder: false });
      return;
    }

    const payload = await listMessages(selectedRole, chatId, {
      limit: MESSAGE_PAGE_SIZE,
      ...(options.anchor ? { anchor: options.anchor } : {}),
      ...(options.before ? { before: options.before } : {}),
      ...(options.q ? { q: options.q } : {})
    });
    if (payload.actorUserId) {
      setCurrentUserId(payload.actorUserId);
    }

    setMessages(sortMessagesAsc((payload.items || []).map(normalizeMessage)));
    setMessagePaging({
      hasOlder: Boolean(payload.paging?.hasOlder),
      nextBefore: payload.paging?.nextBefore || null,
      hasNewer: Boolean(payload.paging?.hasNewer),
      nextAfter: payload.paging?.nextAfter || null,
      isLoadingOlder: false
    });
  }

  async function refreshMessageSearch(chatId, query = debouncedMessageSearch) {
    if (!chatId || !query.trim()) {
      setMessageSearchResults([]);
      return;
    }

    const payload = await listMessages(selectedRole, chatId, { limit: 20, q: query });
    setMessageSearchResults(sortMessagesAsc((payload.items || []).map(normalizeMessage)));
  }

  async function jumpToMessage(message) {
    if (!selectedChatId || !message?.id) {
      return;
    }

    setFocusedMessageId(message.id);
    await refreshMessages(selectedChatId, { anchor: message.id });
  }

  async function loadOlderMessages() {
    if (!selectedChatId || !messagePaging.hasOlder || messagePaging.isLoadingOlder) {
      return;
    }

    setMessagePaging((previous) => ({ ...previous, isLoadingOlder: true }));
    try {
      const payload = await listMessages(selectedRole, selectedChatId, {
        limit: MESSAGE_PAGE_SIZE,
        before: messagePaging.nextBefore
      });

      const olderItems = sortMessagesAsc((payload.items || []).map(normalizeMessage));
      setMessages((previous) => {
        const known = new Set(previous.map((item) => item.id));
        const merged = [...olderItems.filter((item) => !known.has(item.id)), ...previous];
        return sortMessagesAsc(merged);
      });

      setMessagePaging((previous) => ({
        ...previous,
        hasOlder: Boolean(payload.paging?.hasOlder),
        nextBefore: payload.paging?.nextBefore || null,
        isLoadingOlder: false
      }));
    } catch (error) {
      setMessagePaging((previous) => ({ ...previous, isLoadingOlder: false }));
      throw error;
    }
  }

  async function sendCurrentMessage() {
    if (!selectedChat) return;

    const body = messageDraft.trim();
    if (!body && !messageFiles.length && !replyTargetMessage) return;

    const payload = {
      body,
      replyToMessageId: replyTargetMessage?.id || null
    };

    setIsSending(true);
    try {
      if (messageFiles.length) {
        await sendMessageWithFiles(selectedRole, selectedChat.id, payload, messageFiles);
      } else {
        await sendMessage(selectedRole, selectedChat.id, payload);
      }

      setMessageDraft("");
      setMessageFiles([]);
      setReplyTargetMessage(null);
      clearTypingStopTimer();
      isTypingRef.current = false;
      await Promise.all([refreshMessages(selectedChat.id), refreshChats()]);
    } finally {
      setIsSending(false);
    }
  }

  async function createDirectChat() {
    if (!selectedContactId) return;

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

  async function saveEditedMessage() {
    if (!selectedChat || !editingMessageId) return;

    const clean = editingBody.trim();
    if (!clean) {
      throw new Error("Message text is required.");
    }

    await editMessage(selectedRole, selectedChat.id, editingMessageId, clean);
    setEditingMessageId(null);
    setEditingBody("");
    await refreshMessages(selectedChat.id);
  }

  async function removeMessage(messageId) {
    if (!selectedChat || !messageId) return;
    await deleteMessage(selectedRole, selectedChat.id, messageId);
    await refreshMessages(selectedChat.id);
  }

  async function removeChat() {
    if (!selectedChatId) return;
    await deleteChat(selectedRole, selectedChatId);
    setSelectedChatId(null);
    await refreshChats();
  }

  function beginEditMessage(message) {
    setEditingMessageId(message.id);
    setEditingBody(message.body || "");
  }

  function beginReplyMessage(message) {
    setReplyTargetMessage(message);
    setFocusedMessageId(message.id);
  }

  function cancelEditMessage() {
    setEditingMessageId(null);
    setEditingBody("");
  }

  function cancelReplyMessage() {
    setReplyTargetMessage(null);
  }

  function addMessageFiles(files) {
    const incoming = Array.from(files || []);
    if (!incoming.length) return;

    setMessageFiles((previous) => {
      const merged = [...previous];
      for (const file of incoming) {
        const signature = `${file.name}:${file.size}:${file.lastModified}`;
        const exists = merged.some((item) => `${item.name}:${item.size}:${item.lastModified}` === signature);
        if (!exists) {
          merged.push(file);
        }
      }
      return merged;
    });
  }

  function removeMessageFile(index) {
    setMessageFiles((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleMessageDraftChange(nextValue) {
    setMessageDraft(nextValue);
    emitTypingState(nextValue);
  }

  useEffect(() => {
    let active = true;

    async function loadBootstrap() {
      try {
        await Promise.all([refreshChats(), refreshContacts()]);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Could not load messaging data.");
        }
      }
    }

    loadBootstrap();

    return () => {
      active = false;
    };
  }, [selectedRole?.value, selectedRole?.userId]);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket || null;
    if (!socket) return undefined;

    if (currentUserId) {
      socket.emit("user:join", { userId: currentUserId });
    }

    const createdHandler = (message) => {
      if (!message || !message.chatId) return;

      setChats((previous) =>
        sortChatsByNewest(previous.map((chat) => {
          if (chat.id !== message.chatId) return chat;
          const isMyMessage = String(message.senderUserId) === String(currentUserId);
          return {
            ...chat,
            messageCount: (chat.messageCount || 0) + 1,
            unreadCount: isMyMessage || message.chatId === selectedChatId ? 0 : (chat.unreadCount || 0) + 1,
            lastMessage: {
              id: message.id,
              senderUserId: message.senderUserId,
              body: message.body,
              createdAt: message.createdAt
            }
          };
        }))
      );

      if (message.chatId === selectedChatId) {
        setMessages((previous) => {
          if (previous.some((item) => item.id === message.id)) {
            return previous;
          }
          return sortMessagesAsc([...previous, normalizeMessage(message)]);
        });
      }
    };

    const updatedHandler = (message) => {
      if (!message || !message.id) return;
      setMessages((previous) =>
        sortMessagesAsc(previous.map((item) => (item.id === message.id ? { ...item, ...normalizeMessage(message) } : item)))
      );

      setChats((previous) =>
        sortChatsByNewest(
          previous.map((chat) => {
            if (chat.id !== message.chatId || chat.lastMessage?.id !== message.id) {
              return chat;
            }
            return {
              ...chat,
              lastMessage: {
                ...chat.lastMessage,
                body: message.body,
                createdAt: message.createdAt || chat.lastMessage?.createdAt
              }
            };
          })
        )
      );
    };

    const deletedHandler = (message) => {
      if (!message || !message.id) return;
      setMessages((previous) =>
        sortMessagesAsc(
          previous.map((item) =>
            item.id === message.id
              ? { ...item, ...normalizeMessage(message), isDeleted: true, body: "", sender: message.sender || item.sender }
              : item
          )
        )
      );

      setChats((previous) =>
        previous.map((chat) => {
          if (chat.id !== message.chatId || chat.lastMessage?.id !== message.id) {
            return chat;
          }
          return {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              body: "",
              createdAt: message.createdAt || chat.lastMessage?.createdAt
            }
          };
        })
      );
    };

    const readHandler = ({ chatId, userId }) => {
      if (!chatId || !userId) return;
      if (String(userId) === String(currentUserId)) {
        setChats((previous) =>
          sortChatsByNewest(previous.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat)))
        );
      }

      if (chatId === selectedChatId && String(userId) !== String(currentUserId)) {
        setMessages((previous) =>
          previous.map((item) =>
            String(item.senderUserId) === String(currentUserId) ? { ...item, isRead: true } : item
          )
        );
      }
    };

    const typingStartHandler = ({ chatId, userId, userName }) => {
      if (!chatId || !userId || String(chatId) !== String(selectedChatId) || String(userId) === String(currentUserId)) {
        return;
      }

      setTypingUsers((previous) => {
        const next = previous.filter((entry) => String(entry.userId) !== String(userId));
        next.push({ userId, userName: userName || "Someone" });
        return next;
      });
    };

    const typingStopHandler = ({ chatId, userId }) => {
      if (!chatId || !userId || String(chatId) !== String(selectedChatId)) {
        return;
      }

      setTypingUsers((previous) => previous.filter((entry) => String(entry.userId) !== String(userId)));
    };

    const presenceHandler = ({ userId, isOnline }) => {
      if (!userId) return;
      setOnlineUserIds((previous) => {
        const next = new Set(previous.map(String));
        if (isOnline) {
          next.add(String(userId));
        } else {
          next.delete(String(userId));
        }
        return [...next];
      });
    };

    socket.on("message.created", createdHandler);
    socket.on("message.updated", updatedHandler);
    socket.on("message.deleted", deletedHandler);
    socket.on("chat.read", readHandler);
    socket.on("chat.typing.start", typingStartHandler);
    socket.on("chat.typing.stop", typingStopHandler);
    socket.on("presence.changed", presenceHandler);

    return () => {
      socket.off("message.created", createdHandler);
      socket.off("message.updated", updatedHandler);
      socket.off("message.deleted", deletedHandler);
      socket.off("chat.read", readHandler);
      socket.off("chat.typing.start", typingStartHandler);
      socket.off("chat.typing.stop", typingStopHandler);
      socket.off("presence.changed", presenceHandler);
    };
  }, [currentUserId, selectedChatId]);

  useEffect(() => {
    if (!currentUserId) {
      return undefined;
    }

    const socket = connectSocket();
    if (!socket) return undefined;

    socket.emit("user:join", { userId: currentUserId });
    socketRef.current = socket;

    return () => {
      socketRef.current = socket;
    };
  }, [currentUserId]);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket || !selectedChatId) return undefined;

    socket.emit("chat:join", { chatId: selectedChatId });
    setTypingUsers([]);
    setFocusedMessageId(null);
    return () => {
      socket.emit("chat:leave", { chatId: selectedChatId });
    };
  }, [selectedChatId]);

  useEffect(() => {
    let active = true;

    async function loadMessagesAndReadState() {
      try {
        await refreshMessages(selectedChatId);
        if (selectedChatId) {
          await markChatRead(selectedRole, selectedChatId);
          await refreshChats();
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Could not load messages.");
        }
      }
    }

    loadMessagesAndReadState();

    return () => {
      active = false;
    };
  }, [selectedChatId, selectedRole?.value, selectedRole?.userId]);

  useEffect(() => {
    let active = true;

    async function loadSearchResults() {
      try {
        await refreshMessageSearch(selectedChatId, debouncedMessageSearch);
      } catch (loadError) {
        if (active) {
          setMessageSearchResults([]);
          setError(loadError.message || "Could not search messages.");
        }
      }
    }

    loadSearchResults();

    return () => {
      active = false;
    };
  }, [selectedChatId, debouncedMessageSearch, selectedRole?.value, selectedRole?.userId]);

  return {
    chats,
    filteredChats,
    contacts,
    currentUserId,
    typingUsers,
    onlineUserIds,
    selectedChat,
    selectedChatId,
    setSelectedChatId,
    messages,
    messageSearchResults,
    focusedMessageId,
    hasOlderMessages: messagePaging.hasOlder,
    isLoadingOlderMessages: messagePaging.isLoadingOlder,
    loadOlderMessages,
    messageDraft,
    setMessageDraft,
    handleMessageDraftChange,
    replyTargetMessage,
    messageFiles,
    addMessageFiles,
    removeMessageFile,
    selectedContactId,
    setSelectedContactId,
    directMessageDraft,
    setDirectMessageDraft,
    editingMessageId,
    editingBody,
    setEditingBody,
    beginEditMessage,
    beginReplyMessage,
    cancelEditMessage,
    cancelReplyMessage,
    saveEditedMessage,
    removeMessage,
    removeChat,
    searchQuery,
    setSearchQuery,
    messageSearchQuery,
    setMessageSearchQuery,
    isSending,
    sendCurrentMessage,
    createDirectChat,
    jumpToMessage,
    error,
    setError
  };
}
