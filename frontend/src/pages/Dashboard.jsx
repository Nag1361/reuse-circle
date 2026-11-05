import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiInbox, FiPackage, FiPlus, FiAlertTriangle, FiCheckCircle, FiCheck, FiInfo } from 'react-icons/fi';
import api from '../api/client';
import ListingCard from '../components/ListingCard';
import { EmptyState, ErrorState, Loading } from '../components/States';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [recent, setRecent] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [incoming, setIncoming] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, l, r, recentResponse, wishlistResponse, notifResponse] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/me/listings'),
        api.get('/me/requests'),
        api.get('/me/recently-viewed'),
        api.get('/me/wishlist'),
        api.get('/me/notifications').catch(() => ({ data: { data: { notifications: [], unread: 0 } } }))
      ]);
      setSummary(s.data.data);
      setListings(l.data.data.listings);
      setRequests(r.data.data.requests.filter((request) => request.listingId));
      setRecent(recentResponse.data.data.listings);
      setWishlist(wishlistResponse.data.data.listings);
      setNotifications(notifResponse.data.data.notifications || []);
      setUnreadCount(notifResponse.data.data.unread || 0);

      const entries = await Promise.all(l.data.data.listings
        .filter((x) => ['available', 'reserved', 'sold'].includes(x.status))
        .map(async (x) => {
          try {
            return [x._id, (await api.get(`/listings/${x._id}/requests`)).data.data.requests];
          } catch {
            return [x._id, []];
          }
        }));
      setIncoming(Object.fromEntries(entries));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markNotificationAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      setError(e.message);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.patch('/me/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (e) {
      setError(e.message);
    }
  };

  const act = async (id, status) => {
    try {
      await api.patch(`/requests/${id}/status`, { status });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const collect = async (id) => {
    try {
      await api.patch(`/requests/${id}/collect`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <Loading />;

  const metrics = [
    { label: 'My listings', value: summary?.totalListings, accent: 'forest' },
    { label: 'Active listings', value: summary?.availableListings, accent: 'green' },
    { label: 'Requests received', value: summary?.pendingRequestsReceived, accent: 'amber' },
    { label: 'Sent requests', value: summary?.requestsSubmitted, accent: 'blue' },
    { label: 'Collected items', value: summary?.collectedItems, accent: 'sage' }
  ];

  return (
    <main className="page-wrap account-page dashboard-page">
      <header className="dashboard-heading">
        <div>
          <span className="kicker">Your corner of the circle</span>
          <h1>Your <em>ReUseCircle</em></h1>
          <p>Keep track of the good things you’ve shared and found.</p>
        </div>
        <div className="dashboard-header-actions">
          <Link className="button button-outline" to="/browse">Browse items <FiArrowRight aria-hidden="true" /></Link>
          <Link className="button" to="/listings/new"><FiPlus aria-hidden="true" /> Give an item</Link>
        </div>
      </header>

      {error && <ErrorState message={error} />}

      <section className="dashboard-summary" aria-label="Your activity summary">
        {metrics.map(({ label, value, accent }) => (
          <article className={`stat-card stat-card-${accent}`} key={label}>
            <span>{label}</span>
            <strong>{value ?? 0}</strong>
          </article>
        ))}
      </section>

      {notifications.length > 0 && (
        <section className="dash-section dashboard-notifications-section" aria-label="Notifications and alerts">
          <div className="account-section-heading">
            <div>
              <span className="kicker">Important updates</span>
              <h2>Notifications & Alerts {unreadCount > 0 && <span className="notification-badge-inline">{unreadCount} new</span>}</h2>
            </div>
            {unreadCount > 0 && (
              <button className="button button-ghost button-small" type="button" onClick={markAllNotificationsAsRead}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="dashboard-notifications-list">
            {notifications.map((n) => {
              const isUnread = !n.readAt;
              const isReport = n.type === 'listing_reported' || n.type === 'report_reviewed';
              const isDismissed = n.type === 'report_dismissed';
              return (
                <article
                  key={n._id}
                  className={`dashboard-notification-card ${isReport ? 'card-warning' : isDismissed ? 'card-success' : 'card-info'} ${isUnread ? 'is-unread' : 'is-read'}`}
                >
                  <div className="notification-card-icon">
                    {isReport ? <FiAlertTriangle aria-hidden="true" /> : isDismissed ? <FiCheckCircle aria-hidden="true" /> : <FiInfo aria-hidden="true" />}
                  </div>
                  <div className="notification-card-body">
                    <p className="notification-card-message">{n.message}</p>
                    {n.reason && (
                      <p className="notification-card-reason">
                        <strong>Reason provided:</strong> {n.reason}
                      </p>
                    )}
                    <span className="notification-card-time">
                      {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="notification-card-action">
                    {isUnread ? (
                      <button className="small-action" type="button" onClick={() => markNotificationAsRead(n._id)}>
                        Mark as read
                      </button>
                    ) : (
                      <span className="notification-read-badge"><FiCheck aria-hidden="true" /> Read</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="dash-section dashboard-listings-section">
        <div className="account-section-heading">
          <div>
            <span className="kicker">Things you’re sharing</span>
            <h2>My listings</h2>
          </div>
          <Link className="inline-link" to="/listings/new">Give an item <FiPlus aria-hidden="true" /></Link>
        </div>
        {!listings.length ? (
          <EmptyState
            title="Your shelf is empty"
            text="List an item and give it a chance at a new home."
            action={<Link className="button" to="/listings/new">Share an item</Link>}
          />
        ) : (
          <div className="listing-grid dashboard-listing-grid">
            {listings.map((x) => (
              <article className="dashboard-listing" key={x._id}>
                <ListingCard listing={x} />
                {x.status === 'available' && (
                  <div className="listing-manage">
                    <Link className="small-action" to={`/listings/${x._id}/edit`}>Edit</Link>
                    <button className="small-action danger-text" type="button" onClick={() => remove(x._id)}>Delete</button>
                  </div>
                )}
                {incoming[x._id]?.length > 0 && (
                  <div className="incoming">
                    <h3><FiInbox aria-hidden="true" /> Received requests</h3>
                    {incoming[x._id].map((r) => (
                      <div className="request-row" key={r._id}>
                        <p><strong>{r.requesterId?.name || 'Neighbor'}</strong>: {r.message}</p>
                        <span className={`badge badge-${r.status}`}>{r.status}</span>
                        {r.status === 'pending' && (
                          <div>
                            <button className="small-action" type="button" onClick={() => act(r._id, 'accepted')}>Accept</button>
                            <button className="small-action" type="button" onClick={() => act(r._id, 'declined')}>Decline</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dash-section">
        <div className="account-section-heading">
          <div>
            <span className="kicker">Things you’re looking for</span>
            <h2>Sent requests</h2>
          </div>
          <Link className="inline-link" to="/requests">View requests <FiArrowRight aria-hidden="true" /></Link>
        </div>
        {requests.length ? (
          <div className="request-list dashboard-request-list">
            {requests.map((r) => (
              <article className="request-card" key={r._id}>
                <FiPackage aria-hidden="true" />
                <div>
                  <strong>{r.listingId.title}</strong>
                  <p>{r.message}</p>
                  <span>Item: {r.listingId.status === 'reserved' ? 'sold' : r.listingId.status} · Request: {r.status}</span>
                  {r.listingId.pickupAddress && (
                    <div className="pickup-details">
                      <h3>Pickup details</h3>
                      <p><strong>Address:</strong> {r.listingId.pickupAddress}</p>
                      <p><strong>Days and time:</strong> {r.listingId.pickupTime}</p>
                    </div>
                  )}
                  {r.status === 'accepted' && (
                    <button className="small-action" type="button" onClick={() => collect(r._id)}>Mark as collected</button>
                  )}
                </div>
                <span className={`badge badge-${r.status}`}>{r.status}</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No sent requests yet"
            text="Explore available items and find something useful for your home."
            action={<Link className="button button-outline" to="/browse">Browse items</Link>}
          />
        )}
      </section>

      <section className="dash-section dashboard-subsection">
        <div className="account-section-heading">
          <div>
            <span className="kicker">Your saved trail</span>
            <h2>Recently viewed</h2>
          </div>
        </div>
        {recent.length
          ? <div className="recently-viewed-grid">{recent.slice(0, 4).map((listing) => <ListingCard key={listing._id} listing={listing} compact />)}</div>
          : <p className="account-inline-empty">Items you open will appear here.</p>}
      </section>

      <section className="dash-section dashboard-subsection">
        <div className="account-section-heading">
          <div>
            <span className="kicker">Saved for later</span>
            <h2>Wishlist</h2>
          </div>
          <Link className="inline-link" to="/wishlist">View all <FiArrowRight aria-hidden="true" /></Link>
        </div>
        {wishlist.length
          ? <div className="listing-grid">{wishlist.slice(0, 3).map((listing) => <ListingCard key={listing._id} listing={{ ...listing, wishlisted: true }} />)}</div>
          : <p className="account-inline-empty">Your wishlist is empty. <Link to="/browse">Explore items.</Link></p>}
      </section>
    </main>
  );
}
