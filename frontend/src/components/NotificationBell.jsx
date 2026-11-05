import { useEffect, useRef, useState } from 'react';
import { FiBell, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnread = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/me/notifications/unread-count');
      setUnreadCount(data.data.unread || 0);
    } catch {
      // ignore
    }
  };

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/me/notifications');
      setNotifications(data.data.notifications || []);
      setUnreadCount(data.data.unread || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleOpen = () => {
    if (!isOpen) {
      fetchAll();
    }
    setIsOpen((prev) => !prev);
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await api.patch('/me/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-btn"
        type="button"
        onClick={toggleOpen}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <FiBell aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown" role="region" aria-label="Notifications panel">
          <div className="notification-dropdown-header">
            <div className="notification-dropdown-title">
              <strong>Notifications</strong>
              {unreadCount > 0 && <span className="notification-unread-pill">{unreadCount} new</span>}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-read-all-btn"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown-list">
            {loading ? (
              <div className="notification-empty">Loading notifications…</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No notifications yet.</div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                const isReport = n.type === 'listing_reported' || n.type === 'report_reviewed';
                const isDismissed = n.type === 'report_dismissed';
                return (
                  <div
                    key={n._id}
                    className={`notification-item ${isUnread ? 'unread' : 'read'}`}
                  >
                    <div className="notification-item-icon">
                      {isReport ? (
                        <FiAlertTriangle className="icon-warning" aria-hidden="true" />
                      ) : isDismissed ? (
                        <FiCheckCircle className="icon-success" aria-hidden="true" />
                      ) : (
                        <FiInfo className="icon-info" aria-hidden="true" />
                      )}
                    </div>
                    <div className="notification-item-content">
                      <p className="notification-item-message">{n.message}</p>
                      {n.reason && (
                        <p className="notification-item-reason">
                          <small><strong>Reason:</strong> {n.reason}</small>
                        </p>
                      )}
                      <div className="notification-item-footer">
                        <time className="notification-item-time">
                          {new Date(n.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </time>
                        {isUnread && (
                          <button
                            type="button"
                            className="notification-mark-read-btn"
                            onClick={(e) => markAsRead(n._id, e)}
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

