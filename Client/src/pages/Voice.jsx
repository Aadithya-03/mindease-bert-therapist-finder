import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useSpeech } from '../hooks/useSpeech';
import { useMoodTheme, themeForEmotion } from '../context/MoodContext';
import { emojiFor } from '../data/emotions';
import { AssessmentBanner } from '../components/AssessmentCard';
import { VOICE_COMMANDS } from '../data/content';

export default function Voice() {
  const chat = useChat('voice');
  const { setTheme } = useMoodTheme();
  const [speakOn, setSpeakOn] = useState(true);
  const [lang, setLang] = useState('en-US');
  const logEnd = useRef(null);

  const handle = async (text) => {
    const reply = await chat.send(text);
    if (speakOn && reply) speech.speak(reply);
  };
  const speech = useSpeech({ onFinal: handle, lang });

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [chat.messages]);
  useEffect(() => { if (chat.lastAnalysis) setTheme(themeForEmotion(chat.lastAnalysis.label)); }, [chat.lastAnalysis, setTheme]);

  const status = !speech.supported ? 'Voice input is not supported in this browser. Try Chrome or Edge.'
    : speech.listening ? (speech.interim || 'Listening… speak now')
    : chat.sending ? 'Thinking…' : 'Tap the mic and start speaking';

  return (
    <div className="stack-lg">
      <div className="split even">
        <section className="card voice-stage">
          <button className={`voice-btn ${speech.listening ? 'rec' : ''}`} onClick={speech.listening ? speech.stop : speech.start}
            disabled={!speech.supported} aria-label={speech.listening ? 'Stop listening' : 'Start listening'}>
            {speech.listening ? <Square size={34} /> : <Mic size={34} />}
          </button>
          <p className="voice-status" role="status">{status}</p>
          {speech.error && <p className="banner banner-error" role="alert">{speech.error}</p>}
          {chat.error && <p className="banner banner-error" role="alert">{chat.error}</p>}
          <AssessmentBanner assessment={chat.assessment} />
          <p className="fine">Voice recognition runs in your browser. Chrome and Edge may send audio to their speech service to turn it into text.</p>
        </section>

        <section className="card voice-log">
          <div className="row between">
            <h3>Voice log</h3>
            <button className="icon-btn" onClick={() => { chat.reset(); window.speechSynthesis?.cancel(); }} aria-label="Clear log and start over"><Trash2 size={18} /></button>
          </div>
          <div className="log" role="log" aria-live="polite">
            {chat.messages.map((m) => (
              <div key={m.id} className={`msg ${m.role === 'user' ? 'msg-user' : 'msg-bot'}`}>
                <p>{m.text}</p>
                {m.analysis && <div className="msg-meta"><span className="chip">{emojiFor(m.analysis.label)} {m.analysis.label}</span></div>}
              </div>
            ))}
            <div ref={logEnd} />
          </div>
        </section>
      </div>

      <section className="card">
        <h3>Try saying</h3>
        <div className="grid small">
          {VOICE_COMMANDS.map((c) => (
            <button key={c.label} className="action center" onClick={() => handle(c.say)} disabled={chat.sending}>
              <span className="emoji" aria-hidden>{c.emoji}</span><strong>{c.label}</strong><span>“{c.say}”</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Voice settings</h3>
        <div className="row">
          <label className="check"><input type="checkbox" checked={speakOn} onChange={(e) => setSpeakOn(e.target.checked)} /> Speak replies aloud</label>
          <label className="inline">Language
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en-US">English (US)</option>
              <option value="en-IN">English (India)</option>
              <option value="en-GB">English (UK)</option>
            </select>
          </label>
        </div>
        <p className="fine">The mood model reads English text only.</p>
      </section>
    </div>
  );
}
