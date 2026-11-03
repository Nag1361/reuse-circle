import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiHeart, FiMapPin, FiArrowLeft, FiPhone, FiUser } from 'react-icons/fi';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ErrorState, Loading } from '../components/States';
import { getListingImageUrl } from '../utils/imageUrl';

export default function Detail() {
  const { id } = useParams();
  const { user, wishlistIds, toggleWishlist } = useAuth();
  const location = useLocation();
  const [item, setItem] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState(location.state?.message || '');
  const [report, setReport] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [retry, setRetry] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setError('');
    api.get(`/listings/${id}`)
      .then(({ data }) => setItem(data.data.listing))
      .catch((e) => {
        if (e.status === 401 || e.message.includes('full listing details')) {
          navigate(`/login?returnTo=${encodeURIComponent(`/listings/${id}`)}`, { replace: true });
        } else {
          setError(e.message);
        }
      });
  }, [id, retry, navigate]);

  useEffect(() => {
    if (user) {
      api.get('/me/requests')
        .then(({ data }) => setCurrentRequest(data.data.requests.find((request) => String(request.listingId?._id) === String(id)) || null))
        .catch(() => {});
    }
  }, [user, id]);

  const request = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/listings/${id}/requests`, { message });
      setNote('Request sent! The owner can now review it in their dashboard.');
      setMessage('');
    } catch (e) {
      setNote(e.message);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/listings/${id}/reports`, { reason: e.target.reason.value });
      setNote('Thanks for helping keep the community safe.');
      setReport(false);
    } catch (e) {
      setNote(e.message);
    }
  };

  if (error) return <main className="page-wrap"><ErrorState message={error} onRetry={() => { setItem(null); setRetry((value) => value + 1); }} /></main>;
  if (!item) return <Loading />;

  const owner = user && String(item.ownerId) === String(user.id);
  const statusLabel = item.status === 'reserved' ? 'Sold' : item.status;
  const wishlisted = wishlistIds?.has(String(id));
  const imageUrl = getListingImageUrl(item);

  return (
    <main className="page-wrap detail-page">
      <Link className="back-link" to="/browse"><FiArrowLeft aria-hidden="true" /> Back to explore</Link>
      <div className="detail-grid">
        <div className="detail-image">
          {imageUrl && !imageFailed ? (
            <img src={imageUrl} alt={item.title} onError={() => setImageFailed(true)} />
          ) : (
            <div className="image-placeholder">
              <span aria-hidden="true">♻</span>
              <small>Ready for a new home</small>
            </div>
          )}
        </div>

        <section className="detail-info" aria-labelledby="listing-title">
          <div className="detail-status-row">
            <span className={`badge badge-${statusLabel.toLowerCase()}`}>{statusLabel}</span>
            {user && (
              <button
                className={`wishlist-button detail-wishlist${wishlisted ? ' is-wishlisted' : ''}`}
                type="button"
                disabled={wishlistBusy}
                aria-busy={wishlistBusy}
                aria-pressed={wishlisted}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={async () => {
                  if (wishlistBusy) return;
                  setWishlistBusy(true);
                  try {
                    await toggleWishlist(id);
                  } catch (wishlistError) {
                    setNote(wishlistError.message);
                  } finally {
                    setWishlistBusy(false);
                  }
                }}
              >
                <FiHeart fill={wishlisted ? 'currentColor' : 'none'} aria-hidden="true" />
                {wishlisted ? 'Saved' : 'Save'}
              </button>
            )}
          </div>

          <h1 id="listing-title">{item.title}</h1>
          <div className="detail-metadata">
            <span>{item.category}</span>
            <span aria-hidden="true">·</span>
            <span>{item.condition}</span>
          </div>
          <p className="location detail-location"><FiMapPin aria-hidden="true" /><span>{item.pickupArea}</span></p>

          <section className="detail-description-section" aria-labelledby="description-heading">
            <h2 id="description-heading">A little about it</h2>
            <p className="detail-description">{item.description}</p>
          </section>

          {item.pickupAddress && (
            <aside className="pickup-details detail-pickup">
              <h2><FiMapPin aria-hidden="true" /> Pickup details</h2>
              <p><strong>Address:</strong> {item.pickupAddress}</p>
              <p><strong>Days and time:</strong> {item.pickupTime}</p>
              {!owner && <small>Shared because the owner accepted your request.</small>}
            </aside>
          )}

          <div className="detail-community">
            <span className="detail-community-icon"><FiUser aria-hidden="true" /></span>
            <div>
              <span className="detail-community-label">Shared by</span>
              <strong>{item.ownerName || 'Community member'}</strong>
            </div>
          </div>

          {item.contactPhone && (
            <p className="card-detail-line detail-contact">
              <FiPhone aria-hidden="true" />
              <span>Contact <a href={`tel:${item.contactPhone}`}>{item.contactPhone}</a></span>
            </p>
          )}

          <p className="muted detail-date">Shared {new Date(item.createdAt).toLocaleDateString()}</p>
          {note && <div className="notice" role="status">{note}</div>}

          <div className="detail-action-panel">
            {owner ? (
              <div className="detail-actions">
                <Link className="button button-outline" to={`/listings/${id}/edit`}>Edit listing</Link>
                <Link className="button" to="/dashboard">Manage requests</Link>
              </div>
            ) : item.status === 'available' ? (
              <>
                {user ? (
                  currentRequest && ['pending', 'accepted'].includes(currentRequest.status) ? (
                    <div className="notice">
                      <strong>You have already requested this item.</strong>
                      <p>Status: {currentRequest.status}. <Link to="/requests">View Sent Requests</Link></p>
                    </div>
                  ) : (
                    <form className="request-form" onSubmit={request}>
                      <label>
                        Interested? Send the owner a note
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          minLength="5"
                          maxLength="1000"
                          required
                          rows="3"
                          placeholder="Let them know why you'd like this item…"
                        />
                      </label>
                      <button className="button" type="submit">Request this item</button>
                    </form>
                  )
                ) : (
                  <Link className="button detail-request-link" to={`/login?returnTo=${encodeURIComponent(`/listings/${id}`)}`}>
                    Log in to request
                  </Link>
                )}
                <button className="report-link" type="button" onClick={() => user ? setReport(!report) : navigate('/login')}>
                  Report this listing
                </button>
                {report && (
                  <form className="request-form" onSubmit={submitReport}>
                    <label>
                      Why are you reporting this listing?
                      <textarea name="reason" required minLength="5" maxLength="1000" rows="3" />
                    </label>
                    <button className="button button-outline" type="submit">Send report</button>
                  </form>
                )}
              </>
            ) : (
              <p className="detail-unavailable" role="status">This item is no longer accepting requests.</p>
            )}
          </div>

          {currentRequest?.status === 'declined' && currentRequest.rejectionReason && (
            <div className="notice">
              <strong>Your previous request was rejected.</strong>
              <p>{currentRequest.rejectionReason}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
