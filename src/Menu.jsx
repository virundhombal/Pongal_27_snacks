import { useState } from 'react';
import { FEAST, SNACKS } from './menu.js';
import { asset } from './ui.jsx';

// Feast photos already include the dish name, so they are shown as they are.
// Snack photos (caption: true) are shown in a circle with the name underneath.
// If a file is missing we keep the circle and the name, so there is never a gap.
function Dish({ item }) {
  const [ok, setOk] = useState(true);
  const src = asset(item.img);
  if (ok && !item.caption) {
    return (
      <li className="dish">
        <img className="dish-photo" src={src} alt={item.name} loading="lazy" decoding="async" onError={() => setOk(false)} />
      </li>
    );
  }
  return (
    <li className="dish">
      <span className="dish-img">
        {ok && <img src={src} alt="" loading="lazy" decoding="async" onError={() => setOk(false)} />}
      </span>
      <span className="dish-name">{item.name}</span>
    </li>
  );
}

const Info = ({ info }) => (
  <p className="menu-info">{info.venue} &middot; {info.date} &middot; {info.time}</p>
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
            <h3 className="display">{FEAST.title}</h3>
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
