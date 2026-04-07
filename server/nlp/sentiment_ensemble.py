import json
import sys
from typing import Dict, Any


def clamp(value: float, lo: float = -1.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def label_from_score(score: float) -> str:
    if score > 0.2:
        return "positive"
    if score < -0.2:
        return "negative"
    return "neutral"


def run_textblob(text: str) -> Dict[str, Any]:
    polarity = None
    try:
        from textblob import TextBlob

        polarity = clamp(safe_float(TextBlob(text).sentiment.polarity, 0.0))
    except Exception:
        polarity = None

    return {"score": polarity}


def run_vader(text: str) -> Dict[str, Any]:
    compound = None
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

        analyzer = SentimentIntensityAnalyzer()
        compound = clamp(safe_float(analyzer.polarity_scores(text).get("compound", 0.0), 0.0))
    except Exception:
        compound = None

    return {"score": compound}


def run_huggingface(text: str) -> Dict[str, Any]:
    score = None
    label = None
    confidence = None

    try:
        from transformers import pipeline

        classifier = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )
        result = classifier(text[:512])[0]
        raw_label = str(result.get("label", "")).upper()
        confidence = safe_float(result.get("score", 0.0), 0.0)

        if raw_label == "POSITIVE":
            score = clamp(confidence)
            label = "positive"
        elif raw_label == "NEGATIVE":
            score = clamp(-confidence)
            label = "negative"
        else:
            score = 0.0
            label = "neutral"
    except Exception:
        score = None
        label = None
        confidence = None

    return {
        "score": score,
        "label": label,
        "confidence": confidence
    }


def analyze(text: str) -> Dict[str, Any]:
    textblob_res = run_textblob(text)
    vader_res = run_vader(text)
    hf_res = run_huggingface(text)

    components = []
    weights = []

    if hf_res["score"] is not None:
        components.append(hf_res["score"])
        weights.append(0.5)
    if textblob_res["score"] is not None:
        components.append(textblob_res["score"])
        weights.append(0.25)
    if vader_res["score"] is not None:
        components.append(vader_res["score"])
        weights.append(0.25)

    if not components:
        ensemble = 0.0
    else:
        # Re-normalize weights if one source is unavailable.
        norm = sum(weights)
        ensemble = sum((s * w for s, w in zip(components, weights))) / norm

    ensemble = clamp(ensemble)
    label = label_from_score(ensemble)

    # Confidence is a blend of absolute ensemble score and model confidence when available.
    hf_conf = hf_res["confidence"] if hf_res["confidence"] is not None else abs(ensemble)
    confidence = clamp((abs(ensemble) * 0.6) + (safe_float(hf_conf, abs(ensemble)) * 0.4), 0.0, 1.0)

    return {
        "label": label,
        "ensemble_score": round(ensemble, 4),
        "confidence": round(confidence, 4),
        "huggingface": hf_res,
        "textblob": textblob_res,
        "vader": vader_res
    }


def main() -> None:
    payload_raw = sys.stdin.read().strip()
    text = ""

    if payload_raw:
        try:
            payload = json.loads(payload_raw)
            text = str(payload.get("text", ""))
        except Exception:
            text = payload_raw

    result = analyze(text)
    sys.stdout.write(json.dumps(result))


if __name__ == "__main__":
    main()
