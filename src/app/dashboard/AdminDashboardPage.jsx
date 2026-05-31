import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  MessageCircle,
  Layers,
  UserCheck,
  UserCog,
  ShieldCheck,
  MessageSquare,
  Activity,
  Server,
  Users,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

/* ─── helpers ─────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ─── StatCard ────────────────────────────────────────── */

function StatCard({ icon: Icon, value, label, color, delay = 0 }) {
  return (
    <div
      className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ animation: `fadeUp .35s ease ${delay}ms both` }}
    >
      <div
        className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
        style={{ background: `${color}18`, color }}
      >
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-heading text-3xl font-extrabold text-slate-900 leading-none">
          {value ?? '—'}
        </h3>
        <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

/* ─── SectionHeader ───────────────────────────────────── */

function SectionHeader({ eyebrow, title }) {
  return (
    <div className="mb-4">
      <p className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
        {eyebrow}
      </p>
      <h2 className="font-heading text-base font-extrabold text-slate-900">{title}</h2>
    </div>
  );
}

/* ─── InfoCard ────────────────────────────────────────── */

function InfoCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <div
      className="flex flex-col gap-3 bg-white border border-slate-200 rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ animation: `fadeUp .35s ease ${delay}ms both` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: `${color}15`, color }}
        >
          <Icon size={15} />
        </div>
      </div>
      <div>
        <p className="font-heading text-2xl font-extrabold text-slate-900 leading-none">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── SystemRow ───────────────────────────────────────── */

function SystemRow({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{ background: `${color}15`, color }}
        >
          <Icon size={15} />
        </div>
        <span className="text-sm font-semibold text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-900 tabular-nums">{value ?? '—'}</span>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────── */

function Skeleton({ className = '' }) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}

/* ─── Main ────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) navigate('/login');
  }, [isAdmin, navigate]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest('/admin/stats')
      .then((data) => { if (active) setStats(data); })
      .catch((err) => { if (active) setError(err.message || 'Failed to load stats'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const fullName = user
    ? `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || user.email
    : 'Admin';

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="flex flex-col gap-5 sm:gap-7 pb-8 w-full min-w-0 max-w-[1200px] mx-auto">

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer { animation: shimmer 1.6s infinite linear; }
      `}</style>

      {/* ── 1. Hero ── */}
      <section
        className="relative rounded-xl sm:rounded-2xl p-5 sm:p-8 overflow-hidden flex items-center justify-between min-h-[110px] sm:min-h-[130px]"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a3352 60%, #0f172a 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
        />
        <div className="relative z-10">
          <p className="text-[0.72rem] font-bold uppercase tracking-widest text-white/50 mb-1">
            UniLink · Admin Console
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-white mb-1 leading-tight">
            {getGreeting()}, {fullName}
          </h1>
          <p className="text-sm text-white/50">{dateLabel}</p>
        </div>
        <div
          className="absolute -right-10 -top-10 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
      </section>

      {/* error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-600">{error}</p>
        </div>
      )}

      {/* ── 2. Users ── */}
      <section>
        <SectionHeader eyebrow="People" title="User Overview" />
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={GraduationCap} value={stats?.users?.students}    label="Students"     color="#6366f1" delay={0}   />
            <StatCard icon={BookOpen}      value={stats?.users?.teachers}     label="Teachers"     color="#0ea5e9" delay={50}  />
            <StatCard icon={UserCheck}     value={stats?.users?.coordinators} label="Coordinators" color="#10b981" delay={100} />
            <StatCard icon={ShieldCheck}   value={stats?.users?.admins}       label="Admins"       color="#f59e0b" delay={150} />
          </div>
        )}
      </section>

      {/* ── 3. Academic ── */}
      <section>
        <SectionHeader eyebrow="Academic" title="Courses & Groups" />
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCard icon={BookOpen}      label="Courses"      value={stats?.academic?.courses}            sub="total in system"       color="#6366f1" delay={0}   />
            <InfoCard icon={Layers}        label="Class Groups" value={stats?.academic?.classGroups}        sub="active groups"          color="#0ea5e9" delay={50}  />
            <InfoCard icon={MessageCircle} label="Chat Enabled" value={stats?.academic?.coursesWithChat}    sub="courses with chat"      color="#10b981" delay={100} />
            <InfoCard icon={UserCog}       label="Unassigned"   value={stats?.academic?.unassignedStudents} sub="students without group" color="#f59e0b" delay={150} />
          </div>
        )}
      </section>

      {/* ── 4. Activity + System ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        <section>
          <SectionHeader eyebrow="Engagement" title="Activity" />
          {loading ? (
            <Skeleton className="h-32" />
          ) : (
            <div
              className="bg-white border border-slate-200 rounded-xl p-4"
              style={{ animation: 'fadeUp .35s ease 200ms both' }}
            >
              <SystemRow
                icon={MessageSquare}
                label="Total messages"
                value={stats?.activity?.totalMessages?.toLocaleString()}
                color="#6366f1"
              />
              <SystemRow
                icon={Users}
                label="Total users"
                value={(
                  (stats?.users?.students    ?? 0) +
                  (stats?.users?.teachers    ?? 0) +
                  (stats?.users?.coordinators ?? 0) +
                  (stats?.users?.admins      ?? 0)
                ).toLocaleString()}
                color="#0ea5e9"
              />
            </div>
          )}
        </section>

        <section>
          <SectionHeader eyebrow="Infrastructure" title="System Health" />
          {loading ? (
            <Skeleton className="h-32" />
          ) : (
            <div
              className="bg-white border border-slate-200 rounded-xl p-4"
              style={{ animation: 'fadeUp .35s ease 250ms both' }}
            >
              <SystemRow
                icon={Activity}
                label="Server uptime"
                value={stats?.system?.uptime}
                color="#10b981"
              />
              <SystemRow
                icon={Server}
                label="DB heartbeat"
                value={stats?.system?.lastDbSync}
                color="#f59e0b"
              />
            </div>
          )}
        </section>

      </div>

    </div>
  );
}
