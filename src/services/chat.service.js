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

async function sendMessage(selectedRole, chatId, body) {
  return apiRequest(`/chats/${chatId}/messages`, selectedRole, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body })
  });
}

async function sendMessageWithFiles(selectedRole, chatId, body, files = []) {
  const formData = new FormData();
  if (body) {
    formData.append("body", body);
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

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Request failed");
  }
  return payload;
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
  markChatRead,
  deleteChat
};
