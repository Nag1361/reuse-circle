import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowUpRight, FiHeart, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getListingImageUrl } from '../utils/imageUrl';

const statusLabel = (status) => status === 'reserved' ? 'Sold' : status;

export default function ListingCard({ listing, compact }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [toast, setToast] = useState('');
  const { user, wishlistIds, toggleWishlist: updateWishlist } = useAuth();
  const navigate = useNavigate();
  const label = statusLabel(listing?.status);
  const imageUrl = getListingImageUrl(listing);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const toggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) return navigate(`/login?returnTo=${encodeURIComponent(`/listings/${listing._id}`)}`);
    setWishlistBusy(true);
    try {
      const next = await updateWishlist(listing._id);
      setToast(next ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (error) {
      setToast(error.message);
    } finally {
      setWishlistBusy(false);
    }
  };

  const wishlisted = Boolean(listing?.wishlisted || wishlistIds?.has(String(listing?._id)));

  return (
    <article className={`listing-card reveal-card${compact ? ' listing-card-compact' : ''}`}>
      <div className="card-image">
        <Link to={`/listings/${listing._id}`} className="card-image-link" aria-label={`View ${listing.title}`}>
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={listing.title}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="image-placeholder">
              <span aria-hidden="true">♻</span>
              <small>Ready for a new home</small>
            </div>
          )}
          <span className={`badge badge-${label.toLowerCase()}`}>{label}</span>
        </Link>
        <button
          className={`wishlist-button${wishlisted ? ' is-wishlisted' : ''}`}
          type="button"
          aria-label={wishlisted ? `Remove ${listing.title} from wishlist` : `Add ${listing.title} to wishlist`}
          aria-pressed={wishlisted}
          aria-busy={wishlistBusy}
          disabled={wishlistBusy}
          onClick={toggleWishlist}
        >
          <FiHeart fill={wishlisted ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>
      <div className="card-body">
        <h3 className="listing-card-title">
          <Link to={`/listings/${listing._id}`}>{listing.title}</Link>
        </h3>
        <div className="eyebrow listing-card-meta">
          <span>{listing.category}</span>
          <span aria-hidden="true">·</span>
          <span>{listing.condition}</span>
        </div>
        <p className="location">
          <FiMapPin aria-hidden="true" />
          <span>{listing.pickupArea}</span>
        </p>
        <div className="card-actions">
          <Link className="card-link" to={`/listings/${listing._id}`}>
            View details <FiArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </div>
      {toast && <div className="card-toast" role="status">{toast}</div>}
    </article>
  );
}
