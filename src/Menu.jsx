import { useState } from 'react';
import { FEAST, SNACKS } from './menu.js';
import { asset } from './ui.jsx';

// Standard Indian veg mark: green-bordered square with a green dot.
const VegMark = () => (
  <svg
    role="img"
    aria-label="Vegetarian"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6, flexShrink: 0 }}
  >
    <rect x="0.75" y="0.75" width="12.5" height="12.5" rx="1.5" fill="#fff" stroke="#0f8a3c" strokeWidth="1.5" />
    <circle cx="7" cy="7" r="3.5" fill="#0f8a3c" />
  </svg>
);

// Feast lettering sits on the poster yellow (its white lettering needs it); text if the image is missing.
function FeastTitle() {
  const [bad, setBad] = useState(false);
  if (bad) return <h3 className="display">{FEAST.title}</h3>;
  return (
    <h3 className="feast-banner">
      <img src={asset('title-feast.webp')} alt={FEAST.title} onError={() => setBad(true)} />
    </h3>
  );
}

// Feast photos already include the dish name, so they are shown as they are.
// Snack photos (caption: true) are shown in a circle with the name underneath.
// If a file is missing we keep the circle and the name, so there is never a gap.
// Each dish is a link (a web search about the dish, or the page set in menu.js).
function Dish({ item }) {
  const [ok, setOk] = useState(true);
  const src = asset(item.img);
  const content =
    ok && !item.caption ? (
      <img className="dish-photo" src={src} alt={item.name} loading="lazy" decoding="async" onError={() => setOk(false)} />
    ) : (
      <>
        <span className="dish-img">
          {ok && <img src={src} alt="" loading="lazy" decoding="async" onError={() => setOk(false)} />}
        </span>
        <span className="dish-name">{item.veg && <VegMark />}{item.name}</span>
      </>
    );
  return (
    <li className="dish">
      {item.link ? (
        <a href={item.link} target="_blank" rel="noopener noreferrer" aria-label={`${item.name}: learn more (opens in a new tab)`}>
          {content}
        </a>
      ) : (
        content
      )}
    </li>
  );
}

const Info = ({ info }) => (
  <>
    <p className="menu-info">{info.venue} &middot; {info.date} &middot; {info.time}</p>
    <p className="menu-hint">Tap any dish to learn more &#8599;</p>
  </>
);

export default function Menu() {
  const [tab, setTab] = useState('snacks');
  const tabs = [['snacks', 'Snacks'], ['feast', 'Pongal Feast']];
  return (
    <section className="menu" aria-label="Menu">
      <h2 className="display menu-title">What's on the menu</h2>
      <div className="tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'tab on' : 'tab'} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="menu-card" role="tabpanel">
        {tab === 'snacks' ? (
          <>
            <h3 className="display">{SNACKS.title}</h3>
            <Info info={SNACKS.info} />
            <ul className="dishes big">{SNACKS.items.map((it) => <Dish key={it.id} item={it} />)}</ul>
          </>
        ) : (
          <>
            <FeastTitle />
            <Info info={FEAST.info} />
            {FEAST.sections.map((sec) => (
              <div key={sec.name}>
                <h4 className="sec">{sec.name}</h4>
                <ul className="dishes">{sec.items.map((it) => <Dish key={it.id} item={it} />)}</ul>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
