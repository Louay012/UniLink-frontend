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

function createCourseAnnouncementWithFiles(selectedRole, courseId, payload, files) {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('body', payload.body);
  formData.append('priority', payload.priority || 'NORMAL');
  for (const file of files) {
    formData.append('files', file);
  }
  return apiRequest(`/courses/${courseId}/announcements/upload`, selectedRole, {
    method: 'POST',
    body: formData
    // Note: do NOT set Content-Type — browser sets multipart/form-data with boundary automatically
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

// ─── Announcement Read Tracking ────────────────────────────

function markCourseAnnouncementsRead(selectedRole, courseId) {
  return apiRequest(`/courses/${courseId}/announcements/read`, selectedRole, {
    method: 'POST'
  });
}

function markAnnouncementsRead(selectedRole, announcementIds) {
  return apiRequest('/announcements/mark-read', selectedRole, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ announcementIds })
  });
}

function getReadAnnouncementIds(selectedRole) {
  return apiRequest('/announcements/read-ids', selectedRole);
}

function getUnreadCounts(selectedRole) {
  return apiRequest('/announcements/unread-counts', selectedRole);
}

export {
  listCourses,
  getCourse,
  listCourseAnnouncements,
  createCourseAnnouncement,
  createCourseAnnouncementWithFiles,
  listCourseAttachments,
  listCourseChats,
  listChatMessages,
  sendChatMessage,
  markCourseAnnouncementsRead,
  markAnnouncementsRead,
  getReadAnnouncementIds,
  getUnreadCounts
};

