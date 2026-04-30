"""
Thematic tagging — Claude API (claude-sonnet-4-6)

Extracts themes, named places, time periods, and cultural references from a
speaker-attributed transcript. Requires consent_for.thematic_tagging: true.

Set ANTHROPIC_API_KEY in your environment.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

import anthropic

from pipeline.consent_check import require

MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """\
You are an archivist for a community oral history project. Your role is to help
preserve and make discoverable the knowledge within these recordings.

You will receive a speaker-attributed transcript segment and extract structured
metadata. You must be accurate and respectful — do not infer or embellish beyond
what the speaker actually said. Preserve the speaker's voice and framing.

Return valid JSON only, with this structure:
{
  "themes": ["<theme>", ...],
  "places": [{"name": "<place>", "context": "<brief context>"}],
  "time_periods": ["<period or decade>"],
  "cultural_references": ["<reference>"],
  "summary": "<one sentence capturing the core of this segment, in the speaker's voice>",
  "speaker": "<speaker label from transcript>"
}
"""


def tag_segments(
    segments: list[dict], consent_path: str | Path, interview_id: str
) -> list[dict[str, Any]]:
    """
    Run thematic tagging on transcript segments using the Claude API.

    Each segment must have: text, speaker, start, end.
    Returns the segments list with a 'tags' field added to each.
    """
    require(consent_path, "thematic_tagging")

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "ANTHROPIC_API_KEY is required. Set it in your environment."
        )

    client = anthropic.Anthropic(api_key=api_key)
    tagged = []

    for seg in segments:
        user_message = (
            f"Speaker: {seg.get('speaker', 'UNKNOWN')}\n"
            f"Timestamp: {seg['start']}s – {seg['end']}s\n\n"
            f"{seg['text']}"
        )

        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        try:
            tags = json.loads(response.content[0].text)
        except (json.JSONDecodeError, IndexError, KeyError):
            tags = {"error": "failed to parse model response", "raw": response.content[0].text}

        tagged.append({**seg, "tags": tags})

    return tagged


def main() -> None:
    parser = argparse.ArgumentParser(description="Tag themes in an oral history transcript")
    parser.add_argument("--transcript", required=True, help="Path to speaker-attributed transcript JSON")
    parser.add_argument("--consent", required=True, help="Path to consent.yaml")
    parser.add_argument("--output", default=None, help="Path to write tagged output JSON")
    args = parser.parse_args()

    with open(args.transcript) as f:
        transcript = json.load(f)

    segments = transcript.get("segments", [])
    interview_id = transcript.get("interview_id", "unknown")

    tagged = tag_segments(segments, args.consent, interview_id)

    output_path = args.output or (
        Path("data/outputs") / f"{interview_id}-tagged.json"
    )
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    output = {
        "interview_id": interview_id,
        "language": transcript.get("language"),
        "segments": tagged,
    }

    with open(output_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Tagged transcript written to {output_path}")


if __name__ == "__main__":
    main()
