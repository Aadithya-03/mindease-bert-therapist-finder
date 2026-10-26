// Built-in empathetic reply engine. Used when no ANTHROPIC_API_KEY is set (or the LLM call fails).
// Topic keywords come first, then the BERT emotion label, then a generic fallback.

const TOPICS = [
  { re: /panic|can'?t breathe|hyperventilat|heart (is )?racing/i, replies: [
    "That sounds frightening, and I'm glad you said it out loud. Try breathing in for 4, holding for 4 and out for 6. The Breathing Exercise on the AI Therapist page can guide you. Are you somewhere safe right now?",
    "Panic feels awful but it does pass. Press your feet into the floor and name five things you can see. Want to do that together?" ] },
  { re: /anxious|anxiety|nervous|worr(y|ied|ies)/i, replies: [
    "Anxiety is your body trying to protect you, even when there's no real danger. Let's slow down: what's the one worry that's loudest right now?",
    "I hear you. Try this: breathe in for 4 counts, out for 6, and repeat a few times. What do you think is feeding the anxiety today?",
    "That sounds exhausting. Would it help to write the worry down and split it into 'can control' and 'can't control'?" ] },
  { re: /stress|overwhelm|pressure|burn(ed|t)?[ -]?out|too much/i, replies: [
    "That sounds like a lot to carry. What's one small thing on your plate you could put down or delay today?",
    "When everything feels urgent, nothing is clear. Could we pick the single most important task and make it tiny?",
    "Stress builds up in the body too. Have you had water, food or a short break in the last few hours?" ] },
  { re: /sleep|insomnia|can'?t sleep|awake all night|nightmare/i, replies: [
    "Poor sleep makes everything feel heavier. Writing your thoughts down before bed and keeping screens away for 30 minutes can help. What does your night usually look like?",
    "Try progressive relaxation: tense each muscle group for 5 seconds, then release, from toes to forehead. What keeps your mind busy at night?" ] },
  { re: /lonely|alone|isolated|no (one|friends)/i, replies: [
    "Feeling lonely hurts, and it doesn't mean something is wrong with you. Is there one person you could send a short message to today?",
    "I'm here with you. Would you like to tell me about a time you felt connected to someone?" ] },
  { re: /grief|passed away|died|lost (my|someone)|mourning|funeral/i, replies: [
    "I'm so sorry for your loss. Grief comes in waves and there's no right way to carry it. Would you like to tell me about them?" ] },
  { re: /exam|grades|college|school|assignment|deadline|study|placement|interview/i, replies: [
    "Academic pressure is heavy. Short focused sessions, say 25 minutes with a 5 minute break, often help. What's the next exam or deadline on your mind?",
    "It sounds like your performance matters a lot to you. What would 'good enough' look like for this week?" ] },
  { re: /\b(work|job|boss|manager|career|colleague)s?\b/i, replies: [
    "Work stress can follow us home. What part is draining you most: the workload, the people, or the uncertainty?" ] },
  { re: /family|parents?|mother|father|sibling|brother|sister/i, replies: [
    "Family relationships can stir up strong feelings. Would it help to talk through what you wish they understood?" ] },
  { re: /relationship|partner|breakup|broke up|girlfriend|boyfriend|divorce/i, replies: [
    "Relationship pain is real pain. What do you need most right now: to vent, to understand it, or to plan next steps?" ] },
  { re: /motivat|lazy|procrastinat|unproductive|can'?t focus|no energy/i, replies: [
    "Motivation often follows action, not the other way round. What's a 5-minute version of the thing you're avoiding?",
    "Being hard on yourself rarely helps. What's one tiny step that would count as a win today?" ] },
  { re: /negative thought|overthink|ruminat|hate myself|worthless|useless|failure/i, replies: [
    "Thoughts feel like facts, but they're not always accurate. What would you say to a friend who told you this about themselves?",
    "That's a harsh voice to live with. Let's test the thought: what's the evidence for it, and what's the evidence against?" ] },
  { re: /therap(y|ist)|counsel(l)?or|psychiatrist|professional help/i, replies: [
    "Reaching out to a professional is a strong step. The Nearby Therapist page can show counsellors, psychiatrists and hospitals around you, and the Mind Check can help you gauge how much support might help." ] },
  { re: /\b(happy|great|good|excited|proud|relieved|grateful|calm|better)\b/i, replies: [
    "I'm really glad to hear that. What do you think contributed to it? Noticing it helps you repeat it.",
    "That's lovely. Take a second to enjoy it. What's one thing you're proud of today?" ] },
];

const BY_EMOTION = {
  sadness: [
    "I'm sorry you're feeling this way. I'm here and in no rush. What's been weighing on you most?",
    "That sounds painful. You don't have to have it all figured out. Would you like to tell me more?",
    "Thank you for trusting me with that. When did you start feeling this way?" ],
  fear: [
    "That sounds scary. You're not alone in it. What is the fear telling you might happen?",
    "Let's take it one step at a time. What feels most uncertain right now?" ],
  anger: [
    "It makes sense to feel angry when something feels unfair. What happened?",
    "Anger often protects something that hurts. What do you think is underneath it?" ],
  joy: [ "It's good to hear some lightness in your words. What's been going well?" ],
  love: [ "That warmth comes through. Who or what is making you feel this way?" ],
  surprise: [ "That sounds unexpected. How are you feeling about it now?" ],
};

const GENERIC = [
  "I'm listening. Tell me more about what's going on.",
  "Thank you for sharing that. How does it feel in your body when you think about it?",
  "That sounds like a lot. What kind of support would feel most helpful right now?",
  "I hear you. What's the part that matters most to you here?",
];

const pick = (arr, avoid) => {
  const options = arr.filter((r) => r !== avoid);
  const pool = options.length ? options : arr;
  return pool[Math.floor(Math.random() * pool.length)];
};

export function ruleReply(message, analysis, lastBotReply) {
  const topic = TOPICS.find((t) => t.re.test(message));
  if (topic) return pick(topic.replies, lastBotReply);
  const emo = analysis?.label && BY_EMOTION[analysis.label.toLowerCase()];
  if (emo && analysis.confidence >= 0.5) return pick(emo, lastBotReply);
  return pick(GENERIC, lastBotReply);
}
