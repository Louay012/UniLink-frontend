import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import useNotifications from "./hooks/useNotifications";
import LoginPage from "./app/login/LoginPage";
import DashboardPage from "./app/dashboard/DashboardPage";
import ChatPage from "./app/chat/ChatPage";
import GroupsPage from "./app/groups/GroupsPage";
import MyWorkApp from "./MyWorkApp";
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
  const { selectedRole } = useAuth();
  const { notifications, unreadCount, markAllRead, dismiss } = useNotifications(selectedRole);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <TopNavbar
          unreadCount={unreadCount}
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onDismiss={dismiss}
        />
        <div className="app-content-body">
          <AppRoutes />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/my-work/*" element={<MyWorkApp />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<AuthenticatedShell />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}