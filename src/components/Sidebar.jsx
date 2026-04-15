import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const getLinks = (isAdmin) => {
  const baseLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/chat", label: "Chat" },
    { to: "/groups", label: "Groups" }
  ];

  if (isAdmin) {
    return [
      ...baseLinks,
      { to: "/admin/add-user", label: "Add User" },
      { to: "/admin/view-users", label: "View Users" },
      { to: "/admin/assign-courses", label: "Assign Courses" }
    ];
  }

  return baseLinks;
};

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const links = getLinks(isAdmin);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <p className="sidebar-kicker">University Portal</p>
        <h2>UniLink</h2>
        <small>Academic Services</small>
      </div>
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>Spring Semester 2026</p>
      </div>
    </aside>
  );
}
