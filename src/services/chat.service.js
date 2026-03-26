import { apiRequest } from "./api";

async function listChats(selectedRole, courseId) {
  const suffix = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return apiRequest(`/chats${suffix}`, selectedRole);
}

async function listContacts(selectedRole) {
  return apiRequest("/messaging/contacts", selectedRole);
}

async function listMessages(selectedRole, chatId) {
  return apiRequest(`/chats/${chatId}/messages`, selectedRole);
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

export { listChats, listContacts, listMessages, startDirectChat, sendMessage };
