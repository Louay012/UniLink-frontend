function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function getPriorityRank(priority) {
  return String(priority || "NORMAL").toUpperCase() === "URGENT" ? 0 : 1;
}

function getBadgeTone(priority) {
  return String(priority || "NORMAL").toUpperCase() === "URGENT" ? "urgent" : "normal";
}

export { formatDateTime, getPriorityRank, getBadgeTone };
