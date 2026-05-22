import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle, Paperclip, X, CheckCheck } from "lucide-react";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function groupByDay(items) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = { today: [], yesterday: [], earlier: [] };

  for (const item of items) {
    const date = new Date(item.timestamp);
    if (Number.isNaN(date.getTime())) {
      groups.earlier.push(item);
      continue;
    }
    if (date.toDateString() === today.toDateString()) {
      groups.today.push(item);
    } else if (date.toDateString() === yesterday.toDateString()) {
      groups.yesterday.push(item);
    } else {
      groups.earlier.push(item);
    }
  }

  return groups;
}

const ICON_MAP = {
  announcement: { Icon: Bell,           bg: "bg-amber-500/15", text: "text-amber-700" },
  message:      { Icon: MessageCircle,  bg: "bg-blue-500/15",  text: "text-blue-700" },
  file:         { Icon: Paperclip,      bg: "bg-emerald-500/15", text: "text-emerald-700" },
};

function NotificationItem({ item, onClose, onDismiss }) {
  const navigate = useNavigate();
  const { Icon, bg, text } = ICON_MAP[item.type] || ICON_MAP.announcement;

  function handleClick() {
    if (!item.read && onDismiss) {
      onDismiss(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
    onClose();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-start gap-2.5 w-full px-2.5 py-2.5 border-0 rounded-xl text-left cursor-pointer transition-colors
        ${item.read
          ? "bg-transparent hover:bg-slate-50"
          : "bg-sky-500/[0.06] hover:bg-sky-500/[0.1]"
        }`}
    >
      {/* Icon */}
      <span className={`inline-flex items-center justify-center w-[30px] h-[30px] flex-shrink-0 rounded-lg mt-0.5 ${bg} ${text}`}>
        <Icon size={14} />
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="m-0 text-[0.82rem] font-bold text-slate-800 truncate">{item.title}</p>
        <p className="m-0 mt-0.5 text-[0.74rem] text-slate-400 truncate">{item.subtitle}</p>
      </div>

      {/* Time */}
      <small className="flex-shrink-0 text-[0.68rem] text-slate-400 whitespace-nowrap mt-0.5">
        {timeAgo(item.timestamp)}
      </small>
    </button>
  );
}

function NotificationGroup({ label, items, onClose, onDismiss }) {
  if (!items.length) return null;

  return (
    <div className="mb-1">
      <p className="m-0 px-2.5 pt-2 pb-1 text-[0.7rem] font-extrabold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      {items.map((item) => (
        <NotificationItem key={item.id} item={item} onClose={onClose} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export default function NotificationDropdown({ notifications = [], onClose, onMarkAllRead, onDismiss }) {
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  );

  const groups = groupByDay(sorted);
  const hasAny = sorted.length > 0;
  const unreadCount = sorted.filter((n) => !n.read).length;

  return (
    <div
      className="w-[380px] max-sm:w-[min(360px,calc(100vw-1.5rem))] max-h-[520px] rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden"
      style={{
        boxShadow: "0 20px 50px rgba(2,6,23,0.18), 0 0 0 1px rgba(2,6,23,0.04)",
        animation: "notif-slide-in 200ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
        <div>
          <h4 className="text-[0.95rem] font-extrabold text-slate-800 m-0 font-heading">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-[0.72rem] font-bold text-red-500">{unreadCount} new</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && onMarkAllRead && (
            <button
              type="button"
              onClick={onMarkAllRead}
              title="Mark all as read"
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border-0 bg-transparent text-sky-700 text-xs font-bold cursor-pointer hover:bg-sky-500/10 transition-colors"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border-0 bg-transparent text-slate-400 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-1">
        {!hasAny && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-slate-400">
            <Bell size={28} />
            <p className="m-0 mt-2 font-bold text-slate-700 text-[0.92rem]">You're all caught up!</p>
            <small className="mt-0.5 text-sm">No new notifications</small>
          </div>
        )}

        <NotificationGroup label="Today" items={groups.today} onClose={onClose} onDismiss={onDismiss} />
        <NotificationGroup label="Yesterday" items={groups.yesterday} onClose={onClose} onDismiss={onDismiss} />
        <NotificationGroup label="Earlier" items={groups.earlier} onClose={onClose} onDismiss={onDismiss} />
      </div>
    </div>
  );
}
