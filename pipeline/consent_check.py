"""
Consent enforcement gate — must be called before any pipeline step.

The pipeline halts if consent.yaml is missing, invalid, not signed by both
parties, expired, or if the requested operation is not explicitly consented to.
"""

from __future__ import annotations

import sys
from datetime import date, datetime
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, field_validator


ConsentField = Literal[
    "transcription",
    "diarization",
    "thematic_tagging",
    "internal_archive",
    "public_release",
    "curriculum_use",
    "research_use",
]


class ConsentError(Exception):
    """Raised when consent is absent, invalid, or does not cover the requested operation."""


class Signatures(BaseModel):
    contributor: dict
    steward: dict

    def both_signed(self) -> bool:
        return (
            self.contributor.get("signed") is True
            and self.steward.get("signed") is True
        )


class Embargo(BaseModel):
    active: bool
    lift_date: str | None = None


class CommunityReview(BaseModel):
    required: bool
    reviewed: bool


class ConsentDocument(BaseModel):
    schema_version: str
    contributor: dict
    recording: dict
    consent_for: dict[str, bool]
    retention_until: str
    embargo: Embargo
    community_review: CommunityReview
    signatures: Signatures
    revocation: dict

    @field_validator("contributor", "recording")
    @classmethod
    def no_placeholders(cls, v: dict) -> dict:
        for key, val in v.items():
            if isinstance(val, str) and val.startswith("PLACEHOLDER"):
                raise ValueError(f"Field '{key}' still contains a placeholder value")
        return v


def _parse_date(value: str) -> date | None:
    if not value or value.lower() == "indefinite":
        return None
    return datetime.fromisoformat(value).date()


def validate(consent_path: str | Path, operation: ConsentField) -> ConsentDocument:
    """
    Load and validate a consent.yaml file, then verify the requested operation
    is explicitly consented to. Returns the parsed document on success.

    Raises ConsentError on any violation.
    """
    path = Path(consent_path)

    if not path.exists():
        raise ConsentError(f"Consent file not found: {path}")

    with path.open() as f:
        raw = yaml.safe_load(f)

    try:
        doc = ConsentDocument.model_validate(raw)
    except Exception as exc:
        raise ConsentError(f"Consent file is invalid: {exc}") from exc

    if doc.revocation.get("revoked"):
        raise ConsentError("Consent has been revoked by the contributor")

    if not doc.signatures.both_signed():
        raise ConsentError(
            "Consent requires signatures from both contributor and steward"
        )

    retention = _parse_date(doc.retention_until)
    if retention and date.today() > retention:
        raise ConsentError(
            f"Retention window expired on {retention} — data must be deleted"
        )

    if doc.embargo.active:
        lift = _parse_date(doc.embargo.lift_date) if doc.embargo.lift_date else None
        if lift is None or date.today() < lift:
            raise ConsentError(
                "Recording is under embargo — processing is not permitted"
            )

    if not doc.consent_for.get(operation):
        raise ConsentError(
            f"Contributor has not consented to '{operation}' for this recording"
        )

    return doc


def require(consent_path: str | Path, operation: ConsentField) -> ConsentDocument:
    """validate() wrapper that prints an error and exits on failure — use in CLI scripts."""
    try:
        return validate(consent_path, operation)
    except ConsentError as exc:
        print(f"[CONSENT BLOCKED] {exc}", file=sys.stderr)
        sys.exit(1)
