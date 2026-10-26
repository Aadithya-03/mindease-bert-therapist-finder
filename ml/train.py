"""Optional: fine-tune bert-base-uncased on your own labelled mental-health CSV.

Example (Kaggle "Sentiment Analysis for Mental Health"):
    python train.py --csv data.csv --text-col statement --label-col status

The model is saved to ./model, which app.py then picks up automatically.
Labels should be names such as Normal, Anxiety, Depression, Stress, Suicidal,
Bipolar so they match DISTRESS_WEIGHTS in decision.py.
"""
import argparse
import os

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from transformers import (AutoModelForSequenceClassification, AutoTokenizer,
                          Trainer, TrainingArguments)


class DS(torch.utils.data.Dataset):
    def __init__(self, enc, labels):
        self.enc, self.labels = enc, labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, i):
        item = {k: torch.tensor(v[i]) for k, v in self.enc.items()}
        item["labels"] = torch.tensor(self.labels[i])
        return item


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--text-col", default="text")
    ap.add_argument("--label-col", default="label")
    ap.add_argument("--base", default="bert-base-uncased")
    ap.add_argument("--epochs", type=int, default=3)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--max-len", type=int, default=128)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "model"))
    a = ap.parse_args()

    df = pd.read_csv(a.csv).dropna(subset=[a.text_col, a.label_col])
    df[a.label_col] = df[a.label_col].astype(str).str.strip()
    labels = sorted(df[a.label_col].unique())
    label2id = {l: i for i, l in enumerate(labels)}
    id2label = {i: l for l, i in label2id.items()}
    print("Classes:", labels)

    tr, te = train_test_split(df, test_size=0.15, stratify=df[a.label_col], random_state=42)
    tok = AutoTokenizer.from_pretrained(a.base)

    def encode(frame):
        enc = tok(frame[a.text_col].astype(str).tolist(), truncation=True, padding="max_length", max_length=a.max_len)
        return DS(enc, [label2id[l] for l in frame[a.label_col]])

    model = AutoModelForSequenceClassification.from_pretrained(
        a.base, num_labels=len(labels), id2label=id2label, label2id=label2id)

    args = TrainingArguments(
        output_dir=os.path.join(a.out, "_runs"), num_train_epochs=a.epochs,
        per_device_train_batch_size=a.batch, per_device_eval_batch_size=a.batch * 2,
        learning_rate=2e-5, weight_decay=0.01, warmup_ratio=0.1,
        eval_strategy="epoch", save_strategy="no", logging_steps=50, report_to="none")
    trainer = Trainer(model=model, args=args, train_dataset=encode(tr), eval_dataset=encode(te))
    trainer.train()

    pred = trainer.predict(encode(te))
    y_pred = np.argmax(pred.predictions, axis=1)
    print(classification_report([label2id[l] for l in te[a.label_col]], y_pred, target_names=labels))

    trainer.save_model(a.out)
    tok.save_pretrained(a.out)
    print("Saved to", a.out)


if __name__ == "__main__":
    main()
