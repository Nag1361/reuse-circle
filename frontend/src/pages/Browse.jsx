import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import api from '../api/client';
import ListingCard from '../components/ListingCard';
import { EmptyState, ErrorState, Loading } from '../components/States';

const categories = ['Electronics', 'Books', 'Clothing', 'Furniture', 'Home & Kitchen', 'Toys', 'Sports', 'Other'];
const conditions = ['Like New', 'Good', 'Fair'];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [data, setData] = useState({ items: [], pagination: { total: 0, pages: 0, page: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get('/listings', {
      params: Object.fromEntries([...params].filter(([, value]) => value)),
      signal: controller.signal
    }).then(({ data: response }) => setData(response.data))
      .catch((e) => { if (!controller.signal.aborted && e.name !== 'CanceledError') setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [params, retry]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setParams(next);
  };
  const submit = (event) => { event.preventDefault(); update('search', search.trim()); };
  const clear = () => { setSearch(''); setParams({}); };

  const currentCategory = params.get('category') || '';

  return (
    <main className="page-wrap browse-page">
      <div className="page-heading">
        <span className="kicker">Good things, nearby</span>
        <h1>Discover what's <em>being shared</em></h1>
        <p>Find useful items shared by people in your community.</p>
      </div>

      <div className="browse-discovery">
        <form className="search-bar" role="search" onSubmit={submit}>
          <FiSearch aria-hidden="true" />
          <input
            aria-label="Search items"
            placeholder="Search books, furniture, or something specific…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="button" type="submit">
            <FiSearch aria-hidden="true" />
            <span>Search</span>
          </button>
        </form>

        <div className="browse-category-chips" role="region" aria-label="Quick category filters">
          <button
            type="button"
            className={`category-chip${!currentCategory ? ' is-active' : ''}`}
            onClick={() => update('category', '')}
          >
            All
          </button>
          {categories.map((category) => {
            const isActive = currentCategory === category;
            return (
              <button
                key={category}
                type="button"
                className={`category-chip${isActive ? ' is-active' : ''}`}
                onClick={() => update('category', isActive ? '' : category)}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="browse-filters" aria-label="Filter shared items">
          <label>
            Category
            <select aria-label="Category" value={currentCategory} onChange={(event) => update('category', event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>

          <label>
            Condition
            <select aria-label="Condition" value={params.get('condition') || ''} onChange={(event) => update('condition', event.target.value)}>
              <option value="">Any condition</option>
              {conditions.map((condition) => <option key={condition}>{condition}</option>)}
            </select>
          </label>

          <label>
            Location
            <input aria-label="Location" value={params.get('location') || ''} placeholder="Neighborhood" onChange={(event) => update('location', event.target.value)} />
          </label>

          <label>
            Availability
            <select aria-label="Availability" value={params.get('status') || ''} onChange={(event) => update('status', event.target.value)}>
              <option value="">Any status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="collected">Collected</option>
            </select>
          </label>

          <label>
            Sort
            <select aria-label="Sort" value={params.get('sort') || 'newest'} onChange={(event) => update('sort', event.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>

          <label className="filter-check">
            <input type="checkbox" checked={params.get('recent') === 'true'} onChange={(event) => update('recent', event.target.checked ? 'true' : '')} />
            Recently added
          </label>

          {params.size > 0 && (
            <button className="clear-button" onClick={clear} type="button">
              <FiX aria-hidden="true" /> Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="results-line" aria-live="polite">
        <strong>{data.pagination.total} {data.pagination.total === 1 ? 'item' : 'items'}</strong>
        <span>Shared with the community</span>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => setRetry((value) => value + 1)} />
      ) : loading ? (
        <Loading skeleton />
      ) : data.items.length > 0 ? (
        <>
          <div className="listing-grid browse-listing-grid">
            {data.items.map((item) => (
              <ListingCard key={item._id} listing={item} />
            ))}
          </div>
          {data.pagination.pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button disabled={data.pagination.page <= 1} onClick={() => update('page', String(data.pagination.page - 1))}>
                Previous
              </button>
              <span>Page {data.pagination.page} of {data.pagination.pages}</span>
              <button disabled={data.pagination.page >= data.pagination.pages} onClick={() => update('page', String(data.pagination.page + 1))}>
                Next
              </button>
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          title="Nothing here yet"
          text="Try changing your filters or search for something else."
          action={<button className="button button-outline" onClick={clear}>Clear filters</button>}
        />
      )}
    </main>
  );
}
