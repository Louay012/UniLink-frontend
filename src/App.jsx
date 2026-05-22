import React, { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider, useNotificationContext } from "./context/NotificationContext";

import LoginPage from "./app/login/LoginPage";
import DashboardPage from "./app/dashboard/DashboardPage";
import ChatPage from "./app/chat/ChatPage";
import GroupsPage from "./app/groups/GroupsPage";

import CoursesPage from "./CoursesPage";
import CourseDetails from "./CourseDetails";
import AdminPage from "./app/admin/AdminPage";
import AddUserPage from "./app/admin/AddUserPage";
import ViewUsersPage from "./app/admin/ViewUsersPage";
import AssignCoursesPage from "./app/admin/AssignCoursesPage";
import AcademicSetupPage from "./app/admin/AcademicSetupPage";
import FeedbackPage from "./app/feedback/FeedbackPage";
import ProfilePage from "./app/profile/ProfilePage";

function AppRoutes() {
  const { token } = useAuth();
  const target = token ? "/dashboard" : "/login";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={target} replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:id" element={<CourseDetails />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/admin/add-user" element={<AddUserPage />} />
      <Route path="/admin/view-users" element={<ViewUsersPage />} />
      <Route path="/admin/assign-courses" element={<AssignCoursesPage />} />
      <Route path="/admin/academic-setup" element={<AcademicSetupPage />} />
      <Route path="*" element={<Navigate to={target} replace />} />
    </Routes>
  );
}

function AuthenticatedShell() {
  const { notifications, unreadCount, markAllRead, dismiss } = useNotificationContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-shell">
      <TopNavbar
        unreadCount={unreadCount}
        notifications={notifications}
        onMarkAllRead={markAllRead}
        onDismiss={dismiss}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
      />
      <div className="app-body">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-content">
          <div className="app-content-body">
            <div className="page-shell">
              <AppRoutes />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route
              path="*"
              element={
                <NotificationProvider>
                  <AuthenticatedShell />
                </NotificationProvider>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}