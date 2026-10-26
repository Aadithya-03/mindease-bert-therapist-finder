import { useCallback, useRef, useState } from 'react';
import { api } from '../api';

const GREETING = { id: 'greeting', role: 'bot', text: "Hi, I'm your MindEase companion. How are you feeling today?", time: new Date() };
const uid = () => crypto.randomUUID();

export function useChat(kind = 'chatbot') {
  const [messages, setMessages] = useState([GREETING]);
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const sid = useRef(null);
  const busy = useRef(false);

  const send = useCallback(async (raw) => {
    const text = raw.trim();
    if (!text || busy.current) return null;
    busy.current = true;
    setSending(true);
    setError('');
    const userId = uid();
    setMessages((m) => [...m, { id: userId, role: 'user', text, time: new Date() }]);
    try {
      const r = await api('/chat', { method: 'POST', body: { message: text, sessionId: sid.current, kind } });
      sid.current = r.sessionId;
      setSessionId(r.sessionId);
      setMessages((m) => [
        ...m.map((x) => (x.id === userId ? { ...x, analysis: r.analysis } : x)),
        { id: uid(), role: 'bot', text: r.reply, time: new Date(), crisis: r.crisis },
      ]);
      if (r.analysis) setLastAnalysis(r.analysis);
      if (r.sessionAssessment) setAssessment(r.sessionAssessment);
      if (r.crisis) setAssessment((a) => ({ ...(r.sessionAssessment || a || {}), severity: 'crisis', needs_therapist: true }));
      return r.reply;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      busy.current = false;
      setSending(false);
    }
  }, [kind]);

  const reset = useCallback(() => {
    sid.current = null;
    setSessionId(null);
    setMessages([{ ...GREETING, time: new Date() }]);
    setAssessment(null);
    setLastAnalysis(null);
    setError('');
  }, []);

  const open = useCallback(async (id) => {
    setError('');
    try {
      const r = await api(`/chat/sessions/${id}/messages`);
      sid.current = id;
      setSessionId(id);
      setAssessment(null);
      setMessages(r.messages.length ? r.messages.map((m) => ({ ...m, time: new Date(m.time) })) : [GREETING]);
    } catch (e) { setError(e.message); }
  }, []);

  /** Adds a bot message that never leaves the browser (guided tools, mood replies). */
  const addLocal = useCallback((text) => setMessages((m) => [...m, { id: uid(), role: 'bot', text, time: new Date(), local: true }]), []);

  return { messages, sessionId, sending, error, assessment, lastAnalysis, send, reset, open, addLocal };
}
