import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { startDirectChat } from "../../services/chat.service";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function UserViewPage() {
  const { id } = useParams();
  const toast = useToast();
  const { selectedRole } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const data = await apiRequest(`/users/${encodeURIComponent(id)}`);
        if (active) setUser(data);
      } catch (err) {
        if (active) toast.error(err.message || "Failed to load user", "User");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="page-shell">Loading…</div>;
  if (!user) return <div className="page-shell">User not found.</div>;

  return (
    <div className="page-shell" style={{ maxWidth: 960, margin: "0 auto" }}>
      <h2 className="text-xl font-extrabold mb-4">{user.name || `${user.firstName} ${user.lastName}`}</h2>
      <div className="bg-white border rounded-2xl p-4">
        <div className="text-sm text-slate-700">Email: {user.email}</div>
        {user.role && <div className="text-sm text-slate-700">Role: {user.role}</div>}
        <div className="mt-4">
          <button
            className="px-3 py-1 rounded-lg bg-indigo-600 text-white"
            onClick={async () => {
              try {
                const payload = await startDirectChat(selectedRole, { userId: id });
                if (payload && payload.chat && payload.chat.id) {
                  toast.success('Chat started', 'Chat');
                  navigate(`/chat?chatId=${encodeURIComponent(payload.chat.id)}`);
                } else {
                  toast.error('Could not start chat', 'Chat');
                }
              } catch (err) {
                toast.error(err.message || 'Could not start chat', 'Chat');
              }
            }}
          >
            Message
          </button>
        </div>
      </div>
    </div>
  );
}
