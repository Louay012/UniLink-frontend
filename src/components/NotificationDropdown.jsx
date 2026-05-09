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

const ICONS = {
  announcement: Bell,
  message: MessageCircle,
  file: Paperclip
};

function NotificationItem({ item, onClose, onDismiss }) {
  const navigate = useNavigate();
  const Icon = ICONS[item.type] || Bell;

  function handleClick() {
    // Mark as read first
    if (!item.read && onDismiss) {
      onDismiss(item.id);
    }
    // Navigate to the target
    if (item.link) {
      navigate(item.link);
    }
    onClose();
  }

  return (
    <button
      type="button"
      className={`notif-item ${item.read ? "read" : "unread"}`}
      onClick={handleClick}
    >
      <span className={`notif-icon notif-icon-${item.type || "announcement"}`}>
        <Icon size={14} />
      </span>
      <div className="notif-body">
        <p className="notif-title">{item.title}</p>
        <p className="notif-subtitle">{item.subtitle}</p>
      </div>
      <small className="notif-time">{timeAgo(item.timestamp)}</small>
    </button>
  );
}

function NotificationGroup({ label, items, onClose, onDismiss }) {
  if (!items.length) return null;

  return (
    <div className="notif-group">
      <p className="notif-group-label">{label}</p>
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
    <div className="notif-dropdown">
      <div className="notif-header">
        <div>
          <h4>Notifications</h4>
          {unreadCount > 0 && <span className="notif-header-count">{unreadCount} new</span>}
        </div>
        <div className="notif-header-actions">
          {unreadCount > 0 && onMarkAllRead && (
            <button type="button" className="notif-mark-all" onClick={onMarkAllRead} title="Mark all as read">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button type="button" className="notif-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="notif-list">
        {!hasAny && (
          <div className="notif-empty">
            <Bell size={28} />
            <p>You're all caught up!</p>
            <small>No new notifications</small>
          </div>
        )}

        <NotificationGroup label="Today" items={groups.today} onClose={onClose} onDismiss={onDismiss} />
        <NotificationGroup label="Yesterday" items={groups.yesterday} onClose={onClose} onDismiss={onDismiss} />
        <NotificationGroup label="Earlier" items={groups.earlier} onClose={onClose} onDismiss={onDismiss} />
      </div>
    </div>
  );
}
