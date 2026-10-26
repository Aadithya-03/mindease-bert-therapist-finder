"""MindEase ML service: BERT text classification + therapist-need decision.

Run:  uvicorn app:app --port 8000
"""
import logging
import os
from contextlib import asynccontextmanager
from functools import lru_cache
from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from decision import DISTRESS_WEIGHTS, decide

log = logging.getLogger("mindease.ml")
logging.basicConfig(level=logging.INFO)

HERE = os.path.dirname(os.path.abspath(__file__))
# A model you fine-tuned with train.py is used automatically if ./model exists.
MODEL_DIR = os.getenv("MODEL_DIR", os.path.join(HERE, "model"))
# Otherwise a public BERT checkpoint fine-tuned on 6 emotions is downloaded.
MODEL_NAME = os.getenv("MODEL_NAME", "bhadresh-savani/bert-base-uncased-emotion")


@lru_cache(maxsize=1)
def get_classifier():
    from transformers import pipeline  # imported lazily so tests can stub this function

    source = MODEL_DIR if os.path.isfile(os.path.join(MODEL_DIR, "config.json")) else MODEL_NAME
    log.info("Loading BERT classifier from %s", source)
    clf = pipeline("text-classification", model=source)
    labels = {str(v).lower().replace("_", " ") for v in clf.model.config.id2label.values()}
    unknown = labels - set(DISTRESS_WEIGHTS)
    if unknown:
        log.warning("Labels without a distress weight (default used): %s. Edit DISTRESS_WEIGHTS in decision.py.", sorted(unknown))
    return clf, source


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_classifier()  # fail fast and warm up so the first request is quick
    yield


app = FastAPI(title="MindEase ML", lifespan=lifespan)


class Screening(BaseModel):
    phq2: Optional[int] = Field(None, ge=0, le=6)
    gad2: Optional[int] = Field(None, ge=0, le=6)


class PredictIn(BaseModel):
    text: str = Field(min_length=3, max_length=5000)
    screening: Optional[Screening] = None


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/predict")
def predict(body: PredictIn):
    clf, source = get_classifier()
    out = clf(body.text, top_k=None, truncation=True, max_length=256)
    if out and isinstance(out[0], list):
        out = out[0]
    probs = {o["label"]: float(o["score"]) for o in out}
    result = decide(probs, body.text, body.screening.model_dump() if body.screening else None)
    result["model"] = source
    return result
