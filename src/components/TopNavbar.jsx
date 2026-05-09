import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "./NotificationDropdown";

export default function TopNavbar({ unreadCount = 0, notifications = [], onMarkAllRead, onDismiss }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  const profileName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User"
    : "User";

  const initials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "U";

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isNotifOpen) return;

    function handleClickOutside(event) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        bellRef.current && !bellRef.current.contains(event.target)
      ) {
        setIsNotifOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setIsNotifOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNotifOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsNotifOpen(false);
  }, [location.pathname]);

  return (
    <header className="top-navbar">
      <div className="top-navbar-left" />

      <div className="top-navbar-right">

        <button
          ref={bellRef}
          type="button"
          className={`top-navbar-icon-btn ${isNotifOpen ? "active" : ""}`}
          onClick={() => setIsNotifOpen((prev) => !prev)}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="top-navbar-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>

        <button
          type="button"
          className="top-navbar-profile-btn"
          onClick={() => navigate("/profile")}
          title="View profile"
        >
          <span className="top-navbar-avatar">{initials}</span>
          <span className="top-navbar-profile-name">{profileName}</span>
        </button>

        {isNotifOpen && (
          <div ref={dropdownRef} className="top-navbar-dropdown-anchor">
            <NotificationDropdown
              notifications={notifications}
              onClose={() => setIsNotifOpen(false)}
              onMarkAllRead={onMarkAllRead}
              onDismiss={onDismiss}
            />
          </div>
        )}
      </div>
    </header>
  );
}
