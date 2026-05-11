import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Menu, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "./NotificationDropdown";
import NavAvatar from "./NavAvatar";
import logo from "../assets/logo.jpg";

export default function TopNavbar({ unreadCount = 0, notifications = [], onMarkAllRead, onDismiss, sidebarOpen, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);
  const profileBtnRef = useRef(null);
  const profileDropRef = useRef(null);

  const profileName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User"
    : "User";

  const initials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "U";

  // Close notification dropdown when clicking outside
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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!isProfileOpen) return;
    function handleClickOutside(event) {
      if (
        profileDropRef.current && !profileDropRef.current.contains(event.target) &&
        profileBtnRef.current && !profileBtnRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileOpen]);

  // Close both dropdowns on route change
  useEffect(() => {
    setIsNotifOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    setIsProfileOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex items-center justify-between gap-4 px-4 w-full flex-shrink-0 min-h-[52px] z-50 sticky top-0"
      style={{ background: "linear-gradient(90deg,#0b1220 0%,#152238 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-transparent border-none cursor-pointer text-white/75 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
        >
          <Menu size={20} />
        </button>
        <img
          src={logo}
          alt="UniLink"
          className="h-8 w-12"
        />
      </div>

      {/* Right: bell + profile */}
      <div className="flex items-center gap-2 relative">
        {/* Notification bell */}
        <button
          ref={bellRef}
          type="button"
          onClick={() => { setIsNotifOpen((prev) => !prev); setIsProfileOpen(false); }}
          aria-label="Notifications"
          title="Notifications"
          className={`relative flex items-center justify-center w-9 h-9 rounded-xl border cursor-pointer transition-all ${isNotifOpen
            ? "bg-white/20 border-white/30 text-white"
            : "bg-white/8 border-white/15 text-white/80 hover:bg-white/15 hover:text-white"
            }`}
          style={{ background: isNotifOpen ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", borderColor: isNotifOpen ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)" }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-white text-[0.65rem] font-extrabold leading-none"
              style={{ background: "#ef4444", border: "2px solid #152238", animation: "notif-pop 300ms cubic-bezier(0.34,1.56,0.64,1)" }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Profile button — toggles dropdown */}
        <button
          ref={profileBtnRef}
          type="button"
          onClick={() => { setIsProfileOpen((prev) => !prev); setIsNotifOpen(false); }}
          title="Account menu"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border cursor-pointer transition-all text-white/85 hover:text-white"
          style={{
            background: isProfileOpen ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
            borderColor: isProfileOpen ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
          }}
        >
          <NavAvatar userId={user?.id} initials={initials} size={7} />
          <span className="text-[0.82rem] font-semibold whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis hidden sm:block">
            {profileName}
          </span>
          <ChevronDown
            size={13}
            className="hidden sm:block transition-transform"
            style={{ transform: isProfileOpen ? "rotate(180deg)" : "none", opacity: 0.6 }}
          />
        </button>

        {/* Profile dropdown menu */}
        {isProfileOpen && (
          <div
            ref={profileDropRef}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden shadow-2xl z-[100]"
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              animation: "toast-enter 180ms cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-800 m-0 truncate">{profileName}</p>
              <p className="text-xs text-slate-400 m-0 truncate">{user?.email || ""}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => { setIsProfileOpen(false); navigate("/profile"); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-none bg-transparent cursor-pointer text-left"
              >
                <User size={15} className="text-slate-400" />
                My Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer text-left"
              >
                <LogOut size={15} className="text-slate-400" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Notification dropdown */}
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
