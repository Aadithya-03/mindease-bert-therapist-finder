import { Link } from 'react-router-dom';
import { MapPin, LifeBuoy, ShieldAlert } from 'lucide-react';
import { SEVERITY, emojiFor } from '../data/emotions';

export function AssessmentBanner({ assessment }) {
  if (!assessment?.needs_therapist) return null;
  const crisis = assessment.severity === 'crisis';
  return (
    <div className={`banner ${crisis ? 'banner-crisis' : 'banner-warn'}`} role="status">
      <ShieldAlert size={20} aria-hidden />
      <div>
        <strong>{crisis ? 'Please reach out for support now.' : 'Talking to a professional could help.'}</strong>
        <span> {crisis ? 'Helplines are available 24/7.' : 'Based on our conversation, a therapist may be a good next step.'}</span>
      </div>
      <Link className="btn btn-small" to={crisis ? '/emergency' : '/nearby'}>
        {crisis ? <><LifeBuoy size={16} /> Get help now</> : <><MapPin size={16} /> Find therapists</>}
      </Link>
    </div>
  );
}

export default function AssessmentCard({ result }) {
  const sev = SEVERITY[result.severity] || SEVERITY.low;
  const pct = Math.round(result.distress_score * 100);
  const scores = Object.entries(result.scores || {}).slice(0, 4);
  return (
    <section className={`card verdict verdict-${sev.tone}`} aria-live="polite">
      <h2>{sev.title}</h2>
      <p>{result.recommendation}</p>

      <div className="meter" role="img" aria-label={`Distress level ${pct} out of 100`}>
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="meter-labels"><span>Low</span><span>Distress level: {pct}/100</span><span>High</span></div>

      <h3>What the model read in your words</h3>
      <ul className="bars">
        {scores.map(([label, p]) => (
          <li key={label}>
            <span className="bar-label">{emojiFor(label)} {label}</span>
            <span className="bar"><span style={{ width: `${Math.round(p * 100)}%` }} /></span>
            <span className="bar-val">{Math.round(p * 100)}%</span>
          </li>
        ))}
      </ul>

      {result.reasons?.length > 0 && (
        <ul className="reasons">{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      )}

      <div className="row">
        {result.needs_therapist && <Link className="btn btn-primary" to="/nearby"><MapPin size={18} /> Find therapists near me</Link>}
        {(result.urgent || result.severity === 'high') && <Link className="btn" to="/emergency"><LifeBuoy size={18} /> Helplines</Link>}
        {!result.needs_therapist && <Link className="btn btn-primary" to="/chatbot">Talk it through with the chatbot</Link>}
      </div>
      <p className="fine">This is an automated screening to guide you, not a diagnosis. Only a qualified professional can assess your mental health.</p>
    </section>
  );
}
