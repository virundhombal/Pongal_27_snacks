import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Menu from './Menu.jsx';
import { FEAST } from './menu.js';
import { TeamPongal } from './ui.jsx';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function api(path, options) {
  let res;
  try {
    res = await fetch(API + path, { ...options, headers: { 'Content-Type': 'application/json' } });
  } catch {
    throw new Error('Could not reach the server. Check your internet and try again.');
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

const upiLink = (payee, amount) =>
  `upi://pay?pa=${encodeURIComponent(payee.vpa)}&pn=${encodeURIComponent(payee.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Pongal Snacks')}`;

function check(f) {
  if (f.name.length < 2 || f.name.length > 40) return 'Enter your name (2 to 40 characters).';
  if (!/^[A-Za-z0-9/-]{3,15}$/.test(f.rollNumber)) return 'Enter a valid roll number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.emailId)) return 'Enter a valid email address.';
  if (!/^\d{12}$/.test(f.utrId)) return 'The transaction ID (UTR) must be exactly 12 digits.';
  return '';
}

function Header() {
  return (
    <header className="hero">
      <TeamPongal />
      <h1 className="display title">
        Diwali <span className="x">&times;</span> Pongal <span className="gold">Snacks</span>
      </h1>
      <p className="meta">Main Mess &middot; 12 Nov 2026 &middot; 5:00 PM onwards</p>
    </header>
  );
}

function Choose({ status, error, onChoose }) {
  if (!status) {
    return <p className="note">{error || 'Loading…'}</p>;
  }
  const { prices, combo } = status;
  const low = combo.offerActive && combo.remaining <= 10;
  return (
    <section className="cards" aria-label="Choose your option">
      <button className="card" onClick={() => onChoose('snacks')}>
        <span className="tag">Snacks only</span>
        <span className="card-title display">Kothu Parotta &amp; Soda Sarbath</span>
        <span className="price display">₹{prices.snacks}</span>
        <span className="cta">Choose &rarr;</span>
      </button>

      <button className="card hot" onClick={() => onChoose('combo')} disabled={combo.closed}>
        <span className="tag gold-tag">Combo</span>
        <span className="card-title display">Snacks + Pongal Feast</span>
        <span className="feast-line">Feast: {FEAST.info.date} &middot; {FEAST.info.venue} &middot; {FEAST.info.time}</span>
        {combo.closed ? (
          <span className="price display"><s>₹{prices.comboOffer}</s> Sold out</span>
        ) : combo.offerActive ? (
          <span className="price display"><s>₹{prices.comboRegular}</s> ₹{prices.comboOffer}</span>
        ) : (
          <span className="price display"><s>₹{prices.comboOffer}</s> ₹{prices.comboRegular}</span>
        )}
        <span className="claimed">
          <span className="bar"><i style={{ width: `${Math.min(100, (combo.sold / combo.limit) * 100)}%` }} /></span>
          {combo.offerActive
            ? `${combo.sold} of ${combo.limit} offer spots claimed${low ? ` · only ${combo.remaining} left!` : ''}`
            : `All ${combo.limit} offer spots are gone`}
        </span>
        <span className="cta">{combo.closed ? 'Unavailable' : 'Choose →'}</span>
      </button>
      {error && <p className="note">{error}</p>}
    </section>
  );
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [statusErr, setStatusErr] = useState('');
  const [step, setStep] = useState('choose'); // choose | pay | done
  const [option, setOption] = useState(null);
  const [quoted, setQuoted] = useState(null); // price locked in when the student chose
  const [payeeId, setPayeeId] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [form, setForm] = useState({ name: '', rollNumber: '', emailId: '', utrId: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    try { setStatus(await api('/api/status')); setStatusErr(''); }
    catch (e) { setStatusErr(e.message); }
  }, []);

  useEffect(() => {
    loadStatus();
    const t = setInterval(loadStatus, 30000);
    return () => clearInterval(t);
  }, [loadStatus]);

  const payee = status && status.payees.find((p) => p.id === payeeId);

  useEffect(() => {
    if (step !== 'pay' || !payee) return;
    QRCode.toDataURL(upiLink(payee, quoted), { width: 480, margin: 1, color: { dark: '#0f3350', light: '#ffffff' } })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [step, payee, quoted]);

  const choose = (opt) => {
    const { prices, combo, payees } = status;
    setOption(opt);
    setQuoted(opt === 'snacks' ? prices.snacks : combo.offerActive ? prices.comboOffer : prices.comboRegular);
    setPayeeId(payees[Math.floor(Math.random() * payees.length)].id); // spread payments across payees
    setError('');
    setStep('pay');
    window.scrollTo(0, 0);
  };

  const switchPayee = () => {
    const ids = status.payees.map((p) => p.id);
    setPayeeId(ids[(ids.indexOf(payeeId) + 1) % ids.length]);
  };

  const set = (k) => (e) => {
    const v = k === 'utrId' ? e.target.value.replace(/\D/g, '').slice(0, 12) : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const f = {
      name: form.name.trim().replace(/\s+/g, ' '),
      rollNumber: form.rollNumber.trim().toUpperCase(),
      emailId: form.emailId.trim().toLowerCase(),
      utrId: form.utrId.trim(),
    };
    const problem = check(f);
    if (problem) return setError(problem);
    setBusy(true);
    setError('');
    try {
      await api('/api/order', { method: 'POST', body: JSON.stringify({ ...f, tier: option, quotedAmount: quoted, payeeId }) });
      setStep('done');
      window.scrollTo(0, 0);
      loadStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="garland" aria-hidden="true" />
      <main className="wrap">
        <Header />

        {step === 'choose' && <Choose status={status} error={statusErr} onChoose={choose} />}
        {step === 'choose' && <Menu />}

        {step === 'pay' && payee && (
          <section className="panel">
            <button className="back" onClick={() => setStep('choose')}>&larr; Change option</button>

            <h2 className="display h2">1. Pay ₹{quoted}</h2>
            <p className="hint">{option === 'combo' ? 'Snacks + Pongal Feast combo' : 'Kothu Parotta & Soda Sarbath'}</p>
            <div className="qrbox">
              {qrUrl ? <img src={qrUrl} alt={`UPI QR to pay ₹${quoted}`} width="240" height="240" /> : <div className="qrph" />}
            </div>
            <p className="hint center">Paying to <b>{payee.name}</b></p>
            <div className="row">
              <a className="btn" href={upiLink(payee, quoted)}>Open UPI app</a>
              <button className="btn ghost" type="button" onClick={switchPayee}>Payment not working? Try another QR</button>
            </div>

            <h2 className="display h2 gap">2. Enter your details</h2>
            <form onSubmit={submit} noValidate>
              <label>Name<input value={form.name} onChange={set('name')} maxLength={40} autoComplete="name" /></label>
              <label>Roll number<input value={form.rollNumber} onChange={set('rollNumber')} maxLength={15} autoCapitalize="characters" /></label>
              <label>Email (your coupon is sent here)<input type="email" value={form.emailId} onChange={set('emailId')} maxLength={254} autoComplete="email" /></label>
              <label>
                Transaction ID (UTR)
                <input value={form.utrId} onChange={set('utrId')} inputMode="numeric" maxLength={12} placeholder="12 digits" />
                <small>Find it in your UPI app under payment details, as "UTR" or "UPI Ref No."</small>
              </label>
              <p className="err" role="alert" aria-live="polite">{error}</p>
              <button className="btn big" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Get my coupon'}</button>
            </form>
          </section>
        )}

        {step === 'done' && (
          <section className="panel done">
            <div className="diya" aria-hidden="true">🪔</div>
            <h2 className="display h2">You're all set!</h2>
            <p>
              {option === 'combo'
                ? 'Two QR codes are on their way to your email, one for the Snacks and one for the Pongal Feast, in two separate emails.'
                : 'Your Snacks QR code is on its way to your email.'}
            </p>
            <p className="hint">It usually arrives within a couple of minutes. Check spam if you can't see it. Show the QR at the counter, one use only.</p>
            <button className="btn ghost" onClick={() => { setStep('choose'); setForm({ name: '', rollNumber: '', emailId: '', utrId: '' }); }}>Place another order</button>
          </section>
        )}

        <footer>Happy Diwali &amp; Happy Pongal! 🪔</footer>
      </main>
    </>
  );
}
