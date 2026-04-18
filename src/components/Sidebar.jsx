import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  BookOpen,
  Bell,
  MessageCircle,
  Users,
  Settings,
  UserPlus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";
  const links = getLinks(isAdmin);
  const initialIsMobile = typeof window !== 'undefined' ? window.innerWidth <= 1100 : false;
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [isOpen, setIsOpen] = useState(!initialIsMobile);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1100;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Add a body-class so CSS can reliably switch layouts for mobile
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isMobile) document.body.classList.add('mobile-view');
    else document.body.classList.remove('mobile-view');
    return () => document.body.classList.remove('mobile-view');
  }, [isMobile]);

  // Keep a body class to let global styles adjust layout when collapsed
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (!isOpen) document.body.classList.add('sidebar-collapsed');
      else document.body.classList.remove('sidebar-collapsed');
    }
  }, [isOpen]);

  const iconFor = (label) => {
    const key = (label || '').toLowerCase();
    if (key.includes('dash')) return Home;
    if (key.includes('course')) return BookOpen;
    if (key.includes('announce')) return Bell;
    if (key.includes('chat') || key.includes('message')) return MessageCircle;
    if (key.includes('group') || key.includes('teacher') || key.includes('users')) return Users;
    if (key.includes('add')) return UserPlus;
    return Settings;
  };

  return (
    <>
      {/* Render sidebar only when not mobile OR when mobile and explicitly opened (drawer) */}
      {(!isMobile || isOpen) && (
        <aside className={`app-sidebar ${isMobile ? 'mobile-drawer' : ''}`}>
      <div className="sidebar-brand" style={{ position: 'relative' }}>
        <div className="brand-icon" aria-hidden>
          <BookOpen size={28} />
        </div>
        {isOpen && (
          <div className="brand-text">
            <p className="sidebar-kicker">University Portal</p>
            <h2>UniLink</h2>
            <small>Academic Services</small>
          </div>
        )}
      </div>

      <nav>
        {/* Collapse/Expand control rendered first so it appears at the top */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setIsOpen((s) => !s);
          }}
          className={`app-nav-link collapse-toggle-nav ${!isOpen ? 'collapsed' : ''}`}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-pressed={!isOpen}
        >
          {isOpen ? (
            <ChevronLeft size={18} className="nav-icon" />
          ) : (
            <ChevronRight size={18} className="nav-icon" />
          )}
          <span className="nav-label">{isOpen ? 'Collapse' : 'Expand'}</span>
        </a>

        {links.map((link) => {
          const Icon = iconFor(link.label);
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""} ${!isOpen ? 'collapsed' : ''}`}
              title={!isOpen ? link.label : undefined}
            >
              <Icon size={18} className="nav-icon" />
              {isOpen && <span className="nav-label">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>
          <div className="sidebar-footer">
            <p>Spring Semester 2026</p>
            <div style={{ marginTop: '0.6rem' }}>
              <button
                className="sidebar-logout"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </aside>
      )}
      {/* Mobile bottom navigation for small screens (only when drawer is closed) */}
      {isMobile && !isOpen && (
        <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
          {links.map((link) => {
            const Icon = iconFor(link.label);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
                title={link.label}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-label">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </>
  );
}
