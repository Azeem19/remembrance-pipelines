"""
sync_consent.py — Cypher Innovation Studio | Remembrance Day Project

Pulls approved consent records from Airtable and writes one
consent.yaml file per interview into data/consent/.

The transcription pipeline reads these files — this script
is the bridge between Airtable governance and the Python pipeline.

Usage:
    uv run python -m pipelines.sync_consent
    uv run python -m pipelines.sync_consent --status "Approved"
"""

import os
import argparse
import yaml
import requests
from pathlib import Path
from datetime import datetime

AIRTABLE_TOKEN   = os.environ["AIRTABLE_TOKEN"]
AIRTABLE_BASE_ID = os.environ.get("AIRTABLE_BASE_ID", "appXFYw4mym1tKckG")
AIRTABLE_TABLE   = os.environ.get("AIRTABLE_TABLE_NAME", "Consent Records")
CONSENT_DIR      = Path("data/consent")

AIRTABLE_URL = (
    f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}"
    f"/{requests.utils.quote(AIRTABLE_TABLE, safe='')}"
)


def fetch_records(status_filter: str = "Approved") -> list[dict]:
    """Pull records from Airtable filtered by Status."""
    headers = {"Authorization": f"Bearer {AIRTABLE_TOKEN}"}
    params  = {
        "filterByFormula": f"{{Status}}='{status_filter}'",
        "pageSize": 100,
    }
    records = []
    offset  = None

    while True:
        if offset:
            params["offset"] = offset
        res = requests.get(AIRTABLE_URL, headers=headers, params=params)
        res.raise_for_status()
        data = res.json()
        records.extend(data.get("records", []))
        offset = data.get("offset")
        if not offset:
            break

    return records


def record_to_consent_yaml(record: dict) -> dict:
    """Map Airtable fields back to consent.yaml schema."""
    f = record.get("fields", {})
    consent_for_raw = f.get("ConsentFor", "")
    consent_for = [c.strip() for c in consent_for_raw.split(",") if c.strip()]

    return {
        "schema_version":       "1.0",
        "project":              "remembrance_day_project",
        "steward":              "cypher_innovation_studio",
        "airtable_record_id":   record["id"],
        "interviewee":          f.get("Interviewee", ""),
        "date":                 str(f.get("Date", "")),
        "interviewer":          f.get("Interviewer", ""),
        "location":             f.get("Location") or None,
        "consent_for":          consent_for,
        "retention_until":      f.get("RetentionUntil", "indefinite"),
        "embargo":              f.get("Embargo") or None,
        "community_review":     f.get("CommunityReview", True),
        "notes":                f.get("Notes") or None,
        "signed_by_initials":   f.get("Initials") or None,
        "consent_recorded_at":  f.get("RecordedAt", ""),
        "status":               f.get("Status", ""),
        "synced_at":            datetime.utcnow().isoformat() + "Z",
    }


def slug(name: str) -> str:
    """Convert 'Mary Jones' → 'mary_jones'."""
    return name.lower().strip().replace(" ", "_").replace("-", "_")


def sync(status_filter: str = "Approved") -> None:
    CONSENT_DIR.mkdir(parents=True, exist_ok=True)
    records = fetch_records(status_filter)
    print(f"Found {len(records)} records with status '{status_filter}'")

    for record in records:
        consent = record_to_consent_yaml(record)
        interviewee = consent.get("interviewee") or "unknown"
        date        = consent.get("date", "undated")
        filename    = CONSENT_DIR / f"{slug(interviewee)}_{date}.yaml"

        with open(filename, "w") as f:
            yaml.dump(consent, f, default_flow_style=False, allow_unicode=True)

        print(f"  ✓ Written: {filename}")

    print(f"\nSync complete. {len(records)} consent file(s) in {CONSENT_DIR}/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync Airtable consent records to YAML files")
    parser.add_argument("--status", default="Approved", help="Filter by Status field (default: Approved)")
    args = parser.parse_args()
    sync(args.status)

