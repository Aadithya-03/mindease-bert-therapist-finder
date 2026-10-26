import { useEffect, useState } from 'react';
import { Bot, Volume2, VolumeX } from 'lucide-react';
import { api } from '../api';
import { useChat } from '../hooks/useChat';
import { useSpeech } from '../hooks/useSpeech';
import { useMoodTheme, themeForEmotion, themeForMood } from '../context/MoodContext';
import ChatPanel from '../components/ChatPanel';
import BreathingOverlay from '../components/BreathingOverlay';
import { MOODS, TOOLS } from '../data/content';

const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Therapist() {
  const chat = useChat('therapist');
  const { setTheme } = useMoodTheme();
  const [seconds, setSeconds] = useState(0);
  const [speakOn, setSpeakOn] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [moodNote, setMoodNote] = useState('');

  const handleSend = async (text) => {
    const reply = await chat.send(text);
    if (speakOn && reply) speech.speak(reply);
  };
  const speech = useSpeech({ onFinal: handleSend });

  useEffect(() => { const t = setInterval(() => setSeconds((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (chat.lastAnalysis) setTheme(themeForEmotion(chat.lastAnalysis.label)); }, [chat.lastAnalysis, setTheme]);

  const runTool = (tool) => {
    chat.addLocal(tool.text);
    if (speakOn) speech.speak(tool.text);
    if (tool.id === 'breathing') setBreathing(true);
  };

  const pickMood = async (m) => {
    setTheme(themeForMood(m.id));
    chat.addLocal(m.reply);
    if (speakOn) speech.speak(m.reply);
    setMoodNote(`Logged: ${m.label}`);
    api('/mood', { method: 'POST', body: { mood: m.id } }).catch(() => setMoodNote('Could not save your mood. Check your connection.'));
  };

  const above = (
    <div className="stack tight">
      <div className="chips" aria-label="Guided tools">
        {TOOLS.map((t) => <button key={t.id} type="button" className="pill" onClick={() => runTool(t)}>{t.label}</button>)}
      </div>
      <div className="moods" role="group" aria-label="How are you feeling right now?">
        {MOODS.map((m) => (
          <button key={m.id} type="button" onClick={() => pickMood(m)} aria-label={m.label}>
            <span className="emoji" aria-hidden>{m.emoji}</span><small>{m.label}</small>
          </button>
        ))}
      </div>
      {moodNote && <p className="fine" role="status">{moodNote}</p>}
      {speech.error && <p className="fine" role="alert">{speech.error}</p>}
    </div>
  );

  return (
    <>
      <ChatPanel
        title="AI Therapist" subtitle={`Session time ${clock(seconds)}`} icon={Bot}
        {...chat} onSend={handleSend} above={above}
        mic={{ supported: speech.supported, listening: speech.listening, toggle: speech.listening ? speech.stop : speech.start }}
        headerRight={
          <button className="icon-btn" onClick={() => { setSpeakOn((v) => !v); window.speechSynthesis?.cancel(); }}
            aria-pressed={speakOn} aria-label={speakOn ? 'Turn spoken replies off' : 'Turn spoken replies on'} title="Spoken replies">
            {speakOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        }
      />
      {breathing && <BreathingOverlay onClose={() => setBreathing(false)} />}
    </>
  );
}
