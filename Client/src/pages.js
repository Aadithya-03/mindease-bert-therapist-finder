import { Home, MessageCircleHeart, Bot, Mic, ClipboardCheck, MapPin, LifeBuoy, History } from 'lucide-react';

export const PAGES = [
  { path: '/', label: 'Home', icon: Home, title: 'Welcome to MindEase', subtitle: 'A calm place to check in with your mind' },
  { path: '/chatbot', label: 'AI Chatbot', icon: MessageCircleHeart, title: 'AI Chatbot Companion', subtitle: 'Tell me how you feel. I will listen and read your mood as we talk' },
  { path: '/therapist', label: 'AI Therapist', icon: Bot, title: 'AI Therapist Session', subtitle: 'Guided tools and a mood check-in, with a voice option' },
  { path: '/voice', label: 'Voice Assistant', icon: Mic, title: 'Voice Assistant', subtitle: 'Talk instead of typing' },
  { path: '/mind-check', label: 'Mind Check', icon: ClipboardCheck, title: 'Mind Check', subtitle: 'Write how you feel and get a BERT-powered screening of whether a therapist could help' },
  { path: '/nearby', label: 'Nearby Therapist', icon: MapPin, title: 'Nearby Therapists & Hospitals', subtitle: 'Find mental health professionals and hospitals on the map' },
  { path: '/emergency', label: 'Emergency Help', icon: LifeBuoy, title: 'Emergency Help', subtitle: 'Helplines, breathing and grounding when you need them now' },
  { path: '/history', label: 'My History', icon: History, title: 'My History', subtitle: 'Your check-ins, moods and conversations' },
];
