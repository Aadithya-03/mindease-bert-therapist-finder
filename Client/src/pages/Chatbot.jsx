import { useCallback, useEffect, useState } from 'react';
import { Download, MessageCircleHeart, Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useChat } from '../hooks/useChat';
import { useMoodTheme, themeForEmotion } from '../context/MoodContext';
import ChatPanel from '../components/ChatPanel';
import { QUICK_ACTIONS } from '../data/content';

export default function Chatbot() {
  const chat = useChat('chatbot');
  const { setTheme } = useMoodTheme();
  const [sessions, setSessions] = useState([]);

  const loadSessions = useCallback(() => api('/chat/sessions?kind=chatbot').then((r) => setSessions(r.sessions)).catch(() => {}), []);
  useEffect(() => { loadSessions(); }, [loadSessions, chat.sessionId]);
  useEffect(() => { if (chat.lastAnalysis) setTheme(themeForEmotion(chat.lastAnalysis.label)); }, [chat.lastAnalysis, setTheme]);

  const exportChat = () => {
    const lines = chat.messages.map((m) => `[${new Date(m.time).toLocaleString()}] ${m.role === 'user' ? 'You' : 'MindEase'}: ${m.text}`);
    const url = URL.createObjectURL(new Blob([lines.join('\n\n')], { type: 'text/plain' }));
    Object.assign(document.createElement('a'), { href: url, download: 'mindease-chat.txt' }).click();
    URL.revokeObjectURL(url);
  };

  const remove = async () => {
    if (!chat.sessionId || !window.confirm('Delete this conversation permanently?')) return;
    await api(`/chat/sessions/${chat.sessionId}`, { method: 'DELETE' }).catch(() => {});
    chat.reset();
    loadSessions();
  };

  return (
    <div className="split">
      <ChatPanel
        title="MindEase companion" subtitle="Always here to listen. Not a replacement for professional care."
        icon={MessageCircleHeart} {...chat} onSend={chat.send}
        headerRight={
          <div className="row tight">
            <button className="icon-btn" onClick={chat.reset} aria-label="New conversation" title="New conversation"><Plus size={18} /></button>
            <button className="icon-btn" onClick={exportChat} aria-label="Export as text file" title="Export"><Download size={18} /></button>
            <button className="icon-btn" onClick={remove} disabled={!chat.sessionId} aria-label="Delete this conversation" title="Delete"><Trash2 size={18} /></button>
          </div>
        }
      />

      <div className="stack">
        <section className="card">
          <h3>Quick actions</h3>
          <div className="stack tight">
            {QUICK_ACTIONS.map((a) => (
              <button key={a.label} className="action" onClick={() => chat.send(a.text)} disabled={chat.sending}>
                <strong>{a.label}</strong><span>{a.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Recent conversations</h3>
          {sessions.length === 0 && <p className="muted">Your conversations will appear here.</p>}
          <ul className="list">
            {sessions.slice(0, 8).map((s) => (
              <li key={s.id}>
                <button className={`action ${s.id === chat.sessionId ? 'on' : ''}`} onClick={() => chat.open(s.id)}>
                  <strong>{s.title || 'Conversation'}</strong>
                  <span>{s.updatedAt ? new Date(s.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
