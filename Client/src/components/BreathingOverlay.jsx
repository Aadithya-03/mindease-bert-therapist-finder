import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function BreathingOverlay({ onClose }) {
  const [inhale, setInhale] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setInhale((v) => !v), 4000);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { clearInterval(t); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Breathing exercise">
      <div className="breath-circle" />
      <p className="breath-text" aria-live="polite">{inhale ? 'Breathe in' : 'Breathe out'}</p>
      <button className="btn btn-light" onClick={onClose}><X size={18} /> Close</button>
    </div>
  );
}
