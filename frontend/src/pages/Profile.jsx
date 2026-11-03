import { useEffect, useState } from 'react';
import { FiArrowLeft, FiLock, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { ErrorState, Loading } from '../components/States';
import { useAuth } from '../context/AuthContext';
import PhoneInput from '../components/PhoneInput';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordNote, setPasswordNote] = useState('');
  const [passwords, setPasswords] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    api.get('/me/profile')
      .then(({ data }) => {
        setName(data.data.user.name);
        setPhone(data.data.user.phone || '');
        setUser(data.data.user);
      })
      .catch((e) => setError(e.message));
  }, [setUser]);

  if (!user && !error) return <Loading />;

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNote('');
    if (!phone) {
      setError('Please enter your phone number.');
      setBusy(false);
      return;
    }
    try {
      const { data } = await api.patch('/me/profile', { name, phone });
      setUser(data.data.user);
      setPhone(data.data.user.phone);
      setNote('Profile updated successfully.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openPassword = () => {
    setPasswords({ email: user.email, currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordNote('');
    setPasswordOpen(true);
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordError('');
    setPasswordNote('');
    try {
      await api.patch('/me/password', passwords);
      setPasswordNote('Password changed successfully.');
      setPasswords({ email: user.email, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setPasswordError(e.message);
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <main className="page-wrap account-page profile-page">
      <header className="account-page-heading">
        <div>
          <span className="kicker">Your identity</span>
          <h1>Your <em>profile</em></h1>
          <p>Keep your community details up to date.</p>
        </div>
        <Link className="button button-outline" to="/dashboard"><FiArrowLeft aria-hidden="true" /> Dashboard</Link>
      </header>

      <div className="profile-layout">
        <section className="profile-intro-card" aria-labelledby="profile-intro-title">
          <span className="profile-avatar"><FiUser aria-hidden="true" /></span>
          <span className="kicker">Community member</span>
          <h2 id="profile-intro-title">{user?.name}</h2>
          <p>Your profile helps neighbors know who they’re sharing with.</p>
          <div className="profile-private-note"><FiLock aria-hidden="true" /> Your email is not shown on public listings.</div>
        </section>

        <form className="form-card profile-card profile-edit-card" onSubmit={save}>
          <div className="profile-section-heading">
            <div>
              <span className="kicker">Account details</span>
              <h2>Profile information</h2>
            </div>
          </div>
          {error && <ErrorState message={error} />}
          {note && <div className="notice" role="status">{note}</div>}
          <label>
            Display name
            <input value={name} onChange={(event) => setName(event.target.value)} minLength="2" maxLength="100" required autoComplete="name" />
          </label>
          <label>
            Phone number
            <PhoneInput value={phone} onChange={setPhone} required />
          </label>
          <label>
            Email address
            <input value={user?.email || ''} readOnly autoComplete="email" />
          </label>
          <p className="muted profile-email-note">Your email is used for account access and is not shown on public listings.</p>
          <button className="button form-submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
        </form>

        <section className="profile-security-card" aria-labelledby="profile-security-title">
          <div className="profile-security-icon"><FiLock aria-hidden="true" /></div>
          <div>
            <span className="kicker">Account security</span>
            <h2 id="profile-security-title">Password</h2>
            <p>Change your password to keep your account up to date.</p>
          </div>
          <button className="button button-outline" type="button" onClick={openPassword}>Change password</button>
        </section>
      </div>

      {passwordOpen && (
        <div className="modal-backdrop" role="presentation">
          <form
            className="reason-modal password-modal profile-password-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-title"
            onSubmit={changePassword}
          >
            <button className="modal-close" type="button" aria-label="Close change password dialog" onClick={() => setPasswordOpen(false)}>
              <span aria-hidden="true">×</span>
            </button>
            <span className="profile-modal-icon"><FiLock aria-hidden="true" /></span>
            <span className="kicker">Account security</span>
            <h2 id="password-title">Change your password</h2>
            {passwordError && <div className="notice error" role="alert">{passwordError}</div>}
            {passwordNote && <div className="notice" role="status">{passwordNote}</div>}
            <label>
              Email address
              <input type="email" value={passwords.email} onChange={(event) => setPasswords({ ...passwords, email: event.target.value })} required autoComplete="email" />
            </label>
            <label>
              Current password
              <input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} required autoComplete="current-password" />
            </label>
            <label>
              New password
              <input type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} required minLength="5" autoComplete="new-password" />
            </label>
            <label>
              Confirm new password
              <input type="password" value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} required minLength="5" autoComplete="new-password" />
            </label>
            <small>Use at least 5 characters with uppercase, lowercase, and a number.</small>
            <div className="detail-actions">
              <button className="button button-outline" type="button" onClick={() => setPasswordOpen(false)}>Cancel</button>
              <button className="button" disabled={passwordBusy}>{passwordBusy ? 'Changing…' : 'Change password'}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
