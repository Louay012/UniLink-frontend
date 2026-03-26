import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { selectedRole, setSelectedRole, roleOptions } = useAuth();

  return (
    <div className="page-shell">
      <h1>Login</h1>
      <p>Select a role to simulate authentication context in MVP mode.</p>
      <div className="role-switch">
        {roleOptions.map((role) => (
          <button
            key={role.value}
            className={selectedRole.value === role.value ? "active" : ""}
            onClick={() => setSelectedRole(role)}
          >
            {role.label}
          </button>
        ))}
      </div>
    </div>
  );
}
