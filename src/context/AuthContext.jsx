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

  // Login: save user + token in state AND in localStorage
  // localStorage means it survives page refresh
  function login(userData, jwtToken) {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("unilink_user",  JSON.stringify(userData));
    localStorage.setItem("unilink_token", jwtToken);
  }

  // Logout: clear everything
  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("unilink_user");
    localStorage.removeItem("unilink_token");
  }

  const value = useMemo(
    () => ({ user, token, login, logout, isAdmin: user?.role === "ADMIN" }),
    [user, token]
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