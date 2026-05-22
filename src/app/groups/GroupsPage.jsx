import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiRequest } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, BookOpen, Search, ArrowRight } from "lucide-react";

function formatDate(value) {
  if (!value) return "No activity";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return "No activity";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const TYPE_CONFIG = {
  DIRECT: {
    label: "Direct",
    icon: MessageCircle,
    color: "#6366f1",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  COURSE: {
    label: "Course",
    icon: BookOpen,
    color: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  GENERAL_CLASS: {
    label: "Class",
    icon: Users,
    color: "#f59e0b",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  STAFF: {
    label: "Staff",
    icon: Users,
    color: "#8b5cf6",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.DIRECT;
}

export default function GroupsPage() {
  const { selectedRole, token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupTypeFilter, setGroupTypeFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return groups.filter((group) => {
      const matchesType = groupTypeFilter === "ALL" || group.chatType === groupTypeFilter;
      const haystack = `${group.title || ""} ${group.name || ""} ${group.classGroupCode || ""}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesType && matchesSearch;
    });
  }, [groups, groupTypeFilter, searchTerm]);

  const groupStats = useMemo(() => {
    const directCount = groups.filter((g) => g.chatType === "DIRECT").length;
    const courseCount = groups.filter((g) => g.chatType === "COURSE").length;
    const classCount = groups.filter((g) => g.chatType === "GENERAL_CLASS").length;
    return [
      { label: "Total Spaces", value: groups.length, color: "#6366f1" },
      { label: "Direct", value: directCount, color: "#0ea5e9" },
      { label: "Course", value: courseCount, color: "#10b981" },
      { label: "Class", value: classCount, color: "#f59e0b" },
    ];
  }, [groups]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const [groupsPayload, contactsPayload] = await Promise.all([
          apiRequest("/groups", selectedRole),
          apiRequest("/messaging/contacts", selectedRole),
        ]);
        if (!active) return;
        const rawGroups = groupsPayload.items || [];
        const normalized = rawGroups.map((g) => ({
          ...g,
          chatType: String(g.chat_type || g.chatType || "").toUpperCase(),
          title: g.title || g.name || "",
          messageCount: Number(g.messageCount ?? g.message_count ?? 0),
        }));
        setGroups(normalized);
        setContacts(contactsPayload.items || []);
      } catch (e) {
        if (active) toast.error(e.message || "Could not load groups.", "Groups");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [selectedRole.value]);

  const filterButtons = [
    { key: "ALL", label: "All" },
    { key: "GENERAL_CLASS", label: "Class" },
    { key: "COURSE", label: "Course" },
    { key: "DIRECT", label: "Direct" },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto p-5 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8">
      {/* ── Hero Section ── */}
      <header className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{
            background: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.5), transparent 60%), radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.3), transparent 50%)',
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">UniLink</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              Academic Groups
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              Class rooms, course channels, and direct discussions for your academic work.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white/70 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
            <Users size={16} />
            {groups.length} spaces
          </div>
        </div>
      </header>

      {/* ── Stats Grid ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {groupStats.map((stat) => (
          <article
            key={stat.label}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-3xl font-extrabold leading-none" style={{ color: stat.color }}>{stat.value}</h3>
          </article>
        ))}
      </section>

      {/* ── Main Content Grid ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Left Column: Groups List */}
        <article className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Header with search and filters */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Group Spaces</h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {loading ? "Loading..." : `${filteredGroups.length} visible`}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {filterButtons.map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => setGroupTypeFilter(btn.key)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      groupTypeFilter === btn.key
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Groups list */}
          <div className="flex flex-col flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
            {filteredGroups.map((group) => {
              const cfg = getTypeConfig(group.chatType);
              const Icon = cfg.icon;
              return (
                <div
                  key={group.id}
                  onClick={() => navigate(`/chat`)}
                  className="group p-4 sm:p-5 hover:bg-slate-50 flex items-center gap-4 transition-colors cursor-pointer"
                >
                  {/* Type icon */}
                  <div
                    className="w-11 h-11 rounded-xl grid place-items-center shrink-0 shadow-sm"
                    style={{ background: cfg.color + '15', border: `1px solid ${cfg.color}30` }}
                  >
                    <Icon size={20} style={{ color: cfg.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {group.title || group.name || "Untitled group"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {group.classGroupCode || "Cross-group"}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">
                        {group.members?.length || 0} members
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">
                        {group.messageCount} msgs
                      </span>
                    </div>
                  </div>

                  {/* Timestamp + arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400 hidden sm:block">
                      {timeAgo(group.lastMessage?.createdAt)}
                    </span>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              );
            })}
            {!filteredGroups.length && !loading ? (
              <div className="p-12 text-center text-slate-400 text-sm font-medium">
                <Users size={40} className="mx-auto mb-3 text-slate-300" />
                No groups match your filters.
              </div>
            ) : null}
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">
                Loading groups...
              </div>
            ) : null}
          </div>
        </article>

        {/* Right Column: Contact Directory */}
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden max-h-[700px] lg:sticky lg:top-6">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Contacts</h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {contacts.length}
            </span>
          </div>

          <div className="flex flex-col flex-1 divide-y divide-slate-50 overflow-y-auto p-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white text-xs font-bold">
                    {(contact.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {contact.name}
                    </h4>
                    <p className="text-xs text-slate-400">{contact.role}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {contact.classGroupCode || "General"}
                </span>
              </div>
            ))}
            {!contacts.length && !loading ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No contacts available.
              </div>
            ) : null}
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium animate-pulse">
                Loading contacts...
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
