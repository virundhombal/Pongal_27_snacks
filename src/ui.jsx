import { useState } from 'react';

export const asset = (p) => `${import.meta.env.BASE_URL}assets/${p}`;

// Image that quietly disappears if the file isn't there (so a missing asset never breaks the page)
export function Img({ src, alt = '', className, ...rest }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return <img src={asset(src)} alt={alt} className={className} loading="lazy" decoding="async" onError={() => setOk(false)} {...rest} />;
}

// "Team [Pongal logo] presents", falling back to plain text if the logo fails to load
export function TeamPongal() {
  const [bad, setBad] = useState(false);
  return (
    <div className="team-line" role="img" aria-label="Team Pongal presents">
      <span aria-hidden="true">Team</span>
      {bad ? (
        <b className="display" aria-hidden="true">Pongal</b>
      ) : (
        <img className="team-logo" src={asset('logo-pongal.png')} alt="" onError={() => setBad(true)} />
      )}
      <span aria-hidden="true">presents</span>
    </div>
  );
}
