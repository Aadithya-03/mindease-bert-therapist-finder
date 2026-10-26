// Local crisis detection so safety never depends on the ML service being up.
const CRISIS = [
  /\bkill(ing)? myself\b/i, /\bend(ing)? my (own )?life\b/i, /\btake my own life\b/i,
  /\bwant(ed)? to die\b/i, /\bsuicid(e|al)\b/i, /\bbetter off dead\b/i,
  /\b(don'?t|do not) want to (live|be alive|be here)\b/i, /\bno reason to live\b/i,
  /\bend it all\b/i, /\b(hurt|harm|cut)(ting)? myself\b/i, /\bself[- ]?harm\b/i,
];

export const isCrisis = (text) => CRISIS.some((re) => re.test(text));

export const CRISIS_REPLY =
  "I'm really glad you told me, and I'm taking what you wrote seriously. You deserve support from a real person right now. " +
  "If you might act on these thoughts or are in immediate danger, please call your local emergency number. " +
  "India: Tele-MANAS 14416 or KIRAN 1800-599-0019 (both 24/7). US: call or text 988. Elsewhere: findahelpline.com lists services by country. " +
  "If you can, reach out to someone you trust and try not to be alone. I'll stay here and keep listening.";
