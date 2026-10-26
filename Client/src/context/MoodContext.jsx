import { createContext, useContext, useEffect, useState } from 'react';

const MoodContext = createContext({ theme: 'calm', setTheme: () => {} });
export const useMoodTheme = () => useContext(MoodContext);

/** The page background gently follows the user's mood, as in the original design. */
export function MoodProvider({ children }) {
  const [theme, setTheme] = useState('calm');
  useEffect(() => { document.body.className = `theme-${theme}`; }, [theme]);
  return <MoodContext.Provider value={{ theme, setTheme }}>{children}</MoodContext.Provider>;
}

export const themeForEmotion = (label = '') => {
  const l = label.toLowerCase();
  if (['sadness', 'fear', 'anger', 'depression', 'anxiety', 'stress', 'suicidal'].includes(l)) return 'stressed';
  if (['joy', 'love', 'normal'].includes(l)) return 'happy';
  return 'calm';
};
export const themeForMood = (m) => ({ terrible: 'stressed', bad: 'stressed', neutral: 'tired', good: 'happy', great: 'happy' })[m] || 'calm';
