import { apiRequest } from './api';

function listCourses(selectedRole) {
  return apiRequest('/courses', selectedRole);
}

function getCourse(selectedRole, courseId) {
  return apiRequest(`/courses/${courseId}`, selectedRole);
}

function listCourseAnnouncements(selectedRole, courseId) {
  return apiRequest(`/courses/${courseId}/announcements`, selectedRole);
}

function createCourseAnnouncement(selectedRole, courseId, payload) {
  return apiRequest(`/courses/${courseId}/announcements`, selectedRole, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

function listCourseAttachments(selectedRole, courseId) {
  return apiRequest(`/courses/${courseId}/attachments`, selectedRole);
}

function listCourseChats(selectedRole, courseId) {
  return apiRequest(`/chats?courseId=${encodeURIComponent(courseId)}`, selectedRole);
}

function listChatMessages(selectedRole, chatId) {
  return apiRequest(`/chats/${chatId}/messages`, selectedRole);
}

function sendChatMessage(selectedRole, chatId, body) {
  return apiRequest(`/chats/${chatId}/messages`, selectedRole, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ body })
  });
}

export {
  listCourses,
  getCourse,
  listCourseAnnouncements,
  createCourseAnnouncement,
  listCourseAttachments,
  listCourseChats,
  listChatMessages,
  sendChatMessage
};
