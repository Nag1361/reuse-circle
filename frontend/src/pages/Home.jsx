import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheck,
  FiHeart,
  FiMessageCircle,
  FiRefreshCw,
  FiSearch,
  FiShare2
} from 'react-icons/fi';
import api from '../api/client';
import ListingCard from '../components/ListingCard';
import { ErrorState, Loading } from '../components/States';
import { useAuth } from '../context/AuthContext';

const categories = [
  ['📚', 'Books'],
  ['♧', 'Furniture'],
  ['👕', 'Clothing'],
  ['🎧', 'Electronics'],
  ['🍵', 'Home & Kitchen'],
  ['🧸', 'Toys']
];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      setItems([]);
      return undefined;
    }

    setLoading(true);
    setError('');
    api.get('/listings', { params: { status: 'available', limit: 3 } })
      .then(({ data }) => setItems(data.data.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    return undefined;
  }, [authLoading, user, retry]);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="pill"><span className="pulse-dot" /> A better kind of neighborhood</span>
          <h1>Give More.<br /><em>Waste Less.</em></h1>
          <p>Give useful things a second life and discover what your community is ready to share.</p>
          <div className="hero-actions">
            <Link className="button" to="/browse">Explore Items <FiArrowRight aria-hidden="true" /></Link>
            <Link className="button button-outline" to="/listings/new">Give Something Away</Link>
          </div>
          <div className="home-hero-trust-row" aria-label="Key platform guarantees">
            <span className="hero-trust-tag"><FiCheck aria-hidden="true" /> 100% Free sharing</span>
            <span className="hero-trust-tag"><FiCheck aria-hidden="true" /> Verified neighbors</span>
            <span className="hero-trust-tag"><FiCheck aria-hidden="true" /> Zero landfill waste</span>
          </div>
          <div className="home-hero-note">
            <span className="home-hero-note-icon"><FiShare2 aria-hidden="true" /></span>
            <span>Good things, passed along.</span>
          </div>
        </div>
        <div className="home-hero-art">
          <span className="home-art-orbit home-art-orbit-one" aria-hidden="true" />
          <span className="home-art-orbit home-art-orbit-two" aria-hidden="true" />
          <div className="home-hero-badge hero-badge-top" aria-hidden="true">
            <span className="hero-badge-icon">🌱</span>
            <div>
              <strong>Zero Waste</strong>
              <small>Circulated Locally</small>
            </div>
          </div>
          <img
            className="reuse-hero-image"
            src="/images/reuse-hero-art.png"
            alt="Neighbors passing a box of reusable items, with books and plants"
          />
          <div className="home-hero-badge hero-badge-bottom" aria-hidden="true">
            <span className="hero-badge-icon">🤝</span>
            <div>
              <strong>100% Free</strong>
              <small>Neighbor to Neighbor</small>
            </div>
          </div>
          <span className="home-art-caption"><FiHeart aria-hidden="true" /> Shared with care</span>
        </div>
      </section>

      <section className="home-featured section wrap" aria-labelledby="featured-heading">
        <div className="section-heading">
          <div>
            <span className="kicker">A second chance starts here</span>
            <h2 id="featured-heading">Useful things, <em>nearby</em></h2>
          </div>
          {user && <Link className="inline-link" to="/browse">Browse everything <FiArrowRight aria-hidden="true" /></Link>}
        </div>
        {!user ? (
          <div className="home-empty">
            <p>Sign in to explore items shared by your neighbors.</p>
            <Link className="button" to="/login?returnTo=%2Fbrowse">Log in to explore <FiArrowRight aria-hidden="true" /></Link>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => setRetry((value) => value + 1)} />
        ) : loading ? (
          <Loading skeleton />
        ) : items.length ? (
          <div className="listing-grid">{items.map((item) => <ListingCard key={item._id} listing={item} />)}</div>
        ) : (
          <div className="home-empty">
            <p>No listings yet. Be the first to share something useful.</p>
            <Link className="inline-link" to="/listings/new">Give an item <FiArrowRight aria-hidden="true" /></Link>
          </div>
        )}
      </section>

      <section className="home-category-section" aria-labelledby="category-heading">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <span className="kicker">A little of everything</span>
              <h2 id="category-heading">Explore by <em>category</em></h2>
            </div>
            <p>Start with what you need. See what your neighbors have shared.</p>
          </div>
          <div className="category-grid">
            {categories.map(([emoji, name]) => (
              <Link key={name} to={`/browse?category=${encodeURIComponent(name)}`} className="category-card">
                <span aria-hidden="true">{emoji}</span>
                <strong>{name}</strong>
                <FiArrowRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-steps section wrap" aria-labelledby="steps-heading">
        <div className="section-heading">
          <div>
            <span className="kicker">How it works</span>
            <h2 id="steps-heading">The circular <em>community loop</em></h2>
          </div>
          <p>Four simple steps keep quality goods moving from neighbor to neighbor.</p>
        </div>
        <div className="steps-grid">
          <article className="step">
            <span>01</span>
            <FiShare2 aria-hidden="true" />
            <h3>1. Give</h3>
            <p>Pass along items you no longer need. Quick listing, 100% free, zero landfill waste.</p>
          </article>
          <article className="step">
            <span>02</span>
            <FiSearch aria-hidden="true" />
            <h3>2. Discover</h3>
            <p>Explore useful things your neighbors are ready to share nearby.</p>
          </article>
          <article className="step">
            <span>03</span>
            <FiMessageCircle aria-hidden="true" />
            <h3>3. Connect</h3>
            <p>Send a quick note, agree on details, and arrange a safe doorstep handoff.</p>
          </article>
          <article className="step">
            <span>04</span>
            <FiRefreshCw aria-hidden="true" />
            <h3>4. Circulate</h3>
            <p>When you're done with an item, pass it along again. Goods stay alive in the loop.</p>
          </article>
        </div>
      </section>

      <section className="home-community" aria-labelledby="community-heading">
        <div className="wrap home-community-inner">
          <span className="home-community-mark" aria-hidden="true"><FiRefreshCw /></span>
          <div>
            <span className="kicker">A more thoughtful way to share</span>
            <h2 id="community-heading">Good for your home.<br /><em>Good for the community.</em></h2>
            <p>When useful things move from one neighbor to another, we make more room for connection and less room for waste.</p>
            <div className="community-stats-grid">
              <div className="community-stat">
                <strong>100%</strong>
                <span>Free community sharing</span>
              </div>
              <div className="community-stat">
                <strong>0 kg</strong>
                <span>Landfill waste target</span>
              </div>
              <div className="community-stat">
                <strong>Local</strong>
                <span>Doorstep neighbor pickup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-cta wrap" aria-labelledby="home-cta-heading">
        <div>
          <span className="kicker">Pass something along</span>
          <h2 id="home-cta-heading">Have something useful you're not using?</h2>
          <p>Give it a second life with someone in your community.</p>
        </div>
        <Link className="button" to="/listings/new">Give an Item <FiArrowRight aria-hidden="true" /></Link>
      </section>
    </main>
  );
}
