import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";
import { useNavigate } from "react-router-dom";


function formatDate(value) {
  if (!value) {
    return "No activity";
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function GroupsPage() {
  const { selectedRole, setSelectedRole, roleOptions, token } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    const directCount = groups.filter((group) => group.chatType === "DIRECT").length;
    const courseCount = groups.filter((group) => group.chatType === "COURSE").length;
    const classCount = groups.filter((group) => group.chatType === "GENERAL_CLASS").length;

    return [
      { label: "Total Spaces", value: groups.length },
      { label: "Direct", value: directCount },
      { label: "Course", value: courseCount },
      { label: "Class", value: classCount }
    ];
  }, [groups]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [groupsPayload, contactsPayload] = await Promise.all([
          apiRequest("/groups", selectedRole),
          apiRequest("/messaging/contacts", selectedRole)
        ]);

        if (!active) {
          return;
        }

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
        if (active) {
          setError(e.message || "Could not load groups.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [selectedRole.value]);

  return (
    <div className="w-full max-w-[1400px] mx-auto p-5 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8">
      {/* Hero Section */}
      <header className="relative bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:shadow-md">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative z-10 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">UniLink</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Academic Groups</h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed">
            Discover class rooms, course channels, and direct discussion spaces for your academic work.
          </p>
        </div>
      </header>

      {error ? (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      ) : null}

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {groupStats.map((stat, i) => (
          <article 
            key={stat.label} 
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center transition-all hover:-translate-y-1 hover:shadow-md"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-3xl font-extrabold text-slate-800 leading-none">{stat.value}</h3>
          </article>
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Left Column: Groups List */}
        <article className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Group Spaces</h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {loading ? "Loading..." : `${filteredGroups.length} visible`}
            </span>
          </div>

          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-white">
            <input
              type="text"
              placeholder="Search groups by title or class..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow"
            />
            <select
              value={groupTypeFilter}
              onChange={(event) => setGroupTypeFilter(event.target.value)}
              className="w-full sm:w-48 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="ALL">All Types</option>
              <option value="GENERAL_CLASS">Class</option>
              <option value="COURSE">Course</option>
              <option value="DIRECT">Direct</option>
            </select>
          </div>

          <div className="flex flex-col flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[600px] bg-slate-50/30">
            {filteredGroups.map((group) => (
              <article 
                key={group.id} 
                className="group p-4 sm:p-6 hover:bg-white flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors cursor-pointer"
              >
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {group.title || group.name || "Untitled group"}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <span className="text-indigo-500">{group.chatType.replace("_", " ")}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    {group.classGroupCode || "Cross-group"}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {group.members?.length || 0} members
                    </span>
                    <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {group.messageCount || 0} messages
                    </span>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-400 whitespace-nowrap mt-1 sm:mt-0">
                  {formatDate(group.lastMessage?.createdAt)}
                </div>
              </article>
            ))}
            {!filteredGroups.length && !loading ? (
              <div className="p-12 text-center text-slate-500 text-sm font-medium">
                No groups match your filters.
              </div>
            ) : null}
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm font-medium animate-pulse">
                Loading groups...
              </div>
            ) : null}
          </div>
        </article>

        {/* Right Column: Contact Directory */}
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden max-h-[700px] lg:sticky lg:top-6">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-base font-bold text-slate-800">Contact Directory</h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {contacts.length} contacts
            </span>
          </div>

          <div className="flex flex-col flex-1 divide-y divide-slate-100 overflow-y-auto p-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex flex-col">
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{contact.name}</h4>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{contact.role}</p>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 shadow-sm px-2 py-1 rounded-md">
                  {contact.classGroupCode || "General"}
                </span>
              </div>
            ))}
            {!contacts.length && !loading ? (
              <div className="p-8 text-center text-slate-500 text-xs font-medium">
                No contacts available for this role.
              </div>
            ) : null}
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs font-medium animate-pulse">
                Loading contacts...
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
