import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // Save the user and token
      login(data.user, data.token);
      
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-hero-panel">
        <p className="auth-kicker">Welcome to UniLink</p>
        <h1>Campus Digital Services</h1>
        <p>
          Access your courses, messaging hub, class updates, and student resources from one platform.
        </p>
        <ul>
          <li>Course announcements and files</li>
          <li>Student-teacher messaging</li>
          <li>Role-based academic workflows</li>
        </ul>
      </section>

      <section className="auth-form-panel">
        <h2>Sign in</h2>
        <p>Use your university account to continue.</p>

        {error ? <div className="error-banner">{error}</div> : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to portal"}
          </button>
        </form>
      </section>
    </div>
  );
}