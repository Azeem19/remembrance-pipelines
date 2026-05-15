"""
Diarization — pyannote.audio

Identifies and labels speaker turns in a consented audio file.
Requires consent_for.diarization: true in the accompanying consent.yaml.

Needs a Hugging Face token with access to pyannote/speaker-diarization-3.1.
Set HF_TOKEN in your environment.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from pipeline.consent_gate import check


def diarize(audio_path: str | Path, consent_path: str | Path) -> dict:
    """
    Run speaker diarization on audio and return speaker-turn segments.

    Returns a dict with interview_id and a list of turns:
      [{speaker, start, end}, ...]
    """
    check(consent_path, "diarization")

    audio_path = Path(audio_path)
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    hf_token = os.environ.get("HF_TOKEN")
    if not hf_token:
        raise EnvironmentError(
            "HF_TOKEN is required for pyannote diarization. "
            "Set it in your environment — do not hard-code it."
        )

    from pyannote.audio import Pipeline

    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token,
    )
    diarization = pipeline(str(audio_path))

    import yaml
    with open(consent_path) as f:
        consent_raw = yaml.safe_load(f)
    interview_id = consent_raw.get("recording", {}).get("interview_id", "unknown")

    turns = [
        {
            "speaker": speaker,
            "start": round(turn.start, 3),
            "end": round(turn.end, 3),
        }
        for turn, _, speaker in diarization.itertracks(yield_label=True)
    ]

    return {"interview_id": interview_id, "turns": turns}


def merge_with_transcript(transcript: dict, diarization: dict) -> list[dict]:
    """
    Align diarization speaker turns with transcript segments.

    Assigns the majority speaker to each transcript segment based on overlap.
    Returns a list of segments with added 'speaker' field.
    """
    enriched = []
    for seg in transcript["segments"]:
        seg_start, seg_end = seg["start"], seg["end"]
        speaker_time: dict[str, float] = {}

        for turn in diarization["turns"]:
            overlap = min(seg_end, turn["end"]) - max(seg_start, turn["start"])
            if overlap > 0:
                speaker_time[turn["speaker"]] = speaker_time.get(turn["speaker"], 0) + overlap

        speaker = max(speaker_time, key=speaker_time.get) if speaker_time else "UNKNOWN"
        enriched.append({**seg, "speaker": speaker})

    return enriched


def main() -> None:
    parser = argparse.ArgumentParser(description="Diarize an oral history recording")
    parser.add_argument("--audio", required=True, help="Path to audio file")
    parser.add_argument("--consent", required=True, help="Path to consent.yaml")
    parser.add_argument("--transcript", default=None, help="Optional transcript JSON to enrich")
    parser.add_argument("--output", default=None, help="Path to write diarization JSON")
    args = parser.parse_args()

    check(args.consent, "diarization")

    result = diarize(args.audio, args.consent)

    output_path = args.output or (
        Path("data/transcripts") / f"{result['interview_id']}-diarization.json"
    )
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    if args.transcript:
        with open(args.transcript) as f:
            transcript = json.load(f)
        result["segments"] = merge_with_transcript(transcript, result)

    with open(output_path, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Diarization written to {output_path}")


if __name__ == "__main__":
    main()
