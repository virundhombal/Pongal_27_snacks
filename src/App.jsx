import { useCallback, useEffect, useState } from 'react';
import Menu from './Menu.jsx';
import { FEAST } from './menu.js';
import { Img, TeamPongal, asset } from './ui.jsx';
import { FALLBACK } from './fallback.js';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function api(path, options) {
  // Lookups wait up to 90 s for a slow server; order submissions are never cut short.
  const ctrl = new AbortController();
  const isPost = options && options.method === 'POST';
  const timer = isPost ? null : setTimeout(() => ctrl.abort(), 90000);
  let res;
  try {
    // A JSON content-type header makes the browser send an extra "preflight" request first, so only orders (POST) get it.
    res = await fetch(API + path, { ...options, headers: isPost ? { 'Content-Type': 'application/json' } : undefined, signal: ctrl.signal });
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'The server is taking too long to respond.' : 'Could not reach the server. Check your internet and try again.');
  } finally {
    if (timer) clearTimeout(timer);
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

// true = the QR carries the amount; false = students type the amount themselves.
const PREFILL_AMOUNT = true;

const upiLink = (payee, amount, note = 'Pongal Snacks') =>
  `upi://pay?pa=${encodeURIComponent(payee.vpa)}&pn=${encodeURIComponent(payee.name)}${PREFILL_AMOUNT ? `&am=${amount}` : ''}&cu=INR&tn=${encodeURIComponent(note)}`;

function check(f) {
  if (f.name.length < 2 || f.name.length > 40) return 'Enter your name (2 to 40 characters).';
  if (!/^[A-Za-z0-9/-]{3,15}$/.test(f.rollNumber)) return 'Enter a valid roll number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.emailId)) return 'Enter a valid email address.';
  if (!/^\d{12}$/.test(f.utrId)) return 'The transaction ID (UTR) must be exactly 12 digits.';
  return '';
}

// Poster lettering on the first screen; plain text if the image can't load.
function SnacksTitle({ fallback }) {
  const [bad, setBad] = useState(false);
  if (bad) return fallback;
  return (
    <h1 className="title-h">
      <img className="title-img" src={asset('title-snacks.webp')} alt="Diwali × Pongal Snacks" onError={() => setBad(true)} />
    </h1>
  );
}

function Header({ framed, feast }) {
  const textTitle = (
    <h1 className="display title">
      Diwali <span className="x">&times;</span>
      <br />Pongal<br />
      <span className="gold">Snacks</span>
    </h1>
  );
  // Once the page is feast-only, the header is about the feast (not the 12 Nov snacks)
  const feastTitle = (
    <h1 className="display title">
      Pongal<br />2027<br />
      <span className="gold">Virundhu</span>
    </h1>
  );
  const meta = feast ? (
    <p className="meta">
      <span>{FEAST.info.venue} &middot; {FEAST.info.date}</span>
      <span className="sep"> &middot; </span>
      <span>{FEAST.info.time}</span>
    </p>
  ) : (
    <p className="meta">
      <span>Main Mess &middot; 12 Nov 2026</span>
      <span className="sep"> &middot; </span>
      <span>5:00 PM onwards</span>
    </p>
  );
  if (framed) {
    return (
      <div className="frame">
        <Img src="garland.webp" className="frame-img" loading="eager" />
        <Img src="diya-hanging.webp" className="frame-diya" loading="eager" />
        <header className="hero">
          <TeamPongal />
          {feast ? feastTitle : <SnacksTitle fallback={textTitle} />}
          {meta}
        </header>
      </div>
    );
  }
  return (
    <>
      <div className="strip" style={{ backgroundImage: `url(${asset('garland.webp')})` }} aria-hidden="true" />
      <header className="hero small">
        <TeamPongal />
        {feast ? feastTitle : textTitle}
        {meta}
      </header>
    </>
  );
}

function Choose({ status, error, waited, onChoose }) {
  const live = !!status;
  const prices = (status || FALLBACK).prices;

  // Snacks sold out, 5 PM reached, or test switch on: only the Pongal Feast can be bought.
  if (status && status.feastOnly) {
    const msg = status.feastOnlyReason === 'closed'
      ? 'Snack coupons are closed. On-spot coupons might be available, based on availability. Meanwhile, you can purchase a confirmed Pongal Feast coupon.'
      : status.feastOnlyReason === 'time'
        ? 'Snack coupon sales are now closed. Come taste our Tamil Nadu food at our Pongal Feast!'
        : 'Sorry, the snack coupons are over! Taste our Tamil Nadu food through our Pongal Feast.';
    return (
      <section className="cards" aria-label="Choose your option">
        {status.test && <p className="note test-note">TEST MODE: feast-only is forced by FEAST_ONLY_TEST</p>}
        <p className="note feast-note" role="status">{msg}</p>
        <button className="card hot" onClick={() => onChoose('feast')}>
          <span className="tag gold-tag">Pongal Feast</span>
          <span className="card-title display">{FEAST.title}</span>
          <span className="feast-line">{FEAST.info.date} &middot; {FEAST.info.venue} &middot; {FEAST.info.time}</span>
          <span className="price display">₹{prices.feast}</span>
          <span className="cta">Choose →</span>
        </button>
      </section>
    );
  }

  const combo = status && status.combo;
  const low = combo && combo.offerActive && combo.remaining <= 10;
  // Overall snack-coupon cap (status.snacks comes from the server; absent on an older server)
  const snacks = status && status.snacks;
  const snacksOut = !!(snacks && snacks.soldOut);
  const snacksLow = !!(snacks && !snacks.soldOut && snacks.remaining <= 10);
  return (
    <section className="cards" aria-label="Choose your option">
      {/* Snacks has a fixed price, so it works the moment the page opens */}
      <button className="card" onClick={() => onChoose('snacks')} disabled={snacksOut}>
        <span className="tag">Snacks only</span>
        <span className="card-title display">Kothu Parotta &amp; Soda Sarbath</span>
        <span className="price display">{snacksOut ? 'Sold out' : `₹${prices.snacks}`}</span>
        {snacksLow && <span className="claimed">Only {snacks.remaining} coupons left!</span>}
        <span className="cta">{snacksOut ? 'Unavailable' : 'Choose →'}</span>
      </button>

      {/* Combo needs the live count of offer spots, so it waits for the server */}
      <button className="card hot" onClick={() => onChoose('combo')} disabled={!live || combo.closed || snacksOut}>
        <span className="tag gold-tag">Combo</span>
        <span className="card-title display">Snacks + Pongal Feast</span>
        <span className="feast-line">Feast: {FEAST.info.date} &middot; {FEAST.info.venue} &middot; {FEAST.info.time}</span>
        {!live ? (
          <>
            <span className="price display checking"><span className="spinner sm" aria-hidden="true" />Checking offer…</span>
            <span className="claimed">{waited ? 'The server is slow to wake up. Hang on, meanwhile checkout the feast menu.' : 'Checking how many offer spots are left…'}</span>
            <span className="cta">Please wait…</span>
          </>
        ) : (
          <>
            {combo.closed || snacksOut ? (
              <span className="price display">Sold out</span>
            ) : combo.offerActive ? (
              <span className="price display"><s>₹{prices.comboRegular}</s> ₹{prices.comboOffer}</span>
            ) : (
              /* offer is over: show the plain price only, no crossed-out amount */
              <span className="price display">₹{prices.comboRegular}</span>
            )}
            {combo.offerActive && !snacksOut && (
              <span className="claimed">
                <span className="bar"><i style={{ width: `${Math.min(100, (combo.sold / combo.limit) * 100)}%` }} /></span>
                {`${combo.sold} of ${combo.limit} offer spots claimed${low ? ` · only ${combo.remaining} left!` : ''}`}
              </span>
            )}
            {!combo.offerActive && !combo.closed && !snacksOut && (
              <span className="claimed">The offer spots are over. Regular combo price applies.</span>
            )}
            {snacksOut && !combo.closed && (
              <span className="claimed">Snack coupons are sold out, so the combo is unavailable too.</span>
            )}
            <span className="cta">{combo.closed || snacksOut ? 'Unavailable' : 'Choose →'}</span>
          </>
        )}
      </button>
      {error && !live && <p className="note">Still trying to reach the server… ({error})</p>}
    </section>
  );
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [statusErr, setStatusErr] = useState('');
  const [waited, setWaited] = useState(false);
  const [step, setStep] = useState('choose'); // choose | pay | done
  const [option, setOption] = useState(null);
  const [quoted, setQuoted] = useState(null); // price locked in when the student chose
  const [payeeId, setPayeeId] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [form, setForm] = useState({ name: '', rollNumber: '', emailId: '', utrId: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      // index.html already started this request before the app code even loaded
      const early = window.__statusP;
      window.__statusP = null;
      let data;
      try { data = early ? await early : await api('/api/status'); } catch { data = await api('/api/status'); }
      setStatus(data); setStatusErr('');
      return true;
    } catch (e) { setStatusErr(e.message); return false; }
  }, []);

  // After 6 s without an answer, tell students what is going on
  useEffect(() => {
    if (status) return;
    const t = setTimeout(() => setWaited(true), 6000);
    return () => clearTimeout(t);
  }, [status]);

  // Refresh every 30 s. If the server doesn't answer, retry every 4 s instead of waiting.
  useEffect(() => {
    let timer;
    let stopped = false;
    const tick = async () => {
      const ok = await loadStatus();
      if (!stopped) timer = setTimeout(tick, ok ? 30000 : 4000);
    };
    tick();
    return () => { stopped = true; clearTimeout(timer); };
  }, [loadStatus]);

  // Back gesture / browser back from the payment or done screen goes to the options, without reloading the page
  useEffect(() => {
    const onPop = () => setStep((s) => (s === 'choose' ? s : 'choose'));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const feastOnly = !!(status && status.feastOnly);
  // Manual close (SNACKS_CLOSED): the snacks event is still on, so keep the snacks header and menu
  const snacksStay = !!(status && status.feastOnlyReason === 'closed');
  const payees = (status || FALLBACK).payees;
  const payee = payees.find((p) => p.id === payeeId);

  useEffect(() => {
    if (step !== 'pay' || !payee) return;
    import('qrcode') // loaded only when the payment screen opens, so the first screen is lighter
      .then(({ default: QRCode }) => QRCode.toDataURL(upiLink(payee, quoted, option === 'feast' ? 'Pongal Feast' : 'Pongal Snacks'), { width: 480, margin: 1, color: { dark: '#0f3350', light: '#ffffff' } }))
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [step, payee, quoted, option]);

  const choose = (opt) => {
    const { prices } = status || FALLBACK;
    if (opt === 'feast') {
      if (!status || !status.feastOnly) return; // feast-only tickets open with the switchover
    } else {
      if (opt === 'combo' && !status) return; // combo price depends on the live offer count
      if (status && (status.feastOnly || (status.snacks && status.snacks.soldOut))) return; // snacks are closed
    }
    setOption(opt);
    setQuoted(opt === 'feast' ? prices.feast : opt === 'snacks' ? prices.snacks : status.combo.offerActive ? prices.comboOffer : prices.comboRegular);
    setPayeeId(payees[Math.floor(Math.random() * payees.length)].id); // spread payments across payees
    setError('');
    setStep('pay');
    window.history.pushState({ pay: true }, ''); // so the phone's back gesture returns here instead of leaving the page
    window.scrollTo(0, 0);
  };

  const switchPayee = () => {
    const ids = payees.map((p) => p.id);
    setPayeeId(ids[(ids.indexOf(payeeId) + 1) % ids.length]);
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(payee.vpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the UPI ID is shown as selectable text, so students can still copy it by hand */
    }
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
      <main className="wrap">
        <Header framed={step === 'choose'} feast={step === 'choose' ? feastOnly && !snacksStay : option === 'feast'} />

        {step === 'choose' && <Choose status={status} error={statusErr} waited={waited} onChoose={choose} />}
        {step === 'choose' && <Menu feastOnly={feastOnly} keepSnacks={snacksStay} />}

        {step === 'pay' && payee && (
          <section className="panel">
            <button className="back" onClick={() => window.history.back()}>&larr; Change option</button>

            <h2 className="display h2">1. Pay ₹{quoted}</h2>
            <p className="hint">{option === 'combo' ? 'Snacks + Pongal Feast combo' : option === 'feast' ? 'Pongal Feast' : 'Kothu Parotta & Soda Sarbath'}</p>
            <div className="qrbox">
              {qrUrl ? <img src={qrUrl} alt={`UPI QR to pay ₹${quoted}`} width="240" height="240" /> : <div className="qrph" />}
            </div>
            <p className="hint center">Paying to <b>{payee.name}</b></p>
            <p className="upiid">UPI ID: <code>{payee.vpa}</code></p>
            <div className="row">
              <button className="btn" type="button" onClick={copyId}>{copied ? 'Copied ✓' : 'Copy UPI ID'}</button>
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
                : option === 'feast'
                  ? 'Your Pongal Feast QR code is on its way to your email.'
                  : 'Your Snacks QR code is on its way to your email.'}
            </p>
            <p className="hint">It usually arrives within a couple of minutes. Check spam if you can't see it. Show the QR at the counter, one use only.</p>
            <p className="blessing" lang="ta">“வாழ்க வளமுடன்”</p>
            <button className="btn ghost" onClick={() => { setStep('choose'); setForm({ name: '', rollNumber: '', emailId: '', utrId: '' }); }}>Place another order</button>
          </section>
        )}

        <footer>
          <div>Happy Diwali &amp; Happy Pongal! 🪔</div>
          <div className="credit">Designed by Nandita</div>
          <div className="credit">Made with ❤️ by I2019ZF</div>
        </footer>
      </main>
    </>
  );
}
