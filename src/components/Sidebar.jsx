import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotificationContext } from "../context/NotificationContext";
import { listCourses } from "../services/course.service";
import NavAvatar from "./NavAvatar";

import {
  Home,
  GraduationCap,
  MessageCircle,
  Users,
  UserPlus,
  ChevronDown,
  ChevronRight,
  LogOut,
  AlertCircle,
  User
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
      { to: "/admin/assign-courses", label: "Assign Courses" },
      { to: "/admin/academic-setup", label: "Academic Setup" },
      { to: "/feedback", label: "Bug Reports" }
    ];
  }
  return baseLinks;
};

const iconFor = (label) => {
  const key = (label || '').toLowerCase();
  if (key.includes('dash')) return Home;
  if (key.includes('course')) return GraduationCap;
  if (key.includes('chat') || key.includes('message')) return MessageCircle;
  if (key.includes('group') || key.includes('teacher') || key.includes('users')) return Users;
  if (key.includes('add')) return UserPlus;
  return GraduationCap;
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, token, logout, selectedRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "ADMIN";
  const links = getLinks(isAdmin);
  const isStudentSidebar = !isAdmin;

  // Access seen-courses from notification context
  // Sidebar is always rendered inside NotificationProvider (AuthenticatedShell)
  const notifCtx = useNotificationContext();
  const isCourseUnseen = notifCtx?.isCourseUnseen ?? (() => true);

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 1100 : false
  );
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);
  const [sidebarCourses, setSidebarCourses] = useState([]);
  const [coursesError, setCoursesError] = useState("");

  // Track mobile breakpoint
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 1100);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-close drawer when navigating on mobile
  useEffect(() => {
    if (isMobile && onClose) onClose();
  }, [location.pathname]);

  // Cleanup legacy class
  useEffect(() => {
    document.body.classList.remove('mobile-view');
  }, []);

  const topSidebarCourses = useMemo(() => {
    const sorted = [...sidebarCourses].sort((a, b) => {
      const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
      if (bt !== at) return bt - at;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
    return sorted.slice(0, 3);
  }, [sidebarCourses]);

  useEffect(() => {
    let active = true;
    async function loadCourses() {
      if (!token || isAdmin) { if (active) { setSidebarCourses([]); setCoursesError(''); } return; }
      try {
        const payload = await listCourses(selectedRole);
        if (!active) return;
        setSidebarCourses(payload.items || []);
        setCoursesError('');
      } catch (err) {
        if (!active) return;
        setSidebarCourses([]);
        setCoursesError(err.message || 'Could not load courses.');
      }
    }
    loadCourses();
    return () => { active = false; };
  }, [isAdmin, selectedRole, token]);

  const profileName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User"
    : "User";
  const profileSubtitle = selectedRole?.label || user?.role || "Student";
  const isCoursesRoute = location.pathname === '/courses';

  // On desktop: sidebar collapses to icon-only strip (72px). On mobile: fixed drawer overlay.
  // isOpen=true → expanded (270px desktop) or overlay-open (mobile)
  // isOpen=false → collapsed icon-only (72px desktop) or hidden (mobile)

  // Desktop sidebar classes
  const desktopSidebarClass = isOpen ? "w-[270px]" : "w-[72px]";

  // Mobile sidebar: fixed overlay, slides in from left, always full width 270px
  const mobileSidebarTranslate = (isMobile && isOpen) ? "translate-x-0" : (isMobile ? "-translate-x-full" : "");

  const sidebarBase = `
    flex flex-col h-full overflow-y-auto overflow-x-hidden
    border-r border-white/[0.08] flex-shrink-0 transition-all duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]
  `;

  // Nav link base style
  const navLinkBase = (isActive, collapsed) => `
    flex items-center gap-3 px-3 py-[0.52rem] rounded-xl font-semibold text-[0.875rem] no-underline
    transition-all duration-150 cursor-pointer
    ${collapsed ? 'justify-center px-0 mx-auto w-11 h-11' : ''}
    ${isActive
      ? 'bg-white/15 text-white'
      : 'text-white/70 hover:bg-white/10 hover:text-white'
    }
  `;

  const collapsed = !isOpen; // true on desktop when sidebar is icon-only

  return (
    <>
      {/* Backdrop — mobile only when open */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-[59] cursor-pointer"
          style={{ top: 52, background: "rgba(2,6,23,0.35)", backdropFilter: "blur(3px)" }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          ${sidebarBase}
          ${isMobile
            ? `fixed left-0 z-[60] w-[270px] ${mobileSidebarTranslate} pointer-events-${isOpen ? 'auto' : 'none'}`
            : desktopSidebarClass
          }
        `}
        style={{
          top: isMobile ? 52 : undefined,
          height: isMobile ? 'calc(100vh - 52px)' : undefined,
          background: "linear-gradient(180deg,#0b1220 0%,#1e293b 100%)",
          color: "#f1f5f9",
          padding: collapsed && !isMobile ? "1rem 0.5rem" : "1.3rem 1rem",
        }}
      >
        {/* Profile card — shown when expanded */}
        {!collapsed && (
          <div className="flex items-center gap-3 p-3 rounded-2xl mb-3 border border-white/20 bg-white/[0.08]">
            <NavAvatar
              userId={user?.id}
              initials={(profileName || "U").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "U"}
              size={9}
            />
            <div className="min-w-0">
              <p className="m-0 font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis text-sm">{profileName}</p>
              <p className="m-0 text-[0.78rem] text-slate-300">{profileSubtitle}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className={`flex flex-col gap-[0.35rem] flex-1 ${collapsed && !isMobile ? 'items-center' : ''}`}>
          {isStudentSidebar && (
            <>
              <NavLink
                to="/dashboard"
                title={collapsed && !isMobile ? "Dashboard" : undefined}
                className={({ isActive }) => navLinkBase(isActive, collapsed && !isMobile)}
              >
                <Home size={18} className="flex-shrink-0" />
                {(!collapsed || isMobile) && <span>Dashboard</span>}
              </NavLink>

              {/* Courses with expand */}
              <button
                type="button"
                title={collapsed && !isMobile ? "Courses" : undefined}
                onClick={() => {
                  if (collapsed && !isMobile) { navigate('/courses'); return; }
                  setIsCoursesExpanded(v => !v);
                }}
                className={navLinkBase(isCoursesRoute, collapsed && !isMobile) + " w-full text-left border-none bg-transparent"}
                style={{ cursor: 'pointer' }}
              >
                <GraduationCap size={18} className="flex-shrink-0" />
                {(!collapsed || isMobile) && (
                  <>
                    <span className="flex-1">Courses</span>
                    {isCoursesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </>
                )}
              </button>

              {/* Course sub-links */}
              {(!collapsed || isMobile) && isCoursesExpanded && (
                <div className="ml-3 pl-3 border-l-2 border-white/20 flex flex-col gap-[0.35rem]">
                  {topSidebarCourses.map((course) => (
                    <NavLink
                      key={course.id}
                      to={`/courses/${course.id}`}
                      className={({ isActive }) => navLinkBase(isActive, false) + " !py-[0.45rem] !font-medium text-[0.88rem]"}
                      title={course.title}
                    >
                      <span className="truncate">{course.title}</span>
                      {(Number(course.announcementCount) || 0) > 0 && isCourseUnseen(course.id) && (
                        <span className="ml-auto bg-red-500 text-white text-[0.7rem] rounded-full px-1.5 py-0.5 font-bold flex-shrink-0">
                          {course.announcementCount} new
                        </span>
                      )}
                    </NavLink>
                  ))}
                  {!topSidebarCourses.length && !coursesError && (
                    <p className="m-0 text-[0.82rem] text-slate-300 px-2">No courses yet.</p>
                  )}
                  {coursesError && (
                    <p className="m-0 text-[0.8rem] text-red-300 px-2">{coursesError}</p>
                  )}
                  <NavLink
                    to="/courses"
                    className={() => navLinkBase(false, false) + " !py-[0.45rem] !font-semibold text-sky-400 hover:text-sky-300"}
                  >
                    <span>View All →</span>
                  </NavLink>
                </div>
              )}

              <NavLink to="/chat" title={collapsed && !isMobile ? "Chat" : undefined}
                className={({ isActive }) => navLinkBase(isActive, collapsed && !isMobile)}>
                <MessageCircle size={18} className="flex-shrink-0" />
                {(!collapsed || isMobile) && <span>Chat</span>}
              </NavLink>

              <NavLink to="/groups" title={collapsed && !isMobile ? "Groups" : undefined}
                className={({ isActive }) => navLinkBase(isActive, collapsed && !isMobile)}>
                <Users size={18} className="flex-shrink-0" />
                {(!collapsed || isMobile) && <span>Groups</span>}
              </NavLink>

              <NavLink to="/feedback" title={collapsed && !isMobile ? "Bug Report" : undefined}
                className={({ isActive }) => navLinkBase(isActive, collapsed && !isMobile)}>
                <AlertCircle size={18} className="flex-shrink-0" />
                {(!collapsed || isMobile) && <span>Bug Report</span>}
              </NavLink>

              <NavLink to="/profile" title={collapsed && !isMobile ? "Profile" : undefined}
                className={({ isActive }) => navLinkBase(isActive, collapsed && !isMobile)}>
                <User size={18} className="flex-shrink-0" />
                {(!collapsed || isMobile) && <span>Profile</span>}
              </NavLink>
            </>
          )}

          {/* Admin links */}
          {!isStudentSidebar && links.map((link) => {
            const Icon = iconFor(link.label);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                title={collapsed && !isMobile ? link.label : undefined}
                className={({ isActive }) => navLinkBase(isActive, collapsed && !isMobile)}
              >
                <Icon size={18} className="flex-shrink-0" />
                {(!collapsed || isMobile) && <span>{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: logout only (semester text removed) */}
        <div className={`mt-auto pt-3 border-t border-white/[0.12] ${collapsed && !isMobile ? 'flex justify-center' : ''}`}>
          <button
            className={`flex items-center gap-3 px-3 py-[0.52rem] rounded-xl text-[0.875rem] font-semibold cursor-pointer w-full
              text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all border-none bg-transparent
              ${collapsed && !isMobile ? 'justify-center w-11 h-11 px-0 mx-auto' : ''}
            `}
            onClick={() => { logout(); navigate('/login'); }}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={16} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
