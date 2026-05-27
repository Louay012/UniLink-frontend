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
import DirectoryPage from "./app/directory/DirectoryPage";

import CoursesPage from "./CoursesPage";
import CourseDetails from "./CourseDetails";
import AdminPage from "./app/admin/AdminPage";
import AddUserPage from "./app/admin/AddUserPage";
import ViewUsersPage from "./app/admin/ViewUsersPage";
import AssignCoursesPage from "./app/admin/AssignCoursesPage";
import AcademicSetupPage from "./app/admin/AcademicSetupPage";
import FeedbackPage from "./app/feedback/FeedbackPage";
import ProfilePage from "./app/profile/ProfilePage";
import UserViewPage from "./app/users/UserViewPage";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

function AppRoutes() {
  const { token } = useAuth();
  const target = token ? "/dashboard" : "/login";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={target} replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/directory" element={<ProtectedRoute><DirectoryPage /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
      <Route path="/courses/:id" element={<ProtectedRoute><CourseDetails /></ProtectedRoute>} />
      <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/users/:id" element={<ProtectedRoute><UserViewPage /></ProtectedRoute>} />
      <Route path="/admin/add-user" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AddUserPage /></ProtectedRoute>} />
      <Route path="/admin/view-users" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ViewUsersPage /></ProtectedRoute>} />
      <Route path="/admin/assign-courses" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AssignCoursesPage /></ProtectedRoute>} />
      <Route path="/admin/academic-setup" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AcademicSetupPage /></ProtectedRoute>} />
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
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminPage /></ProtectedRoute>} />
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