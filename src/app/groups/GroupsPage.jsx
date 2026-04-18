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
    <div className="page-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Academic Groups</h1>
          <p className="subtitle">
            Discover class rooms, course channels, and direct discussion spaces for your academic work.
          </p>
        </div>
        {/* role-switch removed: use sidebar to change role */}
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="stats-grid">
        {groupStats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <p>{stat.label}</p>
            <h3>{stat.value}</h3>
          </article>
        ))}
      </section>

      <section className="grid groups-grid">
        <article className="card groups-main-card">
          <div className="card-header">
            <h3>Group Spaces</h3>
            {loading ? <span>Loading...</span> : <span>{filteredGroups.length} visible</span>}
          </div>

          <div className="groups-toolbar">
            <input
              type="text"
              placeholder="Search groups by title or class"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              value={groupTypeFilter}
              onChange={(event) => setGroupTypeFilter(event.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="GENERAL_CLASS">Class</option>
              <option value="COURSE">Course</option>
              <option value="DIRECT">Direct</option>
            </select>
          </div>

          <div className="groups-list">
            {filteredGroups.map((group) => (
              <article className="group-item" key={group.id}>
                <div>
                  <h4>{group.title || group.name || "Untitled group"}</h4>
                  <p>
                    {group.chatType.replace("_", " ")} . {group.classGroupCode || "Cross-group"}
                  </p>
                  <small>
                    {group.members?.length || 0} members . {group.messageCount || 0} messages
                  </small>
                </div>
                <small>{formatDate(group.lastMessage?.createdAt)}</small>
              </article>
            ))}
            {!filteredGroups.length ? <p className="subtitle">No groups match your filters.</p> : null}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Contact Directory</h3>
            <span>{contacts.length} contacts</span>
          </div>

          <div className="contact-list">
            {contacts.map((contact) => (
              <div key={contact.id} className="contact-item">
                <div>
                  <h4>{contact.name}</h4>
                  <p>{contact.role}</p>
                </div>
                <small>{contact.classGroupCode || "General"}</small>
              </div>
            ))}
            {!contacts.length ? <p className="subtitle">No contacts available for this role.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
