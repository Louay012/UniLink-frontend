const API_BASE = "http://localhost:4000/api";

function withAuthParams(path, selectedRole) {
  const url = new URL(`${API_BASE}${path}`);
  if (selectedRole?.value) {
    url.searchParams.set("role", selectedRole.value);
  }
  if (selectedRole?.userId) {
    url.searchParams.set("userId", selectedRole.userId);
  }
  return url.toString();
}

async function apiRequest(path, selectedRole, options = {}) {
  const response = await fetch(withAuthParams(path, selectedRole), options);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export { API_BASE, withAuthParams, apiRequest };
