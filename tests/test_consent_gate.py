"""
Tests for consent_gate.py — the consent enforcement gate.

These tests use in-memory YAML fixtures so no real audio or contributor
data is ever needed. One test also loads the repo's consent.yaml template
directly to verify the placeholder file is blocked by the gate.
"""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml

from pipeline.consent_gate import ConsentError, check, validate

# Resolve once — tests that load the real template use this path
REPO_ROOT = Path(__file__).parent.parent
TEMPLATE_CONSENT = REPO_ROOT / "consent.yaml"


def write_consent(tmp_path: Path, overrides: dict) -> Path:
    base = {
        "schema_version": "1.0",
        "contributor": {
            "name": "Test Contributor",
            "contact": "test@example.com",
            "community": "Test Community",
        },
        "recording": {
            "interview_id": "TEST-001",
            "date": "2025-01-01",
            "interviewer": "Test Interviewer",
            "location": "Test City",
            "language": "en",
        },
        "consent_for": {
            "transcription": True,
            "diarization": True,
            "thematic_tagging": True,
            "internal_archive": True,
            "public_release": False,
            "curriculum_use": False,
            "research_use": False,
        },
        "retention_until": "2099-01-01",
        "embargo": {
            "active": False,
            "lift_date": None,
            "reason": None,
        },
        "community_review": {
            "required": False,
            "reviewed": False,
            "reviewer": None,
            "reviewed_date": None,
            "notes": "",
        },
        "signatures": {
            "contributor": {"signed": True, "date": "2025-01-01", "method": "written"},
            "steward": {"name": "Test Steward", "signed": True, "date": "2025-01-01"},
        },
        "revocation": {"revoked": False, "revoked_date": None, "scope": None, "notes": ""},
    }
    for key, val in overrides.items():
        if isinstance(val, dict) and isinstance(base.get(key), dict):
            base[key].update(val)
        else:
            base[key] = val

    p = tmp_path / "consent.yaml"
    p.write_text(yaml.dump(base))
    return p


# ── Core gate tests ─────────────────────────────────────────────────────────

def test_valid_consent_passes(tmp_path):
    p = write_consent(tmp_path, {})
    doc = validate(p, "transcription")
    assert doc.recording["interview_id"] == "TEST-001"


def test_missing_file_raises(tmp_path):
    with pytest.raises(ConsentError, match="not found"):
        validate(tmp_path / "nonexistent.yaml", "transcription")


def test_unsigned_contributor_raises(tmp_path):
    p = write_consent(tmp_path, {"signatures": {
        "contributor": {"signed": False},
        "steward": {"name": "S", "signed": True},
    }})
    with pytest.raises(ConsentError, match="signatures"):
        validate(p, "transcription")


def test_unsigned_steward_raises(tmp_path):
    p = write_consent(tmp_path, {"signatures": {
        "contributor": {"signed": True, "date": "2025-01-01", "method": "written"},
        "steward": {"name": "S", "signed": False},
    }})
    with pytest.raises(ConsentError, match="signatures"):
        validate(p, "transcription")


def test_revoked_consent_raises(tmp_path):
    p = write_consent(tmp_path, {"revocation": {
        "revoked": True, "revoked_date": "2025-06-01", "scope": "full", "notes": ""
    }})
    with pytest.raises(ConsentError, match="revoked"):
        validate(p, "transcription")


def test_expired_retention_raises(tmp_path):
    p = write_consent(tmp_path, {"retention_until": "2000-01-01"})
    with pytest.raises(ConsentError, match="Retention window expired"):
        validate(p, "transcription")


def test_active_embargo_raises(tmp_path):
    p = write_consent(tmp_path, {"embargo": {"active": True, "lift_date": "2099-01-01"}})
    with pytest.raises(ConsentError, match="embargo"):
        validate(p, "transcription")


def test_lifted_embargo_passes(tmp_path):
    p = write_consent(tmp_path, {"embargo": {"active": True, "lift_date": "2020-01-01"}})
    doc = validate(p, "transcription")
    assert doc is not None


def test_unconsented_operation_raises(tmp_path):
    p = write_consent(tmp_path, {})
    with pytest.raises(ConsentError, match="public_release"):
        validate(p, "public_release")


def test_placeholder_value_raises(tmp_path):
    p = write_consent(tmp_path, {"contributor": {
        "name": "PLACEHOLDER_FULL_NAME",
        "contact": "test@example.com",
        "community": "Test",
    }})
    with pytest.raises(ConsentError, match="placeholder"):
        validate(p, "transcription")


# ── Schema completeness: optional fields round-trip ─────────────────────────

def test_embargo_reason_field_accepted(tmp_path):
    p = write_consent(tmp_path, {"embargo": {
        "active": False, "lift_date": None, "reason": "pending family review"
    }})
    doc = validate(p, "transcription")
    assert doc.embargo.reason == "pending family review"


def test_community_review_optional_fields_accepted(tmp_path):
    p = write_consent(tmp_path, {"community_review": {
        "required": True,
        "reviewed": True,
        "reviewer": "Elder Jones",
        "reviewed_date": "2025-03-01",
        "notes": "Approved with minor redaction of family names",
    }})
    doc = validate(p, "transcription")
    assert doc.community_review.reviewer == "Elder Jones"
    assert doc.community_review.reviewed_date == "2025-03-01"


# ── Template file test ───────────────────────────────────────────────────────

def test_template_consent_yaml_is_blocked():
    """
    The repo-root consent.yaml is a placeholder template. It must be blocked
    by the gate on two counts: placeholder values in contributor fields AND
    unsigned signatures. This guards against accidentally processing data
    against an unfilled template.
    """
    assert TEMPLATE_CONSENT.exists(), "consent.yaml template is missing from repo root"
    with pytest.raises(ConsentError):
        validate(TEMPLATE_CONSENT, "transcription")
