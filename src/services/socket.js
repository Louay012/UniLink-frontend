import { API_BASE } from "./api";
import { io } from "socket.io-client";

let socket = null;

function connectSocket() {
  if (socket) return socket;
  const base = API_BASE.replace(/\/api$/, "");
  try {
    socket = io(base, { path: "/socket.io", transports: ["websocket"] });
  } catch (e) {
    console.warn("[socket] connect failed", e.message);
    socket = null;
  }
  return socket;
}

export { connectSocket };
