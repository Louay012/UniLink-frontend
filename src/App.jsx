import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./app/login/LoginPage";
import DashboardPage from "./app/dashboard/DashboardPage";
import ChatPage from "./app/chat/ChatPage";
import GroupsPage from "./app/groups/GroupsPage";
import MyWorkApp from "./MyWorkApp";
import AdminPage from "./app/admin/AdminPage";

function AppRoutes() {
  const { token } = useAuth();
  const target = token ? "/dashboard" : "/login";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={target} replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="*" element={<Navigate to={target} replace />} />
    </Routes>
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
          <Route
            path="*"
            element={
              <div className="app-shell">
                <Sidebar />
                <div className="app-content">
                  <AppRoutes />
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

