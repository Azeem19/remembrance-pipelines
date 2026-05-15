"""
Transcription — Whisper large-v3

Converts a consented audio file to a timestamped transcript.
Requires consent_for.transcription: true in the accompanying consent.yaml.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import whisper

from pipeline.consent_gate import check


def transcribe(audio_path: str | Path, consent_path: str | Path) -> dict:
    """
    Transcribe audio to text using Whisper large-v3.

    Returns a dict with keys: text, segments, language, interview_id.
    Segments include start/end timestamps and per-segment text.
    """
    check(consent_path, "transcription")

    audio_path = Path(audio_path)
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    model = whisper.load_model("large-v3")
    result = model.transcribe(str(audio_path), word_timestamps=True)

    import yaml
    with open(consent_path) as f:
        consent_raw = yaml.safe_load(f)
    interview_id = consent_raw.get("recording", {}).get("interview_id", "unknown")

    return {
        "interview_id": interview_id,
        "language": result["language"],
        "text": result["text"],
        "segments": [
            {
                "id": seg["id"],
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
            }
            for seg in result["segments"]
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Transcribe an oral history recording")
    parser.add_argument("--audio", required=True, help="Path to audio file")
    parser.add_argument("--consent", required=True, help="Path to consent.yaml")
    parser.add_argument("--output", default=None, help="Path to write transcript JSON")
    args = parser.parse_args()

    check(args.consent, "transcription")

    result = transcribe(args.audio, args.consent)

    output_path = args.output or Path("data/transcripts") / f"{result['interview_id']}.json"
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Transcript written to {output_path}")


if __name__ == "__main__":
    main()
