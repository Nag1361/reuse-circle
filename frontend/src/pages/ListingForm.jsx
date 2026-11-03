import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import PhoneInput from '../components/PhoneInput';
import { getListingImageUrl } from '../utils/imageUrl';

const categoryOptions = ['Electronics', 'Books', 'Clothing', 'Furniture', 'Home & Kitchen', 'Toys', 'Sports', 'Other'];
const empty = { title: '', category: '', customCategory: '', condition: '', description: '', pickupArea: '', pickupAddress: '', pickupTime: '', contactPhone: '', imageUrl: '' };

export default function ListingForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (edit) api.get(`/listings/${id}`).then(({ data }) => {
      const listing = data.data.listing;
      setForm({ ...empty, ...listing, category: categoryOptions.includes(listing.category) ? listing.category : 'Other', customCategory: categoryOptions.includes(listing.category) ? '' : listing.category });
      setImagePreview(getListingImageUrl(listing));
    }).catch(e => setError(e.message));
  }, [id, edit]);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); if (busy) return; setBusy(true); setError('');
    try {
      const { customCategory, title, category, condition, description, pickupArea, pickupAddress, pickupTime, contactPhone } = form;
      const payload = { title, category, condition, description, pickupArea, pickupAddress, pickupTime, contactPhone };
      if (form.category === 'Other') payload.category = customCategory.trim();
      const multipart = new FormData();
      Object.entries(payload).forEach(([key, value]) => multipart.append(key, value));
      if (imageFile) {
        multipart.append('image', imageFile);
      } else if (edit && !imagePreview) {
        multipart.append('imageUrl', '');
      }
      const { data } = await api[edit ? 'patch' : 'post'](edit ? `/listings/${id}` : '/listings', multipart);
      const updatedListing = data?.data?.listing;
      if (!updatedListing?._id) throw new Error('The listing was saved, but its updated details were not returned.');
      navigate(`/listings/${updatedListing._id}`, { replace: true, state: { message: edit ? 'Your listing was updated successfully.' : 'Your item was shared successfully.' } });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <main className="page-wrap listing-create-page">
      <header className="listing-form-heading">
        <span className="kicker">{edit ? 'Give it an update' : 'Pass something along'}</span>
        <h1>{edit ? 'Edit your listing' : <>Give something <em>a second life</em></>}</h1>
        <p>{edit ? 'Update the details so your neighbors know what you are sharing.' : 'Share something useful with someone in your community.'}</p>
      </header>
      <form className="form-card listing-form listing-form-card" onSubmit={submit}>
        {error && <div className="notice error" role="alert">{error}</div>}

        <section className="listing-form-section" aria-labelledby="basic-info-heading">
          <div className="listing-form-section-heading">
            <span className="listing-form-step">01</span>
            <div>
              <h2 id="basic-info-heading">Basic information</h2>
              <p>Start with the details that help your item stand out.</p>
            </div>
          </div>
          <label>
            Item title
            <input name="title" value={form.title} onChange={change} required minLength="2" maxLength="120" placeholder="e.g. A well-loved reading lamp" />
          </label>
          <label>
            Category
            <select name="category" value={form.category} onChange={change} required>
              <option value="">Choose a category</option>
              {categoryOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {form.category === 'Other' && (
            <label>
              Type your category
              <input name="customCategory" value={form.customCategory} onChange={change} required minLength="2" maxLength="80" placeholder="e.g. Musical instruments" />
            </label>
          )}
        </section>

        <section className="listing-form-section" aria-labelledby="item-details-heading">
          <div className="listing-form-section-heading">
            <span className="listing-form-step">02</span>
            <div>
              <h2 id="item-details-heading">Item details</h2>
              <p>A few helpful details make it easier for a neighbor to picture it.</p>
            </div>
          </div>
          <label>
            Condition
            <select name="condition" value={form.condition} onChange={change} required>
              <option value="">Choose condition</option>
              {['Like New', 'Good', 'Fair'].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Description
            <textarea name="description" value={form.description} onChange={change} required minLength="10" maxLength="2000" rows="5" placeholder="What's useful to know about it?" />
          </label>
        </section>

        <section className="listing-form-section" aria-labelledby="pickup-info-heading">
          <div className="listing-form-section-heading">
            <span className="listing-form-step">03</span>
            <div>
              <h2 id="pickup-info-heading">Pickup information</h2>
              <p>Let people know where and when pickup can happen.</p>
            </div>
          </div>
          <label>
            Approximate pickup area
            <input name="pickupArea" value={form.pickupArea} onChange={change} required minLength="2" maxLength="120" placeholder="Neighborhood or nearby landmark" />
          </label>
          <label>
            Exact pickup address <span className="muted">(only shown to you and the person you accept)</span>
            <input name="pickupAddress" value={form.pickupAddress} onChange={change} required minLength="5" maxLength="300" placeholder="Street, building, and any directions" autoComplete="street-address" />
          </label>
          <label>
            Pickup days and time <span className="muted">(for example, weekdays 5–7 PM)</span>
            <input name="pickupTime" value={form.pickupTime} onChange={change} required minLength="3" maxLength="200" placeholder="When can the item be collected?" />
          </label>
          <label>
            Contact phone <span className="muted">(shown publicly on your listing; international format)</span>
            <PhoneInput value={form.contactPhone} onChange={(contactPhone) => setForm({ ...form, contactPhone })} />
          </label>
        </section>

        <section className="listing-form-section listing-image-section" aria-labelledby="item-image-heading">
          <div className="listing-form-section-heading">
            <span className="listing-form-step">04</span>
            <div>
              <h2 id="item-image-heading">Add an image</h2>
              <p>A photo can help your neighbors recognize the item.</p>
            </div>
          </div>
          <label>
            Item image <span className="muted">(optional, JPEG, PNG, WebP, or GIF; max 5 MB)</span>
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setImageFile(file);
                setImagePreview(file ? URL.createObjectURL(file) : getListingImageUrl(form));
              }}
            />
          </label>
          {imagePreview && (
            <div className="listing-photo-preview-wrap">
              <img
                className="listing-photo-preview"
                src={imagePreview}
                alt="Preview of the item"
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                onLoad={(event) => { event.currentTarget.style.display = 'block'; }}
              />
              <button
                type="button"
                className="small-action remove-image-button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview('');
                  const fileInput = document.querySelector('input[type="file"][name="image"]');
                  if (fileInput) fileInput.value = '';
                }}
              >
                Clear selected photo
              </button>
            </div>
          )}
        </section>

        <div className="listing-form-submit">
          <p>Thank you for helping something useful find a new home.</p>
          <button className="button form-submit" disabled={busy}>
            {busy ? 'Saving…' : edit ? 'Save changes' : 'Share this item'}
          </button>
        </div>
      </form>
    </main>
  );
}
