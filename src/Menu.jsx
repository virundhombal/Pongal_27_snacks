import { useState } from 'react';
import { FEAST, SNACKS } from './menu.js';
import { asset } from './ui.jsx';

// The photo files already include the dish name, so show them as they are.
// Only if a file is missing do we draw a plain circle with the name underneath.
function Dish({ item }) {
  const [ok, setOk] = useState(true);
  return (
    <li className="dish">
      {ok ? (
        <img className="dish-photo" src={asset(item.img)} alt={item.name} loading="lazy" decoding="async" onError={() => setOk(false)} />
      ) : (
        <>
          <span className="dish-img" />
          <span className="dish-name">{item.name}</span>
        </>
      )}
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
