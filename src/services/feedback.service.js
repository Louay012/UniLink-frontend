import { apiRequest } from "./api";

async function submitFeedbackReport(selectedRole, payload) {
  return apiRequest("/feedback", selectedRole, {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}

async function listFeedbackReports(selectedRole) {
  return apiRequest("/feedback/reports", selectedRole);
}

async function getReadFeedbackReportIds(selectedRole) {
  return apiRequest("/feedback/read-ids", selectedRole);
}

async function markFeedbackReportsRead(selectedRole, reportIds) {
  return apiRequest("/feedback/mark-read", selectedRole, {
    method: "POST",
    body: JSON.stringify({ reportIds: Array.isArray(reportIds) ? reportIds : [] })
  });
}

export {
  submitFeedbackReport,
  listFeedbackReports,
  getReadFeedbackReportIds,
  markFeedbackReportsRead
};
