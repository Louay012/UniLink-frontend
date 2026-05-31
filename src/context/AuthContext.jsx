import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

function readStoredUser() {
  const saved = localStorage.getItem("unilink_user");
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch (_error) {
    localStorage.removeItem("unilink_user");
    localStorage.removeItem("unilink_token");
    return null;
  }
}

export function AuthProvider({ children }) {
  // When the page loads, check if a token was already saved
  const [user,  setUser]  = useState(() => {
    return readStoredUser();
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

  useEffect(() => {
    let active = true;

    async function hydrateUserProfile() {
      if (user?.id) return;
      if (!token) return;
      if (!selectedRole?.value) return;

      try {
        const profile = await apiRequest("/profile", selectedRole);
        if (!active || !profile?.id) return;

        const primaryRole = Array.isArray(profile.roles) && profile.roles.length
          ? String(profile.roles[0].code || profile.roles[0]).toUpperCase()
          : selectedRole.value;

        const hydratedUser = {
          id: profile.id,
          userId: profile.id,
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || "",
          role: primaryRole,
          roles: profile.roles || []
        };

        setUser(hydratedUser);
        localStorage.setItem("unilink_user", JSON.stringify(hydratedUser));
      } catch {
        // Ignore hydration failures; the app can still function with role-only access.
      }
    }

    hydrateUserProfile();
    return () => {
      active = false;
    };
  }, [selectedRole?.value, selectedRole?.userId, token, user?.id]);

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
