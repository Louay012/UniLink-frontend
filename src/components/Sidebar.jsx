import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/login", label: "Login" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/chat", label: "Chat" },
  { to: "/groups", label: "Groups" }
];

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <h2>UniLink</h2>
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
    </aside>
  );
}
