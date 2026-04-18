from __future__ import annotations

import json
import os
import re
from typing import Any
from urllib import error, request


def _extract_json_payload(text: str) -> dict[str, Any] | None:
    if not text:
        return None

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()

    candidate = cleaned
    if not candidate.startswith("{"):
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            return None
        candidate = match.group(0)

    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError:
        return None

    if not isinstance(parsed, dict):
        return None
    return parsed


def _sanitize_mapping(columns: list[str], mapping: Any) -> dict[str, str]:
    if not isinstance(mapping, dict):
        return {}

    valid_columns = {str(column) for column in columns}
    sanitized: dict[str, str] = {}
    for key, value in mapping.items():
        field = str(key).strip().lower()
        if field not in {"invoice", "item", "country", "date", "time", "quantity", "price"}:
            continue

        if value is None:
            continue

        selected = str(value).strip()
        if selected in valid_columns:
            sanitized[field] = selected

    return sanitized


def suggest_schema_mapping_with_gemini(
    columns: list[str],
    sample_rows: list[dict[str, str]],
    current_mapping: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"

    prompt = (
        "You are helping map CSV columns to a retail transaction schema. "
        "Return JSON only, no markdown.\n"
        "Schema fields: invoice, item, quantity, price, date, time, country.\n"
        "Rules:\n"
        "1) item is required.\n"
        "2) invoice is recommended but can be null.\n"
        "3) Use exact column names from the provided columns list only.\n"
        "4) If uncertain, set field to null and lower confidence.\n"
        "Return this JSON shape exactly:\n"
        "{\n"
        "  \"mapping\": {\"invoice\": null, \"item\": null, \"quantity\": null, \"price\": null, \"date\": null, \"time\": null, \"country\": null},\n"
        "  \"fieldConfidence\": {\"invoice\": 0.0, \"item\": 0.0, \"quantity\": 0.0, \"price\": 0.0, \"date\": 0.0, \"time\": 0.0, \"country\": 0.0},\n"
        "  \"notes\": [\"short note\"]\n"
        "}\n"
        f"Columns: {json.dumps(columns, ensure_ascii=True)}\n"
        f"Current rule-based mapping: {json.dumps(current_mapping or {}, ensure_ascii=True)}\n"
        f"Sample rows: {json.dumps(sample_rows, ensure_ascii=True)}"
    )

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "topP": 0.8,
            "maxOutputTokens": 800,
            "responseMimeType": "application/json",
        },
    }

    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    req = request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=20) as response:
            raw = response.read().decode("utf-8")
    except (error.HTTPError, error.URLError, TimeoutError):
        return None

    try:
        response_json = json.loads(raw)
    except json.JSONDecodeError:
        return None

    candidates = response_json.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        return None

    candidate = candidates[0]
    content = candidate.get("content", {}) if isinstance(candidate, dict) else {}
    parts = content.get("parts", []) if isinstance(content, dict) else []
    if not isinstance(parts, list) or not parts:
        return None

    text = ""
    for part in parts:
        if isinstance(part, dict) and isinstance(part.get("text"), str):
            text += part["text"]

    parsed_payload = _extract_json_payload(text)
    if not parsed_payload:
        return None

    mapping = _sanitize_mapping(columns, parsed_payload.get("mapping"))
    field_confidence_raw = parsed_payload.get("fieldConfidence")
    field_confidence: dict[str, float] = {}
    if isinstance(field_confidence_raw, dict):
        for key, value in field_confidence_raw.items():
            field = str(key).strip().lower()
            if field not in {"invoice", "item", "country", "date", "time", "quantity", "price"}:
                continue
            try:
                score = float(value)
            except (TypeError, ValueError):
                continue
            field_confidence[field] = max(0.0, min(1.0, score))

    notes_raw = parsed_payload.get("notes")
    notes: list[str] = []
    if isinstance(notes_raw, list):
        notes = [str(note).strip() for note in notes_raw if str(note).strip()]

    return {
        "mapping": mapping,
        "fieldConfidence": field_confidence,
        "notes": notes,
        "model": model,
    }
