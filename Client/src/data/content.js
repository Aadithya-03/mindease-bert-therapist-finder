export const MOODS = [
  { id: 'terrible', emoji: '😞', label: 'Terrible', reply: "I'm sorry it's that hard right now. You don't have to go through it alone. Would you like to talk about what's going on, or try a breathing exercise together?" },
  { id: 'bad', emoji: '😔', label: 'Bad', reply: "Rough days happen, and it's okay to say so. A grounding exercise or a few lines in a journal can help sort things out. Want to try one?" },
  { id: 'neutral', emoji: '😐', label: 'Okay', reply: "Thanks for checking in. Steady is a fine place to be. Is there one small thing you could do today that your future self would thank you for?" },
  { id: 'good', emoji: '🙂', label: 'Good', reply: "Good to hear. What's contributing to it today? Noticing helps you repeat it." },
  { id: 'great', emoji: '😊', label: 'Great', reply: "That's wonderful. Take a moment to enjoy it. What made today feel so good?" },
];

export const TOOLS = [
  { id: 'breathing', label: 'Breathing', text: "Let's breathe together. Follow the circle: in as it grows, out as it shrinks." },
  { id: 'grounding', label: 'Grounding', text: "Try 5-4-3-2-1. Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell and 1 you can taste. Take your time with each one." },
  { id: 'cbt', label: 'Thought check', text: "Let's examine a thought. What's the thought that's bothering you? Then ask: what's the evidence for it, what's the evidence against it, and what would I tell a friend who thought this?" },
  { id: 'visualization', label: 'Safe place', text: "Close your eyes and picture a place where you feel completely at ease. What do you see, hear and feel there? Stay for a few slow breaths." },
  { id: 'affirmation', label: 'Affirmation', text: "Here's one to repeat: \"I am doing my best, and that is enough.\" Say it slowly, twice. Would you like to write your own?" },
  { id: 'journal', label: 'Journal prompt', text: "Write for two minutes without editing: what am I feeling right now, and where do I feel it in my body?" },
];

export const QUICK_ACTIONS = [
  { label: 'Anxiety support', hint: 'Calm your nerves', text: 'I need help with anxiety' },
  { label: 'Stress relief', hint: 'Manage overwhelm', text: 'I feel stressed and overwhelmed' },
  { label: 'Sleep support', hint: 'Better rest', text: 'Help me sleep better' },
  { label: 'Motivation boost', hint: 'Find a small first step', text: 'I need motivation' },
  { label: 'Negative thoughts', hint: 'Reframe your thinking', text: 'Help me with negative thoughts' },
];

export const VOICE_COMMANDS = [
  { emoji: '🧘', label: 'Meditation', say: 'Guide me through a short meditation' },
  { emoji: '😰', label: 'Anxiety support', say: 'I feel anxious' },
  { emoji: '🌬️', label: 'Breathing', say: 'I need a breathing exercise' },
  { emoji: '💪', label: 'Motivation', say: 'I need motivation' },
  { emoji: '🌙', label: 'Sleep', say: 'Help me sleep' },
  { emoji: '🙂', label: 'Mood check-in', say: 'I want to check in on my mood' },
];

// Verify numbers before launch; services change over time.
export const HELPLINES = [
  { region: 'India', items: [
    { name: 'Tele-MANAS (Govt. of India, 24/7)', tel: '14416', note: 'Free mental health support in many languages' },
    { name: 'KIRAN Mental Health Rehabilitation Helpline', tel: '18005990019', display: '1800-599-0019', note: '24/7, toll-free' },
    { name: 'Emergency services', tel: '112', note: 'If you or someone else is in immediate danger' },
  ] },
  { region: 'United States', items: [
    { name: '988 Suicide & Crisis Lifeline', tel: '988', note: 'Call or text, 24/7' },
  ] },
  { region: 'United Kingdom & Ireland', items: [
    { name: 'Samaritans', tel: '116123', display: '116 123', note: 'Free, 24/7' },
  ] },
];
export const HELPLINE_DIRECTORY = 'https://findahelpline.com';

export const GROUNDING_STEPS = [
  ['5', 'things you can see'], ['4', 'things you can touch'], ['3', 'things you can hear'], ['2', 'things you can smell'], ['1', 'thing you can taste'],
];
