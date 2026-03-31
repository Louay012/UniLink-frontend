const API_BASE = "http://localhost:4000/api";

function isRoleContext(value) {
  return Boolean(value && typeof value === "object" && typeof value.value === "string");
}

async function apiRequest(path, roleOrOptions = {}, maybeOptions = null) {
  const roleContext = isRoleContext(roleOrOptions) ? roleOrOptions : null;
  const options = maybeOptions || (roleContext ? {} : roleOrOptions) || {};
  const token = localStorage.getItem("unilink_token");

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(roleContext?.value ? { "x-unilink-role": roleContext.value } : {}),
      ...(roleContext?.userId ? { "x-unilink-user-id": roleContext.userId } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Request failed");
  }
  return payload;
}

export { API_BASE, apiRequest };