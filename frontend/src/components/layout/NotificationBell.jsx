import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import './NotificationBell.css';

export default function NotificationBell() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Poll unread count every 30 seconds
  useEffect(() => {
    if (!user) return;
    const fetchCount = () => {
      api.get('/notifications/unread-count')
        .then((res) => {
          const data = res.data?.data || res.data;
          setUnreadCount(data.count || data.unreadCount || 0);
        })
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (open && user) {
      setLoading(true);
      api.get('/notifications?pageSize=10')
        .then((res) => {
          const data = res.data?.data || res.data;
          setNotifications(data.notifications || data || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleMarkAsRead = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.post(`/notifications/${notif.id}/read`);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch {}
    }
    if (notif.link) {
      navigate(notif.link);
      setOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const typeIcon = (type) => {
    const icons = {
      CLIENT_STEP_COMPLETED: '\u270F\uFE0F',
      CLIENT_PROFILE_COMPLETE: '\u2705',
      SIGNATURE_COMPLETED: '\u270D\uFE0F',
      SIGNATURE_PENDING: '\u23F3',
      DOCUMENT_UPLOADED: '\uD83D\uDCC4',
      DEADLINE_APPROACHING: '\u23F0',
      MESSAGE_RECEIVED: '\uD83D\uDCAC',
    };
    return icons[type] || '\uD83D\uDD14';
  };

  return (
    <div className="nb-container" ref={dropdownRef}>
      <button className="nb-bell-btn" onClick={() => setOpen(!open)} title="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="nb-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-dropdown-header">
            <span className="nb-dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="nb-mark-all" onClick={handleMarkAllRead}>
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="nb-dropdown-list">
            {loading && <div className="nb-empty">Chargement...</div>}
            {!loading && notifications.length === 0 && (
              <div className="nb-empty">Aucune notification</div>
            )}
            {!loading &&
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  className={`nb-item ${!notif.isRead ? 'nb-item--unread' : ''}`}
                  onClick={() => handleMarkAsRead(notif)}
                >
                  <span className="nb-item-icon">{typeIcon(notif.type)}</span>
                  <div className="nb-item-content">
                    <div className="nb-item-title">{notif.title}</div>
                    <div className="nb-item-message">{notif.message}</div>
                    <div className="nb-item-time">{formatTime(notif.createdAt)}</div>
                  </div>
                  {!notif.isRead && <span className="nb-item-dot" />}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
