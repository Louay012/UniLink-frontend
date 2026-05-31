import React from "react";
import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";
import { useAuth } from "../../context/AuthContext";
import { userHasRole } from "../../utils/roles";

export default function DashboardPage() {
  const { user } = useAuth();

  if (userHasRole(user, "TEACHER")) {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
}
