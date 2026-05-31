import { apiRequest } from './api';

function listGlobalAnnouncements(selectedRole) {
  return apiRequest('/announcements', selectedRole);
}

function getAnnouncementAudienceOptions(selectedRole) {
  return apiRequest('/announcements/audience-options', selectedRole);
}

function buildAnnouncementFormData(payload, files = []) {
  const formData = new FormData();
  formData.append('title', payload.title || '');
  formData.append('body', payload.body || '');
  for (const departmentId of payload.departmentIds || []) {
    formData.append('departmentIds[]', departmentId);
  }
  for (const classGroupId of payload.classGroupIds || []) {
    formData.append('classGroupIds[]', classGroupId);
  }
  for (const item of files || []) {
    formData.append('files', item.file || item);
  }
  return formData;
}

function createGlobalAnnouncement(selectedRole, payload, files = []) {
  return apiRequest('/announcements', selectedRole, {
    method: 'POST',
    body: buildAnnouncementFormData(payload, files)
  });
}

function updateGlobalAnnouncement(selectedRole, announcementId, payload, files = []) {
  return apiRequest(`/announcements/${announcementId}`, selectedRole, {
    method: 'PUT',
    body: buildAnnouncementFormData(payload, files)
  });
}

function deleteGlobalAnnouncement(selectedRole, announcementId) {
  return apiRequest(`/announcements/${announcementId}`, selectedRole, {
    method: 'DELETE'
  });
}

function markGlobalAnnouncementRead(selectedRole, announcementId) {
  return apiRequest(`/announcements/${announcementId}/read`, selectedRole, {
    method: 'POST'
  });
}

export {
  listGlobalAnnouncements,
  getAnnouncementAudienceOptions,
  createGlobalAnnouncement,
  updateGlobalAnnouncement,
  deleteGlobalAnnouncement,
  markGlobalAnnouncementRead
};
