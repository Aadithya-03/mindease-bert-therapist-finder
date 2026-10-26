import { useEffect, useRef, useState } from 'react';
import { Send, Mic, Square } from 'lucide-react';
import { AssessmentBanner } from './AssessmentCard';
import { emojiFor } from '../data/emotions';

const fmt = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ChatPanel({
  title, subtitle, icon: Icon, headerRight, messages, sending, error, assessment,
  onSend, mic, above, placeholder = 'Type how you feel…',
}) {
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, sending]);

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <section className="card chat">
      <div className="chat-head">
        <div className="avatar"><Icon size={22} aria-hidden /></div>
        <div className="grow"><h2>{title}</h2><p>{subtitle}</p></div>
        {headerRight}
      </div>

      <div className="chat-window" role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role === 'user' ? 'msg-user' : 'msg-bot'}`}>
            <p>{m.text}</p>
            <div className="msg-meta">
              {m.role === 'user' && m.analysis && <span className="chip" title="Mood read by BERT">{emojiFor(m.analysis.label)} {m.analysis.label}</span>}
              <time>{fmt(m.time)}</time>
            </div>
          </div>
        ))}
        {sending && <div className="typing" aria-label="MindEase is typing"><i /><i /><i /></div>}
        <div ref={endRef} />
      </div>

      <AssessmentBanner assessment={assessment} />
      {error && <div className="banner banner-error" role="alert">{error}</div>}
      {above}

      <form className="chat-input" onSubmit={submit}>
        <label htmlFor="chat-draft" className="sr-only">Your message</label>
        <input id="chat-draft" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={mic?.listening ? 'Listening…' : placeholder}
          maxLength={2000} autoComplete="off" />
        {mic?.supported && (
          <button type="button" className={`icon-btn ${mic.listening ? 'rec' : ''}`} onClick={mic.toggle}
            aria-label={mic.listening ? 'Stop listening' : 'Speak your message'} aria-pressed={mic.listening}>
            {mic.listening ? <Square size={18} /> : <Mic size={18} />}
          </button>
        )}
        <button className="btn btn-primary" disabled={!draft.trim() || sending}><Send size={18} /> Send</button>
      </form>
    </section>
  );
}
