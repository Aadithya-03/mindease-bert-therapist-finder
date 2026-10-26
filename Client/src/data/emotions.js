export const EMOTION_EMOJI = { sadness: '😢', joy: '😊', love: '🥰', anger: '😠', fear: '😨', surprise: '😮', normal: '🙂', stress: '😣', anxiety: '😰', depression: '😞' };
export const emojiFor = (label = '') => EMOTION_EMOJI[label.toLowerCase()] || '💭';

export const SEVERITY = {
  low:      { title: "Nothing here suggests you need a therapist right now", tone: 'ok' },
  mild:     { title: 'Mild distress. Self-care may be enough for now', tone: 'ok' },
  moderate: { title: 'Talking to a therapist could help', tone: 'warn' },
  high:     { title: 'We recommend speaking to a therapist soon', tone: 'high' },
  crisis:   { title: 'Please reach out for support now', tone: 'crisis' },
};
