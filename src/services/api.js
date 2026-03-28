const API_BASE = "http://localhost:4000/api";

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("unilink_token");

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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