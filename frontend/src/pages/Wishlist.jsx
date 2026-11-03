import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiHeart } from 'react-icons/fi';
import api from '../api/client';
import ListingCard from '../components/ListingCard';
import { EmptyState, ErrorState, Loading } from '../components/States';

export default function Wishlist() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/me/wishlist')
      .then(({ data }) => setListings(data.data.listings))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading skeleton />;

  return (
    <main className="page-wrap account-page wishlist-page">
      <header className="account-page-heading">
        <div>
          <span className="kicker">Saved for later</span>
          <h1>Your <em>wishlist</em></h1>
          <p>Keep track of useful things you hope to give a second life.</p>
        </div>
        <Link className="button button-outline" to="/browse">Browse items <FiArrowRight aria-hidden="true" /></Link>
      </header>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : listings.length ? (
        <section aria-label="Wishlisted items">
          <div className="wishlist-results-heading">
            <span className="wishlist-results-icon"><FiHeart aria-hidden="true" /></span>
            <p><strong>{listings.length}</strong> {listings.length === 1 ? 'saved item' : 'saved items'}</p>
          </div>
          <div className="listing-grid wishlist-listing-grid">
            {listings.map((listing) => <ListingCard key={listing._id} listing={listing} />)}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Your wishlist is empty"
          text="When something catches your eye, tap its heart to save it here."
          action={<Link className="button" to="/browse">Explore shared items <FiArrowRight aria-hidden="true" /></Link>}
        />
      )}
    </main>
  );
}
