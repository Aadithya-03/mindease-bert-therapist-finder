"""Turn raw BERT class probabilities (+ optional PHQ-2 / GAD-2 answers) into a
"does this person likely benefit from seeing a therapist?" decision.

IMPORTANT: the thresholds below are heuristics, not clinically validated
cut-offs. This is a screening aid, never a diagnosis. Calibrate the weights and
thresholds on your own labelled data before relying on them.
"""
import re
from typing import Dict, Optional

# How much each predicted class contributes to "distress" (0 = none, 1 = max).
# Covers the default 6-class emotion model AND the labels train.py produces
# when you fine-tune on a mental-health dataset.
DISTRESS_WEIGHTS: Dict[str, float] = {
    # emotion model (default)
    "sadness": 1.0, "fear": 0.8, "anger": 0.55, "surprise": 0.15, "joy": 0.0, "love": 0.0,
    # mental-health dataset labels (after fine-tuning)
    "normal": 0.0, "stress": 0.6, "anxiety": 0.8, "depression": 1.0,
    "bipolar": 0.8, "bi polar": 0.8, "personality disorder": 0.7, "suicidal": 1.0,
}
UNKNOWN_LABEL_WEIGHT = 0.3

CRISIS_PATTERNS = [re.compile(p, re.I) for p in [
    r"\bkill(ing)? myself\b", r"\bend(ing)? my (own )?life\b", r"\btake my own life\b",
    r"\bwant(ed)? to die\b", r"\bsuicid(e|al)\b", r"\bbetter off dead\b",
    r"\b(don'?t|do not) want to (live|be alive|be here)\b", r"\bno reason to live\b",
    r"\bend it all\b", r"\b(hurt|harm|cut)(ting)? myself\b", r"\bself[- ]?harm\b",
]]


def _norm(label: str) -> str:
    return re.sub(r"[_\-]+", " ", label).strip().lower()


def crisis_hit(text: str) -> bool:
    return any(p.search(text) for p in CRISIS_PATTERNS)


def distress_score(probs: Dict[str, float]) -> float:
    return sum(p * DISTRESS_WEIGHTS.get(_norm(label), UNKNOWN_LABEL_WEIGHT) for label, p in probs.items())


RECOMMENDATIONS = {
    "low": "Nothing here suggests you need a therapist right now. Keep checking in with yourself and use the chatbot whenever you want to talk.",
    "mild": "You may be going through a rough patch. Self-care, rest and talking to someone you trust can help. If this lasts more than a couple of weeks, consider a counsellor.",
    "moderate": "What you wrote suggests meaningful distress. Speaking with a therapist or counsellor could really help.",
    "high": "What you wrote suggests significant distress. We recommend booking a session with a therapist or psychiatrist soon.",
    "crisis": "You may be in crisis. Please contact a crisis helpline or your local emergency number now, and reach out to someone you trust.",
}


def decide(probs: Dict[str, float], text: str, screening: Optional[dict] = None) -> dict:
    top_label, top_p = max(probs.items(), key=lambda kv: kv[1])
    d = distress_score(probs)
    reasons = []

    words = len(text.split())
    reliability = "low" if words < 8 else "ok"
    if reliability == "low":
        reasons.append("The text is very short, so the prediction is less reliable.")

    screen_info = None
    screen_pos = False
    strongest = 0
    if screening:
        phq, gad = screening.get("phq2"), screening.get("gad2")
        vals = [v for v in (phq, gad) if v is not None]
        if vals:
            strongest = max(vals)
            screen_pos = (phq is not None and phq >= 3) or (gad is not None and gad >= 3)
            screen_info = {"phq2": phq, "gad2": gad, "positive": screen_pos}
            if screen_pos:
                reasons.append("Your questionnaire answers reached the usual screening threshold (score of 3 or more).")

    if d >= 0.6:
        reasons.append(f"The language in your text reads as predominantly '{top_label}'.")

    if crisis_hit(text):
        severity = "crisis"
        reasons.append("Your text mentions thoughts of self-harm or suicide.")
    elif d >= 0.85 or (screen_pos and d >= 0.6) or strongest >= 5:
        severity = "high"
    elif d >= 0.6 or screen_pos:
        severity = "moderate"
    elif d >= 0.35:
        severity = "mild"
    else:
        severity = "low"

    # One short, intense sentence should not be labelled "high" on text alone.
    if severity == "high" and reliability == "low" and not screen_pos and strongest < 5:
        severity = "moderate"

    return {
        "label": top_label,
        "confidence": round(top_p, 3),
        "scores": {k: round(v, 3) for k, v in sorted(probs.items(), key=lambda kv: -kv[1])},
        "distress_score": round(min(d, 1.0), 3),
        "severity": severity,
        "needs_therapist": severity in ("moderate", "high", "crisis"),
        "urgent": severity == "crisis",
        "screening": screen_info,
        "reliability": reliability,
        "recommendation": RECOMMENDATIONS[severity],
        "reasons": reasons,
    }
