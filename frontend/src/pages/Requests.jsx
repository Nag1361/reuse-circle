import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiInbox, FiPackage, FiX } from 'react-icons/fi';
import api from '../api/client';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { getListingImageUrl } from '../utils/imageUrl';

function RequestStatus({ status }) {
  const label = status === 'declined' ? 'Declined' : status[0].toUpperCase() + status.slice(1);
  return <span className={`badge badge-${status}`}>{label}</span>;
}

export default function Requests({ incoming = false }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [rejection, setRejection] = useState(null);
  const [reason, setReason] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (incoming) {
        const listings = (await api.get('/me/listings')).data.data.listings;
        const result = await Promise.all(listings.map(async (listing) => (
          await api.get(`/listings/${listing._id}/requests`)
        ).data.data.requests.map((request) => ({ ...request, listing }))));
        setRequests(result.flat());
      } else {
        const [requestResponse, notificationResponse] = await Promise.all([
          api.get('/me/requests'),
          api.get('/me/notifications')
        ]);
        setRequests(requestResponse.data.data.requests.filter((request) => request.listingId));
        setNotifications(notificationResponse.data.data.notifications);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [incoming]);

  const resolve = async (id, status) => {
    try {
      await api.patch(`/requests/${id}/status`, { status, rejectionReason: reason });
      setRejection(null);
      setReason('');
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

  if (loading) return <Loading skeleton />;

  return (
    <main className="page-wrap account-page requests-page">
      <header className="account-page-heading">
        <div>
          <span className="kicker">{incoming ? 'Requests received' : 'Requests sent'}</span>
          <h1>{incoming ? <>Incoming <em>Requests</em></> : <>Your <em>Requests</em></>}</h1>
          <p>
            {incoming
              ? 'Review neighbors who are interested in the things you shared.'
              : 'Follow every request from first message to collection.'}
          </p>
        </div>
        {incoming
          ? <Link className="button button-outline" to="/dashboard">Back to dashboard</Link>
          : <Link className="button button-outline" to="/browse">Browse items</Link>}
      </header>

      {!incoming && notifications.length > 0 && (
        <section className="notification-panel" aria-labelledby="notification-heading">
          <div className="account-section-heading">
            <div className="notification-title">
              <span className="notification-icon"><FiBell aria-hidden="true" /></span>
              <h2 id="notification-heading">Notifications</h2>
            </div>
            <span className="unread-count" aria-label={`${notifications.filter((item) => !item.readAt).length} unread`}>
              {notifications.filter((item) => !item.readAt).length}
            </span>
          </div>
          <div className="notification-list">
            {notifications.map((notification) => (
              <button
                className={`notification-item${notification.readAt ? '' : ' unread'}`}
                key={notification._id}
                type="button"
                onClick={async () => {
                  if (!notification.readAt) {
                    await api.patch(`/notifications/${notification._id}/read`);
                    setNotifications(notifications.map((item) => (
                      item._id === notification._id
                        ? { ...item, readAt: new Date().toISOString() }
                        : item
                    )));
                  }
                }}
              >
                <strong>{notification.message}</strong>
                <span>{notification.reason}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !requests.length ? (
        <EmptyState
          title={incoming ? 'No incoming requests' : 'No requests yet'}
          text={incoming
            ? 'When someone requests one of your items, it will appear here.'
            : 'Explore available items and send a thoughtful request.'}
          action={!incoming && <Link className="button" to="/browse">Explore items</Link>}
        />
      ) : (
        <div className="request-management-list">
          {requests.map((request) => {
            const listing = incoming ? request.listing : request.listingId;
            const thumbUrl = getListingImageUrl(listing);
            return (
              <article className="request-management-card" key={request._id}>
                <div className="request-thumb">
                  {thumbUrl
                    ? <img src={thumbUrl} alt={listing?.title || ''} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    : <span aria-hidden="true">♻</span>}
                </div>
                <div className="request-management-content">
                  <div className="request-management-heading">
                    <div>
                      <span className="kicker">{incoming ? 'Incoming request' : 'Item request'}</span>
                      <h2>{listing?.title}</h2>
                    </div>
                    <RequestStatus status={request.status} />
                  </div>
                  <p className="request-person">
                    {incoming
                      ? `From ${request.requesterId?.name || 'Neighbor'}`
                      : `For ${listing?.ownerName || 'a community member'}`}
                    {' · '}{new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  <p className="request-message">{request.message}</p>
                  {request.rejectionReason && (
                    <div className="rejection-reason">
                      <strong>Rejection reason</strong>
                      <p>{request.rejectionReason}</p>
                    </div>
                  )}
                  {incoming && request.status === 'pending' && (
                    <div className="request-card-actions">
                      <button className="button" type="button" onClick={() => resolve(request._id, 'accepted')}>Accept</button>
                      <button
                        className="button button-outline request-decline-button"
                        type="button"
                        onClick={() => { setRejection(request); setReason(''); }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {!incoming && request.status === 'accepted' && (
                    <button className="button request-collect-button" type="button" onClick={() => collect(request._id)}>
                      Mark as collected
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {rejection && (
        <div className="modal-backdrop" role="presentation">
          <section className="reason-modal" role="dialog" aria-modal="true" aria-labelledby="rejection-title">
            <button className="modal-close" type="button" aria-label="Close" onClick={() => setRejection(null)}>
              <FiX aria-hidden="true" />
            </button>
            <span className="kicker">A thoughtful response</span>
            <h2 id="rejection-title">Decline request for {rejection.listing?.title || 'this item'}?</h2>
            <p>Let {rejection.requesterId?.name || 'your neighbor'} know why you cannot accept this request.</p>
            <label>
              Reason
              <textarea
                autoFocus
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                minLength="5"
                maxLength="1000"
                placeholder="Please explain why you are declining this request."
              />
            </label>
            <div className="detail-actions">
              <button className="button button-outline" type="button" onClick={() => setRejection(null)}>Cancel</button>
              <button
                className="button"
                type="button"
                disabled={reason.trim().length < 5}
                onClick={() => resolve(rejection._id, 'declined')}
              >
                Confirm Decline
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
