import { useState } from 'react';
import { FEAST, SNACKS } from './menu.js';
import { Img } from './ui.jsx';

const Dish = ({ item }) => (
  <li className="dish">
    <span className="dish-img"><Img src={item.img} /></span>
    <span className="dish-name">{item.name}</span>
  </li>
);

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
