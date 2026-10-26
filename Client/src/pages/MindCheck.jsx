import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../api';
import { useMoodTheme, themeForEmotion } from '../context/MoodContext';
import AssessmentCard from '../components/AssessmentCard';

const OPTIONS = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
const QUESTIONS = [
  { key: 'phq1', group: 'phq2', text: 'Little interest or pleasure in doing things' },
  { key: 'phq2', group: 'phq2', text: 'Feeling down, depressed or hopeless' },
  { key: 'gad1', group: 'gad2', text: 'Feeling nervous, anxious or on edge' },
  { key: 'gad2', group: 'gad2', text: 'Not being able to stop or control worrying' },
];

export default function MindCheck() {
  const { setTheme } = useMoodTheme();
  const [text, setText] = useState('');
  const [useQ, setUseQ] = useState(true);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const complete = QUESTIONS.every((q) => answers[q.key] !== undefined);
  const tooShort = text.trim().length < 10;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setResult(null);
    const sum = (g) => QUESTIONS.filter((q) => q.group === g).reduce((s, q) => s + answers[q.key], 0);
    try {
      const r = await api('/analyze', { method: 'POST', body: { text, ...(useQ && complete ? { screening: { phq2: sum('phq2'), gad2: sum('gad2') } } : {}) } });
      setResult(r.result);
      setTheme(themeForEmotion(r.result.label));
      setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="narrow stack-lg">
      <form className="card stack" onSubmit={submit}>
        <label htmlFor="mc-text"><strong>How have you been feeling lately?</strong>
          <span className="muted block">Write a few sentences in your own words. The more you share, the more reliable the result.</span></label>
        <textarea id="mc-text" rows={6} value={text} onChange={(e) => setText(e.target.value)} maxLength={5000}
          placeholder="For example: I've been feeling tired and low for the past few weeks, and I can't enjoy things the way I used to…" />

        <label className="check"><input type="checkbox" checked={useQ} onChange={(e) => setUseQ(e.target.checked)} /> Add a 2-minute questionnaire for a more accurate result</label>

        {useQ && (
          <fieldset className="stack">
            <legend>Over the last 2 weeks, how often have you been bothered by…</legend>
            {QUESTIONS.map((q) => (
              <div key={q.key} className="question" role="radiogroup" aria-label={q.text}>
                <span>{q.text}</span>
                <div className="scale">
                  {OPTIONS.map((o, i) => (
                    <label key={o} className={answers[q.key] === i ? 'on' : ''}>
                      <input type="radio" name={q.key} checked={answers[q.key] === i} onChange={() => setAnswers({ ...answers, [q.key]: i })} />{o}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
        )}

        {error && <div className="banner banner-error" role="alert">{error}</div>}
        <button className="btn btn-primary" disabled={busy || tooShort}><Sparkles size={18} /> {busy ? 'Analysing…' : 'Analyse how I feel'}</button>
        {useQ && !complete && !tooShort && <p className="fine">Answer all four questions to include them, or untick the box to use your text only.</p>}
      </form>

      {result && <div id="result"><AssessmentCard result={result} /></div>}
    </div>
  );
}
