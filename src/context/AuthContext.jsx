import React, { createContext, useContext, useMemo, useState } from "react";

const roleOptions = [
  { label: "Student", value: "STUDENT", userId: "u-student-1" },
  { label: "Teacher", value: "TEACHER", userId: "u-teacher-1" },
  { label: "Coordinator", value: "COORDINATOR", userId: "u-coordinator-1" }
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);

  const value = useMemo(
    () => ({
      selectedRole,
      setSelectedRole,
      roleOptions
    }),
    [selectedRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
