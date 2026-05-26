import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { searchUsers, startDirectChat } from "../../services/chat.service";

export default function DirectoryPage() {
  const { selectedRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  async function handleSearch(e) {
    e && e.preventDefault();
    if (!q) return setResults([]);
    setLoading(true);
    try {
      const res = await searchUsers(selectedRole, q);
      setResults(Array.isArray(res) ? res : []);
    } catch (err) {
      toast.error(err.message || "Search failed", "Directory");
    } finally {
      setLoading(false);
    }
  }

  function openProfile(userId) {
    navigate(`/users/${userId}`);
  }

  return (
    <div className="page-shell" style={{ maxWidth: 960, margin: "0 auto" }}>
      <h2 className="text-xl font-extrabold mb-4">Directory</h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email"
          className="flex-1 border rounded-xl px-3 py-2"
        />
        <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white">{loading ? 'Searching…' : 'Search'}</button>
      </form>

      <div className="bg-white border rounded-2xl p-4">
        {results.length === 0 && <div className="text-sm text-slate-500">No results</div>}
        {results.map((u) => (
          <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
            <div>
              <div className="font-semibold">{u.name}</div>
              <div className="text-xs text-slate-500">{u.email}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openProfile(u.id)} className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
