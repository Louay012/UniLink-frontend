import React from "react";
import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboardPage from "./AdminDashboardPage"
import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "TEACHER") {
    return <TeacherDashboard />;
  }
  if (user?.role === "ADMIN") {
    return <AdminDashboardPage />;
  }
  return <StudentDashboard />;
}
