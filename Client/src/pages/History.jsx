import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { api } from '../api';
import { MOODS } from '../data/content';
import { SEVERITY, emojiFor } from '../data/emotions';

const when = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
const KIND = { chatbot: 'Chatbot', therapist: 'AI Therapist', voice: 'Voice' };

export default function HistoryPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => api('/dashboard').then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const wipe = async () => {
    if (!window.confirm('Permanently delete all your conversations, check-ins and moods? This cannot be undone.')) return;
    try { await api('/me/data', { method: 'DELETE' }); await load(); } catch (e) { setError(e.message); }
  };

  if (error) return <div className="banner banner-error" role="alert">{error}</div>;
  if (!data) return <p className="muted" role="status">Loading…</p>;

  const empty = !data.assessments.length && !data.moods.length && !data.sessions.length;
  return (
    <div className="stack-lg">
      {empty && <section className="card"><p>Nothing here yet. Try the <Link to="/mind-check">Mind Check</Link> or chat with the <Link to="/chatbot">chatbot</Link>.</p></section>}

      {data.assessments.length > 0 && (
        <section className="card">
          <h3>Mood readings</h3>
          <ul className="list">
            {data.assessments.map((a) => (
              <li key={a.id} className="row between">
                <span>{emojiFor(a.label)} <strong>{a.label}</strong> <span className="muted">· {a.source === 'chat' ? 'from a conversation' : 'Mind Check'} · {when(a.createdAt)}</span></span>
                <span className={`tag tag-${SEVERITY[a.severity]?.tone || 'ok'}`}>{a.needs_therapist ? 'Therapist suggested' : a.severity}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.moods.length > 0 && (
        <section className="card">
          <h3>Recent mood check-ins</h3>
          <div className="chips">
            {data.moods.map((m) => {
              const mood = MOODS.find((x) => x.id === m.mood);
              return <span key={m.id} className="pill" title={when(m.createdAt)}>{mood?.emoji} {mood?.label}</span>;
            })}
          </div>
        </section>
      )}

      {data.sessions.length > 0 && (
        <section className="card">
          <h3>Conversations</h3>
          <ul className="list">
            {data.sessions.map((s) => (
              <li key={s.id} className="row between">
                <span><strong>{s.title || 'Conversation'}</strong> <span className="muted">· {KIND[s.kind] || s.kind} · {when(s.updatedAt)}</span></span>
                <span className="muted">{s.messageCount || 0} messages</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card stack">
        <h3>Your data</h3>
        <p>Mind Check results are stored without the text you wrote. Chat messages are stored so you can continue conversations. You can delete everything at any time.</p>
        <button className="btn btn-danger" onClick={wipe}><Trash2 size={18} /> Delete all my data</button>
      </section>
    </div>
  );
}
