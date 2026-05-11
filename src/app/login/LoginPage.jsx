import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";
import { GraduationCap, Mail, Lock, CheckCircle2, AlertCircle } from "lucide-react";

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
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Hero panel ─────────────────────────────────────────── */}
      <section
        className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12 text-white"
        style={{ background: "linear-gradient(135deg, #0b1220 0%, #1e293b 60%, #0f172a 100%)" }}
      >
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-indigo-400 mb-2">
          Welcome to UniLink
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white m-0">
          Campus Digital Services
        </h1>
        <p className="text-slate-300 mt-3 text-base leading-relaxed max-w-md">
          Access your courses, messaging hub, class updates, and student resources from one platform.
        </p>
        <ul className="mt-5 space-y-2.5 text-sm text-slate-300 list-none p-0 m-0">
          {["Course announcements and files", "Student-teacher messaging", "Role-based academic workflows"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Form panel ─────────────────────────────────────────── */}
      <section className="flex-1 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Icon + title */}
          <div className="flex items-center gap-2.5 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <GraduationCap size={20} />
            </div>
            <span className="text-lg font-extrabold text-slate-800">UniLink</span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-800 m-0">Sign in</h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">Use your university account to continue.</p>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl text-sm font-semibold text-red-700 bg-red-50 border border-red-200">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign in to portal"
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}