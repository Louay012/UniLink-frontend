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

export {
  submitFeedbackReport,
  listFeedbackReports
};
