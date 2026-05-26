import { apiRequest } from "./api";
import { API_BASE } from "./api";

function buildAuthHeaders(selectedRole) {
  const token = localStorage.getItem("unilink_token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(selectedRole?.value ? { "x-unilink-role": selectedRole.value } : {}),
    ...(selectedRole?.userId ? { "x-unilink-user-id": selectedRole.userId } : {})
  };
}

async function listChats(selectedRole, courseId) {
  const suffix = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return apiRequest(`/chats${suffix}`, selectedRole);
}

async function listContacts(selectedRole) {
  return apiRequest("/messaging/contacts", selectedRole);
}

async function searchUsers(selectedRole, query) {
  const q = encodeURIComponent(query || "");
  return apiRequest(`/users/search?q=${q}`, selectedRole);
}

async function listMessages(selectedRole, chatId, options = {}) {
  const params = new URLSearchParams();
  if (options.before) {
    params.set("before", options.before);
  }
  if (options.anchor) {
    params.set("anchor", options.anchor);
  }
  if (options.q) {
    params.set("q", options.q);
  }
  if (Number.isFinite(Number(options.limit))) {
    params.set("limit", String(Math.trunc(Number(options.limit))));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/chats/${chatId}/messages${suffix}`, selectedRole);
}

async function startDirectChat(selectedRole, payload) {
  return apiRequest("/chats/direct", selectedRole, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

async function sendMessage(selectedRole, chatId, payload) {
  return apiRequest(`/chats/${chatId}/messages`, selectedRole, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(
      typeof payload === "string"
        ? { body: payload }
        : payload || {}
    )
  });
}

async function sendMessageWithFiles(selectedRole, chatId, payload, files = []) {
  const formData = new FormData();
  const normalized = typeof payload === "string" ? { body: payload } : (payload || {});

  if (normalized.body) {
    formData.append("body", normalized.body);
  }
  if (normalized.replyToMessageId) {
    formData.append("replyToMessageId", normalized.replyToMessageId);
  }
  if (normalized.forwardedFromMessageId) {
    formData.append("forwardedFromMessageId", normalized.forwardedFromMessageId);
  }
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch(`${API_BASE}/chats/${chatId}/messages/upload`, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(selectedRole)
    },
    body: formData
  });

  const responsePayload = await response.json();
  if (!response.ok) {
    throw new Error(responsePayload.error || responsePayload.message || "Request failed");
  }
  return responsePayload;
}

async function editMessage(selectedRole, chatId, messageId, body) {
  return apiRequest(`/chats/${chatId}/messages/${messageId}`, selectedRole, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body })
  });
}

async function deleteMessage(selectedRole, chatId, messageId) {
  return apiRequest(`/chats/${chatId}/messages/${messageId}`, selectedRole, {
    method: "DELETE"
  });
}

async function toggleMessageReaction(selectedRole, chatId, messageId, emoji) {
  return apiRequest(`/chats/${chatId}/messages/${messageId}/reactions`, selectedRole, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emoji })
  });
}

async function markChatRead(selectedRole, chatId) {
  return apiRequest(`/chats/${chatId}/read`, selectedRole, {
    method: "POST"
  });
}

async function deleteChat(selectedRole, chatId) {
  return apiRequest(`/chats/${chatId}`, selectedRole, {
    method: "DELETE"
  });
}

async function submitFeedback(selectedRole, payload) {
  return apiRequest("/feedback", selectedRole, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export {
  listChats,
  listContacts,
  searchUsers,
  listMessages,
  startDirectChat,
  sendMessage,
  sendMessageWithFiles,
  editMessage,
  deleteMessage,
  toggleMessageReaction,
  markChatRead,
  deleteChat,
  submitFeedback
};
