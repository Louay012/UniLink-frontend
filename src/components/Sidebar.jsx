import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { COURSES, MOCK_USER } from "../mockData";
import {
  Home,
  BookOpen,
  MessageCircle,
  Users,
  UserPlus,
  Menu,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LogOut
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
  const { user, logout, selectedRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "ADMIN";
  const links = getLinks(isAdmin);
  const initialIsMobile = typeof window !== 'undefined' ? window.innerWidth <= 1100 : false;
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [isOpen, setIsOpen] = useState(!initialIsMobile);
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);
  const isStudentSidebar = !isAdmin;

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
    if (key.includes('course')) return GraduationCap;
    if (key.includes('chat') || key.includes('message')) return MessageCircle;
    if (key.includes('group') || key.includes('teacher') || key.includes('users')) return Users;
    if (key.includes('add')) return UserPlus;
    return GraduationCap;
  };

  const profileName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User"
    : "User";
  const profileSubtitle = selectedRole?.label || user?.role || MOCK_USER?.classGroup || "Student";
  const isCoursesRoute = location.pathname === '/courses';

  return (
    <>
      {/* Render sidebar only when not mobile OR when mobile and explicitly opened (drawer) */}
      {(!isMobile || isOpen) && (
        <aside className={`app-sidebar ${isMobile ? 'mobile-drawer' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => setIsOpen((s) => !s)}
              className="app-nav-link"
              style={{
                padding: '0.4rem',
                width: '2.35rem',
                minWidth: '2.35rem',
                justifyContent: 'center',
                borderRadius: '10px'
              }}
              title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <Menu size={22} className="nav-icon" style={{ marginRight: 0 }} />
            </button>

            <div className="brand-icon" aria-hidden>
              <BookOpen size={22} />
            </div>
          </div>
          {isOpen && (
            <div className="brand-text">
              <p className="sidebar-kicker">University Portal</p>
              <h2>UniLink</h2>
              <small>Academic Services</small>
            </div>
          )}
        </div>

        {isOpen && (
          <div className="sidebar-profile">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                aria-hidden
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.16)',
                  fontWeight: 700
                }}
              >
                {(profileName || "U").slice(0, 1).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profileName}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1' }}>{profileSubtitle}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav>
        {isStudentSidebar && (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""} ${!isOpen ? 'collapsed' : ''}`}
              title={!isOpen ? "Dashboard" : undefined}
            >
              <Home size={18} className="nav-icon" />
              {isOpen && <span className="nav-label">Dashboard</span>}
            </NavLink>

            <button
              type="button"
              onClick={() => {
                if (!isOpen) {
                  navigate('/courses');
                  return;
                }
                setIsCoursesExpanded((v) => !v);
              }}
              className={`app-nav-link ${isCoursesRoute ? 'active' : ''} ${!isOpen ? 'collapsed' : ''}`}
              title={!isOpen ? 'Courses' : undefined}
              style={{ cursor: 'pointer', justifyContent: isOpen ? 'flex-start' : 'center', textAlign: 'left' }}
            >
              <GraduationCap size={isOpen ? 18 : 21} className="nav-icon" style={!isOpen ? { marginRight: 0 } : undefined} />
              {isOpen && (
                <>
                  <span className="nav-label">Courses</span>
                  {isCoursesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </>
              )}
            </button>

            {isOpen && isCoursesExpanded && (
              <div style={{ marginLeft: '0.6rem', borderLeft: '2px solid rgba(255,255,255,0.2)', paddingLeft: '0.55rem', display: 'grid', gap: '0.35rem' }}>
                {COURSES.slice(0, 3).map((course) => (
                  <NavLink
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
                    style={{ padding: '0.55rem 0.65rem', fontWeight: 500 }}
                    title={course.title}
                  >
                    <span className="nav-label" style={{ fontSize: '0.88rem' }}>{course.title}</span>
                    {(course.newAnnouncements || 0) > 0 && (
                      <span
                        style={{
                          marginLeft: '0.45rem',
                          background: '#ef4444',
                          color: '#fff',
                          fontSize: '0.7rem',
                          borderRadius: '999px',
                          padding: '0.12rem 0.4rem',
                          fontWeight: 700
                        }}
                      >
                        {course.newAnnouncements} new
                      </span>
                    )}
                  </NavLink>
                ))}

                <NavLink
                  to="/courses"
                  className="app-nav-link view-all-link"
                  style={{ padding: '0.45rem 0.65rem', fontWeight: 600, color: '#38bdf8' }}
                >
                  <span className="nav-label">View All →</span>
                </NavLink>
              </div>
            )}

            <NavLink
              to="/chat"
              className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""} ${!isOpen ? 'collapsed' : ''}`}
              title={!isOpen ? 'Chat' : undefined}
            >
              <MessageCircle size={18} className="nav-icon" />
              {isOpen && <span className="nav-label">Chat</span>}
            </NavLink>

            <NavLink
              to="/groups"
              className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""} ${!isOpen ? 'collapsed' : ''}`}
              title={!isOpen ? 'Groups' : undefined}
            >
              <Users size={18} className="nav-icon" />
              {isOpen && <span className="nav-label">Groups</span>}
            </NavLink>
          </>
        )}

        {!isStudentSidebar && links.map((link) => {
          if (link.label === "Dashboard") {
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
          }

          if (link.label === "Chat") {
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
          }

          if (link.label === "Groups") {
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
          }

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
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={16} />
                {isOpen && <span>Logout</span>}
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
