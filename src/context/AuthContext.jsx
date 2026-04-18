import React, { createContext, useContext, useState, useMemo, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // When the page loads, check if a token was already saved
  const [user,  setUser]  = useState(() => {
    const saved = localStorage.getItem("unilink_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem("unilink_token") || null;
  });

  const roleOptions = useMemo(
    () => [
      { value: "STUDENT", label: "Student" },
      { value: "TEACHER", label: "Teacher" },
      { value: "COORDINATOR", label: "Coordinator" },
      { value: "ADMIN", label: "Admin" }
    ],
    []
  );

  const [selectedRole, setSelectedRole] = useState(() => {
    const saved = localStorage.getItem("unilink_selected_role");
    const fallbackRole = (saved || "STUDENT").toUpperCase();
    const label = roleOptions.find((role) => role.value === fallbackRole)?.label || fallbackRole;
    return { value: fallbackRole, label };
  });

  // Login: save user + token in state AND in localStorage
  // localStorage means it survives page refresh
  function login(userData, jwtToken) {
    setUser(userData);
    setToken(jwtToken);
    const nextRole = (userData?.role || "STUDENT").toUpperCase();
    const label = roleOptions.find((role) => role.value === nextRole)?.label || nextRole;
    setSelectedRole({ value: nextRole, label });
    localStorage.setItem("unilink_user",  JSON.stringify(userData));
    localStorage.setItem("unilink_token", jwtToken);
    localStorage.setItem("unilink_selected_role", nextRole);
  }

  // Logout: clear everything
  function logout() {
    setUser(null);
    setToken(null);
    setSelectedRole({ value: "STUDENT", label: "Student" });
    localStorage.removeItem("unilink_user");
    localStorage.removeItem("unilink_token");
    localStorage.removeItem("unilink_selected_role");
  }

  useEffect(() => {
    localStorage.setItem("unilink_selected_role", selectedRole.value);
  }, [selectedRole.value]);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      isAdmin: user?.role === "ADMIN",
      roleOptions,
      selectedRole: {
        ...selectedRole,
        userId: user?.id || user?.userId || null
      },
      setSelectedRole
    }),
    [user, token, roleOptions, selectedRole]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}