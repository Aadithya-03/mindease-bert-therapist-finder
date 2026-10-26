import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Wind, MapPin, ExternalLink } from 'lucide-react';
import BreathingOverlay from '../components/BreathingOverlay';
import { GROUNDING_STEPS, HELPLINES, HELPLINE_DIRECTORY } from '../data/content';

export default function Emergency() {
  const [breathing, setBreathing] = useState(false);
  return (
    <div className="stack-lg">
      <section className="card banner-crisis crisis-card">
        <h2>If you are in immediate danger</h2>
        <p>Call your local emergency number now (112 in India, 911 in the US, 999 in the UK). If you can, move to a safe place and stay with someone you trust.</p>
      </section>

      <div className="split even">
        <section className="card stack">
          <h3>Helplines</h3>
          {HELPLINES.map((g) => (
            <div key={g.region}>
              <h4>{g.region}</h4>
              <ul className="list">
                {g.items.map((h) => (
                  <li key={h.name} className="helpline">
                    <div><strong>{h.name}</strong><span className="muted block">{h.note}</span></div>
                    <a className="btn btn-primary btn-small" href={`tel:${h.tel}`}><Phone size={15} /> {h.display || h.tel}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <a className="btn" href={HELPLINE_DIRECTORY} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> Find a helpline in another country</a>
          <p className="fine">Numbers can change. Please verify before relying on them.</p>
        </section>

        <div className="stack">
          <section className="card stack">
            <h3>Calm your body</h3>
            <p>Slow breathing signals your nervous system that you are safe.</p>
            <button className="btn btn-primary" onClick={() => setBreathing(true)}><Wind size={18} /> Start breathing exercise</button>
          </section>

          <section className="card stack">
            <h3>Ground yourself: 5-4-3-2-1</h3>
            <ol className="ground">
              {GROUNDING_STEPS.map(([n, t]) => <li key={n}><b>{n}</b> {t}</li>)}
            </ol>
          </section>

          <section className="card stack">
            <h3>Talk to someone in person</h3>
            <p>A therapist, psychiatrist or hospital near you can help.</p>
            <Link className="btn" to="/nearby"><MapPin size={18} /> Find nearby help</Link>
          </section>
        </div>
      </div>
      {breathing && <BreathingOverlay onClose={() => setBreathing(false)} />}
    </div>
  );
}
